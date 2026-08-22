import { createClient } from '@/lib/supabase/client';
import { pushOfflineOperation } from '@/lib/sync/offlineQueue';

export interface VoidTransactionParams {
  tx_ref: string;
  party_id?: string | null;
  debitAmount: number;
  creditAmount: number;
  currentPartyBalance?: number;
  businessId?: string;
}

export interface AddKhataEntryParams {
  businessId: string;
  partyId?: string | null;
  amount: number | string;
  entryType: 'DEBIT' | 'CREDIT' | 'debit' | 'credit';
  description?: string;
}

export class KhataService {
  /**
   * Adds and persists a new Khata ledger entry safely with input sanitization.
   */
  static async addKhataEntry(params: AddKhataEntryParams): Promise<{ success: boolean; entryId: string }> {
    try {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `entry-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const numAmount = Math.abs(Number(params.amount) || 0);
      const entryTypeLower = String(params.entryType).toLowerCase() as 'debit' | 'credit';
      const txRef = `TX-${Date.now().toString(36).toUpperCase()}`;

      const supabase = createClient();
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      const entry = {
        id,
        business_id: params.businessId,
        party_id: params.partyId || null,
        amount: numAmount,
        entry_type: entryTypeLower,
        description: params.description || '',
        posted_at: createdAt,
        created_at: createdAt,
        tx_ref: txRef,
        status: 'posted'
      };

      if (isOnline) {
        try {
          const { error } = await supabase.from('ledger_entries').insert([entry]);
          if (error) throw error;
        } catch (err) {
          pushOfflineOperation({
            table: 'ledger_entries',
            operation: 'insert',
            data: entry
          });
        }
      } else {
        pushOfflineOperation({
          table: 'ledger_entries',
          operation: 'insert',
          data: entry
        });
      }

      // Local storage optimistic cache update
      try {
        const cacheKey = `noxis_khata_cache_${params.businessId || 'default'}`;
        const localCacheRaw = localStorage.getItem(cacheKey);
        const cache = localCacheRaw ? JSON.parse(localCacheRaw) : { ledger_entries: [] };
        if (!Array.isArray(cache.ledger_entries)) cache.ledger_entries = [];
        cache.ledger_entries.unshift(entry);
        localStorage.setItem(cacheKey, JSON.stringify(cache));
      } catch {}

      return { success: true, entryId: id };
    } catch (error) {
      console.error("Failed to persist Khata entry:", error);
      throw new Error("Khata entry creation failed");
    }
  }

  /**
   * Offline-First Local Reversion of a Transaction.
   * 1. Does NOT execute a direct blocking cloud fetch first.
   * 2. Executes local state / storage update FIRST to instantly mark status: 'reversed' and recalculate balance.
   * 3. Executes Supabase mutation WITHOUT .select() or RETURNING clause.
   * 4. Queues reversion in local offline queue if offline or on network failure.
   */
  static async voidTransaction(params: VoidTransactionParams): Promise<{ success: boolean; newBalance?: number }> {
    const { tx_ref, party_id, debitAmount, creditAmount, currentPartyBalance = 0 } = params;

    // 1. Calculate balance reversion delta
    const delta = creditAmount - debitAmount;
    const newBalance = Number(currentPartyBalance || 0) + delta;

    // 2. Local storage / cache optimistic update
    try {
      const cacheKey = `noxis_khata_cache_${params.businessId || 'default'}`;
      const localCacheRaw = localStorage.getItem(cacheKey);
      if (localCacheRaw) {
        const cache = JSON.parse(localCacheRaw);
        if (Array.isArray(cache.ledger_entries)) {
          cache.ledger_entries = cache.ledger_entries.map((entry: any) =>
            entry.tx_ref === tx_ref ? { ...entry, status: 'reversed', is_void: true } : entry
          );
        }
        if (party_id && Array.isArray(cache.parties)) {
          cache.parties = cache.parties.map((p: any) =>
            p.id === party_id ? { ...p, current_balance: newBalance } : p
          );
        }
        localStorage.setItem(cacheKey, JSON.stringify(cache));
      }
    } catch {
      // Local cache update is non-fatal
    }

    // 3. Supabase Mutation WITHOUT .select() or RETURNING
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const supabase = createClient();

    if (isOnline) {
      try {
        // DO NOT USE .select() or RETURNING
        const { error: ledgerErr } = await supabase
          .from('ledger_entries')
          .update({ status: 'reversed', is_void: true })
          .eq('tx_ref', tx_ref);

        if (ledgerErr) {
          pushOfflineOperation({
            table: 'ledger_entries',
            operation: 'update',
            data: { status: 'reversed', is_void: true },
            matchColumn: 'tx_ref',
            matchValue: tx_ref,
          });
        }

        if (party_id) {
          // DO NOT USE .select() or RETURNING
          const { error: partyErr } = await supabase
            .from('parties')
            .update({ current_balance: newBalance })
            .eq('id', party_id);

          if (partyErr) {
            pushOfflineOperation({
              table: 'parties',
              operation: 'update',
              data: { current_balance: newBalance },
              matchColumn: 'id',
              matchValue: party_id,
            });
          }
        }
      } catch {
        // Network timeout / offline fallback: queue operations silently
        pushOfflineOperation({
          table: 'ledger_entries',
          operation: 'update',
          data: { status: 'reversed', is_void: true },
          matchColumn: 'tx_ref',
          matchValue: tx_ref,
        });

        if (party_id) {
          pushOfflineOperation({
            table: 'parties',
            operation: 'update',
            data: { current_balance: newBalance },
            matchColumn: 'id',
            matchValue: party_id,
          });
        }
      }
    } else {
      // Offline mode: queue for silent background sync
      pushOfflineOperation({
        table: 'ledger_entries',
        operation: 'update',
        data: { status: 'reversed', is_void: true },
        matchColumn: 'tx_ref',
        matchValue: tx_ref,
      });

      if (party_id) {
        pushOfflineOperation({
          table: 'parties',
          operation: 'update',
          data: { current_balance: newBalance },
          matchColumn: 'id',
          matchValue: party_id,
        });
      }
    }

    return { success: true, newBalance };
  }
}

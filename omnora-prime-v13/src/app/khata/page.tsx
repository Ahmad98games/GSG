'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { usePersona } from '@/hooks/usePersona';
import {
  FileText, Plus, Search, BookOpen, Layers, History,
  ArrowUpRight, ArrowDownLeft, Wallet,
  Printer, CheckCircle2, X, Trash2, Edit3, MessageSquare,
  Building2, Phone, MapPin, CreditCard, ChevronRight, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Decimal } from 'decimal.js';
import { cn } from '@/lib/utils';
import { format, parseISO, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/StateViews';
import { useDebounce } from '@/hooks/useDebounce';

import { KhataEntryModal } from '@/components/khata/KhataEntryModal';
import { AddAccountModal } from '@/components/khata/AddAccountModal';
import { LedgerReceipt } from '@/components/khata/LedgerReceipt';
import { MasterPinModal } from '@/components/khata/MasterPinModal';
import { AddPartyModal } from '@/components/parties/AddPartyModal';
import { EditPartyModal } from '@/components/parties/EditPartyModal';
import { KhataService } from '@/lib/khata/KhataService';

// --- Types ---

interface Account {
  id: string;
  account_code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id: string | null;
  is_system: boolean;
  is_active: boolean;
}

interface Party {
  id: string;
  name: string;
  phone?: string;
  secondary_phone?: string;
  secondaryPhone?: string;
  city?: string;
  party_type: string;
  current_balance: number;
  credit_limit?: number;
  preferred_transport?: string;
  cnic_or_ntn?: string;
}

interface LedgerEntry {
  id: string;
  tx_ref: string;
  entry_type: 'debit' | 'credit';
  account_id: string;
  party_id: string | null;
  business_id: string;
  amount: number;
  description: string;
  posted_at: string;
  status: 'posted' | 'reversed' | 'pending';
  reversal_of: string | null;
  accounts: { name: string; type: string };
  parties: { name: string; phone?: string; current_balance?: number } | null;
}

interface GroupedTransaction {
  tx_ref: string;
  date: string;
  description: string;
  party: string;
  party_phone?: string;
  party_id: string | null;
  party_balance?: number;
  debitAccount: string;
  creditAccount: string;
  debitAmount: number;
  creditAmount: number;
  status: 'posted' | 'reversed' | 'pending';
  originalEntries: LedgerEntry[];
  accountType?: string;
  runningBalance?: number;
}

export default function KhataPage() {
  const { profile } = useBusinessProfile();
  const { businessId, t, fmt } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'entries' | 'accounts' | 'parties'>('entries');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState<GroupedTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<GroupedTransaction | null>(null);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [selectedPartyForTx, setSelectedPartyForTx] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [printingTx, setPrintingTx] = useState<GroupedTransaction | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');

  // 1. ACCOUNTS QUERY (Instant offline cache + remote sync)
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', businessId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('business_id', businessId)
          .order('account_code');
        if (!error && data) {
          if (typeof window !== 'undefined') {
            try { localStorage.setItem(`noxis_cached_accounts_${businessId}`, JSON.stringify(data)); } catch {}
          }
          return data as Account[];
        }
      } catch {}

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`noxis_cached_accounts_${businessId}`);
          if (raw) return JSON.parse(raw) as Account[];
        } catch {}
      }
      return [];
    },
    initialData: () => {
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`noxis_cached_accounts_${businessId}`);
          if (raw) return JSON.parse(raw) as Account[];
        } catch {}
      }
      return [];
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });

  // 2. PARTIES QUERY (Instant offline cache + remote sync + graceful fallback)
  const { data: parties = [] } = useQuery({
    queryKey: ['parties', businessId],
    queryFn: async () => {
      let cached: Party[] = [];
      if (typeof window !== 'undefined') {
        const keys = [
          businessId ? `noxis_cached_parties_${businessId}` : null,
          `noxis_cached_parties_00000000-0000-0000-0000-000000000000`,
          `noxis_cached_parties`
        ].filter(Boolean) as string[];
        for (const k of keys) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                cached = parsed;
                break;
              }
            }
          } catch {}
        }
      }

      try {
        let q = supabase
          .from('parties')
          .select('id, name, phone, secondary_phone, city, party_type, current_balance, credit_limit, preferred_transport, cnic_or_ntn')
          .order('name');
        if (businessId) {
          q = q.eq('business_id', businessId);
        }
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          if (typeof window !== 'undefined' && businessId) {
            try { localStorage.setItem(`noxis_cached_parties_${businessId}`, JSON.stringify(data)); } catch {}
          }
          return data as Party[];
        }
      } catch (err) {
        console.warn('[KhataPage] Remote parties fetch notice:', err);
      }

      return cached;
    },
    initialData: () => {
      if (typeof window !== 'undefined') {
        const keys = [
          businessId ? `noxis_cached_parties_${businessId}` : null,
          `noxis_cached_parties_00000000-0000-0000-0000-000000000000`,
          `noxis_cached_parties`
        ].filter(Boolean) as string[];
        for (const k of keys) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
          } catch {}
        }
      }
      return [];
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });

  // 3. LEDGER ENTRIES QUERY (Instant offline cache + remote sync)
  const { data: rawEntries = [], isLoading: entriesLoading, error: entriesError, refetch: refetchEntries } = useQuery({
    queryKey: ['ledger_entries', businessId],
    queryFn: async () => {
      let localEntries: any[] = [];
      if (typeof window !== 'undefined') {
        try {
          const cacheKey = `noxis_khata_cache_${businessId}`;
          const rawCache = localStorage.getItem(cacheKey);
          if (rawCache) {
            const parsed = JSON.parse(rawCache);
            if (Array.isArray(parsed.ledger_entries)) localEntries = parsed.ledger_entries;
          }

          const legacyKey = `noxis_cached_ledger_${businessId}`;
          const legacyRaw = localStorage.getItem(legacyKey);
          if (legacyRaw) {
            const legacyParsed = JSON.parse(legacyRaw);
            if (Array.isArray(legacyParsed)) {
              localEntries = [...localEntries, ...legacyParsed];
            }
          }
        } catch {}
      }

      let remoteEntries: any[] = [];
      try {
        const { data, error } = await supabase
          .from('ledger_entries')
          .select('*, accounts(name, type), parties(name, phone, current_balance)')
          .eq('business_id', businessId)
          .order('posted_at', { ascending: false });

        if (!error && data) {
          remoteEntries = data;
        } else {
          const { data: plainEntries } = await supabase
            .from('ledger_entries')
            .select('*')
            .eq('business_id', businessId)
            .order('posted_at', { ascending: false });
          if (plainEntries) remoteEntries = plainEntries;
        }
      } catch (err) {
        console.warn('Supabase ledger fetch notice (using local entries):', err);
      }

      // O(1) Hash Map lookups for fast indexing
      const accMap = new Map<string, any>(accounts.map(a => [a.id, a]));
      const partyMap = new Map<string, any>(parties.map(p => [p.id, p]));

      const map = new Map<string, any>();
      [...localEntries, ...remoteEntries].forEach((entry: any) => {
        const key = entry.id || `${entry.tx_ref}_${entry.entry_type}_${entry.account_id}`;
        if (!map.has(key)) {
          const acc = accMap.get(entry.account_id);
          const party = partyMap.get(entry.party_id);
          map.set(key, {
            ...entry,
            accounts: entry.accounts || (acc ? { name: acc.name, type: acc.type } : { name: entry.entry_type === 'debit' ? 'Cash / Asset Account' : 'Revenue Account', type: 'asset' }),
            parties: entry.parties || (party ? { name: party.name, phone: party.phone || party.secondary_phone, current_balance: party.current_balance } : null),
          });
        }
      });

      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.posted_at || b.created_at || 0).getTime() - new Date(a.posted_at || a.created_at || 0).getTime());
      return merged as LedgerEntry[];
    },
    initialData: () => {
      if (typeof window !== 'undefined') {
        try {
          const cacheKey = `noxis_khata_cache_${businessId}`;
          const rawCache = localStorage.getItem(cacheKey);
          if (rawCache) {
            const parsed = JSON.parse(rawCache);
            if (Array.isArray(parsed.ledger_entries) && parsed.ledger_entries.length > 0) {
              return parsed.ledger_entries;
            }
          }
        } catch {}
      }
      return [];
    },
    enabled: !!businessId,
    staleTime: 30_000,
  });

  // Real-time listener for party updates
  useEffect(() => {
    const handlePartyEvent = (e: any) => {
      const partyData = e.detail;
      if (partyData) {
        queryClient.setQueryData(['parties', businessId], (old: any) => {
          const arr = Array.isArray(old) ? old : [];
          return [partyData, ...arr.filter((p: any) => p.id !== partyData.id)];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['parties_registry'] });
    };

    window.addEventListener('noxis:party-added', handlePartyEvent);
    window.addEventListener('noxis:party-updated', handlePartyEvent);
    return () => {
      window.removeEventListener('noxis:party-added', handlePartyEvent);
      window.removeEventListener('noxis:party-updated', handlePartyEvent);
    };
  }, [businessId, queryClient]);

  // Grouping & Running balance logic for transactions (optimized O(N))
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, GroupedTransaction> = {};
    rawEntries.forEach((entry: any) => {
      if (!groups[entry.tx_ref]) {
        groups[entry.tx_ref] = {
          tx_ref: entry.tx_ref,
          date: entry.posted_at,
          description: entry.description,
          party: entry.parties?.name || '—',
          party_phone: entry.parties?.phone || '',
          party_id: entry.party_id,
          party_balance: entry.parties?.current_balance || 0,
          debitAccount: '—',
          creditAccount: '—',
          debitAmount: 0,
          creditAmount: 0,
          status: entry.status,
          originalEntries: [],
          accountType: entry.accounts?.type,
        };
      }
      groups[entry.tx_ref].originalEntries.push(entry);
      if (entry.entry_type === 'debit') {
        groups[entry.tx_ref].debitAccount = entry.accounts?.name || '—';
        groups[entry.tx_ref].debitAmount += entry.amount;
      } else {
        groups[entry.tx_ref].creditAccount = entry.accounts?.name || '—';
        groups[entry.tx_ref].creditAmount += entry.amount;
      }
    });

    const list = Object.values(groups);
    let running = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const tx = list[i];
      if (tx.status === 'posted') {
        running += (tx.debitAmount - tx.creditAmount);
      }
      tx.runningBalance = running;
    }

    return list;
  }, [rawEntries]);

  const debouncedSearch = useDebounce(searchTerm, 250);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return groupedTransactions.filter(tx => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        tx.tx_ref.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.party.toLowerCase().includes(q) ||
        (tx.party_phone && tx.party_phone.includes(q));

      let matchesDate = true;
      if (datePreset !== 'all') {
        const txDate = parseISO(tx.date);
        if (datePreset === 'today') {
          matchesDate = format(txDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        } else if (datePreset === 'yesterday') {
          matchesDate = format(txDate, 'yyyy-MM-dd') === format(subDays(now, 1), 'yyyy-MM-dd');
        } else if (datePreset === 'week') {
          matchesDate = txDate >= startOfWeek(now);
        } else if (datePreset === 'month') {
          matchesDate = txDate >= startOfMonth(now);
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [groupedTransactions, debouncedSearch, datePreset]);

  // Filtered Parties for Party Accounts Tab
  const filteredPartiesList = useMemo(() => {
    return parties.filter(p => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.secondary_phone?.includes(q) ||
        p.city?.toLowerCase().includes(q);

      const matchesType =
        partyTypeFilter === 'all' ||
        p.party_type === partyTypeFilter ||
        p.party_type === 'both';

      return matchesSearch && matchesType;
    });
  }, [parties, debouncedSearch, partyTypeFilter]);

  // Summary Cards Data
  const summary = useMemo(() => {
    let debits = new Decimal(0);
    let credits = new Decimal(0);
    rawEntries.forEach((e: any) => {
      if (e.status === 'posted') {
        if (e.entry_type === 'debit') debits = debits.plus(new Decimal(e.amount));
        else credits = credits.plus(new Decimal(e.amount));
      }
    });

    return {
      totalDebits: debits,
      totalCredits: credits,
      netBalance: debits.minus(credits),
      entryCount: groupedTransactions.filter(t => t.status === 'posted').length,
    };
  }, [rawEntries, groupedTransactions]);

  // Handle Printing Thermal / PDF Slip
  const handlePrint = (tx: GroupedTransaction) => {
    setPrintingTx(tx);
    setTimeout(() => {
      window.print();
      setPrintingTx(null);
    }, 150);
  };

  // WhatsApp Reminder Generator
  const sendWhatsAppReminder = (tx: GroupedTransaction) => {
    const rawPhone = tx.party_phone ? tx.party_phone.replace(/[^0-9]/g, '') : '';
    const phone = rawPhone.startsWith('92') ? rawPhone : `92${rawPhone.replace(/^0/, '')}`;
    const businessName = profile?.business_name || 'Noxis Hub';
    const amount = tx.debitAmount || tx.creditAmount;
    const balance = tx.party_balance || 0;

    const message = encodeURIComponent(
      `Assalam-o-Alaikum ${tx.party}, aapka ${businessName} par kul baqaya PKR ${Math.abs(balance).toLocaleString()} hai. Aakhri adaiyagi PKR ${amount.toLocaleString()} ko hui thi. Shukriya!`
    );

    const waUrl = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  // Execute Revert / Void Transaction
  const executeRevertTransaction = async () => {
    if (!deletingTx) return;
    try {
      const result = await KhataService.voidTransaction({
        tx_ref: deletingTx.tx_ref,
        party_id: deletingTx.party_id,
        debitAmount: deletingTx.debitAmount,
        creditAmount: deletingTx.creditAmount,
        currentPartyBalance: parties.find(p => p.id === deletingTx.party_id)?.current_balance || 0,
        businessId: profile?.id
      });

      if (!result.success) throw new Error("Could not void transaction");

      setSuccessToast(`Transaction ${deletingTx.tx_ref} successfully voided and balances reverted.`);
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    } catch (err: any) {
      try {
        await supabase.from('ledger_entries').delete().eq('tx_ref', deletingTx.tx_ref);
        setSuccessToast(`Transaction ${deletingTx.tx_ref} successfully voided.`);
        queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
        queryClient.invalidateQueries({ queryKey: ['parties'] });
      } catch (fallbackErr: any) {
        alert(`Error voiding transaction: ${fallbackErr.message || err.message}`);
      }
    } finally {
      setDeletingTx(null);
    }
  };

  // Only show full loading skeleton if we have NO cached data at all
  const hasNoData = accounts.length === 0 && parties.length === 0 && rawEntries.length === 0;
  if (accountsLoading && entriesLoading && hasNoData) {
    return (
      <div className="p-8 bg-[#030712] min-h-screen space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  if (entriesError && hasNoData) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-8">
        <ErrorState
          message="Could not load Khata registry"
          detail={(entriesError as Error).message}
          onRetry={refetchEntries}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-[#08EBF6] selection:text-black">
      {/* Thermal / PDF Receipt Component */}
      {printingTx && <LedgerReceipt transaction={printingTx} />}

      <main className="transition-all duration-300 min-h-screen flex flex-col">
        {/* Header Banner */}
        <header className="h-16 border-b border-white/10 flex items-center px-6 md:px-8 bg-[#0B0F17] sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-[#08EBF6]" size={20} />
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              {t('ledger') || 'Khata Dual-Entry Ledger'}
            </h1>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <nav className="flex h-16 items-center">
              {[
                { id: 'entries', label: 'Ledger Entries', icon: FileText },
                { id: 'parties', label: `Party Accounts (${parties.length})`, icon: Wallet },
                { id: 'accounts', label: 'Chart of Accounts', icon: Layers },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'px-5 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black transition-all border-b-2 cursor-pointer',
                    activeTab === tab.id
                      ? 'text-[#08EBF6] border-[#08EBF6] bg-white/5'
                      : 'text-slate-500 border-transparent hover:text-white hover:bg-white/[0.02]'
                  )}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            <button
              onClick={() => setIsPartyModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/15 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <UserPlus size={13} className="text-[#08EBF6]" />
              <span>+ Add Party</span>
            </button>

            <button
              onClick={() => { setSelectedPartyForTx(null); setEditingTx(null); setIsEntryModalOpen(true); }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#08EBF6] to-[#5FA5FA] text-black text-[10px] uppercase tracking-widest font-black rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(8,235,246,0.3)] transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Post Transaction</span>
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 w-full flex-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 bg-[#0B0F17] border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Debits</span>
                <ArrowUpRight size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black font-mono text-white">PKR {summary.totalDebits.toNumber().toLocaleString()}</p>
            </div>

            <div className="p-5 bg-[#0B0F17] border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Credits</span>
                <ArrowDownLeft size={18} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black font-mono text-white">PKR {summary.totalCredits.toNumber().toLocaleString()}</p>
            </div>

            <div className="p-5 bg-[#0B0F17] border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Net Position</span>
                <Wallet size={18} className="text-[#08EBF6]" />
              </div>
              <p className={`text-2xl font-black font-mono ${summary.netBalance.toNumber() >= 0 ? 'text-[#08EBF6]' : 'text-red-400'}`}>
                PKR {summary.netBalance.toNumber().toLocaleString()}
              </p>
            </div>

            <div className="p-5 bg-[#0B0F17] border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Linked Parties</span>
                <History size={18} className="text-[#38bdf8]" />
              </div>
              <p className="text-2xl font-black font-mono text-white">{parties.length}</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B0F17] p-4 rounded-2xl border border-white/10">
            <div className="relative w-full sm:w-96">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'parties' ? "Search party by name, city, phone..." : "Search party, phone, ref, or memo..."}
                className="w-full bg-[#030712] border border-white/15 p-2.5 pl-10 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
              />
            </div>

            {activeTab === 'entries' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {['all', 'today', 'yesterday', 'week', 'month'].map(p => (
                  <button
                    key={p}
                    onClick={() => setDatePreset(p as any)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                      datePreset === p
                        ? 'bg-[#08EBF6]/10 border-[#08EBF6] text-[#08EBF6]'
                        : 'bg-[#030712] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'parties' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {[
                  { val: 'all', label: 'All Parties' },
                  { val: 'customer', label: 'Buyers / Customers' },
                  { val: 'supplier', label: 'Suppliers / Mills' }
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => setPartyTypeFilter(f.val as any)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                      partyTypeFilter === f.val
                        ? 'bg-[#08EBF6]/10 border-[#08EBF6] text-[#08EBF6]'
                        : 'bg-[#030712] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB CONTENT: 1. LEDGER ENTRIES */}
          {activeTab === 'entries' && (
            <div className="bg-[#0B0F17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#030712] text-slate-400 uppercase font-black tracking-widest text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-4">Date &amp; Time</th>
                      <th className="p-4">Party &amp; Phone</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Description / Memo</th>
                      <th className="p-4">Accounts / Ref</th>
                      <th className="p-4 text-right">Amount (PKR)</th>
                      <th className="p-4 text-right">Running Bal</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-500 font-bold">
                          No transactions found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(tx => {
                        const isMoneyIn = tx.debitAmount > 0;
                        const amount = tx.debitAmount || tx.creditAmount;
                        const isReversed = tx.status === 'reversed';

                        return (
                          <tr key={tx.tx_ref} className={`hover:bg-white/[0.02] transition-colors ${isReversed ? 'opacity-40 line-through' : ''}`}>
                            <td className="p-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {format(new Date(tx.date), 'dd MMM yyyy, HH:mm')}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-white block">{tx.party}</span>
                              {tx.party_phone && <span className="text-[10px] text-slate-400 font-mono">{tx.party_phone}</span>}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isMoneyIn
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}>
                                {isMoneyIn ? 'Money In' : 'Money Out'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-300 max-w-xs truncate">{tx.description}</td>
                            <td className="p-4 text-[10px] text-slate-400 font-mono">
                              <div>Dr: {tx.debitAccount}</div>
                              <div>Cr: {tx.creditAccount}</div>
                            </td>
                            <td className={`p-4 text-right font-black font-mono text-sm ${isMoneyIn ? 'text-emerald-400' : 'text-red-400'}`}>
                              PKR {amount.toLocaleString()}
                            </td>
                            <td className="p-4 text-right font-black font-mono text-slate-300">
                              PKR {(tx.runningBalance || 0).toLocaleString()}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => sendWhatsAppReminder(tx)}
                                  title="Send WhatsApp Summary"
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                                >
                                  <MessageSquare size={14} />
                                </button>
                                <button
                                  onClick={() => handlePrint(tx)}
                                  title="Print Voucher Slip"
                                  className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 cursor-pointer"
                                >
                                  <Printer size={14} />
                                </button>
                                <button
                                  onClick={() => { setDeletingTx(tx); setIsPinModalOpen(true); }}
                                  title="Void &amp; Revert Transaction"
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. PARTY ACCOUNTS */}
          {activeTab === 'parties' && (
            <div className="bg-[#0B0F17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#030712] text-slate-400 uppercase font-black tracking-widest text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-4">Party Name</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">City / Hub</th>
                      <th className="p-4">Contacts</th>
                      <th className="p-4 text-right">Balance (PKR)</th>
                      <th className="p-4 text-right">Credit Limit</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredPartiesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
                          No parties found. Click "+ Add Party" above to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredPartiesList.map(p => {
                        const bal = Number(p.current_balance || 0);
                        const isReceivable = bal >= 0;
                        const creditLimit = Number(p.credit_limit || 0);
                        const isExceeded = creditLimit > 0 && Math.abs(bal) > creditLimit;

                        return (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                              <span className="font-bold text-white text-sm block">{p.name}</span>
                              {p.preferred_transport && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <span>Adda:</span> {p.preferred_transport}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/5 text-[#08EBF6] border border-[#08EBF6]/30">
                                {p.party_type}
                              </span>
                            </td>
                            <td className="p-4 text-slate-300">
                              <span className="flex items-center gap-1 text-[11px]">
                                <MapPin size={11} className="text-[#08EBF6]" />
                                {p.city || 'Textile Hub'}
                              </span>
                            </td>
                            <td className="p-4 text-[11px] font-mono text-slate-400">
                              <div>{p.phone || 'No phone'}</div>
                              {p.secondary_phone && (
                                <div className="text-[10px] text-slate-500">Munshi: {p.secondary_phone}</div>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <span className={`font-black font-mono text-sm block ${isReceivable ? 'text-emerald-400' : 'text-amber-400'}`}>
                                PKR {Math.abs(bal).toLocaleString()}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider text-slate-500">
                                {isReceivable ? 'Receivable (Lena Hai)' : 'Payable (Dena Hai)'}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono text-[11px]">
                              {creditLimit > 0 ? (
                                <span className={isExceeded ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                  PKR {creditLimit.toLocaleString()}
                                  {isExceeded && <span className="block text-[9px] text-red-400">BREACHED</span>}
                                </span>
                              ) : (
                                <span className="text-slate-600">No Limit</span>
                              )}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedPartyForTx(p.id);
                                    setEditingTx(null);
                                    setIsEntryModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#08EBF6]/10 text-[#08EBF6] hover:bg-[#08EBF6]/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  + Post Entry
                                </button>
                                <button
                                  onClick={() => setEditingParty(p)}
                                  title="Edit Wholesale Details"
                                  className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 cursor-pointer"
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. CHART OF ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="bg-[#0B0F17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">General Ledger Accounts</h3>
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="px-3 py-1.5 bg-[#08EBF6]/10 border border-[#08EBF6]/30 text-[#08EBF6] text-[10px] font-black uppercase rounded-lg hover:bg-[#08EBF6]/20 cursor-pointer"
                >
                  + Add Account
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#030712] text-slate-400 uppercase font-black tracking-widest text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-4">Code</th>
                      <th className="p-4">Account Name</th>
                      <th className="p-4">Account Type</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-500 font-bold">
                          No custom accounts configured. Default cash/bank accounts active.
                        </td>
                      </tr>
                    ) : (
                      accounts.map(acc => (
                        <tr key={acc.id} className="hover:bg-white/[0.02]">
                          <td className="p-4 font-mono text-[#08EBF6]">{acc.account_code}</td>
                          <td className="p-4 font-bold text-white">{acc.name}</td>
                          <td className="p-4 text-slate-400 uppercase text-[10px]">{acc.type}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <KhataEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => { setIsEntryModalOpen(false); setEditingTx(null); setSelectedPartyForTx(null); }}
        onSuccess={msg => {
          setSuccessToast(msg);
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
          queryClient.invalidateQueries({ queryKey: ['parties'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
        }}
        accounts={accounts}
        parties={parties}
        editingEntry={editingTx}
        preselectedPartyId={selectedPartyForTx}
      />

      <AddPartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onSuccess={newParty => {
          setSuccessToast(`Party ${newParty?.name || ''} created successfully`);
          queryClient.setQueryData(['parties', businessId], (old: any) => {
            const arr = Array.isArray(old) ? old : [];
            return [newParty, ...arr.filter((p: any) => p.id !== newParty.id)];
          });
          queryClient.invalidateQueries({ queryKey: ['parties'] });
          queryClient.invalidateQueries({ queryKey: ['parties_registry'] });
          setIsPartyModalOpen(false);
        }}
      />

      <EditPartyModal
        isOpen={!!editingParty}
        party={editingParty}
        onClose={() => setEditingParty(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['parties'] });
          queryClient.invalidateQueries({ queryKey: ['parties_registry'] });
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
        }}
      />

      {isAccountModalOpen && (
        <AddAccountModal
          onClose={() => setIsAccountModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsAccountModalOpen(false);
          }}
        />
      )}

      <MasterPinModal
        isOpen={isPinModalOpen}
        onClose={() => { setIsPinModalOpen(false); setDeletingTx(null); }}
        onConfirm={executeRevertTransaction}
        title="Authorize Transaction Reversion"
        description={`Are you sure you want to void transaction ${deletingTx?.tx_ref}? Linked balances will be reverted.`}
      />

      {/* Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[100] bg-[#08EBF6] text-black px-6 py-3.5 flex items-center space-x-3 shadow-2xl rounded-xl font-black uppercase text-xs tracking-widest"
          >
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="ml-4 opacity-70 hover:opacity-100 cursor-pointer">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
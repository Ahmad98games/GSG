/**
 * ============================================================================
 * Noxis Hub — Cheque Clearance & Bounce Management Engine
 * Handles full lifecycle: Pending -> Cleared / Bounced with Khata auto-reversal
 * and customer WhatsApp alert generation.
 * Target File: src/lib/cheques/chequeEngine.ts
 * ============================================================================
 */

import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';
import { broadcastSyncToMobileDevices, broadcastToHubRenderer } from '@/lib/mobile-bridge/server';
import { enqueueWorkflowEvent } from '@/lib/workflows/outboxEngine';

export interface RecordChequeParams {
  id?: string;
  businessId: string;
  partyId?: string;
  partyName: string;
  partyPhone?: string;
  invoiceId?: string;
  chequeNumber: string;
  bankName: string;
  amount: number;
  chequeDate: string;
  clearanceDueDate?: string;
  notes?: string;
}

export interface BounceChequeParams {
  chequeId: string;
  businessId: string;
  reason: string;
  penaltyFee?: number;
}

function getSqlite() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

export function recordCheque(params: RecordChequeParams) {
  const sqlite = getSqlite();
  if (!sqlite) return { success: false, error: 'Database unavailable' };

  const id = params.id || randomUUID();
  try {
    sqlite.prepare(`
      INSERT INTO cheque_transactions (
        id, business_id, party_id, party_name, party_phone, invoice_id,
        cheque_number, bank_name, amount, cheque_date, clearance_due_date,
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
    `).run(
      id,
      params.businessId,
      params.partyId || null,
      params.partyName,
      params.partyPhone || null,
      params.invoiceId || null,
      params.chequeNumber,
      params.bankName,
      Number(params.amount),
      params.chequeDate,
      params.clearanceDueDate || null,
      params.notes || null
    );

    broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'cheques' });
    return { success: true, id };
  } catch (err: any) {
    console.error('[ChequeEngine] Record error:', err.message);
    return { success: false, error: err.message };
  }
}

export function markChequeCleared(chequeId: string, businessId: string) {
  const sqlite = getSqlite();
  if (!sqlite) return { success: false, error: 'Database unavailable' };

  try {
    sqlite.prepare(`
      UPDATE cheque_transactions
      SET status = 'cleared', cleared_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND business_id = ?
    `).run(chequeId, businessId);

    broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'cheques' });
    return { success: true };
  } catch (err: any) {
    console.error('[ChequeEngine] Clear error:', err.message);
    return { success: false, error: err.message };
  }
}

export function markChequeBounced(params: BounceChequeParams) {
  const sqlite = getSqlite();
  if (!sqlite) return { success: false, error: 'Database unavailable' };

  try {
    const cheque = sqlite.prepare(`
      SELECT * FROM cheque_transactions WHERE id = ? AND business_id = ?
    `).get(params.chequeId, params.businessId) as any;

    if (!cheque) {
      return { success: false, error: 'Cheque record not found' };
    }

    if (cheque.status === 'bounced') {
      return { success: false, error: 'Cheque is already marked as bounced' };
    }

    const penalty = Number(params.penaltyFee || 0);
    const reversalAmount = Number(cheque.amount) + penalty;

    // 1. Update cheque status
    sqlite.prepare(`
      UPDATE cheque_transactions
      SET status = 'bounced',
          bounced_reason = ?,
          bounce_penalty_fee = ?,
          bounced_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(params.reason, penalty, params.chequeId);

    // 2. Auto-reverse in Khata (Increase party balance back)
    if (cheque.party_id) {
      sqlite.prepare(`
        UPDATE parties
        SET current_balance = COALESCE(current_balance, 0) + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(reversalAmount, cheque.party_id);

      // Insert ledger entry for audit trail
      try {
        sqlite.prepare(`
          INSERT INTO ledger_entries (
            id, business_id, party_id, entry_type, amount, balance_after,
            description, reference_id, reference_type, posted_at, created_at
          ) VALUES (?, ?, ?, 'debit', ?, (SELECT current_balance FROM parties WHERE id = ?), ?, ?, 'cheque_bounce', datetime('now'), datetime('now'))
        `).run(
          randomUUID(),
          params.businessId,
          cheque.party_id,
          reversalAmount,
          cheque.party_id,
          `Cheque Bounce Reversal - #${cheque.cheque_number} (${cheque.bank_name})${penalty > 0 ? ` + Penalty Rs. ${penalty}` : ''} - Reason: ${params.reason}`,
          cheque.id
        );
      } catch {}
    }

    // 3. Prepare WhatsApp Alert message
    const formattedAmount = Number(cheque.amount).toLocaleString('en-PK');
    const waMessage = 
`⚠️ *CHEQUE BOUNCE NOTIFICATION*
Mohtaram *${cheque.party_name}*,
Aapka cheque bank se wapas (bounce) ho gaya hai:

🏦 *Bank*: ${cheque.bank_name}
🔖 *Cheque #*: ${cheque.cheque_number}
💵 *Raqam*: PKR ${formattedAmount}
❌ *Wajah*: ${params.reason}
${penalty > 0 ? `⚖️ *Bounce Penalty Fee*: PKR ${penalty}\n` : ''}
*Total Reversal Added to Khata*: PKR ${reversalAmount.toLocaleString('en-PK')}

Baraye meherbani foran counter par naqad (cash) ya Raast transfer ada karein. Shukriya.`;

    // 4. Enqueue into Workflow Engine (< 0.2ms)
    enqueueWorkflowEvent({
      businessId: params.businessId,
      eventType: 'cheque.bounced',
      entityId: params.chequeId,
      recipient: cheque.party_phone || cheque.party_id || undefined,
      payload: {
        cheque_id: params.chequeId,
        cheque_number: cheque.cheque_number,
        bank_name: cheque.bank_name,
        amount: cheque.amount,
        reversal_amount: reversalAmount,
        party_name: cheque.party_name,
        party_phone: cheque.party_phone,
        reason: params.reason,
        whatsapp_message: waMessage,
      },
    });

    // 5. Broadcast to TopBar NotificationBell & Mobile devices
    broadcastToHubRenderer('WORKFLOW_ALERT', {
      id: randomUUID(),
      title: `Cheque #${cheque.cheque_number} Bounced!`,
      message: `${cheque.party_name} - PKR ${formattedAmount} reversed in Khata`,
      severity: 'error',
      route: '/khata',
      timestamp: new Date().toISOString(),
    });

    broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'cheques' });
    broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'parties' });

    return {
      success: true,
      reversalAmount,
      whatsappMessage: waMessage,
      partyPhone: cheque.party_phone,
    };
  } catch (err: any) {
    console.error('[ChequeEngine] Bounce error:', err.message);
    return { success: false, error: err.message };
  }
}

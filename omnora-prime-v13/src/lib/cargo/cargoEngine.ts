/**
 * ============================================================================
 * Noxis Hub — Bilti & Cargo / Adda Tracking (Inter-City Wholesale Engine)
 * Manages freight dispatches, goods adda, nag (bundle/carton) counts, to-pay/paid
 * freight charges, and customer WhatsApp Bilty notifications.
 * Target File: src/lib/cargo/cargoEngine.ts
 * ============================================================================
 */

import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';
import { broadcastToHubRenderer, broadcastSyncToMobileDevices } from '@/lib/mobile-bridge/server';
import { enqueueWorkflowEvent } from '@/lib/workflows/outboxEngine';

function getSqlite() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

export interface CreateCargoDispatchParams {
  id?: string;
  businessId: string;
  invoiceId?: string;
  invoiceNumber: string;
  partyId?: string;
  partyName: string;
  partyPhone?: string;
  destinationCity: string;
  addaName: string;
  biltyNumber: string;
  nagCount: number;
  freightType?: 'paid' | 'to_pay';
  freightAmount?: number;
  driverPhone?: string;
  biltyImageUrl?: string;
  notes?: string;
}

export function createCargoDispatch(params: CreateCargoDispatchParams) {
  const sqlite = getSqlite();
  if (!sqlite) return { success: false, error: 'Database unavailable' };

  const id = params.id || randomUUID();
  const freightType = params.freightType || 'to_pay';
  const freightAmt = Number(params.freightAmount || 0);
  const nagCount = Number(params.nagCount || 1);

  try {
    sqlite.prepare(`
      INSERT INTO cargo_dispatches (
        id, business_id, invoice_id, invoice_number, party_id, party_name, party_phone,
        destination_city, adda_name, bilty_number, nag_count, freight_type, freight_amount,
        driver_phone, status, bilty_image_url, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'dispatched', ?, ?, datetime('now'), datetime('now'))
    `).run(
      id,
      params.businessId,
      params.invoiceId || null,
      params.invoiceNumber,
      params.partyId || null,
      params.partyName,
      params.partyPhone || null,
      params.destinationCity,
      params.addaName,
      params.biltyNumber,
      nagCount,
      freightType,
      freightAmt,
      params.driverPhone || null,
      params.biltyImageUrl || null,
      params.notes || null
    );

    // Formatted WhatsApp Bilty message
    const freightLabel = freightType === 'paid' ? 'PAID (Office se ada shuda)' : 'TO-PAY / Adaigi Baad az Wasooli';
    const waMessage = 
`📦 *NOXIS HUB — CARGO / BILTI RAWANAGI*
Mohtaram *${params.partyName}*,
Aapka maal Adda par book kar ke rawana kar diya gaya hai:

📄 *Bill #*: ${params.invoiceNumber}
🚚 *Goods Adda / Cargo*: ${params.addaName}
🔖 *Bilty Number*: *${params.biltyNumber}*
📦 *Kul Nag (Bori/Thaan)*: *${nagCount} Nag*
🏙️ *Manzil (City)*: ${params.destinationCity}
💵 *Kiraya (Freight)*: ${freightLabel} ${freightAmt > 0 ? `(PKR ${freightAmt.toLocaleString('en-PK')})` : ''}
${params.driverPhone ? `📞 *Driver / Adda Phone*: ${params.driverPhone}\n` : ''}
Bilty slip office record mein darj ho chuki hai. Mal wasool hotay hi confirm karein. Shukriya!`;

    // Fast outbox enqueue
    enqueueWorkflowEvent({
      businessId: params.businessId,
      eventType: 'cargo.dispatched',
      entityId: id,
      recipient: params.partyPhone || undefined,
      payload: {
        cargo_id: id,
        bilty_number: params.biltyNumber,
        adda_name: params.addaName,
        invoice_number: params.invoiceNumber,
        party_name: params.partyName,
        nag_count: nagCount,
        destination_city: params.destinationCity,
        message: waMessage,
      },
    });

    broadcastToHubRenderer('WORKFLOW_ALERT', {
      id: randomUUID(),
      title: `Bilty #${params.biltyNumber} Dispatched`,
      message: `${params.partyName} · ${params.addaName} (${nagCount} Nag) to ${params.destinationCity}`,
      severity: 'success',
      route: '/dispatch',
      timestamp: new Date().toISOString(),
    });

    broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'cargo' });

    const waLink = params.partyPhone
      ? `https://wa.me/${params.partyPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`
      : undefined;

    return {
      success: true,
      id,
      whatsappMessage: waMessage,
      waLink,
    };
  } catch (err: any) {
    console.error('[CargoEngine] Error creating dispatch:', err.message);
    return { success: false, error: err.message };
  }
}

export function updateCargoStatus(id: string, status: 'dispatched' | 'in_transit' | 'delivered' | 'cancelled') {
  const sqlite = getSqlite();
  if (!sqlite) return { success: false, error: 'Database unavailable' };

  try {
    sqlite.prepare(`
      UPDATE cargo_dispatches
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, id);

    broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'cargo' });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

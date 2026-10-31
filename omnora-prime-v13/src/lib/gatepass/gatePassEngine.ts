/**
 * ============================================================================
 * Noxis Hub — Parcha / Gate Pass Engine (Theft & Security Gate Verification)
 * Generates price-free physical dispatch gate passes with verification barcodes
 * for wholesale shop security guards to verify physical carton/thaan quantities.
 * Target File: src/lib/gatepass/gatePassEngine.ts
 * ============================================================================
 */

import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';
import { broadcastToHubRenderer, broadcastSyncToMobileDevices } from '@/lib/mobile-bridge/server';

function getSqlite() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

export interface GenerateGatePassParams {
  businessId: string;
  invoiceId: string;
  invoiceNumber: string;
  partyName: string;
  partyPhone?: string;
  nagCount: number;
  vehicleNumber?: string;
  driverName?: string;
}

export function generateGatePass(params: GenerateGatePassParams) {
  const sqlite = getSqlite();
  if (!sqlite) return { success: false, error: 'Database unavailable' };

  try {
    // 1. Fetch line items from invoice_items (quantities only, NO PRICES)
    let items: Array<{ description: string; quantity: number; unit: string }> = [];
    try {
      items = sqlite.prepare(`
        SELECT description, quantity, unit
        FROM invoice_items
        WHERE invoice_id = ?
      `).all(params.invoiceId) as any[];
    } catch {}

    const itemsSummary = items.map(it => `${it.quantity} ${it.unit} · ${it.description}`).join(' | ');

    const dateSlug = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const gatePassNo = `GP-${dateSlug}-${randSuffix}`;
    const id = randomUUID();

    sqlite.prepare(`
      INSERT INTO gate_passes (
        id, gate_pass_no, business_id, invoice_id, invoice_number, party_name,
        party_phone, nag_count, vehicle_number, driver_name, items_summary,
        security_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued', datetime('now'))
    `).run(
      id,
      gatePassNo,
      params.businessId,
      params.invoiceId,
      params.invoiceNumber,
      params.partyName,
      params.partyPhone || null,
      Number(params.nagCount || 1),
      params.vehicleNumber || null,
      params.driverName || null,
      itemsSummary || 'Standard Wholesale Package'
    );

    broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'gate_passes' });

    return {
      success: true,
      id,
      gatePassNo,
      invoiceNumber: params.invoiceNumber,
      partyName: params.partyName,
      nagCount: params.nagCount,
      vehicleNumber: params.vehicleNumber,
      driverName: params.driverName,
      items,
      createdAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[GatePassEngine] Error generating gate pass:', err.message);
    return { success: false, error: err.message };
  }
}

export function verifyGatePass(gatePassNo: string, verifiedBy = 'Gate Guard') {
  const sqlite = getSqlite();
  if (!sqlite) return { success: false, error: 'Database unavailable' };

  try {
    const record = sqlite.prepare(`
      SELECT * FROM gate_passes WHERE gate_pass_no = ?
    `).get(gatePassNo) as any;

    if (!record) {
      return {
        success: false,
        verified: false,
        alertType: 'danger',
        message: '❌ JALI / GHALAT PARCHA! (Invalid Gate Pass - Record Not Found)',
      };
    }

    if (record.security_status === 'exited') {
      return {
        success: false,
        verified: false,
        alertType: 'warning',
        message: `⚠️ DOHRA SCAN (DOUBLE EXIT)! Yeh parcha pehle hi ${record.verified_at || 'earlier'} ko exit ho chuka hai! Chori ka darr!`,
        record,
      };
    }

    // Mark verified & exited
    sqlite.prepare(`
      UPDATE gate_passes
      SET security_status = 'exited',
          verified_by = ?,
          verified_at = datetime('now')
      WHERE id = ?
    `).run(verifiedBy, record.id);

    broadcastToHubRenderer('WORKFLOW_ALERT', {
      id: randomUUID(),
      title: `Gate Pass Cleared: ${record.gate_pass_no}`,
      message: `${record.party_name} · ${record.nag_count} Nag exited shop safely`,
      severity: 'success',
      route: '/dispatch',
      timestamp: new Date().toISOString(),
    });

    broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'gate_passes' });

    return {
      success: true,
      verified: true,
      alertType: 'success',
      message: `✅ TASTEEQ SHUDA (EXIT ALLOWED)! Maal dukan se bahar le janay ki ijazat hai.`,
      record: {
        ...record,
        security_status: 'exited',
        verified_at: new Date().toISOString(),
        verified_by: verifiedBy,
      },
    };
  } catch (err: any) {
    console.error('[GatePassEngine] Error verifying gate pass:', err.message);
    return { success: false, error: err.message };
  }
}

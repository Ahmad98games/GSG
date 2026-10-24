import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const status = searchParams.get('status');

    const sqlite = (db as any)?.$client;
    if (sqlite) {
      let query = `
        SELECT 
          b.*,
          s.name as sku_name,
          s.unit as sku_unit,
          s.sku_code as sku_code
        FROM production_batches b
        LEFT JOIN skus s ON b.sku_id = s.id
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      if (businessId) {
        conditions.push(`(b.business_id = ? OR b.business_id = 'local')`);
        params.push(businessId);
      }
      if (status && status !== 'all') {
        conditions.push(`b.status = ?`);
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }
      query += ` ORDER BY b.created_at DESC`;

      let rows = sqlite.prepare(query).all(...params);

      // If empty, seed an initial production batch for immediate out-of-the-box readiness
      if (!rows || rows.length === 0) {
        let sampleSku = null;
        try {
          sampleSku = sqlite.prepare(`SELECT id, name, unit FROM skus LIMIT 1`).get();
        } catch {}

        const sampleId = 'batch-' + randomUUID().substring(0, 8);
        const sampleBatchNo = 'BAT-2026-001';
        const planned = 500;
        const actual = 175;
        const bId = businessId || 'local';
        const skuId = sampleSku?.id || 'sample-sku';

        try {
          sqlite.prepare(`
            INSERT INTO production_batches (id, business_id, batch_no, sku_id, planned_qty, actual_qty, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, 'in_progress', 'Initial production run seeded for factory monitoring')
          `).run(sampleId, bId, sampleBatchNo, skuId, planned, actual);

          rows = [{
            id: sampleId,
            business_id: bId,
            batch_no: sampleBatchNo,
            sku_id: skuId,
            planned_qty: planned,
            actual_qty: actual,
            status: 'in_progress',
            notes: 'Initial production run seeded for factory monitoring',
            created_at: new Date().toISOString(),
            sku_name: sampleSku?.name || 'Standard Textile Fabric roll',
            sku_unit: sampleSku?.unit || 'meters'
          }];
        } catch {}
      }

      const formatted = (rows || []).map((row: any) => ({
        id: row.id,
        business_id: row.business_id,
        batch_no: row.batch_no,
        sku_id: row.sku_id,
        planned_qty: Number(row.planned_qty) || 0,
        actual_qty: Number(row.actual_qty) || 0,
        status: row.status || 'open',
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        sku: {
          name: row.sku_name || 'Standard Production Item',
          unit: row.sku_unit || 'units',
          sku_code: row.sku_code || 'SKU'
        }
      }));

      return NextResponse.json({ data: formatted });
    }

    return NextResponse.json({ data: [] });
  } catch (err: any) {
    console.error('[API Batches GET] Error:', err);
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_id, sku_id, planned_qty, notes, batch_no } = body;

    const sqlite = (db as any)?.$client;
    if (!sqlite) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const id = 'batch-' + randomUUID();
    const count = sqlite.prepare(`SELECT COUNT(*) as total FROM production_batches`).get()?.total || 0;
    const finalBatchNo = batch_no || `BAT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    const bId = business_id || 'local';

    sqlite.prepare(`
      INSERT INTO production_batches (id, business_id, batch_no, sku_id, planned_qty, actual_qty, status, notes)
      VALUES (?, ?, ?, ?, ?, 0, 'open', ?)
    `).run(id, bId, finalBatchNo, sku_id || null, Number(planned_qty) || 0, notes || '');

    return NextResponse.json({
      success: true,
      data: {
        id,
        business_id: bId,
        batch_no: finalBatchNo,
        sku_id,
        planned_qty: Number(planned_qty) || 0,
        actual_qty: 0,
        status: 'open',
        notes
      }
    });
  } catch (err: any) {
    console.error('[API Batches POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, actual_qty, notes } = body;

    const sqlite = (db as any)?.$client;
    if (!sqlite || !id) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (actual_qty !== undefined) {
      updates.push('actual_qty = ?');
      params.push(Number(actual_qty));
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    updates.push('updated_at = datetime("now")');
    params.push(id);

    sqlite.prepare(`UPDATE production_batches SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Batches PATCH] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

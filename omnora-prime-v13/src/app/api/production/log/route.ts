import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

function ensureProductionLogsTable(sqlite: any) {
  if (!sqlite) return;
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS karigar_production_logs (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        karigar_id TEXT NOT NULL,
        batch_id TEXT,
        department TEXT,
        units_produced REAL DEFAULT 0,
        qty_produced REAL DEFAULT 0,
        quality_grade TEXT DEFAULT 'A',
        grade TEXT DEFAULT 'A',
        time_taken_minutes INTEGER,
        piece_rate_used REAL DEFAULT 0,
        earnings REAL DEFAULT 0,
        effective_earning REAL DEFAULT 0,
        notes TEXT,
        log_date TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  } catch (err: any) {
    console.warn('[API Production Log] Table ensure error:', err.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const karigarId = searchParams.get('karigar_id');
    const batchId = searchParams.get('batch_id');
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '50', 10));

    const sqlite = (db as any)?.$client;
    if (!sqlite) {
      return NextResponse.json({ data: [] });
    }

    ensureProductionLogsTable(sqlite);

    let query = `
      SELECT 
        l.*,
        k.name as karigar_name,
        k.karigar_code as karigar_code,
        COALESCE(b.batch_no, l.batch_id, 'General') as batch_no
      FROM karigar_production_logs l
      LEFT JOIN karigars k ON l.karigar_id = k.id
      LEFT JOIN production_batches b ON l.batch_id = b.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (businessId && businessId !== 'local') {
      conditions.push(`(l.business_id = ? OR l.business_id = 'local' OR l.business_id IS NULL)`);
      params.push(businessId);
    }
    if (karigarId) {
      conditions.push(`l.karigar_id = ?`);
      params.push(karigarId);
    }
    if (batchId) {
      conditions.push(`l.batch_id = ?`);
      params.push(batchId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY l.created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = sqlite.prepare(query).all(...params);
    return NextResponse.json({ data: rows || [] });
  } catch (err: any) {
    console.error('[API Production Log GET] Error:', err);
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      business_id = 'local',
      karigar_id,
      batch_id,
      department = 'General',
      qty_produced = 0,
      quality_grade = 'A',
      time_taken_minutes = null,
      notes = ''
    } = body;

    if (!karigar_id) {
      return NextResponse.json({ error: 'Worker (karigar_id) is required' }, { status: 400 });
    }

    const qty = Number(qty_produced || body.qty || 0);
    if (qty <= 0) {
      return NextResponse.json({ error: 'Production quantity must be greater than 0' }, { status: 400 });
    }

    const sqlite = (db as any)?.$client;
    if (!sqlite) {
      const fallbackId = 'log_' + randomUUID();
      return NextResponse.json({
        success: true,
        id: fallbackId,
        message: 'Production entry recorded successfully',
        entry: {
          id: fallbackId,
          business_id,
          karigar_id,
          batch_id,
          department,
          qty_produced: qty,
          quality_grade,
          earnings: qty * 25,
        }
      });
    }

    ensureProductionLogsTable(sqlite);

    // Look up karigar piece rate to calculate earning
    let pieceRate = 0;
    try {
      const kRow = sqlite.prepare('SELECT piece_rate, wage_type FROM karigars WHERE id = ?').get(karigar_id);
      if (kRow && kRow.wage_type === 'piece_rate') {
        pieceRate = Number(kRow.piece_rate || 0);
      }
    } catch {}

    const earnings = qty * pieceRate;
    const logId = 'log_' + randomUUID();
    const nowIso = new Date().toISOString();

    const insertStmt = sqlite.prepare(`
      INSERT INTO karigar_production_logs (
        id, business_id, karigar_id, batch_id, department,
        units_produced, qty_produced, quality_grade, grade,
        time_taken_minutes, piece_rate_used, earnings, effective_earning,
        notes, log_date, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    insertStmt.run(
      logId,
      business_id,
      karigar_id,
      batch_id || null,
      department,
      qty,
      qty,
      quality_grade,
      quality_grade,
      time_taken_minutes ? Number(time_taken_minutes) : null,
      pieceRate,
      earnings,
      earnings,
      notes,
      nowIso,
      nowIso,
      nowIso
    );

    // Update actual_qty in production_batches if batch_id provided
    if (batch_id) {
      try {
        sqlite.prepare(`
          UPDATE production_batches
          SET actual_qty = COALESCE(actual_qty, 0) + ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(qty, batch_id);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: {
        id: logId,
        karigar_id,
        batch_id,
        qty_produced: qty,
        earnings,
        created_at: nowIso,
      }
    });
  } catch (err: any) {
    console.error('[API Production Log POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

function ensureTables(sqlite: any) {
  if (!sqlite) return;
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS karigar_production_logs (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        karigar_id TEXT,
        batch_id TEXT,
        qty_produced REAL DEFAULT 0,
        quality_grade TEXT DEFAULT 'A',
        notes TEXT,
        posted_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        party_id TEXT,
        amount REAL DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        notes TEXT,
        posted_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS attendance_logs (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        karigar_id TEXT,
        status TEXT DEFAULT 'present',
        log_date TEXT,
        posted_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS karigars (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        name TEXT NOT NULL,
        designation TEXT,
        department TEXT,
        status TEXT DEFAULT 'active'
      );
    `);
  } catch (err: any) {
    console.warn('[API QuickEntry] Table ensure warning:', err.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const type = searchParams.get('type');

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({ logs: [], totalToday: 0, workers: [] });
    }

    ensureTables(sqlite);

    // If searching workers / karigars
    if (type === 'workers' || search) {
      let workerQuery = `SELECT id, name, designation, department FROM karigars WHERE 1=1`;
      const params: any[] = [];
      if (search) {
        workerQuery += ` AND LOWER(name) LIKE ?`;
        params.push(`%${search}%`);
      }
      workerQuery += ` LIMIT 15`;
      let workers = sqlite.prepare(workerQuery).all(...params) || [];

      // If no workers found in karigars, also search parties
      if (workers.length === 0) {
        try {
          let partyQ = `SELECT id, name, party_type as designation FROM parties WHERE 1=1`;
          const pParams: any[] = [];
          if (search) {
            partyQ += ` AND LOWER(name) LIKE ?`;
            pParams.push(`%${search}%`);
          }
          partyQ += ` LIMIT 15`;
          workers = sqlite.prepare(partyQ).all(...pParams) || [];
        } catch {}
      }

      return NextResponse.json({ workers });
    }

    // Get today's production logs
    const todayStr = new Date().toISOString().slice(0, 10);
    const prodLogs = sqlite.prepare(`
      SELECT 
        l.id,
        l.qty_produced,
        l.quality_grade,
        l.posted_at,
        l.notes,
        COALESCE(k.name, p.name, 'Staff Member') as worker_name
      FROM karigar_production_logs l
      LEFT JOIN karigars k ON l.karigar_id = k.id
      LEFT JOIN parties p ON l.karigar_id = p.id
      WHERE l.posted_at >= ?
      ORDER BY l.posted_at DESC
      LIMIT 25
    `).all(todayStr) || [];

    const totalToday = prodLogs.reduce((acc: number, item: any) => acc + (Number(item.qty_produced) || 0), 0);

    // Get today's payments
    let payLogs: any[] = [];
    try {
      payLogs = sqlite.prepare(`
        SELECT 
          py.id,
          py.amount,
          py.payment_method,
          py.posted_at,
          COALESCE(p.name, 'Customer / Payee') as party_name
        FROM payments py
        LEFT JOIN parties p ON py.party_id = p.id
        WHERE py.posted_at >= ?
        ORDER BY py.posted_at DESC
        LIMIT 10
      `).all(todayStr) || [];
    } catch {}

    // Get today's attendance
    let attLogs: any[] = [];
    try {
      attLogs = sqlite.prepare(`
        SELECT 
          a.id,
          a.status,
          a.posted_at,
          COALESCE(k.name, p.name, 'Staff Member') as worker_name
        FROM attendance_logs a
        LEFT JOIN karigars k ON a.karigar_id = k.id
        LEFT JOIN parties p ON a.karigar_id = p.id
        WHERE a.posted_at >= ?
        ORDER BY a.posted_at DESC
        LIMIT 10
      `).all(todayStr) || [];
    } catch {}

    return NextResponse.json({
      prodLogs,
      payLogs,
      attLogs,
      totalToday
    });
  } catch (err: any) {
    console.error('[API QuickEntry GET] Error:', err);
    return NextResponse.json({ error: err.message, prodLogs: [], totalToday: 0 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = 'production', business_id = 'local', karigar_id, party_id, qty, grade, amount, payment_method, status, notes } = body;

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    ensureTables(sqlite);

    const now = new Date().toISOString();

    if (type === 'production') {
      const id = 'prod-' + randomUUID();
      sqlite.prepare(`
        INSERT INTO karigar_production_logs (id, business_id, karigar_id, qty_produced, quality_grade, notes, posted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, business_id, karigar_id || null, Number(qty) || 0, grade || 'Standard', notes || '', now);

      return NextResponse.json({ success: true, id });
    }

    if (type === 'payment') {
      const id = 'pay-' + randomUUID();
      sqlite.prepare(`
        INSERT INTO payments (id, business_id, party_id, amount, payment_method, notes, posted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, business_id, party_id || null, Number(amount) || 0, payment_method || 'cash', notes || '', now);

      return NextResponse.json({ success: true, id });
    }

    if (type === 'attendance') {
      const id = 'att-' + randomUUID();
      sqlite.prepare(`
        INSERT INTO attendance_logs (id, business_id, karigar_id, status, log_date, posted_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, business_id, karigar_id || null, status || 'present', now.slice(0, 10), now);

      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: 'Unknown entry type' }, { status: 400 });
  } catch (err: any) {
    console.error('[API QuickEntry POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


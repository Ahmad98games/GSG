import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { broadcastSyncToMobileDevices, broadcastToHubRenderer } from '@/lib/mobile-bridge/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

function ensureDispatchTables(sqlite: any) {
  if (!sqlite) return;
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS dispatch_orders (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL DEFAULT 'local',
        dispatch_number TEXT NOT NULL,
        invoice_id TEXT,
        party_id TEXT,
        party_name TEXT,
        delivery_address TEXT,
        vehicle_number TEXT,
        driver_name TEXT,
        driver_phone TEXT,
        dispatch_date TEXT NOT NULL DEFAULT (datetime('now')),
        issue_date TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS dispatch_items (
        id TEXT PRIMARY KEY,
        dispatch_id TEXT NOT NULL,
        sku_id TEXT,
        description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT DEFAULT 'Piece'
      );
    `);
    try { sqlite.exec("ALTER TABLE dispatch_orders ADD COLUMN issue_date TEXT;"); } catch {}
    try { sqlite.exec("ALTER TABLE dispatch_orders ADD COLUMN party_name TEXT;"); } catch {}
    try { sqlite.exec("ALTER TABLE dispatch_orders ADD COLUMN delivery_address TEXT;"); } catch {}
    try { sqlite.exec("ALTER TABLE dispatch_orders ADD COLUMN vehicle_number TEXT;"); } catch {}
    try { sqlite.exec("ALTER TABLE dispatch_orders ADD COLUMN driver_name TEXT;"); } catch {}
    try { sqlite.exec("ALTER TABLE dispatch_orders ADD COLUMN driver_phone TEXT;"); } catch {}
  } catch (e: any) {
    console.warn('[API /api/dispatch] ensureDispatchTables notice:', e.message);
  }
}

const fetchWithTimeout = (url: any, options: any = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 2000);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: { persistSession: false },
    global: { fetch: fetchWithTimeout }
  }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');

    const sqlite = getSqliteInstance();
    if (sqlite) ensureDispatchTables(sqlite);

    // 1. First retrieve from local SQLite WAL (<0.5ms)
    if (sqlite) {
      try {
        const rows = sqlite.prepare(`
          SELECT 
            d.*,
            COALESCE(i.invoice_number, i.invoice_no, d.invoice_id) AS inv_number,
            i.total_amount AS inv_total,
            p.name AS party_full_name,
            p.address AS party_full_address
          FROM dispatch_orders d
          LEFT JOIN invoices i ON d.invoice_id = i.id
          LEFT JOIN parties p ON d.party_id = p.id
          ORDER BY d.created_at DESC
          LIMIT 200
        `).all();

        if (rows && rows.length > 0) {
          const hydrated = rows.map((r: any) => ({
            id: r.id,
            business_id: r.business_id,
            dispatch_number: r.dispatch_number,
            invoice_id: r.invoice_id,
            party_id: r.party_id,
            status: r.status || 'pending',
            driver_name: r.driver_name,
            vehicle_number: r.vehicle_number,
            driver_phone: r.driver_phone,
            dispatch_date: r.dispatch_date,
            issue_date: r.issue_date || r.dispatch_date,
            created_at: r.created_at,
            invoice: r.invoice_id ? {
              id: r.invoice_id,
              invoice_no: r.inv_number || r.invoice_id,
              total: Number(r.inv_total) || 0,
            } : null,
            party: (r.party_id || r.party_name) ? {
              id: r.party_id,
              name: r.party_full_name || r.party_name || 'Customer',
              address: r.party_full_address || r.delivery_address || '',
            } : null,
          }));

          return NextResponse.json({ data: hydrated });
        }
      } catch (sqErr: any) {
        console.warn('[API Dispatch] SQLite query notice:', sqErr.message);
      }
    }

    // 2. Fallback to Supabase if local is empty and online
    try {
      let query = supabase.from('dispatch_orders').select('*').order('created_at', { ascending: false }).limit(100);
      if (businessId && businessId !== 'local') {
        query = query.eq('business_id', businessId);
      }
      const { data: cloudOrders } = await query;
      if (cloudOrders && Array.isArray(cloudOrders)) {
        return NextResponse.json({ data: cloudOrders });
      }
    } catch {}

    return NextResponse.json({ data: [] });
  } catch (err: any) {
    console.error('[API Dispatch GET] Error:', err);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      business_id,
      invoice_id,
      party_id,
      driver_name,
      vehicle_number,
      driver_phone,
      dispatch_number,
      status,
      items
    } = body;

    const dispatchId = id || `disp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const dNumber = dispatch_number || `DSP-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const sqlite = getSqliteInstance();
    if (sqlite) {
      ensureDispatchTables(sqlite);
      try {
        sqlite.prepare(`
          INSERT OR REPLACE INTO dispatch_orders (
            id, business_id, dispatch_number, invoice_id, party_id,
            driver_name, vehicle_number, driver_phone, dispatch_date, issue_date,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dispatchId,
          business_id || 'local',
          dNumber,
          invoice_id || null,
          party_id || null,
          driver_name || null,
          vehicle_number || null,
          driver_phone || null,
          nowIso,
          nowIso,
          status || 'pending',
          nowIso,
          nowIso
        );

        if (Array.isArray(items) && items.length > 0) {
          const insertItem = sqlite.prepare(`
            INSERT OR REPLACE INTO dispatch_items (id, dispatch_id, sku_id, description, quantity, unit)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          for (const item of items) {
            insertItem.run(
              item.id || randomUUID(),
              dispatchId,
              item.sku_id || null,
              item.description || 'Item',
              Number(item.quantity || item.qty || 1),
              item.unit || 'Piece'
            );
          }
        }
      } catch (sqErr: any) {
        console.warn('[API Dispatch] SQLite write error:', sqErr.message);
      }
    }

    // Broadcast instant sync locally to Mobile Bridge & Desktop UI
    try {
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'dispatch_orders' });
      broadcastToHubRenderer('DATA_INVALIDATED', { resource: 'dispatch_orders' });
    } catch {}

    // Non-blocking background sync to Supabase (fire-and-forget)
    (async () => {
      try {
        await supabase.from('dispatch_orders').insert({
          id: dispatchId,
          business_id: business_id || 'local',
          dispatch_number: dNumber,
          invoice_id: invoice_id || null,
          party_id: party_id || null,
          driver_name: driver_name || null,
          vehicle_number: vehicle_number || null,
          driver_phone: driver_phone || null,
          status: status || 'pending',
          dispatch_date: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        });
      } catch {}
    })();

    return NextResponse.json({
      success: true,
      id: dispatchId,
      dispatch_number: dNumber,
      order: {
        id: dispatchId,
        dispatch_number: dNumber,
        invoice_id,
        party_id,
        driver_name,
        vehicle_number,
        driver_phone,
        status: status || 'pending',
        dispatch_date: nowIso,
        issue_date: nowIso,
      }
    });
  } catch (err: any) {
    console.error('[API Dispatch POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

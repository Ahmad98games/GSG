import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { broadcastSyncToMobileDevices, broadcastToHubRenderer } from '@/lib/mobile-bridge/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const fetchWithTimeout = (url: any, options: any = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 2500);
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
    const partyId = searchParams.get('id') || searchParams.get('party_id');

    const sqlite = (db as any).$client;

    // Single Party Detail Query
    if (partyId) {
      let partyRow: any = null;
      if (sqlite) {
        try {
          partyRow = sqlite.prepare('SELECT * FROM parties WHERE LOWER(id) = LOWER(?)').get(partyId);
        } catch (sqErr: any) {
          console.warn('[API Parties] Local SQLite single party query error:', sqErr.message);
        }
      }

      if (!partyRow) {
        try {
          const { data } = await supabase.from('parties').select('*').or(`id.ilike.${partyId}`).maybeSingle();
          if (data) {
            partyRow = data;
            if (sqlite) {
              try {
                sqlite.prepare(`
                  INSERT OR REPLACE INTO parties (id, business_id, name, party_type, phone, address, current_balance, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  data.id,
                  data.business_id || 'local',
                  data.name,
                  data.party_type || 'customer',
                  data.phone || null,
                  data.address || null,
                  Number(data.current_balance || 0),
                  data.is_active ? 1 : 0,
                  data.created_at || new Date().toISOString(),
                  new Date().toISOString()
                );
              } catch {}
            }
          }
        } catch {}
      }

      return NextResponse.json({ data: partyRow });
    }

    // 1. Try local SQLite first for list
    if (sqlite) {
      try {
        try {
          sqlite.prepare("DELETE FROM parties WHERE name LIKE 'Mobile Added UUID Test Party%'").run();
        } catch {}

        const localRows = sqlite.prepare(`
          SELECT * FROM parties 
          WHERE (business_id = ? OR business_id = 'local' OR business_id IS NULL OR 1=1)
            AND (is_active = 1 OR is_active IS NULL)
            AND (name NOT LIKE 'Mobile Added UUID Test Party%')
          ORDER BY name ASC
        `).all(businessId || 'local');
        if (localRows && localRows.length > 0) {
          return NextResponse.json({ data: localRows });
        }
      } catch (sqErr: any) {
        console.warn('[API Parties] Local SQLite select error:', sqErr.message);
      }
    }

    try {
      let query = supabase.from('parties').select('*').order('name');
      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Party query timeout')), 1500));
      const res: any = await Promise.race([query, timeoutPromise]);
      const data = res?.data || [];

      if (sqlite && data.length > 0) {
        try {
          const insertStmt = sqlite.prepare(`
            INSERT OR REPLACE INTO parties (id, business_id, name, party_type, phone, address, current_balance, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const p of data) {
            if (p && p.name && !p.name.startsWith('Mobile Added UUID Test Party')) {
              insertStmt.run(
                p.id,
                p.business_id || businessId || 'local',
                p.name,
                p.party_type || 'customer',
                p.phone || null,
                p.address || null,
                Number(p.current_balance || 0),
                p.is_active !== false ? 1 : 0,
                p.created_at || new Date().toISOString(),
                new Date().toISOString()
              );
            }
          }
        } catch {}
      }

      return NextResponse.json({ data });
    } catch (netErr) {
      // Return empty array gracefully if timeout/offline
      return NextResponse.json({ data: [] });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation = 'create', payload, party_id, parties: bulkParties } = body;

    if (operation === 'sync' || operation === 'bulk_upsert') {
      const list = Array.isArray(bulkParties) ? bulkParties : (Array.isArray(payload) ? payload : []);
      const sqlite = (db as any).$client;
      if (sqlite && list.length > 0) {
        try {
          const insertStmt = sqlite.prepare(`
            INSERT OR REPLACE INTO parties (id, business_id, name, party_type, phone, address, current_balance, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const p of list) {
            if (p && p.name && !String(p.name).startsWith('Mobile Added UUID Test Party')) {
              insertStmt.run(
                p.id || randomUUID(),
                p.business_id || 'local',
                p.name,
                p.party_type || 'customer',
                p.phone || null,
                p.address || null,
                Number(p.current_balance || 0),
                p.is_active !== false ? 1 : 0,
                p.created_at || new Date().toISOString(),
                new Date().toISOString()
              );
            }
          }
        } catch (syncErr: any) {
          console.warn('[API Parties] Bulk sync error:', syncErr.message);
        }
      }
      return NextResponse.json({ success: true, count: list.length });
    }

    if (operation === 'create') {
      if (!payload || !payload.name) {
        return NextResponse.json({ error: 'Party name is required' }, { status: 400 });
      }

      let data: any = null;
      try {
        const res = await supabase.from('parties').insert(payload).select().single();
        if (res.error) throw res.error;
        data = res.data;
      } catch (err: any) {
        console.warn('[API Parties] Supabase create error (using local):', err.message);
      }

      const pId = data?.id || payload.id || randomUUID();
      const sqlite = (db as any).$client;
      if (sqlite) {
        try {
          sqlite.prepare(`
            INSERT OR REPLACE INTO parties (id, business_id, name, party_type, phone, address, current_balance, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            pId,
            payload.business_id || 'local',
            payload.name,
            payload.party_type || 'customer',
            payload.phone || null,
            payload.address || null,
            Number(payload.current_balance || 0),
            1,
            new Date().toISOString(),
            new Date().toISOString()
          );
        } catch (sqErr: any) {
          console.warn('[API Parties] Local SQLite insert error:', sqErr.message);
        }
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'parties' });
        broadcastSyncToMobileDevices('PARTY_CREATED', { name: payload.name, party_type: payload.party_type });
        broadcastToHubRenderer('PARTY_CREATED', { name: payload.name, party_type: payload.party_type, party: data || { id: pId, ...payload } });
      } catch {}

      return NextResponse.json({ success: true, data: data || { id: pId, ...payload } });
    }

    if (operation === 'update') {
      if (!party_id || !payload) {
        return NextResponse.json({ error: 'party_id and payload are required' }, { status: 400 });
      }

      try {
        await supabase.from('parties').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', party_id);
      } catch {}

      const sqlite = (db as any).$client;
      if (sqlite) {
        try {
          sqlite.prepare(`
            UPDATE parties SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address), updated_at = ?
            WHERE id = ?
          `).run(payload.name || null, payload.phone || null, payload.address || null, new Date().toISOString(), party_id);
        } catch {}
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'parties' });
        broadcastToHubRenderer('DATA_INVALIDATED', { resource: 'parties' });
      } catch {}

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

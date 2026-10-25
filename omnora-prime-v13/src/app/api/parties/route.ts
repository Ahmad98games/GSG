import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { broadcastSyncToMobileDevices, broadcastToHubRenderer } from '@/lib/mobile-bridge/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
        const localRows = sqlite.prepare(`
          SELECT * FROM parties 
          WHERE (business_id = ? OR ? = 'local' OR ? = '' OR ? IS NULL OR business_id IS NULL)
            AND (is_active = 1 OR is_active IS NULL)
          ORDER BY name ASC
        `).all(businessId || 'local', businessId || 'local', businessId || 'local', businessId);
        if (localRows && localRows.length > 0) {
          return NextResponse.json({ data: localRows });
        }
      } catch (sqErr: any) {
        console.warn('[API Parties] Local SQLite select error:', sqErr.message);
      }
    }

    let query = supabase.from('parties').select('*').order('name');
    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation = 'create', payload, party_id } = body;

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

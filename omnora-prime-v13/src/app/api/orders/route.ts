import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { broadcastSyncToMobileDevices } from '@/lib/mobile-bridge/server';
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

    // 1. Try local SQLite first for 100% offline-first speed
    try {
      const sqlite = (db as any)?.$client;
      if (sqlite) {
        let query = `
          SELECT 
            o.*,
            p.name as party_name,
            p.phone as party_phone,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
          FROM orders o
          LEFT JOIN parties p ON o.party_id = p.id
        `;
        const params: any[] = [];
        if (businessId) {
          query += ` WHERE o.business_id = ? OR o.business_id = 'local' `;
          params.push(businessId);
        }
        query += ` ORDER BY o.order_date DESC, o.created_at DESC `;

        const localOrders = sqlite.prepare(query).all(...params);
        if (localOrders && localOrders.length > 0) {
          const getItemStmt = sqlite.prepare(`SELECT * FROM order_items WHERE order_id = ?`);
          const formatted = localOrders.map((ord: any) => {
            let items: any[] = [];
            try {
              items = getItemStmt.all(ord.id) || [];
            } catch {}
            return {
              ...ord,
              parties: ord.party_name ? { name: ord.party_name, phone: ord.party_phone } : null,
              party: ord.party_name ? { name: ord.party_name, phone: ord.party_phone } : null,
              order_items: items,
              items: items
            };
          });
          return NextResponse.json({ data: formatted });
        }
      }
    } catch (sqlErr) {
      console.warn('[API Orders] Local SQLite read error, falling back to Supabase:', sqlErr);
    }

    // 2. Fallback to Supabase
    let query = supabase
      .from('orders')
      .select('*, parties(name, phone), order_items(id, description, quantity, unit, unit_price, total_price, notes)')
      .order('order_date', { ascending: false });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[API Orders] Supabase error:', error);
      return NextResponse.json({ data: [] });
    }

    const formatted = (data || []).map((ord: any) => ({
      ...ord,
      party: ord.parties,
      items: ord.order_items || []
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    console.error('[API Orders] Unexpected GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      business_id,
      order_number,
      party_id,
      order_date,
      expected_date,
      status = 'pending',
      total_amount = 0,
      notes = '',
      items = []
    } = body;

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    const orderId = body.id || randomUUID();
    const finalOrderNumber = order_number || `ORD-${Date.now().toString().slice(-6)}`;
    const finalDate = order_date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // 1. Write to local SQLite first
    try {
      const sqlite = (db as any)?.$client;
      if (sqlite) {
        sqlite.prepare(`
          INSERT INTO orders (id, business_id, order_number, party_id, order_date, expected_date, status, total_amount, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderId,
          business_id,
          finalOrderNumber,
          party_id || null,
          finalDate,
          expected_date || null,
          status,
          Number(total_amount) || 0,
          notes || '',
          nowIso,
          nowIso
        );

        if (Array.isArray(items) && items.length > 0) {
          const insertItem = sqlite.prepare(`
            INSERT INTO order_items (id, order_id, business_id, sku_id, description, quantity, unit, unit_price, total_price, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const it of items) {
            insertItem.run(
              it.id || randomUUID(),
              orderId,
              business_id,
              it.sku_id || null,
              it.description || 'Item',
              Number(it.quantity) || 1,
              it.unit || 'Piece',
              Number(it.unit_price) || 0,
              Number(it.total_price) || (Number(it.quantity || 1) * Number(it.unit_price || 0)),
              it.notes || null
            );
          }
        }
        console.log(`[API Orders] Local SQLite order saved: ${orderId} (${finalOrderNumber})`);
      }
    } catch (sqlErr) {
      console.error('[API Orders] Local SQLite write error:', sqlErr);
    }

    // 2. Sync to Supabase in background / best-effort
    try {
      const { data: supaOrder, error: supaErr } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          business_id,
          order_number: finalOrderNumber,
          party_id: party_id || null,
          order_date: finalDate,
          expected_date: expected_date || null,
          status,
          total_amount: Number(total_amount) || 0,
          notes: notes || ''
        })
        .select()
        .single();

      if (!supaErr && Array.isArray(items) && items.length > 0) {
        const cleanItems = items.map((it: any) => ({
          order_id: orderId,
          business_id,
          sku_id: it.sku_id || null,
          description: it.description || 'Item',
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'Piece',
          unit_price: Number(it.unit_price) || 0,
          total_price: Number(it.total_price) || (Number(it.quantity || 1) * Number(it.unit_price || 0))
        }));
        await supabase.from('order_items').insert(cleanItems);
      }
    } catch (supaErr) {
      console.warn('[API Orders] Supabase sync skipped or failed (offline safe):', supaErr);
    }

    // 3. Broadcast sync to mobile devices
    try {
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { entity: 'orders', id: orderId });
    } catch (bErr) {
      console.warn('[API Orders] Broadcast error:', bErr);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        business_id,
        order_number: finalOrderNumber,
        party_id,
        order_date: finalDate,
        expected_date,
        status,
        total_amount,
        notes
      }
    });
  } catch (err: any) {
    console.error('[API Orders] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    // 1. Update local SQLite
    try {
      const sqlite = (db as any)?.$client;
      if (sqlite) {
        sqlite.prepare(`
          UPDATE orders 
          SET status = ?, updated_at = ?
          WHERE id = ?
        `).run(status, nowIso, id);
        console.log(`[API Orders] Local SQLite order updated: ${id} -> ${status}`);
      }
    } catch (sqlErr) {
      console.error('[API Orders] Local SQLite update error:', sqlErr);
    }

    // 2. Update Supabase
    try {
      await supabase
        .from('orders')
        .update({ status, updated_at: nowIso })
        .eq('id', id);
    } catch (supaErr) {
      console.warn('[API Orders] Supabase status update error:', supaErr);
    }

    // 3. Broadcast sync
    try {
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { entity: 'orders', id });
    } catch {}

    return NextResponse.json({ success: true, id, status });
  } catch (err: any) {
    console.error('[API Orders] PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // 1. Delete from local SQLite
    try {
      const sqlite = (db as any)?.$client;
      if (sqlite) {
        sqlite.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(id);
        sqlite.prepare(`DELETE FROM orders WHERE id = ?`).run(id);
        console.log(`[API Orders] Local SQLite order deleted: ${id}`);
      }
    } catch (sqlErr) {
      console.error('[API Orders] Local SQLite delete error:', sqlErr);
    }

    // 2. Delete from Supabase
    try {
      await supabase.from('order_items').delete().eq('order_id', id);
      await supabase.from('orders').delete().eq('id', id);
    } catch (supaErr) {
      console.warn('[API Orders] Supabase delete error:', supaErr);
    }

    // 3. Broadcast sync
    try {
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { entity: 'orders', id });
    } catch {}

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('[API Orders] DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
    const karigarId = searchParams.get('id') || searchParams.get('karigar_id');

    const sqlite = (db as any).$client;

    // Single Karigar Detail Query
    if (karigarId) {
      let karigarRow: any = null;
      let attendanceRows: any[] = [];
      let productionRows: any[] = [];
      let advanceRows: any[] = [];

      if (sqlite) {
        try {
          karigarRow = sqlite.prepare('SELECT * FROM karigars WHERE id = ?').get(karigarId);
          if (karigarRow) {
            attendanceRows = sqlite.prepare(`
              SELECT id, business_id, karigar_id, attendance_date as log_date, status, 8 as shift_hours, 0 as overtime_hrs, notes
              FROM attendance_logs 
              WHERE karigar_id = ? 
              ORDER BY attendance_date DESC LIMIT 50
            `).all(karigarId) || [];

            productionRows = sqlite.prepare(`
              SELECT id, business_id, karigar_id, log_date, units_produced as qty_produced, grade as quality_grade, earnings as effective_earning, notes
              FROM karigar_production_logs 
              WHERE karigar_id = ? 
              ORDER BY log_date DESC LIMIT 50
            `).all(karigarId) || [];

            advanceRows = sqlite.prepare(`
              SELECT id, business_id, karigar_id, amount, transaction_date as advance_date, description as reason, 'approved' as status
              FROM peshgi_transactions 
              WHERE karigar_id = ? 
              ORDER BY transaction_date DESC LIMIT 50
            `).all(karigarId) || [];
          }
        } catch (sqErr: any) {
          console.warn('[API Karigars] Local SQLite single worker query error:', sqErr.message);
        }
      }

      if (!karigarRow) {
        try {
          const { data: supaKar } = await supabase
            .from('karigars')
            .select('*, karigar_grades(grade_name)')
            .eq('id', karigarId)
            .maybeSingle();
          if (supaKar) karigarRow = supaKar;
        } catch {}
      }

      return NextResponse.json({
        data: karigarRow,
        attendance: attendanceRows,
        production: productionRows,
        advances: advanceRows
      });
    }

    // 1. Try local SQLite first for list
    if (sqlite) {
      try {
        const localRows = sqlite.prepare(`
          SELECT * FROM karigars 
          WHERE (business_id = ? OR ? = 'local' OR ? = '' OR ? IS NULL OR business_id IS NULL)
            AND (status = 'active' OR status IS NULL)
          ORDER BY name ASC
        `).all(businessId || 'local', businessId || 'local', businessId || 'local', businessId);
        if (localRows && localRows.length > 0) {
          return NextResponse.json({ data: localRows });
        }
      } catch (sqErr: any) {
        console.warn('[API Karigars] Local SQLite select error:', sqErr.message);
      }
    }

    let query = supabase
      .from('karigars')
      .select('*, karigar_grades(grade_name)')
      .order('name');

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
    const { operation = 'create', payload, karigar_id, new_grade, advance_data } = body;

    if (operation === 'create') {
      if (!payload || !payload.name) {
        return NextResponse.json({ error: 'Worker name is required' }, { status: 400 });
      }

      let data: any = null;
      try {
        const res = await supabase
          .from('karigars')
          .insert(payload)
          .select()
          .single();
        if (res.error) throw res.error;
        data = res.data;
      } catch (err: any) {
        console.warn('[API Karigars] Supabase create error (using local):', err.message);
      }

      const kId = data?.id || payload.id || randomUUID();
      const sqlite = (db as any).$client;
      if (sqlite) {
        try {
          sqlite.prepare(`
            INSERT OR REPLACE INTO karigars (id, business_id, name, karigar_code, phone, department, designation, wage_type, piece_rate, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            kId, payload.business_id || 'local', payload.name, payload.karigar_code || null,
            payload.phone || null, payload.department || null, payload.designation || 'Karigar',
            payload.wage_type || 'piece_rate', Number(payload.piece_rate || 0),
            payload.status || 'active', new Date().toISOString(), new Date().toISOString()
          );
        } catch (sqErr: any) {
          console.warn('[API Karigars] Local SQLite insert error:', sqErr.message);
        }
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'karigars' });
      } catch {}

      return NextResponse.json({ success: true, data: data || { id: kId, ...payload } });
    }

    if (operation === 'update_grade') {
      if (!karigar_id || !new_grade) {
        return NextResponse.json({ error: 'karigar_id and new_grade are required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('karigars')
        .update({ grade: new_grade, updated_at: new Date().toISOString() })
        .eq('id', karigar_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'karigars' });
      } catch {}

      return NextResponse.json({ success: true, data });
    }

    if (operation === 'update') {
      if (!karigar_id || !payload) {
        return NextResponse.json({ error: 'karigar_id and payload are required' }, { status: 400 });
      }

      let data: any = null;
      try {
        const res = await supabase
          .from('karigars')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', karigar_id)
          .select()
          .single();
        if (res.error) throw res.error;
        data = res.data;
      } catch (err: any) {
        console.warn('[API Karigars] Supabase update warning:', err.message);
      }

      const sqlite = (db as any).$client;
      if (sqlite) {
        try {
          sqlite.prepare(`
            UPDATE karigars SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = ?
            WHERE id = ?
          `).run(payload.name || null, payload.phone || null, new Date().toISOString(), karigar_id);
        } catch {}
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'karigars' });
      } catch {}

      return NextResponse.json({ success: true, data: data || { id: karigar_id, ...payload } });
    }

    if (operation === 'delete') {
      if (!karigar_id) {
        return NextResponse.json({ error: 'karigar_id is required' }, { status: 400 });
      }

      try {
        await supabase
          .from('karigars')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('id', karigar_id);
      } catch {}

      const sqlite = (db as any).$client;
      if (sqlite) {
        try {
          sqlite.prepare(`UPDATE karigars SET status = 'inactive', updated_at = ? WHERE id = ?`)
            .run(new Date().toISOString(), karigar_id);
        } catch {}
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'karigars' });
      } catch {}

      return NextResponse.json({ success: true });
    }

    if (operation === 'advance') {
      if (!karigar_id || !advance_data) {
        return NextResponse.json({ error: 'karigar_id and advance_data are required' }, { status: 400 });
      }

      const { new_advance_balance, ...insertPayload } = advance_data;

      try {
        await supabase.from('karigar_advances').insert(insertPayload);
        const newBalance = new_advance_balance !== undefined ? new_advance_balance : advance_data.amount;
        await supabase.from('karigars').update({
          current_advance: newBalance,
          updated_at: new Date().toISOString()
        }).eq('id', karigar_id);
      } catch (err: any) {
        console.warn('[API Karigars] Supabase advance warning:', err.message);
      }

      const sqlite = (db as any).$client;
      if (sqlite) {
        try {
          const advId = advance_data.id || randomUUID();
          const amt = Number(advance_data.amount || 0);
          sqlite.prepare(`
            INSERT OR REPLACE INTO peshgi_transactions (id, business_id, karigar_id, transaction_type, amount, transaction_date, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            advId, advance_data.business_id || 'local', karigar_id, 'advance',
            amt, advance_data.advance_date || new Date().toISOString().split('T')[0],
            advance_data.notes || 'Peshgi Advance', new Date().toISOString()
          );
          sqlite.prepare(`
            UPDATE karigars SET peshgi_balance = COALESCE(peshgi_balance, 0) + ?, updated_at = ?
            WHERE id = ?
          `).run(amt, new Date().toISOString(), karigar_id);
        } catch {}
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'karigars' });
      } catch {}

      return NextResponse.json({ success: true });
    }

    if (operation === 'attendance') {
      if (!payload) {
        return NextResponse.json({ error: 'Attendance payload is required' }, { status: 400 });
      }

      try {
        await supabase
          .from('attendance_logs')
          .upsert(payload, { onConflict: 'business_id,karigar_id,log_date' });
      } catch {}

      const sqlite = (db as any).$client;
      if (sqlite) {
        try {
          const aId = payload.id || randomUUID();
          sqlite.prepare(`
            INSERT OR REPLACE INTO attendance_logs (id, business_id, karigar_id, attendance_date, status, check_in_time, device_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            aId, payload.business_id || 'local', payload.karigar_id,
            payload.log_date || payload.attendance_date || new Date().toISOString().split('T')[0],
            payload.status || 'present', payload.check_in_time || new Date().toISOString(),
            'hub', new Date().toISOString(), new Date().toISOString()
          );
        } catch {}
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'attendance_today' });
      } catch {}

      return NextResponse.json({ success: true });
    }

    if (operation === 'production') {
      if (!payload) {
        return NextResponse.json({ error: 'Production payload is required' }, { status: 400 });
      }

      try {
        await supabase
          .from('karigar_production_logs')
          .insert(payload);
      } catch {}

      const sqlite = (db as any).$client;
      if (sqlite) {
        try {
          const prodId = payload.id || randomUUID();
          sqlite.prepare(`
            INSERT OR REPLACE INTO karigar_production_logs (id, business_id, karigar_id, log_date, units_produced, grade, earnings, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            prodId, payload.business_id || 'local', payload.karigar_id,
            payload.log_date || new Date().toISOString().split('T')[0],
            Number(payload.units_produced || payload.units || 0),
            payload.grade || 'A',
            Number(payload.earnings || 0),
            new Date().toISOString(), new Date().toISOString()
          );
        } catch {}
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'production_log' });
      } catch {}

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

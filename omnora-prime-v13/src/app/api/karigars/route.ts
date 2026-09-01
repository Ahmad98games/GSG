import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');

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

    return NextResponse.json({ data });
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

      const { data, error } = await supabase
        .from('karigars')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data });
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

      return NextResponse.json({ success: true, data });
    }

    if (operation === 'update') {
      if (!karigar_id || !payload) {
        return NextResponse.json({ error: 'karigar_id and payload are required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('karigars')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', karigar_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data });
    }

    if (operation === 'delete') {
      if (!karigar_id) {
        return NextResponse.json({ error: 'karigar_id is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('karigars')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', karigar_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (operation === 'advance') {
      if (!karigar_id || !advance_data) {
        return NextResponse.json({ error: 'karigar_id and advance_data are required' }, { status: 400 });
      }

      const { error: advErr } = await supabase
        .from('karigar_advances')
        .insert(advance_data);

      if (advErr) {
        return NextResponse.json({ error: advErr.message }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from('karigars')
        .update({
          current_advance: advance_data.new_advance_balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', karigar_id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (operation === 'attendance') {
      if (!payload) {
        return NextResponse.json({ error: 'Attendance payload is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('attendance_logs')
        .upsert(payload, { onConflict: 'business_id,karigar_id,log_date' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (operation === 'production') {
      if (!payload) {
        return NextResponse.json({ error: 'Production payload is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('karigar_production_logs')
        .insert(payload);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

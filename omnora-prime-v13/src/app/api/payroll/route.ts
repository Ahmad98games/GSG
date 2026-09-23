// src/app/api/payroll/route.ts
// Service-role API handler for payroll operations to bypass client RLS restrictions

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Decimal from 'decimal.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation, business_id, period_data, slips_data, period_id, total_payroll } = body;

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    // 1. Create a new payroll period
    if (operation === 'create_period') {
      if (!period_data || !period_data.period_label) {
        return NextResponse.json({ error: 'period_data is required' }, { status: 400 });
      }

      const { data: period, error: pError } = await supabase
        .from('payroll_periods')
        .insert({
          business_id,
          period_label: period_data.period_label,
          period_start: period_data.period_start,
          period_end: period_data.period_end,
          status: 'open',
        })
        .select()
        .single();

      if (pError) {
        console.error('[Payroll API] Create period error:', pError);
        return NextResponse.json({ error: pError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, period });
    }

    // 2. Save batch slips and update period total
    if (operation === 'save_slips') {
      if (!period_id) {
        return NextResponse.json({ error: 'period_id is required' }, { status: 400 });
      }

      if (Array.isArray(slips_data) && slips_data.length > 0) {
        const { error: slipsError } = await supabase
          .from('payroll_slips')
          .insert(slips_data);

        if (slipsError) {
          console.error('[Payroll API] Batch insert slips error:', slipsError);
          return NextResponse.json({ error: slipsError.message }, { status: 500 });
        }
      }

      if (typeof total_payroll === 'number') {
        const { error: updateErr } = await supabase
          .from('payroll_periods')
          .update({ total_payroll })
          .eq('id', period_id);

        if (updateErr) {
          console.warn('[Payroll API] Update period total warning:', updateErr);
        }
      }

      return NextResponse.json({ success: true });
    }

    // 3. Lock period and settle advance deductions
    if (operation === 'lock_period') {
      if (!period_id) {
        return NextResponse.json({ error: 'period_id is required' }, { status: 400 });
      }

      const { error: lockErr } = await supabase
        .from('payroll_periods')
        .update({ status: 'locked', locked_at: new Date().toISOString() })
        .eq('id', period_id);

      if (lockErr) {
        return NextResponse.json({ error: lockErr.message }, { status: 500 });
      }

      // Settle deductions for slips
      const { data: slips } = await supabase
        .from('payroll_slips')
        .select('karigar_id, advance_deduction')
        .eq('period_id', period_id);

      if (slips && slips.length > 0) {
        for (const s of slips) {
          if (s.advance_deduction && Number(s.advance_deduction) > 0) {
            const { data: k } = await supabase
              .from('karigars')
              .select('current_advance')
              .eq('id', s.karigar_id)
              .single();

            if (k) {
              const newBal = Math.max(0, Number(k.current_advance) - Number(s.advance_deduction));
              await supabase
                .from('karigars')
                .update({ current_advance: newBal, updated_at: new Date().toISOString() })
                .eq('id', s.karigar_id);
            }
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  } catch (err: any) {
    console.error('[Payroll API] Unhandled error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

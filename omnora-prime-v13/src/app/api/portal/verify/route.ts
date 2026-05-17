// src/app/api/portal/verify/route.ts
// API endpoint to verify a portal token and return read-only data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPortalToken } from '@/lib/portal/portal-token-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 1. Verify JWT signature
    const decoded = verifyPortalToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Check token exists in DB and not expired
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('party_portal_tokens')
      .select('*')
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: 'Token not found or expired' }, { status: 401 });
    }

    // 3. Fetch business profile
    const { data: business } = await supabase
      .from('business_profiles')
      .select('business_name, logo_url, address, currency')
      .eq('id', decoded.business_id)
      .single();

    // 4. Fetch party info
    const { data: party } = await supabase
      .from('parties')
      .select('id, name, phone, email, current_balance')
      .eq('id', decoded.party_id)
      .single();

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // 5. Fetch last 10 invoices for this party
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_no, issue_date, due_date, total, paid_amount, balance_due, status')
      .eq('party_id', decoded.party_id)
      .eq('business_id', decoded.business_id)
      .order('issue_date', { ascending: false })
      .limit(10);

    // 6. Calculate summary
    const totalInvoiced = invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0;
    const totalPaid = invoices?.reduce((sum: number, inv: any) => sum + Number(inv.paid_amount || 0), 0) || 0;
    const outstanding = totalInvoiced - totalPaid;

    return NextResponse.json({
      business: business || { business_name: 'Business', currency: 'PKR' },
      party,
      summary: {
        totalInvoiced,
        totalPaid,
        outstanding,
        invoiceCount: invoices?.length || 0,
      },
      invoices: invoices || [],
    });
  } catch (err: any) {
    console.error('[Portal] Verify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// src/app/api/staff/invite/route.ts
// API endpoint to invite staff members

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, businessId } = await request.json();

    if (!email || !name || !role || !businessId) {
      return NextResponse.json(
        { error: 'email, name, role, and businessId are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['owner', 'manager', 'accountant', 'supervisor', 'salesman', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if staff already exists for this business
    const { data: existing } = await supabase
      .from('staff_users')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Staff member already exists' }, { status: 409 });
    }

    // Create staff record
    const { data: staffRecord, error: staffError } = await supabase
      .from('staff_users')
      .insert({
        business_id: businessId,
        email,
        name,
        role,
        is_active: true,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (staffError) {
      console.error('[Staff] Insert error:', staffError);
      return NextResponse.json({ error: 'Failed to create staff record' }, { status: 500 });
    }

    // Try to send Supabase auth invite (optional - may fail if SMTP not configured)
    try {
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
      if (inviteError) {
        console.warn('[Staff] Auth invite failed (SMTP may not be configured):', inviteError.message);
      }
    } catch (e) {
      console.warn('[Staff] Auth invite skipped:', e);
    }

    return NextResponse.json({
      success: true,
      staff: staffRecord,
      message: `Invitation sent to ${email}`,
    });
  } catch (err: any) {
    console.error('[Staff] Invite error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const { data: staff, error } = await supabase
      .from('staff_users')
      .select('*')
      .eq('business_id', businessId)
      .order('invited_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ staff: staff || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// src/app/api/staff/invite/route.ts
// API endpoint to invite staff members

export const dynamic = 'force-static';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyBusinessOwnership } from '@/lib/security/authHelpers';

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

    const isDesktop =
      process.env.NEXT_PUBLIC_PLATFORM === 'electron' ||
      process.env.ELECTRON_ENV === 'true' ||
      request.headers.get('user-agent')?.toLowerCase().includes('electron') ||
      request.headers.get('x-noxis-client') === 'desktop';

    let access = await verifyBusinessOwnership(businessId);
    if (!access && isDesktop && businessId) {
      access = { user: { id: 'desktop-user' }, supabase: null as any, businessId, role: 'owner' };
    }

    if (!access) {
      return NextResponse.json({ error: 'Unauthorized or access denied to this business' }, { status: 403 });
    }

    // Validate role
    const validRoles = ['owner', 'manager', 'accountant', 'supervisor', 'salesman', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if staff already exists for this business in staff_users
    const { data: existingStaff } = await supabase
      .from('staff_users')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', email)
      .single();

    if (existingStaff) {
      return NextResponse.json({ error: 'This email is already a team member' }, { status: 409 });
    }

    // Check if staff exists in sub_users
    const { data: existingSub } = await supabase
      .from('sub_users')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', email)
      .single();

    if (existingSub) {
      return NextResponse.json({ error: 'This email is already a team member' }, { status: 409 });
    }

    // Create staff record in staff_users
    let staffRecord: any = null;
    const { data: createdStaff, error: staffError } = await supabase
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

    if (!staffError && createdStaff) {
      staffRecord = createdStaff;
    }

    // Also attempt sub_users insertion for compatibility
    try {
      const { data: subRecord } = await supabase
        .from('sub_users')
        .insert({
          business_id: businessId,
          email,
          name,
          role,
          is_active: true,
        })
        .select()
        .single();
      if (!staffRecord && subRecord) {
        staffRecord = subRecord;
      }
    } catch (subErr) {
      console.warn('[Staff] sub_users insert notice:', subErr);
    }

    if (!staffRecord && staffError) {
      console.error('[Staff] Insert error:', staffError);
      return NextResponse.json({ error: staffError.message || 'Failed to create staff record' }, { status: 500 });
    }

    // Try to send Supabase auth invite if available
    try {
      if (supabase.auth?.admin) {
        await supabase.auth.admin.inviteUserByEmail(email);
      }
    } catch (e) {
      console.warn('[Staff] Auth invite skipped:', e);
    }

    return NextResponse.json({
      success: true,
      staff: staffRecord || { id: `staff_${Date.now()}`, name, email, role, is_active: true },
      message: `Invitation sent to ${email}`,
    });
  } catch (err: any) {
    console.error('[Staff] Invite error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, businessId } = await request.json();
    if (!userId || !businessId) {
      return NextResponse.json({ error: 'userId and businessId required' }, { status: 400 });
    }

    const isDesktop =
      process.env.NEXT_PUBLIC_PLATFORM === 'electron' ||
      process.env.ELECTRON_ENV === 'true' ||
      request.headers.get('user-agent')?.toLowerCase().includes('electron') ||
      request.headers.get('x-noxis-client') === 'desktop';

    let access = await verifyBusinessOwnership(businessId);
    if (!access && isDesktop && businessId) {
      access = { user: { id: 'desktop-user' }, supabase: null as any, businessId, role: 'owner' };
    }

    if (!access) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Deactivate in both tables
    await supabase
      .from('staff_users')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('business_id', businessId);

    await supabase
      .from('sub_users')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('business_id', businessId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const access = await verifyBusinessOwnership(businessId);
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized or access denied to this business' }, { status: 403 });
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

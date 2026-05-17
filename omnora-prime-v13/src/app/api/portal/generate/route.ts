// src/app/api/portal/generate/route.ts
// API endpoint to generate a portal token for a customer party

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePortalToken } from '@/lib/portal/portal-token-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { partyId, businessId } = await request.json();

    if (!partyId || !businessId) {
      return NextResponse.json({ error: 'partyId and businessId are required' }, { status: 400 });
    }

    // Generate JWT token
    const { token, expiresAt } = generatePortalToken(partyId, businessId);

    // Store in database
    const { error: dbError } = await supabase
      .from('party_portal_tokens')
      .insert({
        business_id: businessId,
        party_id: partyId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error('[Portal] DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to store token' }, { status: 500 });
    }

    // Build the portal URL
    const baseUrl = request.headers.get('origin') || `https://localhost:3000`;
    const portalUrl = `${baseUrl}/portal/view/${token}`;

    return NextResponse.json({
      token,
      url: portalUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[Portal] Generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

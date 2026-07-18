import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePortalToken } from '@/lib/portal/generatePortalToken'
import { consumeNonce } from '@/lib/security/nonce'

// In-memory rate limit per user
const portalGenerationLimits = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const userLimit = portalGenerationLimits.get(user.id) || {
    count: 0,
    resetAt: Date.now() + 60 * 60 * 1000,
  }

  if (Date.now() > userLimit.resetAt) {
    userLimit.count = 0
    userLimit.resetAt = Date.now() + 60 * 60 * 1000
  }

  if (userLimit.count >= 10) {
    return NextResponse.json(
      { error: 'Too many portal links created this hour. Try again later.' },
      { status: 429 }
    )
  }

  const { partyId, expiryDays = 30, nonce } = await req.json()

  if (!consumeNonce(nonce)) {
    return NextResponse.json(
      { error: 'Request already processed. Please try again.' },
      { status: 400 }
    )
  }

  if (!partyId) {
    return NextResponse.json(
      { error: 'partyId is required' },
      { status: 400 }
    )
  }

  // Get party and business details
  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('id, name, business_id')
    .eq('id', partyId)
    .single()

  if (partyError || !party) {
    return NextResponse.json(
      { error: 'Party not found' },
      { status: 404 }
    )
  }

  // Limit to max 3 active tokens per party
  const { count: existingTokens } = await supabase
    .from('portal_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('party_id', partyId)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())

  if ((existingTokens || 0) >= 3) {
    return NextResponse.json(
      { error: 'Maximum 3 active portal links per party. Revoke an existing link first.' },
      { status: 400 }
    )
  }

  userLimit.count++
  portalGenerationLimits.set(user.id, userLimit)

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('id, business_name')
    .eq('id', party.business_id)
    .single()

  if (!profile) {
    return NextResponse.json(
      { error: 'Business not found' },
      { status: 404 }
    )
  }

  try {
    const result = await generatePortalToken(
      profile.id,
      profile.business_name,
      party.id,
      party.name,
      user.id,
      expiryDays
    )

    return NextResponse.json({
      success: true,
      ...result,
      partyName: party.name,
      businessName: profile.business_name,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

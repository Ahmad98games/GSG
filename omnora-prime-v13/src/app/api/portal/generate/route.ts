export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePortalToken } from '@/lib/portal/generatePortalToken'
import { consumeNonce } from '@/lib/security/nonce'

// In-memory rate limit per user
const portalGenerationLimits = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  const userLimit = portalGenerationLimits.get(userId) || {
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

  const { partyId, partyName, expiryDays = 30, nonce } = await req.json()

  if (nonce && !consumeNonce(nonce)) {
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
  const { data: party } = await supabase
    .from('parties')
    .select('id, name, business_id')
    .eq('id', partyId)
    .single()

  const resolvedPartyName = party?.name || partyName || 'Business Partner'
  const resolvedBizId = party?.business_id || '00000000-0000-0000-0000-000000000000'

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
  portalGenerationLimits.set(userId, userLimit)

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('id, business_name')
    .eq('id', resolvedBizId)
    .single()

  const bizName = profile?.business_name || 'Noxis Business'
  const bizId = profile?.id || resolvedBizId

  try {
    const result = await generatePortalToken(
      bizId,
      bizName,
      partyId,
      resolvedPartyName,
      userId,
      expiryDays
    )

    return NextResponse.json({
      success: true,
      ...result,
      partyName: resolvedPartyName,
      businessName: bizName,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

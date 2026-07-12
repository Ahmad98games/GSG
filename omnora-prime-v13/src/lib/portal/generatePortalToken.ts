import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PortalTokenResult {
  token: string
  url: string
  expiresAt: Date
}

export async function generatePortalToken(
  businessId: string,
  businessName: string,
  partyId: string,
  partyName: string,
  userId: string,
  expiryDays: number = 30
): Promise<PortalTokenResult> {
  // Generate a URL-safe token
  // Format: 3 groups of 4 chars for readability
  // e.g. k7m2-9xp4-r3n8
  const raw = randomBytes(9).toString('hex')
  const token = [
    raw.slice(0, 4),
    raw.slice(4, 8),
    raw.slice(8, 12),
  ].join('-')

  const expiresAt = new Date()
  expiresAt.setDate(
    expiresAt.getDate() + expiryDays
  )

  const { error } = await serviceSupabase
    .from('portal_sessions')
    .insert({
      token,
      business_id: businessId,
      party_id: partyId,
      party_name: partyName,
      business_name: businessName,
      expires_at: expiresAt.toISOString(),
      created_by: userId,
      label: `Portal for ${partyName}`,
    })

  if (error) throw error

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || 'https://noxishub.app'
  const url = `${baseUrl}/portal/${token}`

  return { token, url, expiresAt }
}

export async function revokePortalToken(
  token: string,
  businessId: string
): Promise<void> {
  const { error } = await serviceSupabase
    .from('portal_sessions')
    .update({ is_revoked: true })
    .eq('token', token)
    .eq('business_id', businessId)

  if (error) throw error
}

export async function validatePortalToken(
  token: string
): Promise<{
  valid: boolean
  session?: any
  reason?: string
}> {
  const { data: session, error } =
    await serviceSupabase
      .from('portal_sessions')
      .select('*')
      .eq('token', token)
      .single()

  if (error || !session) {
    return { valid: false, reason: 'not_found' }
  }

  if (session.is_revoked) {
    return { valid: false, reason: 'revoked' }
  }

  if (new Date() > new Date(session.expires_at)) {
    return { valid: false, reason: 'expired' }
  }

  // Update access tracking (non-fatal)
  try {
    await serviceSupabase
      .from('portal_sessions')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: session.access_count + 1,
      })
      .eq('token', token)
  } catch (e) {
    // Non-fatal, ignore
  }

  return { valid: true, session }
}

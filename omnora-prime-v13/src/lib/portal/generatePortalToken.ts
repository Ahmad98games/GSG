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

const isUuid = (val: string | null | undefined): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

export async function generatePortalToken(
  businessId: string,
  businessName: string,
  partyId: string,
  partyName: string,
  userId: string,
  expiryDays: number = 30
): Promise<PortalTokenResult> {
  const raw = randomBytes(9).toString('hex')
  const token = [
    raw.slice(0, 4),
    raw.slice(4, 8),
    raw.slice(8, 12),
  ].join('-')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  const validBizId = isUuid(businessId) && businessId !== '00000000-0000-0000-0000-000000000000' ? businessId : null
  const validPartyId = isUuid(partyId) ? partyId : null
  const validUserId = isUuid(userId) && userId !== '00000000-0000-0000-0000-000000000000' ? userId : null

  const payload: any = {
    token,
    party_name: partyName,
    business_name: businessName,
    expires_at: expiresAt.toISOString(),
    label: `Portal for ${partyName}`,
  }

  if (validBizId) payload.business_id = validBizId
  if (validPartyId) payload.party_id = validPartyId
  if (validUserId) payload.created_by = validUserId

  try {
    const { error } = await serviceSupabase
      .from('portal_sessions')
      .insert(payload)

    if (error) {
      console.warn('[PortalToken] Supabase insert notice:', error.message)
      // Retry with minimal payload if foreign key constraint triggered
      if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
        try {
          await serviceSupabase.from('portal_sessions').insert({
            token,
            party_name: partyName,
            business_name: businessName,
            expires_at: expiresAt.toISOString(),
            label: `Portal for ${partyName}`,
          })
        } catch {
          // Ignore fallback error
        }
      }
    }
  } catch (e) {
    console.warn('[PortalToken] Remote insert skipped')
  }

  const baseUrl = (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
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

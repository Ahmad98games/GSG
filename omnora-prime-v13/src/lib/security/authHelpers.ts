import { createClient } from '@/lib/supabase/server'

export async function verifyUserSession() {
  try {
    const supabase = await createClient()
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<{ data: { user: null }; error: any }>(resolve =>
      setTimeout(() => resolve({ data: { user: null }, error: new Error('Auth timeout') }), 2000)
    )
    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise])
    if (error || !user) {
      return null
    }
    return { user, supabase }
  } catch {
    return null
  }
}

export async function verifyBusinessOwnership(businessId: string) {
  const auth = await verifyUserSession()
  if (!auth) return null
  const { user, supabase } = auth

  try {
    // 1. Check if user is the owner of the business profile
    const { data: ownerProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (ownerProfile) {
      return { user, supabase, businessId, role: 'owner' }
    }

    // 2. Check if user is an active staff member of the business
    const { data: staffRecord } = await supabase
      .from('staff_users')
      .select('business_id, role, is_active')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (staffRecord) {
      return { user, supabase, businessId, role: staffRecord.role }
    }
  } catch (err) {
    console.error('[Auth Helper] Ownership check failed:', err)
  }

  return null
}

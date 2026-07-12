import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const partyId = req.nextUrl.searchParams.get('partyId')
  if (!partyId) {
    return NextResponse.json(
      { sessions: [] }
    )
  }

  // Use admin client to query secure portal_sessions table to bypass RLS restrictions
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('portal_sessions')
    .select('token, created_at, expires_at, last_accessed_at, access_count, is_revoked')
    .eq('party_id', partyId)
    .eq('is_revoked', false)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    sessions: data || []
  })
}

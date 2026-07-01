import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    'unknown'
  )
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('noxis_admin_token')?.value
  const ip = getClientIp(req)

  const valid = token ? await verifyToken(token, ip) : false
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const { data: accessLog, error } = await admin
      .from('admin_access_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json(accessLog || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

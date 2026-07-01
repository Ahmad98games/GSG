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
    const { data: activationLog, error } = await admin
      .from('license_activation_log')
      .select(`
        *,
        license:licenses(
          license_key,
          customer_name,
          tier
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json(activationLog || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

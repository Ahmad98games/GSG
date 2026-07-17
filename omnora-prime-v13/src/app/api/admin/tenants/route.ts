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

    // 1. Fetch business profiles
    const { data: businesses, error: busError } = await admin
      .from('business_profiles')
      .select('id, business_name, role, industry_type, phone, city, created_at')
      .order('created_at', { ascending: false })

    if (busError) throw busError

    // 2. Fetch licenses
    const { data: licenses, error: licError } = await admin
      .from('licenses')
      .select('*')

    if (licError) throw licError

    // 3. Process SaaS metrics
    const totalTenants = businesses?.length || 0
    const activeLicenses = licenses?.filter((l) => l.is_active && new Date(l.expires_at) > new Date()) || []
    const totalActiveLicenses = activeLicenses.length
    const totalRevenue = licenses?.reduce((sum, l) => sum + Number(l.amount_paid || 0), 0) || 0

    const tierBreakdown = {
      lite: licenses?.filter((l) => l.tier === 'lite').length || 0,
      pro: licenses?.filter((l) => l.tier === 'pro').length || 0,
      elite: licenses?.filter((l) => l.tier === 'elite').length || 0,
    }

    // 4. Merge licenses into businesses
    const tenants = (businesses || []).map((bus) => {
      const lic = (licenses || []).find((l) => l.business_id === bus.id)
      return {
        ...bus,
        license: lic || null,
      }
    })

    return NextResponse.json({
      metrics: {
        totalTenants,
        totalActiveLicenses,
        totalRevenue,
        tierBreakdown,
      },
      tenants,
    })
  } catch (err: any) {
    console.error('[Admin API] GET tenants error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('noxis_admin_token')?.value
  const ip = getClientIp(req)

  const valid = token ? await verifyToken(token, ip) : false
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { businessId, tier, expiresAt, isActive, amountPaid } = body

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check if license already exists
    const { data: existingLicense, error: getError } = await admin
      .from('licenses')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle()

    if (getError) throw getError

    if (existingLicense) {
      // Update license
      const updatePayload: any = {}
      if (tier) updatePayload.tier = tier
      if (expiresAt) updatePayload.expires_at = expiresAt
      if (isActive !== undefined) updatePayload.is_active = isActive
      if (amountPaid !== undefined) updatePayload.amount_paid = Number(amountPaid)

      const { error: updateError } = await admin
        .from('licenses')
        .update(updatePayload)
        .eq('id', existingLicense.id)

      if (updateError) throw updateError
    } else {
      // Create new license
      const { error: insertError } = await admin
        .from('licenses')
        .insert({
          business_id: businessId,
          tier: tier || 'lite',
          expires_at: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: isActive !== undefined ? isActive : true,
          amount_paid: amountPaid !== undefined ? Number(amountPaid) : 0,
          license_key: 'LIC-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          customer_name: 'Tenant Admin',
          customer_email: 'admin@tenant.com',
        })

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Admin API] POST tenants error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

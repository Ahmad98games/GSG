import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { checkRateLimit } from '@/lib/security/rateLimiter'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate a stable device fingerprint
// from the combination of factors the client sends
function generateDeviceId(factors: Record<string, string>): string {
  const data = JSON.stringify(factors)
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default_license_fingerprint_secret_2026'
  return createHmac('sha256', secret)
    .update(data)
    .digest('hex')
    .slice(0, 32)
}

export async function POST(req: NextRequest) {
  // Guard: env vars must exist
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error: 'Server configuration error. Contact Noxis support on WhatsApp: +92 333 435 5475',
        code: 'ENV_MISSING',
      },
      { status: 500 }
    )
  }

  try {
    const ip = req.headers.get('x-forwarded-for') ?? 
             req.headers.get('x-real-ip') ?? 
             'unknown';

    if (!checkRateLimit(ip, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many license activation attempts. Please try again in a minute.' },
        { status: 429 }
      );
    }

    let body: any

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    const {
      licenseKey,
      machineInfo,
      appVersion,
    } = body

    // Validate request shape
    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      )
    }

    const cleanKey = licenseKey.trim().toUpperCase()

    // Look up the license in Supabase
    const { data: license, error: lookupError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', cleanKey)
      .single()

    if (lookupError || !license) {
      // Log failed activation attempt
      try {
        await supabase.from('license_activation_log')
          .insert({
            key_attempted: cleanKey,
            event: 'key_not_found',
            machine_info: machineInfo || null,
            app_version: appVersion || null,
            created_at: new Date().toISOString(),
          })
      } catch (e: any) {
        console.error('[License] Failed to log failure to DB:', e.message)
      }

      return NextResponse.json(
        { error: 'Invalid license key. Check the key and try again.' },
        { status: 404 }
      )
    }

    // Check if deactivated
    if (license.is_deactivated) {
      try {
        await supabase.from('license_activation_log')
          .insert({
            license_id: license.id,
            key_attempted: cleanKey,
            event: 'key_deactivated',
            machine_info: machineInfo || null,
            app_version: appVersion || null,
            created_at: new Date().toISOString(),
          })
      } catch (e: any) {
        console.error('[License] Failed to log deactivation to DB:', e.message)
      }

      return NextResponse.json(
        { error: 'This license has been deactivated. Contact support on WhatsApp: +92 326 4742678' },
        { status: 403 }
      )
    }

    // Check expiry
    if (license.expires_at && new Date() > new Date(license.expires_at)) {
      const expiredDate = new Date(license.expires_at).toLocaleDateString('en-PK')

      try {
        await supabase.from('license_activation_log')
          .insert({
            license_id: license.id,
            key_attempted: cleanKey,
            event: 'key_expired',
            machine_info: machineInfo || null,
            app_version: appVersion || null,
            created_at: new Date().toISOString(),
          })
      } catch (e: any) {
        console.error('[License] Failed to log expiry to DB:', e.message)
      }

      return NextResponse.json(
        {
          error: `This license expired on ${expiredDate}. Contact support to renew.`,
          expired: true,
          expiresAt: license.expires_at,
        },
        { status: 403 }
      )
    }

    // Generate device fingerprint if machine info provided
    let deviceId: string | null = null
    if (machineInfo) {
      deviceId = generateDeviceId(machineInfo)
    }

    // Update last_activated_at and device ID
    const { error: updateError } = await supabase
      .from('licenses')
      .update({
        last_activated_at: new Date().toISOString(),
        last_device_id: deviceId,
        activation_count: license.activation_count ? license.activation_count + 1 : 1,
      })
      .eq('id', license.id)

    if (updateError) {
      console.error('[License] Update failed:', updateError.message)
    }

    // Log successful activation
    try {
      await supabase.from('license_activation_log')
        .insert({
          license_id: license.id,
          key_attempted: cleanKey,
          event: 'activated',
          device_id: deviceId,
          machine_info: machineInfo || null,
          app_version: appVersion || null,
          created_at: new Date().toISOString(),
        })
    } catch (e: any) {
      console.error('[License] Failed to log success to DB:', e.message)
    }

    // Return everything the app needs
    return NextResponse.json({
      success: true,
      license: {
        id: license.id,
        key: cleanKey,
        tier: license.tier,
        customerName: license.customer_name,
        expiresAt: license.expires_at,
        maxDevices: license.max_devices,
        isTrialActive: license.is_trial ?? false,
        trialDaysRemaining: license.expires_at
          ? Math.max(0, Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / 86400000))
          : null,
      }
    })
  } catch (err: any) {
    console.error('[License API] Unhandled error:', err.message)
    return NextResponse.json(
      {
        error: 'Activation server error. Try again in a moment.',
        code: 'SERVER_ERROR',
        detail: err.message,
      },
      { status: 500 }
    )
  }
}

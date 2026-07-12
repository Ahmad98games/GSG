import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { checkRateLimit } from '@/lib/security/rateLimiter'

import { consumeNonce } from '@/lib/security/nonce'

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

// In-memory rate limit map for activation attempts
const activationAttempts = new Map<string, { count: number; lockedUntil: number | null }>()

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
    const ip = req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const state = activationAttempts.get(ip) || { count: 0, lockedUntil: null }

    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      const minutesLeft = Math.ceil((state.lockedUntil - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${minutesLeft} minute(s).` },
        { status: 429 }
      )
    }

    state.count++
    if (state.count >= 10) {
      state.lockedUntil = Date.now() + 30 * 60 * 1000
    }
    activationAttempts.set(ip, state)

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
      nonce,
      email,
      autoDetect,
    } = body

    if (!consumeNonce(nonce)) {
      return NextResponse.json(
        { error: 'Request already processed. Please try again.' },
        { status: 400 }
      )
    }

    let cleanKey = (licenseKey || '').trim().toUpperCase()
    let license: any = null
    let lookupError: any = null

    if (autoDetect && email) {
      // Auto-detect: find by customer_email
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('customer_email', email.trim().toLowerCase())
        .eq('is_active', true)
        .eq('is_deactivated', false)
        .limit(1)
        .maybeSingle()

      license = data
      lookupError = error
      if (license) {
        cleanKey = license.license_key
      }
    } else {
      // Validate request shape
      if (!cleanKey) {
        return NextResponse.json(
          { error: 'License key is required' },
          { status: 400 }
        )
      }

      // Look up the license in Supabase
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', cleanKey)
        .maybeSingle()

      license = data
      lookupError = error
    }

    if (lookupError || !license) {
      // Log failed activation attempt
      try {
        await supabase.from('license_activation_log')
          .insert({
            key_attempted: cleanKey || 'AUTO_DETECT_FAILED',
            event: 'key_not_found',
            machine_info: machineInfo || null,
            app_version: appVersion || null,
            created_at: new Date().toISOString(),
          })
      } catch (e: any) {
        console.error('[License] Failed to log failure to DB:', e.message)
      }

      return NextResponse.json(
        { error: autoDetect ? 'No active license found associated with this email.' : 'Invalid license key. Check the key and try again.' },
        { status: 404 }
      )
    }

    // Bind email if provided and not set yet
    if (email && (!license.customer_email || license.customer_email === '')) {
      const { error: bindError } = await supabase
        .from('licenses')
        .update({ customer_email: email.trim().toLowerCase() })
        .eq('id', license.id)
      if (bindError) {
        console.error('[License] Email bind failed:', bindError.message)
      } else {
        license.customer_email = email.trim().toLowerCase()
      }
    }

    // Verify email match if set
    if (email && license.customer_email && license.customer_email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'This license is registered to a different email address.' },
        { status: 403 }
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

    // If it's a trial license and expires_at is null, first activation sets the 10-day countdown
    let expiresAt = license.expires_at
    const isTrial = license.is_trial || cleanKey.startsWith('TRIAL')
    
    if (isTrial && !expiresAt) {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 10)
      expiresAt = expirationDate.toISOString()
    }

    // Update last_activated_at, device ID, and expires_at if trial activation
    const updatePayload: any = {
      last_activated_at: new Date().toISOString(),
      last_device_id: deviceId,
      activation_count: license.activation_count ? license.activation_count + 1 : 1,
    }
    if (isTrial && !license.expires_at) {
      updatePayload.expires_at = expiresAt
    }

    const { error: updateError } = await supabase
      .from('licenses')
      .update(updatePayload)
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

    // Clear attempt state upon success
    activationAttempts.delete(ip);

    // Return everything the app needs
    return NextResponse.json({
      success: true,
      license: {
        id: license.id,
        key: cleanKey,
        tier: license.tier,
        customerName: license.customer_name,
        expiresAt: expiresAt,
        maxDevices: license.max_devices,
        isTrialActive: isTrial,
        trialDaysRemaining: expiresAt
          ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
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

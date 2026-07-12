import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/admin/auth'
import { consumeNonce } from '@/lib/security/nonce'

// Track failed attempts per IP
// (in-memory — resets on server restart,
// good enough for a Cloudflare Worker / Serverless environment)
const failedAttempts = new Map<string, {
  count: number
  lockedUntil: number | null
}>()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  const ip = getClientIp(req)
  const now = Date.now()

  // Check if IP is locked out
  const state = failedAttempts.get(ip)
  if (state?.lockedUntil && now < state.lockedUntil) {
    const remainingMinutes = Math.ceil(
      (state.lockedUntil - now) / 60000
    )
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${remainingMinutes} minute(s).`
      },
      { status: 429 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const { password, nonce } = body

  if (!consumeNonce(nonce)) {
    return NextResponse.json(
      { error: 'Request already processed. Please try again.' },
      { status: 400 }
    )
  }

  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Admin password is not configured on the server' },
      { status: 500 }
    )
  }

  if (!password || password !== ADMIN_PASSWORD) {
    const current = failedAttempts.get(ip) || {
      count: 0, lockedUntil: null
    }
    current.count++

    if (current.count >= 5) {
      // Lock for 15 minutes after 5 failures
      current.lockedUntil = now + 15 * 60 * 1000
    }

    failedAttempts.set(ip, current)

    // Log to Supabase for audit trail
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await supabase.from('admin_access_log').insert({
        event: 'login_failed',
        ip_address: ip,
        attempt_count: current.count,
        locked: current.count >= 5,
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error('[Admin Auth] Failed to log failure to Supabase:', e)
    }

    return NextResponse.json(
      {
        error: 'Invalid password',
        attemptsRemaining: Math.max(0, 5 - current.count),
      },
      { status: 401 }
    )
  }

  // Success — clear failed attempts
  failedAttempts.delete(ip)

  const token = await generateToken(ip)

  // Log successful access
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from('admin_access_log').insert({
      event: 'login_success',
      ip_address: ip,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[Admin Auth] Failed to log success to Supabase:', e)
  }

  // Set token in HttpOnly cookie
  const response = NextResponse.json({
    success: true
  })
  response.cookies.set('noxis_admin_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  })
  return response
}

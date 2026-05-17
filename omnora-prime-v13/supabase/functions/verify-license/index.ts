import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─────────────────────────────────────────────
// Rate Limiter — prevent license key brute-force
// 10 attempts per IP per 15-minute window
// ─────────────────────────────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }) // 15 min window
    return false
  }

  if (entry.count >= 10) {
    return true
  }

  entry.count++
  return false
}

// Periodic cleanup to prevent memory leaks (every 30 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of attempts.entries()) {
    if (entry.resetAt < now) {
      attempts.delete(ip)
    }
  }
}, 30 * 60 * 1000)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── Rate limit check ──
  const ip = req.headers.get('x-forwarded-for')
    || req.headers.get('x-real-ip')
    || 'unknown'

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: 'Too many attempts. Try again later.'
      }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const { license_key, business_id, device_id } = await req.json()
    
    if (!license_key) {
      return new Response(
        JSON.stringify({ valid: false, error: 'No license key provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Find the license
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key.toUpperCase())
      .eq('is_active', true)
      .single()
    
    if (error || !license) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid license key' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // First activation of a trial license — set expires_at now
    if (license.is_trial && !license.expires_at) {
      const trialExpiresAt = new Date()
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 3)
      
      await supabase
        .from('licenses')
        .update({
          expires_at: trialExpiresAt.toISOString(),
          activated_at: new Date().toISOString(),
          business_id: business_id || null
        })
        .eq('id', license.id)
      
      license.expires_at = trialExpiresAt.toISOString()
    }
    
    // Check trial expiration strictly (for returning trial activations)
    if (license.is_trial && license.expires_at && new Date(license.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Trial expired. Contact sales to continue.',
          is_trial_expired: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Check expiry for regular license
    if (!license.is_trial && license.expires_at && new Date(license.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: 'License expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Link to business if not already linked (for regular non-trial licenses)
    if (!license.is_trial && !license.business_id && business_id) {
      await supabase
        .from('licenses')
        .update({
          business_id,
          activated_at: new Date().toISOString()
        })
        .eq('id', license.id)
    }
    
    // Return tier info
    return new Response(
      JSON.stringify({
        valid: true,
        tier: license.tier,
        max_devices: license.max_devices,
        customer_name: license.customer_name,
        expires_at: license.expires_at,
        is_trial: license.is_trial || false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (err: any) {
    return new Response(
      JSON.stringify({ valid: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

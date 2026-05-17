// supabase/functions/portal-verify-otp/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const JWT_SECRET = Deno.env.get("PORTAL_JWT_SECRET") || "super-secret-key-for-portal-jwt"

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { email, otp, businessSlug } = await req.json()

    // 1. Get customer and latest session
    const { data: customer, error: custError } = await supabaseClient
      .from("portal_customers")
      .select("id, name, party_id, business_id")
      .eq("email", email)
      .eq("portal_enabled", true)
      .single()

    if (custError || !customer) throw new Error("Customer not found or portal disabled")

    const { data: session, error: sessError } = await supabaseClient
      .from("portal_sessions")
      .select("id, otp_hash, otp_expires")
      .eq("customer_id", customer.id)
      .is("session_token", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (sessError || !session) throw new Error("No active OTP session found")

    // 2. Verify OTP
    const isOtpValid = await bcrypt.compare(otp, session.otp_hash)
    const isExpired = new Date(session.otp_expires) < new Date()

    if (!isOtpValid || isExpired) {
      throw new Error("Invalid or expired OTP")
    }

    // 3. Generate JWT
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const jwt = await create({ alg: "HS256", typ: "JWT" }, {
      customerId: customer.id,
      partyId: customer.party_id,
      businessId: customer.business_id,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }, key)

    // 4. Update session
    await supabaseClient
      .from("portal_sessions")
      .update({
        session_token: jwt,
        token_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq("id", session.id)

    // 5. Update last login
    await supabaseClient
      .from("portal_customers")
      .update({ last_login: new Date().toISOString() })
      .eq("id", customer.id)

    return new Response(JSON.stringify({ 
      token: jwt, 
      customerName: customer.name,
      businessId: customer.business_id,
      partyId: customer.party_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})


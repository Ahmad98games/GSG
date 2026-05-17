// supabase/functions/portal-send-otp/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { email, businessSlug } = await req.json()

    // 1. Find business and customer
    const { data: business, error: bizError } = await supabaseClient
      .from("business_profiles")
      .select("id, business_name")
      .eq("slug", businessSlug)
      .single()

    if (bizError || !business) {
      return new Response(JSON.stringify({ error: "Business not found" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    const { data: customer, error: custError } = await supabaseClient
      .from("portal_customers")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("email", email)
      .eq("portal_enabled", true)
      .single()

    if (custError || !customer) {
      return new Response(JSON.stringify({ error: "Email not registered for this portal" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const salt = await bcrypt.genSalt(8)
    const otpHash = await bcrypt.hash(otp, salt)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins

    // 3. Store OTP in portal_sessions
    const { error: sessionError } = await supabaseClient
      .from("portal_sessions")
      .insert({
        customer_id: customer.id,
        otp_hash: otpHash,
        otp_expires: expiresAt
      })

    if (sessionError) throw sessionError

    // 4. Send OTP (Demo: WhatsApp link + Console Log)
    // In production, integrate Resend here
    const message = `Your Noxis Portal OTP for ${business.business_name} is: ${otp}. It expires in 10 minutes.`
    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`

    console.log(`[OTP SENT] ${email}: ${otp}`)

    return new Response(JSON.stringify({ sent: true, waLink }), {
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


// supabase/functions/paddle-create-checkout/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

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

    const { plan, billingCycle, buyerEmail, buyerCountry } = await req.json()

    // Pricing IDs (Mapping to Paddle Price IDs)
    const PADDLE_PRICES = {
      lite: { monthly: Deno.env.get("PADDLE_PRICE_LITE_MONTHLY"), annual: Deno.env.get("PADDLE_PRICE_LITE_ANNUAL") },
      pro: { monthly: Deno.env.get("PADDLE_PRICE_PRO_MONTHLY"), annual: Deno.env.get("PADDLE_PRICE_PRO_ANNUAL") },
      elite: { monthly: Deno.env.get("PADDLE_PRICE_ELITE_MONTHLY"), annual: Deno.env.get("PADDLE_PRICE_ELITE_ANNUAL") }
    }

    const priceId = PADDLE_PRICES[plan as keyof typeof PADDLE_PRICES][billingCycle as 'monthly' | 'annual']
    if (!priceId) throw new Error("Invalid plan or billing cycle for Paddle")

    const paddleApiKey = Deno.env.get("PADDLE_API_KEY")!

    // 1. Create Paddle Transaction
    const response = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        customer: { email: buyerEmail },
        checkout: { 
          url: `${Deno.env.get("SITE_URL") || 'https://noxis.app'}/purchase/success?session={checkout_id}` 
        },
        custom_data: { plan, billingCycle, buyerEmail }
      })
    })

    const paddleData = await response.json()
    if (!response.ok) throw new Error(paddleData.error?.message || "Paddle checkout creation failed")

    // 2. Insert into license_payments
    const { error: insertError } = await supabaseClient
      .from("license_payments")
      .insert({
        gateway: 'paddle',
        gateway_txn_id: paddleData.data.id,
        amount_usd: paddleData.data.details.totals.total / 100, // Paddle uses lowest denomination
        currency: 'USD',
        status: 'initiated',
        buyer_email: buyerEmail,
        plan,
        billing_cycle: billingCycle
      })

    if (insertError) throw insertError

    return new Response(JSON.stringify({ 
      checkoutUrl: paddleData.data.checkout.url 
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


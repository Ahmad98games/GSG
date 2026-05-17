// supabase/functions/easypaisa-initiate/index.ts

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

    const { plan, billingCycle, buyerPhone, buyerName, buyerEmail } = await req.json()

    const PLANS = {
      lite: { monthly: 2500, annual: 25000 },
      pro: { monthly: 6500, annual: 65000 },
      elite: { monthly: 14000, annual: 140000 }
    }
    const amount = PLANS[plan as keyof typeof PLANS][billingCycle as 'monthly' | 'annual']
    const txnRef = `EP-${Date.now()}`

    // 1. Insert into license_payments
    const { data: paymentRecord, error: insertError } = await supabaseClient
      .from("license_payments")
      .insert({
        gateway: 'easypaisa',
        amount_pkr: amount,
        currency: 'PKR',
        status: 'initiated',
        buyer_phone: buyerPhone,
        buyer_email: buyerEmail,
        plan,
        billing_cycle: billingCycle,
        gateway_txn_id: txnRef
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 2. EasyPaisa Flow (OAuth + Initiate)
    const clientId = Deno.env.get("EASYPAISA_CLIENT_ID")!
    const clientSecret = Deno.env.get("EASYPAISA_CLIENT_SECRET")!
    const storeId = Deno.env.get("EASYPAISA_STORE_ID")!

    // Note: In a real implementation, you'd fetch the token first.
    // For this demonstration, we return the payload for the frontend to handle or 
    // we can do the backend-to-backend call here if the API allows.
    
    // EasyPaisa often uses a redirect flow or a direct wallet API.
    // Assuming Direct Wallet API for this implementation:
    
    return new Response(JSON.stringify({ 
      paymentId: paymentRecord.id,
      txnRef: txnRef,
      amount: amount,
      instructions: "Please approve the payment request in your EasyPaisa app."
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


// supabase/functions/jazzcash-initiate/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { createHmac } from "node:crypto"

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

    // 1. Calculate Amount (PKR)
    const PLANS = {
      lite: { monthly: 2500, annual: 25000 },
      pro: { monthly: 6500, annual: 65000 },
      elite: { monthly: 14000, annual: 140000 }
    }
    const amount = PLANS[plan as keyof typeof PLANS][billingCycle as 'monthly' | 'annual']
    const txnRef = `JC-${Date.now()}`

    // 2. Insert into license_payments
    const { data: paymentRecord, error: insertError } = await supabaseClient
      .from("license_payments")
      .insert({
        gateway: 'jazzcash',
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

    // 3. Build JazzCash Request
    const merchantId = Deno.env.get("JAZZCASH_MERCHANT_ID")!
    const password = Deno.env.get("JAZZCASH_PASSWORD")!
    const salt = Deno.env.get("JAZZCASH_INTEGRITY_SALT")!
    
    const txnDateTime = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const expiryDateTime = new Date(Date.now() + 3600_000).toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const amountPaisas = Math.round(amount * 100).toString()

    const fields: Record<string, string> = {
      pp_Amount: amountPaisas,
      pp_BillReference: `NOXIS ${plan}`,
      pp_Description: `Noxis ${plan} - ${billingCycle}`,
      pp_Language: 'EN',
      pp_MerchantID: merchantId,
      pp_MobileNumber: buyerPhone,
      pp_Password: password,
      pp_ProductID: 'RETL',
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_TxnRefNo: txnRef,
      pp_TxnType: 'MWALLET',
      ppmpf_1: '1', ppmpf_2: '1', ppmpf_3: '1', ppmpf_4: '1', ppmpf_5: '1',
    }

    const sortedKeys = Object.keys(fields).sort()
    const sortedValues = sortedKeys.map(k => fields[k]).join('&')
    const signatureString = salt + '&' + sortedValues
    const signature = createHmac('sha256', salt).update(signatureString).digest('hex').toUpperCase()

    const jazzCashPayload = { ...fields, pp_SecureHash: signature }

    return new Response(JSON.stringify({ 
      paymentId: paymentRecord.id,
      payload: jazzCashPayload,
      endpoint: 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMobileWalletTransaction'
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


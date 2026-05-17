// supabase/functions/jazzcash-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { createHmac } from "node:crypto"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const payload = await req.json()
    const { pp_ResponseCode, pp_TxnRefNo, pp_SecureHash, pp_ResponseMessage } = payload

    // 1. Verify Signature
    const salt = Deno.env.get("JAZZCASH_INTEGRITY_SALT")!
    const fields = { ...payload }
    delete fields.pp_SecureHash

    const sortedKeys = Object.keys(fields).sort()
    const sortedValues = sortedKeys.map(k => fields[k]).join('&')
    const signatureString = salt + '&' + sortedValues
    const expectedSignature = createHmac('sha256', salt).update(signatureString).digest('hex').toUpperCase()

    if (pp_SecureHash !== expectedSignature) {
      return new Response("Invalid signature", { status: 401 })
    }

    // 2. Update Payment Status
    const status = pp_ResponseCode === '000' ? 'completed' : 'failed'
    
    const { data: payment, error: updateError } = await supabaseClient
      .from("license_payments")
      .update({
        status: status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        webhook_payload: payload
      })
      .eq("gateway_txn_id", pp_TxnRefNo)
      .select()
      .single()

    if (updateError) throw updateError

    // 3. Generate License if successful
    if (status === 'completed' && payment) {
      const { data: licenseData, error: licenseError } = await supabaseClient.functions.invoke('generate-license', {
        body: {
          tier: payment.plan,
          businessName: payment.buyer_email, // Fallback if name not stored
          email: payment.buyer_email,
          country: 'PK',
          billingCycle: payment.billing_cycle
        }
      })

      if (licenseError) console.error("License generation failed after payment:", licenseError)
      
      if (licenseData?.licenseKey) {
        await supabaseClient
          .from("license_payments")
          .update({ license_id: (await supabaseClient.from("licenses").select("id").eq("license_key", licenseData.licenseKey).single()).data?.id })
          .eq("id", payment.id)
      }
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 })

  } catch (error) {
    console.error("[JazzCash Webhook Error]", error)
    return new Response(error.message, { status: 400 })
  }
})


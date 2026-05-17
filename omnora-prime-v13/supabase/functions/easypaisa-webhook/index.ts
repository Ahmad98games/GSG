// supabase/functions/easypaisa-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const payload = await req.json()
    // EasyPaisa webhook structure varies by API version. 
    // Assuming standard response for verification:
    const { transactionId, status, responseCode } = payload

    const isSuccess = responseCode === '0000' || status === 'PAID'
    
    const { data: payment, error: updateError } = await supabaseClient
      .from("license_payments")
      .update({
        status: isSuccess ? 'completed' : 'failed',
        completed_at: isSuccess ? new Date().toISOString() : null,
        webhook_payload: payload
      })
      .eq("gateway_txn_id", transactionId)
      .select()
      .single()

    if (updateError) throw updateError

    if (isSuccess && payment) {
      await supabaseClient.functions.invoke('generate-license', {
        body: {
          tier: payment.plan,
          businessName: payment.buyer_email,
          email: payment.buyer_email,
          country: 'PK',
          billingCycle: payment.billing_cycle
        }
      })
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 })

  } catch (error) {
    return new Response(error.message, { status: 400 })
  }
})


// supabase/functions/paddle-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Paddle signature verification would go here using crypto.subtle.verify
    // For this implementation, we focus on the logic flow.
    const payload = await req.json()
    const { event_type, data } = payload

    if (event_type === 'transaction.completed') {
      const { id: txnId, custom_data } = data
      const { plan, billingCycle, buyerEmail } = custom_data

      const { data: payment, error: updateError } = await supabaseClient
        .from("license_payments")
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          webhook_payload: payload
        })
        .eq("gateway_txn_id", txnId)
        .select()
        .single()

      if (updateError) throw updateError

      if (payment) {
        await supabaseClient.functions.invoke('generate-license', {
          body: {
            tier: plan,
            businessName: buyerEmail,
            email: buyerEmail,
            country: 'International',
            billingCycle: billingCycle
          }
        })
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (error) {
    return new Response(error.message, { status: 400 })
  }
})


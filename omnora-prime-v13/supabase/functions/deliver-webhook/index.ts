// supabase/functions/deliver-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function signPayload(payload: string, secret: string) {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { eventType, payload, businessId } = await req.json()

    // 1. Find active endpoints for this business and event
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .contains('events', [eventType])

    if (!endpoints || endpoints.length === 0) {
      return new Response(JSON.stringify({ status: "no_endpoints" }), { status: 200 })
    }

    const results = await Promise.all(endpoints.map(async (ep) => {
      const payloadStr = JSON.stringify(payload)
      const signature = await signPayload(payloadStr, ep.secret_hash) // In reality, we'd use a separate secret key, not the hash

      let status = 0
      let responseBody = ""
      let success = false

      try {
        const response = await fetch(ep.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NOXIS-Event': eventType,
            'X-NOXIS-Signature': signature,
            'User-Agent': 'NOXIS-Webhook-Dispatcher/1.0'
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000)
        })

        status = response.status
        responseBody = await response.text()
        success = response.ok
      } catch (err) {
        responseBody = err.message
      }

      // 2. Log Delivery
      await supabase.from('webhook_deliveries').insert({
        endpoint_id: ep.id,
        event_type: eventType,
        payload: payload,
        response_status: status,
        response_body: responseBody.substring(0, 1000), // Cap size
        success: success
      })

      return { endpoint: ep.name, success }
    }))

    return new Response(JSON.stringify({ results }), {
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


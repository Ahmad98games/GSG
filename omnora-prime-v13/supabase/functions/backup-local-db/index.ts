// supabase/functions/backup-local-db/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

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

    // This function is triggered via cron to perform cleanup and health checks
    // The actual upload is performed by the Hub app directly to Supabase Storage.

    const { businessId } = await req.json()
    const bucket = 'hub-backups'
    const path = `${businessId}/`

    // 1. List current backups
    const { data: files, error: listError } = await supabaseClient
      .storage
      .from(bucket)
      .list(path, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError) throw listError

    // 2. Retention Policy: Keep last 30 files
    if (files && files.length > 30) {
      const filesToDelete = files.slice(30).map(f => `${path}${f.name}`)
      const { error: deleteError } = await supabaseClient
        .storage
        .from(bucket)
        .remove(filesToDelete)
      
      if (deleteError) console.error("Backup cleanup error:", deleteError)
    }

    // 3. Verify if today's backup exists
    const today = new Date().toISOString().split('T')[0]
    const todayBackup = files?.find(f => f.name.includes(today))

    if (!todayBackup) {
      // Send WhatsApp Alert (Mock)
      console.error(`[ALERT] Backup missing for ${businessId} on ${today}`)
      // Integration with WhatsApp API (e.g. Twilio or custom wa.me logic) would go here
    }

    return new Response(JSON.stringify({ status: "checked", filesProcessed: files?.length }), {
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


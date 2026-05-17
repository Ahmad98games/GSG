// supabase/functions/gdpr-export/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import * as fflate from "https://esm.sh/fflate@0.8.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    const { requestId, businessId, subjectEmail, deletionRequest } = await req.json();

    if (!requestId || !businessId || !subjectEmail) {
      throw new Error("Missing required parameters");
    }

    // 1. Update status to processing
    await supabaseAdmin
      .from("gdpr_export_requests")
      .update({ status: "processing" })
      .eq("id", requestId);

    // 2. Find party ID(s)
    const { data: parties } = await supabaseAdmin
      .from("parties")
      .select("id, name, phone, address")
      .eq("business_id", businessId)
      .eq("email", subjectEmail);

    const partyIds = parties?.map(p => p.id) || [];

    // 3. Collect Data
    const data: any = {
      subject: { email: subjectEmail, identities: parties },
      invoices: [],
      payments: [],
      ledger_entries: [],
      shipments: []
    };

    if (partyIds.length > 0) {
      const [inv, pay, led, ship] = await Promise.all([
        supabaseAdmin.from("invoices").select("*, items:invoice_items(*)").in("party_id", partyIds),
        supabaseAdmin.from("payments").select("*, splits:payment_splits(*)").in("party_id", partyIds),
        supabaseAdmin.from("ledger_entries").select("*").in("party_id", partyIds),
        supabaseAdmin.from("shipments").select("*").in("client_id", partyIds)
      ]);

      data.invoices = inv.data || [];
      data.payments = pay.data || [];
      data.ledger_entries = led.data || [];
      data.shipments = ship.data || [];
    }

    // 4. Package as JSON in ZIP
    const jsonStr = JSON.stringify(data, null, 2);
    const jsonUint8 = new TextEncoder().encode(jsonStr);
    
    const zipped = fflate.zipSync({
      "data_export.json": jsonUint8
    });

    // 5. Upload to Storage
    const storagePath = `gdpr-exports/${businessId}/${requestId}.zip`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("exports")
      .upload(storagePath, zipped, {
        contentType: "application/zip",
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 6. Get Signed URL (valid for 7 days)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("exports")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signError) throw signError;

    // 7. Update request
    await supabaseAdmin
      .from("gdpr_export_requests")
      .update({
        status: "ready",
        export_url: signedData.signedUrl,
        completed_at: new Date().toISOString()
      })
      .eq("id", requestId);

    // 8. Handle Deletion
    if (deletionRequest && partyIds.length > 0) {
      // Log deletion before doing it
      await supabaseAdmin.from("security_audit").insert({
        business_id: businessId,
        alert_type: "GDPR_DELETION",
        details: { subject_email: subjectEmail, party_ids: partyIds },
        severity: "info",
        state: "auto_resolved"
      });

      // Cascading deletes or manual? 
      // Most tables have REFERENCES ... ON DELETE CASCADE if set up correctly.
      // Based on migrations, invoices/payments use party_id.
      await supabaseAdmin.from("parties").delete().in("id", partyIds);
      
      await supabaseAdmin
        .from("gdpr_export_requests")
        .update({ status: "deleted" })
        .eq("id", requestId);
    }

    return new Response(JSON.stringify({ success: true, url: signedData.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


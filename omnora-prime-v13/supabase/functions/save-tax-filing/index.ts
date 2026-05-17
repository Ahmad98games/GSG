// supabase/functions/save-tax-filing/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseClient.from('business_profiles').select('*').eq('user_id', user.id).single();
    if (!profile) throw new Error("Business profile not found");

    const { periodLabel, periodFrom, periodTo, filingRef, outputTax, inputTax, netPayable, taxLabel } = await req.json();

    // Generate Forensic HMAC-SHA256 Fingerprint
    const fingerprintData = `${profile.id}|${periodFrom}|${periodTo}|${outputTax}|${inputTax}|${netPayable}`;
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "forensic-fallback-secret";
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(fingerprintData);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const fingerprint = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Insert into tax_return_filings
    const { data: filing, error: filingErr } = await supabaseClient
      .from('tax_return_filings')
      .insert({
        business_id: profile.id,
        period_label: periodLabel,
        period_from: periodFrom,
        period_to: periodTo,
        tax_label: taxLabel,
        output_tax: outputTax,
        input_tax: inputTax,
        net_payable: netPayable,
        filing_ref: filingRef,
        filed_by: user.id,
        status: 'filed',
        forensic_fingerprint: fingerprint
      })
      .select()
      .single();

    if (filingErr) throw filingErr;

    return new Response(JSON.stringify({ 
      filingId: filing.id,
      message: "Tax return successfully filed."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


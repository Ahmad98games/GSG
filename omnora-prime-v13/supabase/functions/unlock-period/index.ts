// supabase/functions/unlock-period/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { filingId, pin, reason } = await req.json();

    if (!filingId || !pin || !reason) throw new Error("Missing required fields");

    // 1. Verify Admin PIN
    const { data: profile, error: profileErr } = await supabaseClient
      .from('business_profiles')
      .select('role_pin_hash')
      .eq('user_id', user.id)
      .single();

    if (profileErr || !profile?.role_pin_hash) throw new Error("Admin PIN not configured");

    const pinMatch = await bcrypt.compare(pin, profile.role_pin_hash);
    if (!pinMatch) throw new Error("INVALID_PIN: Access Denied.");

    // 2. Call RPC to unlock
    const { error: rpcErr } = await supabaseClient.rpc('unlock_tax_period', {
      p_filing_id: filingId,
      p_reason: reason
    });

    if (rpcErr) throw rpcErr;

    return new Response(JSON.stringify({ 
      success: true,
      message: "Tax period unlocked. Ledger modifications are now permitted."
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


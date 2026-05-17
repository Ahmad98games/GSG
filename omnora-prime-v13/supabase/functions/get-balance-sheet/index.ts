// supabase/functions/get-balance-sheet/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://noxis.industrial";
const rateLimitMap = new Map<string, number[]>();

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown";

  // 1. Rate Limiting (10 req/min)
  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < 60_000);
  
  if (timestamps.length >= 10) {
    return new Response(JSON.stringify({ error: 'TOO_MANY_REQUESTS' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      status: 429,
    });
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  try {
    // 2. Request Validation
    if (req.headers.get("content-type") !== "application/json") {
      throw new Error('INVALID_CONTENT_TYPE');
    }

    const body = await req.json();
    const { asAtDate } = body;

    if (!asAtDate) {
      return new Response(JSON.stringify({ error: 'MISSING_FIELDS' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    if (!authHeader) throw new Error("Unauthorized");
    
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseClient.from('business_profiles').select('id').eq('user_id', user.id).single();
    if (!profile) throw new Error("Business profile not found");

    // 1. Integrity Check (Up to as-at-date)
    const { data: integrity } = await supabaseClient.rpc('check_trial_balance_integrity', {
      p_business_id: profile.id,
      p_date_from: '2000-01-01',
      p_date_to: asAtDate
    });

    if (!integrity?.[0]?.is_balanced) {
      return new Response(JSON.stringify({ error: 'LEDGER_NOT_BALANCED', variance: integrity?.[0]?.variance }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 422 
      });
    }

    // 2. Fetch Balance Sheet
    const { data: rows } = await supabaseClient.rpc('get_balance_sheet', {
      p_business_id: profile.id,
      p_as_at_date: asAtDate
    });

    // 3. Post-fetch Verification (Assets = L+E)
    const totalAssets = rows?.find((r: any) => r.section === 'total_assets')?.amount || 0;
    const totalLE = rows?.find((r: any) => r.section === 'total_le')?.amount || 0;
    const isBalanced = Math.abs(totalAssets - totalLE) < 0.01;

    return new Response(JSON.stringify({ 
      rows, 
      totalAssets, 
      totalLiabilitiesEquity: totalLE, 
      isBalanced,
      generatedAt: new Date().toISOString() 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error(`[Edge Error] Balance sheet failed: ${err.message}`);
    return new Response(JSON.stringify({ error: 'VERIFICATION_FAILED' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});


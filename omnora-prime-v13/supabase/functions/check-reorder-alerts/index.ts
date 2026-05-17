// supabase/functions/check-reorder-alerts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://noxis.industrial";
const rateLimitMap = new Map<string, number[]>();

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch all business profiles to iterate (or could be triggered per business)
    const { data: businesses } = await supabaseClient.from('business_profiles').select('id');

    const results = [];

    if (businesses) {
      for (const biz of businesses) {
        // 2. Find items below reorder level
        const { data: lowStockItems } = await supabaseClient
          .from('skus')
          .select('name, sku_code, qty_on_hand, reorder_level, unit')
          .eq('business_id', biz.id)
          .eq('is_active', true)
          .filter('qty_on_hand', 'lte', 'reorder_level')
          .gt('reorder_level', 0);

        if (lowStockItems && lowStockItems.length > 0) {
          results.push({
            business_id: biz.id,
            count: lowStockItems.length,
            items: lowStockItems
          });
        }
      }
    }

    return new Response(JSON.stringify({ status: "success", alerts: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`[Edge Error] Reorder check failed: ${err.message}`);
    return new Response(JSON.stringify({ error: 'VERIFICATION_FAILED' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});


// supabase/functions/complete-pos-sale/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // 2. Request Validation
    if (req.headers.get("content-type") !== "application/json") {
      throw new Error('INVALID_CONTENT_TYPE');
    }

    const body = await req.json();
    const { saleId, businessId } = body;

    if (!saleId || !businessId) {
      return new Response(JSON.stringify({ error: 'MISSING_FIELDS' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch the sale data
    const { data: sale, error: saleError } = await supabaseClient
      .from("pos_sales")
      .select("*, pos_payments(*)")
      .eq("id", saleId)
      .single();

    if (saleError || !sale) throw new Error("Sale not found");

    // 2. Fetch Chart of Accounts for this business (Simplified for this phase)
    const { data: accounts } = await supabaseClient
      .from("ledger_accounts")
      .select("id, code")
      .eq("business_id", businessId);

    const salesAccount = accounts?.find(a => a.code === '4000'); // Revenue
    const cashAccount = accounts?.find(a => a.code === '1000');  // Asset

    if (!salesAccount || !cashAccount) throw new Error("Required ledger accounts missing");

    // 3. Post Double Entry
    const { data: entry, error: entryError } = await supabaseClient
      .from("ledger_entries")
      .insert({
        business_id: businessId,
        ref_type: 'pos_sale',
        ref_id: saleId,
        description: `POS Sale ${sale.sale_ref}`,
        date: new Date().toISOString()
      })
      .select()
      .single();

    if (entryError) throw entryError;

    await supabaseClient.from("ledger_transactions").insert([
      {
        entry_id: entry.id,
        account_id: salesAccount.id,
        credit: sale.total,
        debit: 0,
        business_id: businessId
      },
      {
        entry_id: entry.id,
        account_id: cashAccount.id,
        credit: 0,
        debit: sale.total,
        business_id: businessId
      }
    ]);

    // 4. Update sale with ledger entry ID
    await supabaseClient
      .from("pos_sales")
      .update({ ledger_entry_id: entry.id })
      .eq("id", saleId);

    // 5. Broadcast to PC Hub
    await supabaseClient.from("sync_broadcasts").insert({
      channel: 'pos-sales-feed',
      event: 'SALE_COMPLETED',
      payload: { 
        saleRef: sale.sale_ref, 
        total: sale.total, 
        businessId: businessId 
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`[Edge Error] POS sale completion failed: ${error.message}`);
    return new Response(JSON.stringify({ error: 'VERIFICATION_FAILED' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});


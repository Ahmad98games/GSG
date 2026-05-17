// supabase/functions/reverse-transaction/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { txRef, reason } = await req.json();

    // 1. Fetch original entries
    const { data: originalEntries, error: fetchError } = await supabaseClient
      .from('ledger_entries')
      .select('*')
      .eq('tx_ref', txRef)
      .eq('status', 'posted');

    if (fetchError || !originalEntries || originalEntries.length === 0) {
      return new Response(JSON.stringify({ error: "Transaction not found or already reversed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // 2. Create mirror reversal entries
    const reversalEntries = originalEntries.map((e: any) => ({
      business_id: e.business_id,
      tx_ref: `REV-${e.tx_ref}`,
      entry_type: e.entry_type === 'debit' ? 'credit' : 'debit',
      account_id: e.account_id,
      party_id: e.party_id,
      amount: e.amount,
      description: `REVERSAL of ${txRef}: ${reason}`,
      status: 'posted',
      reversal_of: e.id
    }));

    const { error: insertError } = await supabaseClient
      .from('ledger_entries')
      .insert(reversalEntries);

    if (insertError) throw insertError;

    // 3. Mark original as reversed
    await supabaseClient
      .from('ledger_entries')
      .update({ status: 'reversed' })
      .eq('tx_ref', txRef);

    return new Response(JSON.stringify({ status: "success", reversalRef: `REV-${txRef}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


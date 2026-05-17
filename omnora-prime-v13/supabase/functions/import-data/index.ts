// supabase/functions/import-data/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, data, businessId } = await req.json()

    if (type === 'skus') {
      // Data: [{ code, name, category, cost, sale, unit }]
      const { error } = await supabase.from('skus').upsert(
        data.map((item: any) => ({
          business_id: businessId,
          sku_code: item.code,
          name: item.name,
          category: item.category,
          cost_price: item.cost,
          sale_price: item.sale,
          unit: item.unit
        })),
        { onConflict: 'business_id, sku_code' }
      )
      if (error) throw error
    } 
    else if (type === 'parties') {
      const { error } = await supabase.from('parties').insert(
        data.map((item: any) => ({
          business_id: businessId,
          name: item.name,
          party_type: item.type,
          phone: item.phone,
          address: item.address,
          credit_limit: item.creditLimit
        }))
      )
      if (error) throw error
    }
    else if (type === 'opening_balances') {
      // 1. Verify Balanced Entry
      let totalDebit = 0
      let totalCredit = 0
      data.forEach((item: any) => {
        totalDebit += Number(item.debit || 0)
        totalCredit += Number(item.credit || 0)
      })

      // Use a tolerance for floating point
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Unbalanced Import: Debits (${totalDebit}) must equal Credits (${totalCredit})`)
      }

      // 2. Post as a single transaction
      const txRef = `OPENING-${new Date().getFullYear()}`
      
      // In a real implementation, we would use a stored procedure or multiple inserts
      // For this demo, we'll insert into ledger_entries
      const entries = data.flatMap((item: any) => {
        const result = []
        if (item.debit > 0) {
           result.push({
             business_id: businessId,
             tx_ref: txRef,
             entry_type: 'debit',
             account_id: item.accountId, // Assumes frontend resolved account names to IDs
             amount: item.debit,
             description: 'Opening Balance Import'
           })
        }
        if (item.credit > 0) {
           result.push({
             business_id: businessId,
             tx_ref: txRef,
             entry_type: 'credit',
             account_id: item.accountId,
             amount: item.credit,
             description: 'Opening Balance Import'
           })
        }
        return result
      })

      const { error } = await supabase.from('ledger_entries').insert(entries)
      if (error) throw error
    }

    return new Response(JSON.stringify({ success: true, count: data.length }), {
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


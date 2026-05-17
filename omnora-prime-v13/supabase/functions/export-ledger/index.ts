// supabase/functions/export-ledger/index.ts

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

    const { dateFrom, dateTo, format, businessId } = await req.json()

    // 1. Fetch Ledger Entries
    const { data: entries, error } = await supabase
      .from('ledger_entries')
      .select('*, account:accounts(account_code, name), party:parties(name)')
      .eq('business_id', businessId)
      .gte('posted_at', dateFrom)
      .lte('posted_at', dateTo)
      .order('posted_at', { ascending: true })

    if (error) throw error

    let content = ""
    let contentType = "text/csv"
    let filename = `ledger_export_${dateFrom}_${dateTo}`

    if (format === 'csv') {
      content = "Date,Transaction Ref,Account Code,Account Name,Party,Debit,Credit,Description\n"
      entries.forEach(e => {
        const debit = e.entry_type === 'debit' ? e.amount : 0
        const credit = e.entry_type === 'credit' ? e.amount : 0
        content += `${e.posted_at},${e.tx_ref},${e.account.account_code},${e.account.name},${e.party?.name || ''},${debit},${credit},"${e.description}"\n`
      })
      filename += ".csv"
    } 
    else if (format === 'quickbooks') {
      // QB IIF Format
      content = "!ACCNT\tNAME\tACCNTTYPE\tDESC\n"
      // Mock some accounts - in real use, fetch unique accounts from entries
      content += "!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\n"
      entries.forEach(e => {
        const amt = e.entry_type === 'debit' ? e.amount : -e.amount
        content += `TRNS\t\tGENERAL JOURNAL\t${e.posted_at}\t${e.account.name}\t${e.party?.name || ''}\t${amt}\t${e.tx_ref}\t${e.description}\n`
      })
      content += "!ENDTRNS\n"
      contentType = "text/plain"
      filename += ".iif"
    }
    else if (format === 'fbr') {
      // FBR Sales Register CSV (Simplified)
      content = "Date,Invoice No,Party Name,Party NTN,Gross Amount,Sales Tax,Total Amount\n"
      // Filter for sales invoices (this logic depends on your account naming)
      entries.filter(e => e.invoice_id).forEach(e => {
        // Mock GST as 18%
        const gst = (Number(e.amount) * 0.18).toFixed(2)
        content += `${e.posted_at},${e.tx_ref},${e.party?.name || ''},,,${gst},${e.amount}\n`
      })
      filename += "_fbr.csv"
    }

    return new Response(content, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`
      },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})


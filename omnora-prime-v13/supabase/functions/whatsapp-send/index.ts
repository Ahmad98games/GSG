// supabase/functions/whatsapp-send/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const payload = await req.json()
    const { type, business_id, recipient, language = 'english', data: customData } = payload

    // 1. Fetch Business Context
    const { data: business } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', business_id)
      .single()

    if (!business) throw new Error("Business not found")

    let message = ""
    const today = new Date().toISOString().split('T')[0]

    // 2. Build Message Content based on type
    if (type === 'daily_summary') {
      // Fetch stats
      const [
        { data: sales },
        { data: invoicesToday },
        { data: overdueInvoices },
        { data: production },
        { data: attendance },
        { data: anomalies }
      ] = await Promise.all([
        supabase.from('ledger_entries').select('amount').eq('business_id', business_id).eq('entry_type', 'credit').gte('created_at', today),
        supabase.from('invoices').select('id').eq('business_id', business_id).gte('issue_date', today),
        supabase.from('invoices').select('id').eq('business_id', business_id).eq('status', 'overdue'),
        supabase.from('karigar_production_logs').select('qty_produced').eq('business_id', business_id).eq('log_date', today),
        supabase.from('attendance_logs').select('status').eq('business_id', business_id).eq('log_date', today),
        supabase.from('anomaly_alerts').select('id').eq('business_id', business_id).eq('resolved', false)
      ])

      const totalRevenue = sales?.reduce((acc, s) => acc + Number(s.amount), 0) || 0
      const postedCount = invoicesToday?.length || 0
      const overdueCount = overdueInvoices?.length || 0
      const unitsProduced = production?.reduce((acc, p) => acc + Number(p.qty_produced), 0) || 0
      const batchCount = production?.length || 0
      const presentCount = attendance?.filter(a => a.status === 'present').length || 0
      const totalKarigars = attendance?.length || 0
      const anomalyCount = anomalies?.length || 0

      if (language === 'urdu') {
        message = `📊 *Noxis روزانہ خلاصہ*\n${business.business_name} — ${today}\n\n` +
                  `💰 آج کی آمدنی: PKR ${totalRevenue.toLocaleString()}\n` +
                  `📦 انوائسز: ${postedCount} پوسٹ، ${overdueCount} واجب الادا\n` +
                  `🏭 پروڈکشن: ${unitsProduced} یونٹس (${batchCount} بیجز)\n` +
                  `👥 حاضری: ${presentCount}/${totalKarigars} کاریگر\n\n` +
                  (anomalyCount > 0 ? `⚠️ الرٹس: ${anomalyCount} مسائل پائے گئے\n\n` : "") +
                  `_Powered by Noxis — noxis.app_`
      } else {
        message = `📊 *Noxis Daily Summary*\n${business.business_name} — ${today}\n\n` +
                  `💰 Today's Revenue: PKR ${totalRevenue.toLocaleString()}\n` +
                  `📦 Invoices: ${postedCount} posted, ${overdueCount} overdue\n` +
                  `🏭 Production: ${unitsProduced} units across ${batchCount} batches\n` +
                  `👥 Attendance: ${presentCount}/${totalKarigars} karigars\n\n` +
                  (anomalyCount > 0 ? `⚠️ Alerts: ${anomalyCount} issues detected\n\n` : "") +
                  `_Powered by Noxis — noxis.app_`
      }
    } else if (type === 'payment_received') {
      const { amount, customer_name, invoice_no } = customData
      message = `✅ *Payment Received*\n\nBusiness: ${business.business_name}\nCustomer: ${customer_name}\nAmount: PKR ${amount.toLocaleString()}\nRef: ${invoice_no}\n\nThank you for choosing Noxis.`
    } else if (type === 'invoice_due') {
      const { amount, due_date, invoice_no } = customData
      message = `📅 *Invoice Reminder*\n\nBusiness: ${business.business_name}\nInvoice: ${invoice_no}\nAmount: PKR ${amount.toLocaleString()}\nDue Date: ${due_date}\n\nPlease ensure timely payment to avoid service interruption.`
    } else if (type === 'low_stock_alert') {
      const { item_name, current_qty, reorder_level } = customData
      message = `📉 *Low Stock Alert*\n\nItem: ${item_name}\nCurrent Qty: ${current_qty}\nReorder Level: ${reorder_level}\n\nPlease restock soon.`
    } else if (type === 'payslip') {
      const { karigar_name, period, amount } = customData
      message = `💸 *Payslip Generated*\n\nHello ${karigar_name},\nYour payslip for ${period} has been generated.\nTotal Amount: PKR ${amount.toLocaleString()}\n\nNoxis Payroll System.`
    } else if (type === 'test') {
      message = `✅ *Noxis WhatsApp Verification*\nConnection established for ${business.business_name}.\n\nTime: ${new Date().toLocaleTimeString()}`
    }

    // 3. Send via Meta API
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!accessToken || !phoneNumberId) throw new Error("Meta API not configured")

    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: message }
      })
    })

    const result = await response.json()

    // 4. Log to DB
    await supabase.from('whatsapp_logs').insert({
      business_id,
      recipient_phone: recipient,
      message_type: type,
      message_body: message,
      status: result.error ? 'failed' : 'sent',
      error_message: result.error?.message,
      meta_message_id: result.messages?.[0]?.id
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})


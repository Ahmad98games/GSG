// src/app/api/cron/recurring-invoices/route.ts
// Cron endpoint: processes recurring invoices and creates new invoices on schedule

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);


function getNextRunDate(currentDate: string, frequency: string): string {
  const date = new Date(currentDate);
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
  }
  return date.toISOString().split('T')[0];
}

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[Cron] Processing recurring invoices for ${today}`);

    // Fetch all active recurring invoices due today
    const { data: templates, error: fetchError } = await supabase
      .from('recurring_invoices')
      .select('*, party:parties(name, phone)')
      .eq('is_active', true)
      .lte('next_run_date', today);

    if (fetchError) {
      console.error('[Cron] Fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!templates || templates.length === 0) {
      console.log('[Cron] No recurring invoices due today');
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;
    const results: any[] = [];

    for (const template of templates) {
      try {
        // Check if end_date has passed
        if (template.end_date && template.end_date < today) {
          await supabase
            .from('recurring_invoices')
            .update({ is_active: false })
            .eq('id', template.id);
          continue;
        }

        // Calculate totals from line items
        const lineItems = template.line_items as any[];
        const subtotal = lineItems.reduce((sum: number, item: any) => 
          sum + (Number(item.qty || 1) * Number(item.rate || 0)), 0
        );

        // Generate invoice number
        const invoiceNo = `INV-R-${Date.now().toString(36).toUpperCase()}`;

        // Create invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            business_id: template.business_id,
            party_id: template.party_id,
            invoice_no: invoiceNo,
            issue_date: today,
            due_date: today, // can be extended
            subtotal,
            tax_amount: 0,
            total: subtotal,
            paid_amount: 0,
            balance_due: subtotal,
            status: template.auto_post ? 'issued' : 'draft',
            line_items: template.line_items,
            notes: `Auto-generated from recurring template`,
          })
          .select()
          .single();

        if (invoiceError) {
          console.error(`[Cron] Invoice creation failed for template ${template.id}:`, invoiceError);
          results.push({ templateId: template.id, success: false, error: invoiceError.message });
          continue;
        }

        // Update next_run_date
        const nextRun = getNextRunDate(template.next_run_date, template.frequency);
        await supabase
          .from('recurring_invoices')
          .update({ next_run_date: nextRun })
          .eq('id', template.id);

        processed++;
        results.push({
          templateId: template.id,
          invoiceId: newInvoice?.id,
          invoiceNo,
          success: true,
          autoPosted: template.auto_post,
        });

        console.log(`[Cron] Created invoice ${invoiceNo} from recurring template ${template.id}`);

      } catch (innerErr: any) {
        console.error(`[Cron] Error processing template ${template.id}:`, innerErr);
        results.push({ templateId: template.id, success: false, error: innerErr.message });
      }
    }

    console.log(`[Cron] Processed ${processed}/${templates.length} recurring invoices`);
    return NextResponse.json({ processed, total: templates.length, results });
  } catch (err: any) {
    console.error('[Cron] Fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Also support GET for manual triggers
export async function GET() {
  return POST();
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      operation = 'create',
      invoice,
      items = [],
      ledger_entries = [],
      party_balance_increment = 0,
      sku_deductions = []
    } = body;

    if (operation === 'create') {
      if (!invoice || !invoice.business_id) {
        return NextResponse.json({ error: 'Invoice data and business_id are required' }, { status: 400 });
      }

      // 1. Insert Invoice
      const { data: invData, error: invErr } = await supabase
        .from('invoices')
        .insert(invoice)
        .select('id')
        .single();

      if (invErr) {
        console.error('[API Invoices] Invoice insert error:', invErr);
        return NextResponse.json({ error: invErr.message }, { status: 400 });
      }

      const invoiceId = invData.id;

      // 2. Insert Invoice Items (clean payload matching schema)
      if (items.length > 0) {
        const cleanItems = items.map((item: any) => ({
          invoice_id: invoiceId,
          sku_id: item.sku_id || null,
          description: item.description || 'Item',
          qty: Number(item.qty) || 1,
          unit: item.unit || 'pcs',
          unit_price: Number(item.unit_price) || 0
        }));

        const { error: itemsErr } = await supabase
          .from('invoice_items')
          .insert(cleanItems);

        if (itemsErr) {
          console.error('[API Invoices] Invoice items insert error:', itemsErr);
          return NextResponse.json({ error: itemsErr.message }, { status: 400 });
        }
      }

      // 3. Decrement SKU quantities if applicable
      if (sku_deductions.length > 0) {
        for (const item of sku_deductions) {
          if (item.sku_id && item.qty) {
            try {
              const { data: skuRecord } = await supabase
                .from('skus')
                .select('qty_on_hand')
                .eq('id', item.sku_id)
                .single();
              if (skuRecord) {
                const currentQty = skuRecord.qty_on_hand || 0;
                await supabase
                  .from('skus')
                  .update({
                    qty_on_hand: Math.max(0, currentQty - Number(item.qty)),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', item.sku_id);
              }
            } catch (skuErr) {
              console.warn('[API Invoices] Stock deduction warning:', skuErr);
            }
          }
        }
      }

      // 4. Insert Ledger Entries
      if (ledger_entries.length > 0) {
        const cleanLedgers = ledger_entries.map((entry: any) => ({
          ...entry,
          invoice_id: invoiceId
        }));
        try {
          await supabase.from('ledger_entries').insert(cleanLedgers);
        } catch (ledgErr) {
          console.warn('[API Invoices] Ledger entries warning:', ledgErr);
        }
      }

      // 5. Update Party balance
      if (invoice.party_id && party_balance_increment !== 0) {
        try {
          const { data: partyRecord } = await supabase
            .from('parties')
            .select('current_balance')
            .eq('id', invoice.party_id)
            .single();
          if (partyRecord) {
            await supabase
              .from('parties')
              .update({
                current_balance: (partyRecord.current_balance || 0) + Number(party_balance_increment)
              })
              .eq('id', invoice.party_id);
          }
        } catch (partyErr) {
          console.warn('[API Invoices] Party balance update warning:', partyErr);
        }
      }

      return NextResponse.json({ success: true, invoice_id: invoiceId });
    }

    return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
  } catch (err: any) {
    console.error('[API Invoices] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

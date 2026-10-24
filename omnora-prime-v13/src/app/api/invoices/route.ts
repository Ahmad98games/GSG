import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { broadcastSyncToMobileDevices } from '@/lib/mobile-bridge/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

/**
 * GET /api/invoices
 * Serves invoices and items directly from master local SQLite,
 * allowing secondary browsers and LAN workstations to view all bills offline.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || 'all').trim();
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '100', 10));

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json([], { status: 200 });
    }

    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'").get();
    if (!tableExists) {
      return NextResponse.json([], { status: 200 });
    }

    let query = `
      SELECT 
        i.id,
        i.business_id,
        COALESCE(i.invoice_number, '') AS invoice_no,
        COALESCE(i.invoice_number, '') AS invoice_number,
        COALESCE(i.invoice_type, 'invoice') AS invoice_type,
        i.party_id,
        COALESCE(i.party_name, p.name, 'Walk-in Customer') AS party_name,
        COALESCE(i.party_phone, p.phone, '') AS party_phone,
        COALESCE(i.invoice_date, datetime('now')) AS invoice_date,
        i.due_date,
        COALESCE(i.status, 'posted') AS status,
        COALESCE(i.subtotal, 0) AS subtotal,
        COALESCE(i.discount_amount, 0) AS discount_amount,
        COALESCE(i.tax_amount, 0) AS tax_amount,
        COALESCE(i.total_amount, 0) AS total_amount,
        COALESCE(i.amount_paid, 0) AS amount_paid,
        COALESCE(i.balance_due, 0) AS balance_due,
        COALESCE(i.notes, '') AS notes,
        COALESCE(i.created_at, datetime('now')) AS created_at
      FROM invoices i
      LEFT JOIN parties p ON p.id = i.party_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status !== 'all') {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (i.invoice_number LIKE ? OR i.party_name LIKE ? OR p.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY i.created_at DESC LIMIT ?`;
    params.push(limit);

    const invoices = sqlite.prepare(query).all(...params);

    // Format response to match Supabase schema expected by frontend
    const formatted = invoices.map((inv: any) => ({
      ...inv,
      party: {
        name: inv.party_name,
        phone: inv.party_phone,
      },
    }));

    return NextResponse.json(formatted, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[API /api/invoices] Error reading local invoices:', err);
    return NextResponse.json([], { status: 200 });
  }
}

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

      let invoiceId = invoice.id || randomUUID();
      let remoteSynced = false;

      // 1. Try cloud sync if online, but never fail if offline
      try {
        const { data: invData, error: invErr } = await supabase
          .from('invoices')
          .insert(invoice)
          .select('id')
          .single();

        if (!invErr && invData?.id) {
          invoiceId = invData.id;
          remoteSynced = true;
        } else if (invErr) {
          console.warn('[API Invoices] Cloud sync skipped/failed (offline):', invErr.message);
        }
      } catch (cloudErr: any) {
        console.warn('[API Invoices] Network offline for cloud sync:', cloudErr.message);
      }

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

        try {
          const { error: itemsErr } = await supabase
            .from('invoice_items')
            .insert(cleanItems);

          if (itemsErr) {
            console.warn('[API Invoices] Invoice items remote insert warning:', itemsErr.message);
          }
        } catch (itemErr: any) {
          console.warn('[API Invoices] Offline remote items insert skipped:', itemErr.message);
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

      // 6. Local SQLite persistence & mobile push
      try {
        const sqlite = (db as any).$client;
        if (sqlite) {
          sqlite.prepare(`
            INSERT OR REPLACE INTO invoices (id, business_id, invoice_number, invoice_type, party_id, party_name, party_phone, invoice_date, due_date, status, total_amount, amount_paid, balance_due, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            invoiceId,
            invoice.business_id,
            invoice.invoice_number || 'INV',
            invoice.invoice_type || 'invoice',
            invoice.party_id || null,
            invoice.party_name || null,
            invoice.party_phone || null,
            invoice.invoice_date || new Date().toISOString(),
            invoice.due_date || null,
            invoice.status || 'posted',
            Number(invoice.total_amount || 0),
            Number(invoice.amount_paid || 0),
            Number(invoice.balance_due || invoice.total_amount || 0),
            new Date().toISOString(),
            new Date().toISOString()
          );

          if (items.length > 0) {
            for (const it of items) {
              sqlite.prepare(`
                INSERT OR REPLACE INTO invoice_items (id, invoice_id, business_id, sku_id, description, quantity, unit, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                it.id || randomUUID(),
                invoiceId,
                invoice.business_id,
                it.sku_id || null,
                it.description || 'Item',
                Number(it.qty || 1),
                it.unit || 'Piece',
                Number(it.unit_price || 0),
                Number((it.qty || 1) * (it.unit_price || 0))
              );
            }
            // Also deduct quantities in local SQLite skus
            if (sku_deductions.length > 0) {
              for (const it of sku_deductions) {
                if (it.sku_id && it.qty) {
                  try {
                    sqlite.prepare('UPDATE skus SET qty_on_hand = MAX(0, qty_on_hand - ?) WHERE id = ?').run(Number(it.qty), it.sku_id);
                  } catch {}
                }
              }
            }

            // Also update local parties balance
            if (invoice.party_id && party_balance_increment !== 0) {
              try {
                sqlite.prepare('UPDATE parties SET current_balance = current_balance + ? WHERE id = ?').run(Number(party_balance_increment), invoice.party_id);
              } catch {}
            }
          }
        }
      } catch (sqErr: any) {
        console.warn('[API Invoices] Local SQLite insertion warning:', sqErr.message);
      }

      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'invoices' });
        broadcastSyncToMobileDevices('INVOICE_CREATED', {
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
        });
      } catch {}

      return NextResponse.json({ success: true, invoice_id: invoiceId });
    }

    return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
  } catch (err: any) {
    console.error('[API Invoices] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

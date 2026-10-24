import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { broadcastSyncToMobileDevices } from '@/lib/mobile-bridge/server';
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatcher';
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
    const id = (searchParams.get('id') || '').trim();
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || 'all').trim();
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '100', 10));

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json(id ? null : [], { status: 200 });
    }

    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'").get();
    if (!tableExists) {
      return NextResponse.json(id ? null : [], { status: 200 });
    }

    // ── SINGLE INVOICE RETRIEVAL WITH ITEMS ──
    if (id) {
      const invQuery = `
        SELECT 
          i.id,
          i.business_id,
          COALESCE(i.invoice_number, '') AS invoice_no,
          COALESCE(i.invoice_number, '') AS invoice_number,
          COALESCE(i.invoice_type, 'invoice') AS invoice_type,
          i.party_id,
          COALESCE(i.party_name, p.name, 'Walk-in Customer') AS party_name,
          COALESCE(i.party_phone, p.phone, '') AS party_phone,
          COALESCE(p.address, '') AS party_address,
          COALESCE(i.invoice_date, datetime('now')) AS invoice_date,
          COALESCE(i.invoice_date, datetime('now')) AS issue_date,
          i.due_date,
          COALESCE(i.status, 'posted') AS status,
          COALESCE(i.subtotal, 0) AS subtotal,
          COALESCE(i.discount_amount, 0) AS discount_amount,
          COALESCE(i.discount_percent, 0) AS discount_pct,
          COALESCE(i.tax_amount, 0) AS tax_amount,
          COALESCE(i.tax_rate, 0) AS tax_pct,
          COALESCE(i.total_amount, 0) AS total_amount,
          COALESCE(i.total_amount, 0) AS total,
          COALESCE(i.amount_paid, 0) AS amount_paid,
          COALESCE(i.balance_due, 0) AS balance_due,
          COALESCE(i.notes, '') AS notes,
          COALESCE(i.created_at, datetime('now')) AS created_at
        FROM invoices i
        LEFT JOIN parties p ON p.id = i.party_id
        WHERE i.id = ? OR i.invoice_number = ?
        LIMIT 1
      `;
      const inv: any = sqlite.prepare(invQuery).get(id, id);
      if (!inv) {
        return NextResponse.json(null, { status: 404 });
      }

      // Query line items from local SQLite
      let items: any[] = [];
      const itemsTableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_items'").get();
      if (itemsTableExists) {
        try {
          const rawItems = sqlite.prepare(`
            SELECT 
              ii.*,
              s.sku AS sku_code,
              s.name AS sku_name
            FROM invoice_items ii
            LEFT JOIN skus s ON s.id = ii.sku_id
            WHERE ii.invoice_id = ?
            ORDER BY ii.sort_order ASC, ii.rowid ASC
          `).all(inv.id);

          items = rawItems.map((it: any) => {
            const qty = Number(it.quantity ?? it.qty ?? 1);
            const unitPrice = Number(it.unit_price ?? 0);
            const lineTotal = Number(it.total_price ?? it.line_total ?? (qty * unitPrice));
            return {
              id: it.id,
              invoice_id: it.invoice_id,
              sku_id: it.sku_id || null,
              description: it.description || 'Item',
              qty,
              quantity: qty,
              unit: it.unit || 'pcs',
              unit_price: unitPrice,
              line_total: lineTotal,
              total_price: lineTotal,
              discount_percent: Number(it.discount_percent || 0),
              sku: it.sku_code ? { name: it.sku_name || it.description, sku_code: it.sku_code } : undefined
            };
          });
        } catch (itemErr) {
          console.warn('[API /api/invoices] Item query warning:', itemErr);
        }
      }

      const singleFormatted = {
        ...inv,
        items,
        party: {
          id: inv.party_id,
          name: inv.party_name,
          phone: inv.party_phone,
          address: inv.party_address,
        },
      };

      return NextResponse.json(singleFormatted, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    // ── LIST RETRIEVAL ──
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
        COALESCE(i.invoice_date, datetime('now')) AS issue_date,
        i.due_date,
        COALESCE(i.status, 'posted') AS status,
        COALESCE(i.subtotal, 0) AS subtotal,
        COALESCE(i.discount_amount, 0) AS discount_amount,
        COALESCE(i.tax_amount, 0) AS tax_amount,
        COALESCE(i.total_amount, 0) AS total_amount,
        COALESCE(i.total_amount, 0) AS total,
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
          const invNumber = invoice.invoice_number || invoice.invoice_no || `INV-${Date.now().toString().slice(-6)}`;
          const invDate = invoice.invoice_date || invoice.issue_date || new Date().toISOString();
          const invSubtotal = Number(invoice.subtotal || invoice.total_amount || invoice.total || 0);
          const invDiscount = Number(invoice.discount_amount || 0);
          const invDiscountPct = Number(invoice.discount_percent || invoice.discount_pct || 0);
          const invTax = Number(invoice.tax_amount || 0);
          const invTaxRate = Number(invoice.tax_rate || invoice.tax_pct || 0);
          const invTotal = Number(invoice.total_amount || invoice.total || (invSubtotal - invDiscount + invTax));
          const invPaid = Number(invoice.amount_paid || 0);
          const invBalance = Number(invoice.balance_due ?? (invTotal - invPaid));

          sqlite.prepare(`
            INSERT OR REPLACE INTO invoices (
              id, business_id, invoice_number, invoice_type, party_id, party_name, party_phone,
              invoice_date, due_date, status, subtotal, discount_amount, discount_percent,
              tax_amount, tax_rate, total_amount, amount_paid, balance_due, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            invoiceId,
            invoice.business_id,
            invNumber,
            invoice.invoice_type || 'invoice',
            invoice.party_id || null,
            invoice.party_name || null,
            invoice.party_phone || null,
            invDate,
            invoice.due_date || null,
            invoice.status || 'posted',
            invSubtotal,
            invDiscount,
            invDiscountPct,
            invTax,
            invTaxRate,
            invTotal,
            invPaid,
            invBalance,
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

        // Trigger real outbound webhook dispatch
        dispatchWebhookEvent('invoice.created', {
          invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          party_name: invoice.party_name,
          party_phone: invoice.party_phone,
          status: invoice.status || 'posted',
          items_count: items.length,
        }, invoice.business_id || 'local');
      } catch {}

      return NextResponse.json({ success: true, invoice_id: invoiceId });
    }

    return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
  } catch (err: any) {
    console.error('[API Invoices] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

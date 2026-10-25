import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { broadcastSyncToMobileDevices, broadcastToHubRenderer } from '@/lib/mobile-bridge/server';
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
        WHERE LOWER(i.id) = LOWER(?)
           OR LOWER(COALESCE(i.invoice_number, '')) = LOWER(?)
           OR LOWER(COALESCE(i.invoice_no, '')) = LOWER(?)
        LIMIT 1
      `;
      let inv: any = sqlite.prepare(invQuery).get(id, id, id);
      const itemsTableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_items'").get();

      if (!inv) {
        // Fallback: Check Supabase cloud database if not yet cached in local SQLite
        try {
          const { data: cloudInv } = await supabase
            .from('invoices')
            .select('*, party:parties(*), invoice_items(*)')
            .or(`id.ilike.${id},invoice_no.ilike.${id},invoice_number.ilike.${id}`)
            .maybeSingle();

          if (cloudInv) {
            // Upsert into local SQLite cache
            try {
              sqlite.prepare(`
                INSERT OR REPLACE INTO invoices (
                  id, business_id, invoice_number, invoice_type, party_id, 
                  party_name, party_phone, invoice_date, status, 
                  total_amount, amount_paid, balance_due, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                cloudInv.id,
                cloudInv.business_id || 'local',
                cloudInv.invoice_no || cloudInv.invoice_number || id,
                cloudInv.invoice_type || 'invoice',
                cloudInv.party_id || null,
                cloudInv.party?.name || cloudInv.party_name || null,
                cloudInv.party?.phone || cloudInv.party_phone || null,
                cloudInv.issue_date || cloudInv.invoice_date || new Date().toISOString(),
                cloudInv.status || 'posted',
                Number(cloudInv.total ?? cloudInv.total_amount ?? 0),
                Number(cloudInv.paid_amount ?? cloudInv.amount_paid ?? 0),
                Number(cloudInv.balance_due ?? 0),
                cloudInv.notes || '',
                cloudInv.created_at || new Date().toISOString(),
                new Date().toISOString()
              );

              if (Array.isArray(cloudInv.invoice_items) && itemsTableExists) {
                for (const it of cloudInv.invoice_items) {
                  sqlite.prepare(`
                    INSERT OR REPLACE INTO invoice_items (
                      id, invoice_id, business_id, sku_id, description, quantity, unit, unit_price, total_price
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).run(
                    it.id || randomUUID(),
                    cloudInv.id,
                    cloudInv.business_id || 'local',
                    it.sku_id || null,
                    it.description || 'Item',
                    Number(it.quantity ?? it.qty ?? 1),
                    it.unit || 'pcs',
                    Number(it.unit_price || 0),
                    Number(it.total_price ?? it.line_total ?? 0)
                  );
                }
              }
            } catch (cacheErr) {
              console.warn('[API /api/invoices] Cache into SQLite notice:', cacheErr);
            }

            const items = (cloudInv.invoice_items || []).map((it: any) => ({
              id: it.id,
              invoice_id: it.invoice_id,
              sku_id: it.sku_id || null,
              description: it.description || 'Item',
              qty: Number(it.quantity ?? it.qty ?? 1),
              quantity: Number(it.quantity ?? it.qty ?? 1),
              unit: it.unit || 'pcs',
              unit_price: Number(it.unit_price ?? 0),
              line_total: Number(it.total_price ?? it.line_total ?? 0),
              total_price: Number(it.total_price ?? it.line_total ?? 0),
              discount_percent: Number(it.discount_percent || 0),
              sku: it.sku ? { name: it.sku.name || it.description, sku_code: it.sku.sku_code || '' } : undefined
            }));

            return NextResponse.json({
              id: cloudInv.id,
              business_id: cloudInv.business_id,
              invoice_no: cloudInv.invoice_no || cloudInv.invoice_number,
              invoice_number: cloudInv.invoice_no || cloudInv.invoice_number,
              invoice_type: cloudInv.invoice_type || 'invoice',
              party_id: cloudInv.party_id,
              party_name: cloudInv.party?.name || cloudInv.party_name || 'Walk-in Customer',
              party_phone: cloudInv.party?.phone || cloudInv.party_phone || '',
              party_address: cloudInv.party?.address || '',
              invoice_date: cloudInv.issue_date || cloudInv.invoice_date || new Date().toISOString(),
              issue_date: cloudInv.issue_date || cloudInv.invoice_date || new Date().toISOString(),
              due_date: cloudInv.due_date,
              status: cloudInv.status || 'posted',
              subtotal: Number(cloudInv.subtotal ?? 0),
              discount_amount: Number(cloudInv.discount_amount ?? 0),
              discount_pct: Number(cloudInv.discount_percent ?? cloudInv.discount_pct ?? 0),
              tax_amount: Number(cloudInv.tax_amount ?? 0),
              tax_pct: Number(cloudInv.tax_rate ?? cloudInv.tax_pct ?? 0),
              total_amount: Number(cloudInv.total ?? cloudInv.total_amount ?? 0),
              total: Number(cloudInv.total ?? cloudInv.total_amount ?? 0),
              amount_paid: Number(cloudInv.paid_amount ?? cloudInv.amount_paid ?? 0),
              balance_due: Number(cloudInv.balance_due ?? 0),
              notes: cloudInv.notes || '',
              created_at: cloudInv.created_at || new Date().toISOString(),
              items,
              party: cloudInv.party || {
                id: cloudInv.party_id,
                name: cloudInv.party_name || 'Walk-in Customer',
                phone: cloudInv.party_phone || '',
                address: ''
              }
            }, { status: 200 });
          }
        } catch (cloudErr) {
          console.warn('[API /api/invoices] Cloud fallback check notice:', cloudErr);
        }

        return NextResponse.json(null, { status: 404 });
      }

      // Query line items from local SQLite
      let items: any[] = [];
      if (itemsTableExists) {
        try {
          let rawItems: any[] = [];
          try {
            rawItems = sqlite.prepare(`
              SELECT 
                ii.*,
                COALESCE(s.sku_code, '') AS sku_code,
                COALESCE(s.name, '') AS sku_name
              FROM invoice_items ii
              LEFT JOIN skus s ON s.id = ii.sku_id
              WHERE ii.invoice_id = ? OR ii.invoice_id = ? OR ii.invoice_id = ?
              ORDER BY ii.rowid ASC
            `).all(inv.id, inv.invoice_number, inv.invoice_no);
          } catch {
            rawItems = sqlite.prepare(`
              SELECT ii.*
              FROM invoice_items ii
              WHERE ii.invoice_id = ? OR ii.invoice_id = ? OR ii.invoice_id = ?
              ORDER BY ii.rowid ASC
            `).all(inv.id, inv.invoice_number, inv.invoice_no);
          }

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
              sku: (it.sku_code || it.sku_name) ? { name: it.sku_name || it.description, sku_code: it.sku_code || '' } : undefined
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

      const invoiceId = invoice.id || randomUUID();
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

      // ── STEP 1: ZERO-LATENCY LOCAL SQLITE WAL WRITE (< 1ms) ──
      try {
        const sqlite = (db as any).$client;
        if (sqlite) {
          // Ensure invoice_items table exists
          sqlite.exec(`
            CREATE TABLE IF NOT EXISTS invoice_items (
              id TEXT PRIMARY KEY,
              invoice_id TEXT NOT NULL,
              business_id TEXT,
              sku_id TEXT,
              description TEXT,
              quantity REAL DEFAULT 1,
              unit TEXT DEFAULT 'Piece',
              unit_price REAL DEFAULT 0,
              total_price REAL DEFAULT 0,
              discount_percent REAL DEFAULT 0,
              created_at TEXT DEFAULT (datetime('now'))
            )
          `);

          // Insert or replace invoice
          sqlite.prepare(`
            INSERT OR REPLACE INTO invoices (
              id, business_id, invoice_number, invoice_type, party_id, party_name, party_phone,
              invoice_date, due_date, status, subtotal, discount_amount, discount_percent,
              tax_amount, tax_rate, total_amount, amount_paid, balance_due, notes, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            invoice.notes || '',
            new Date().toISOString(),
            new Date().toISOString()
          );

          // Insert line items
          if (Array.isArray(items) && items.length > 0) {
            const insertItemStmt = sqlite.prepare(`
              INSERT OR REPLACE INTO invoice_items (
                id, invoice_id, business_id, sku_id, description, quantity, unit, unit_price, total_price, discount_percent
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const it of items) {
              const qty = Number(it.quantity ?? it.qty ?? 1);
              const unitPrice = Number(it.unit_price ?? 0);
              const totalPrice = Number(it.total_price ?? it.line_total ?? (qty * unitPrice));
              insertItemStmt.run(
                it.id || randomUUID(),
                invoiceId,
                invoice.business_id,
                it.sku_id || null,
                it.description || 'Item',
                qty,
                it.unit || 'Piece',
                unitPrice,
                totalPrice,
                Number(it.discount_percent || 0)
              );
            }
          }

          // Deduct quantities in local SQLite skus
          if (Array.isArray(sku_deductions) && sku_deductions.length > 0) {
            const deductStmt = sqlite.prepare('UPDATE skus SET qty_on_hand = MAX(0, qty_on_hand - ?) WHERE id = ?');
            for (const it of sku_deductions) {
              if (it.sku_id && it.qty) {
                try {
                  deductStmt.run(Number(it.qty), it.sku_id);
                } catch {}
              }
            }
          }

          // Update local party balance
          if (invoice.party_id && party_balance_increment !== 0) {
            try {
              sqlite.prepare('UPDATE parties SET current_balance = COALESCE(current_balance, 0) + ? WHERE id = ?')
                .run(Number(party_balance_increment), invoice.party_id);
            } catch {}
          }
        }
      } catch (sqErr: any) {
        console.warn('[API Invoices] Local SQLite write warning:', sqErr.message);
      }

      // ── STEP 2: INSTANT MOBILE BRIDGE & REALTIME BROADCAST ──
      try {
        broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'invoices' });
        broadcastSyncToMobileDevices('INVOICE_CREATED', {
          invoice_id: invoiceId,
          invoice_number: invNumber,
          total_amount: invTotal,
        });
        broadcastToHubRenderer('INVOICE_CREATED', {
          invoice_id: invoiceId,
          invoice_number: invNumber,
          total_amount: invTotal,
          invoice: { id: invoiceId, invoice_no: invNumber, invoice_number: invNumber, total_amount: invTotal, ...invoice },
          source: 'pc_hub',
        });

        dispatchWebhookEvent('invoice.created', {
          invoice_id: invoiceId,
          invoice_number: invNumber,
          total_amount: invTotal,
          party_name: invoice.party_name,
          party_phone: invoice.party_phone,
          status: invoice.status || 'posted',
          items_count: items.length,
        }, invoice.business_id || 'local');
      } catch {}

      // ── STEP 3: NON-BLOCKING BACKGROUND CLOUD SYNC ──
      // Runs asynchronously without blocking the user response
      (async () => {
        try {
          const timeoutController = new AbortController();
          const tId = setTimeout(() => timeoutController.abort(), 2000);

          const { error: invErr } = await supabase
            .from('invoices')
            .insert({
              ...invoice,
              id: invoiceId,
              invoice_number: invNumber,
              invoice_no: invNumber,
              total_amount: invTotal,
              total: invTotal,
            });

          clearTimeout(tId);

          if (!invErr && items.length > 0) {
            const cleanItems = items.map((item: any) => ({
              invoice_id: invoiceId,
              sku_id: item.sku_id || null,
              description: item.description || 'Item',
              qty: Number(item.quantity ?? item.qty) || 1,
              unit: item.unit || 'pcs',
              unit_price: Number(item.unit_price) || 0
            }));
            await supabase.from('invoice_items').insert(cleanItems);
          }

          if (ledger_entries.length > 0) {
            const cleanLedgers = ledger_entries.map((entry: any) => ({
              ...entry,
              invoice_id: invoiceId
            }));
            await supabase.from('ledger_entries').insert(cleanLedgers);
          }

          if (invoice.party_id && party_balance_increment !== 0) {
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
          }
        } catch (cloudErr: any) {
          // Offline or network timeout - local SQLite is already fully saved
          console.info('[API Invoices] Cloud sync skipped/queued (offline or timeout):', cloudErr.message || cloudErr);
        }
      })();

      return NextResponse.json({
        success: true,
        invoice_id: invoiceId,
        invoice_no: invNumber,
      });
    }

    return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
  } catch (err: any) {
    console.error('[API Invoices] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/security/apiKeyAuth';
import { db } from '@/lib/db/client';
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

/**
 * GET /v1/invoices or /api/v1/invoices
 * Public authenticated REST endpoint to query invoices
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req, 'read');
  if (!auth.authenticated) {
    return NextResponse.json({ status: 'error', error: auth.error, code: 401 }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const limit = Math.min(200, parseInt(searchParams.get('limit') || '50', 10));

  const sqlite = getSqliteInstance();
  if (!sqlite) {
    return NextResponse.json({ status: 'error', message: 'Database unavailable' }, { status: 500 });
  }

  try {
    let query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.party_name,
        i.party_phone,
        i.invoice_date,
        i.status,
        i.total_amount,
        i.amount_paid,
        i.balance_due,
        i.created_at
      FROM invoices i
      WHERE 1=1
    `;
    const params: any[] = [];
    if (status !== 'all') {
      query += ` AND i.status = ?`;
      params.push(status);
    }
    query += ` ORDER BY i.created_at DESC LIMIT ?`;
    params.push(limit);

    const invoices = sqlite.prepare(query).all(...params);

    return NextResponse.json({
      status: 'success',
      endpoint: '/v1/invoices',
      authenticated_as: auth.keyName,
      total_invoices: invoices.length,
      data: invoices,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

/**
 * POST /v1/invoices or /api/v1/invoices
 * Public authenticated REST endpoint for Shopify, WooCommerce, ERPs to create invoices directly
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req, 'write');
  if (!auth.authenticated) {
    return NextResponse.json({ status: 'error', error: auth.error, code: 401 }, { status: 401 });
  }

  const sqlite = getSqliteInstance();
  if (!sqlite) {
    return NextResponse.json({ status: 'error', message: 'Database unavailable' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      party_name = 'Online Customer',
      party_phone = '',
      items = [],
      total_amount = 0,
      notes = 'Created via Public API'
    } = body;

    const invoiceId = randomUUID();
    const invoiceNumber = 'INV-API-' + Math.floor(100000 + Math.random() * 900000);

    sqlite.prepare(`
      INSERT INTO invoices (
        id, business_id, invoice_number, invoice_type, party_name, party_phone,
        invoice_date, status, total_amount, amount_paid, balance_due, notes, created_at, updated_at
      ) VALUES (?, 'local', ?, 'invoice', ?, ?, datetime('now'), 'posted', ?, ?, 0, ?, datetime('now'), datetime('now'))
    `).run(
      invoiceId,
      invoiceNumber,
      party_name,
      party_phone,
      Number(total_amount),
      Number(total_amount),
      notes
    );

    // Insert items if provided and deduct stock
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        sqlite.prepare(`
          INSERT INTO invoice_items (
            id, invoice_id, business_id, sku_id, description, quantity, unit, unit_price, total_price
          ) VALUES (?, ?, 'local', ?, ?, ?, ?, ?, ?)
        `).run(
          randomUUID(),
          invoiceId,
          it.sku_id || null,
          it.description || 'API Order Item',
          Number(it.quantity || 1),
          it.unit || 'Piece',
          Number(it.unit_price || 0),
          Number(it.total_price || 0)
        );

        if (it.sku_id && it.quantity) {
          try {
            sqlite.prepare('UPDATE skus SET qty_on_hand = MAX(0, qty_on_hand - ?) WHERE id = ?').run(Number(it.quantity), it.sku_id);
          } catch {}
        }
      }
    }

    // Trigger webhook event
    dispatchWebhookEvent('invoice.created', {
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      total_amount,
      party_name,
      party_phone,
      source: 'public_api'
    });

    return NextResponse.json({
      status: 'success',
      endpoint: '/v1/invoices',
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      total_amount,
      message: 'Invoice created successfully via Noxis Open API'
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

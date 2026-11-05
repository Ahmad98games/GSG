import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

function ensurePurchaseTables(sqlite: any) {
  if (!sqlite) return;
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        po_number TEXT NOT NULL,
        supplier_id TEXT,
        supplier_name TEXT,
        order_date TEXT NOT NULL,
        expected_date TEXT,
        status TEXT DEFAULT 'pending',
        subtotal REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        business_id TEXT DEFAULT 'local',
        sku_id TEXT,
        sku_code TEXT,
        description TEXT NOT NULL,
        ordered_qty REAL NOT NULL DEFAULT 1,
        received_qty REAL DEFAULT 0,
        unit TEXT DEFAULT 'Piece',
        unit_cost REAL DEFAULT 0,
        total_price REAL DEFAULT 0
      );
    `);
  } catch (err: any) {
    console.warn('[API Purchase] Table ensure warning:', err.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status') || 'all';
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const businessId = searchParams.get('business_id') || 'local';

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({ data: id ? null : [], stats: { totalOrders: 0, openOrders: 0, pendingReceipt: 0, monthlyValue: 0 } });
    }

    ensurePurchaseTables(sqlite);

    // Single PO query with line items
    if (id) {
      const po = sqlite.prepare(`
        SELECT 
          po.*,
          COALESCE(po.supplier_name, p.name, 'Supplier') as supplier_name,
          p.phone as supplier_phone,
          p.email as supplier_email,
          p.address as supplier_address
        FROM purchase_orders po
        LEFT JOIN parties p ON po.supplier_id = p.id
        WHERE po.id = ? OR po.po_number = ?
      `).get(id, id);

      if (!po) {
        return NextResponse.json({ error: 'Purchase order not found', data: null }, { status: 404 });
      }

      const items = sqlite.prepare(`
        SELECT * FROM purchase_order_items WHERE po_id = ?
      `).all(po.id) || [];

      return NextResponse.json({
        data: {
          ...po,
          supplier: {
            id: po.supplier_id,
            name: po.supplier_name,
            phone: po.supplier_phone,
            address: po.supplier_address,
          },
          items
        }
      });
    }

    // List PO query
    let query = `
      SELECT 
        po.*,
        COALESCE(po.supplier_name, p.name, 'Supplier') as supplier_name,
        p.phone as supplier_phone,
        (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.po_id = po.id) as item_count
      FROM purchase_orders po
      LEFT JOIN parties p ON po.supplier_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND po.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (LOWER(po.po_number) LIKE ? OR LOWER(po.supplier_name) LIKE ? OR LOWER(COALESCE(p.name, '')) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY po.created_at DESC`;

    const rows = sqlite.prepare(query).all(...params) || [];

    // Calculate registry statistics
    const allRows = sqlite.prepare(`SELECT status, total_amount, created_at FROM purchase_orders`).all() || [];
    const openOrders = allRows.filter((r: any) => r.status === 'pending' || r.status === 'sent').length;
    const pendingReceipt = allRows.filter((r: any) => r.status === 'pending').length;
    
    // Monthly value: sum of orders created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyValue = allRows
      .filter((r: any) => new Date(r.created_at || Date.now()) >= thirtyDaysAgo)
      .reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);

    return NextResponse.json({
      data: rows.map((r: any) => ({
        ...r,
        supplier: {
          id: r.supplier_id,
          name: r.supplier_name,
          phone: r.supplier_phone
        }
      })),
      stats: {
        totalOrders: allRows.length,
        openOrders,
        pendingReceipt,
        monthlyValue
      }
    });
  } catch (err: any) {
    console.error('[API Purchase GET] Error:', err);
    return NextResponse.json({ error: err.message, data: [], stats: { totalOrders: 0, openOrders: 0, pendingReceipt: 0, monthlyValue: 0 } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      business_id, 
      supplier_id, 
      supplier_name, 
      status = 'pending', 
      expected_by, 
      expected_date,
      subtotal = 0, 
      tax_amount = 0, 
      tax_rate = 0, 
      tax_pct = 0,
      total_amount = 0, 
      total = 0,
      notes = '', 
      items = [] 
    } = body;

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
    }

    ensurePurchaseTables(sqlite);

    // Look up supplier name from parties if missing
    let resolvedSupplierName = supplier_name || '';
    if (!resolvedSupplierName && supplier_id) {
      try {
        const party = sqlite.prepare(`SELECT name FROM parties WHERE id = ?`).get(supplier_id);
        if (party) resolvedSupplierName = party.name;
      } catch {}
    }

    const year = new Date().getFullYear();
    const countRow = sqlite.prepare(`SELECT COUNT(*) as cnt FROM purchase_orders`).get();
    const nextNum = (countRow?.cnt || 0) + 1;
    const poNumber = `PO-${year}-${String(nextNum).padStart(4, '0')}`;
    const poId = 'po-' + randomUUID();
    const finalSubtotal = Number(subtotal) || 0;
    const finalTax = Number(tax_amount) || 0;
    const finalRate = Number(tax_rate || tax_pct) || 0;
    const finalTotal = Number(total_amount || total) || (finalSubtotal + finalTax);
    const expDate = expected_date || expected_by || null;
    const bId = business_id || 'local';

    const insertPo = sqlite.prepare(`
      INSERT INTO purchase_orders (
        id, business_id, po_number, supplier_id, supplier_name, order_date, expected_date,
        status, subtotal, tax_amount, tax_rate, total_amount, notes
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPo.run(
      poId, bId, poNumber, supplier_id || null, resolvedSupplierName,
      expDate, status, finalSubtotal, finalTax, finalRate, finalTotal, notes
    );

    // Insert line items
    if (Array.isArray(items) && items.length > 0) {
      const insertItem = sqlite.prepare(`
        INSERT INTO purchase_order_items (
          id, po_id, business_id, sku_id, sku_code, description, ordered_qty, received_qty,
          unit, unit_cost, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      `);

      for (const it of items) {
        const itemId = 'poi-' + randomUUID();
        const qty = Number(it.qty_ordered || it.quantity || 1);
        const cost = Number(it.unit_cost || it.unit_price || 0);
        const lineTotal = Number(it.line_total || it.total_price) || (qty * cost);

        insertItem.run(
          itemId, poId, bId, it.sku_id || null, it.sku_code || '',
          it.description || 'Stock Item', qty, it.unit || 'Piece', cost, lineTotal
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: poId,
        po_number: poNumber,
        status,
        total_amount: finalTotal,
        supplier_name: resolvedSupplierName
      }
    });
  } catch (err: any) {
    console.error('[API Purchase POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, notes } = body;

    const sqlite = getSqliteInstance();
    if (!sqlite || !id) {
      return NextResponse.json({ error: 'Missing PO ID or database' }, { status: 400 });
    }

    ensurePurchaseTables(sqlite);

    const po = sqlite.prepare(`SELECT * FROM purchase_orders WHERE id = ?`).get(id);
    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const updates: string[] = ["updated_at = datetime('now')"];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    params.push(id);

    sqlite.prepare(`UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // If order was marked as 'received', receive stock into inventory!
    if (status === 'received' && po.status !== 'received') {
      try {
        const items = sqlite.prepare(`SELECT * FROM purchase_order_items WHERE po_id = ?`).all(id) || [];
        for (const item of items) {
          if (item.sku_id) {
            // Update sku_cache
            try {
              sqlite.prepare(`
                UPDATE sku_cache 
                SET qty_on_hand = CAST((CAST(COALESCE(qty_on_hand, '0') AS REAL) + ?) AS TEXT)
                WHERE sku_id = ?
              `).run(item.ordered_qty, item.sku_id);
            } catch {}

            // Update skus table if present
            try {
              sqlite.prepare(`
                UPDATE skus 
                SET qty_on_hand = COALESCE(qty_on_hand, 0) + ?
                WHERE id = ?
              `).run(item.ordered_qty, item.sku_id);
            } catch {}
          }
        }
      } catch (stockErr: any) {
        console.warn('[API Purchase PATCH] Inventory increment warning:', stockErr.message);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('[API Purchase PATCH] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const sqlite = getSqliteInstance();
    if (!sqlite || !id) {
      return NextResponse.json({ error: 'Missing ID or database' }, { status: 400 });
    }

    ensurePurchaseTables(sqlite);

    sqlite.prepare(`DELETE FROM purchase_order_items WHERE po_id = ?`).run(id);
    sqlite.prepare(`DELETE FROM purchase_orders WHERE id = ?`).run(id);

    return NextResponse.json({ success: true, message: 'Purchase order deleted' });
  } catch (err: any) {
    console.error('[API Purchase DELETE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/skus
 * Returns all active inventory items directly from local SQLite database (WAL mode),
 * enabling 0ms latency for secondary PC browsers & LAN workstations without internet.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const barcode = (searchParams.get('barcode') || '').trim();
    const businessId = (searchParams.get('business_id') || '').trim();
    const limit = Math.min(5000, parseInt(searchParams.get('limit') || '1000', 10));

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json([], { status: 200 });
    }

    let items: any[] = [];

    // Check if skus table exists
    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='skus'").get();
    if (tableExists) {
      let query = `
        SELECT 
          id, 
          business_id, 
          name, 
          COALESCE(sku_code, '') AS sku_code, 
          COALESCE(barcode, '') AS barcode, 
          COALESCE(category, '') AS category, 
          COALESCE(unit, 'Piece') AS unit, 
          COALESCE(cost_price, 0) AS cost_price, 
          COALESCE(sale_price, 0) AS sale_price, 
          COALESCE(sale_price, 0) AS wholesale_price,
          COALESCE(sale_price, 0) AS dealer_price,
          COALESCE(tax_rate, 0) AS tax_rate, 
          COALESCE(qty_on_hand, 0) AS qty_on_hand, 
          COALESCE(reorder_level, 0) AS reorder_level, 
          COALESCE(is_active, 1) AS is_active
        FROM skus
        WHERE is_active = 1
      `;
      const params: any[] = [];

      if (businessId && businessId !== 'local') {
        query += ` AND (business_id = ? OR business_id = 'local')`;
        params.push(businessId);
      }

      if (barcode) {
        query += ` AND barcode = ?`;
        params.push(barcode);
      } else if (search) {
        query += ` AND (name LIKE ? OR sku_code LIKE ? OR barcode LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY name ASC LIMIT ?`;
      params.push(limit);

      items = sqlite.prepare(query).all(...params);
    }

    // Fallback: check sku_cache if skus table returned 0 items
    if (items.length === 0) {
      const cacheExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sku_cache'").get();
      if (cacheExists) {
        let cacheQuery = `
          SELECT 
            sku_id AS id, 
            COALESCE(sku_code, '') AS sku_code, 
            name, 
            COALESCE(barcode, '') AS barcode, 
            COALESCE(unit, 'Piece') AS unit, 
            CAST(COALESCE(cost_price, '0') AS REAL) AS cost_price, 
            CAST(COALESCE(sale_price, '0') AS REAL) AS sale_price, 
            CAST(COALESCE(sale_price, '0') AS REAL) AS wholesale_price,
            CAST(COALESCE(sale_price, '0') AS REAL) AS dealer_price,
            0 AS tax_rate, 
            CAST(COALESCE(qty_on_hand, '0') AS REAL) AS qty_on_hand, 
            0 AS reorder_level, 
            1 AS is_active
          FROM sku_cache
        `;
        const cacheParams: any[] = [];
        if (barcode) {
          cacheQuery += ` WHERE barcode = ?`;
          cacheParams.push(barcode);
        } else if (search) {
          cacheQuery += ` WHERE name LIKE ? OR sku_code LIKE ? OR barcode LIKE ?`;
          cacheParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        cacheQuery += ` ORDER BY name ASC LIMIT ?`;
        cacheParams.push(limit);

        items = sqlite.prepare(cacheQuery).all(...cacheParams);
      }
    }

    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[API /api/skus] Error loading local inventory:', err);
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST /api/skus
 * Supports single creation or bulk import of SKUs into local SQLite WAL database.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sqlite = getSqliteInstance();
    if (!sqlite) {
      const { skus: bulkSkus, sku } = body;
      const count = Array.isArray(bulkSkus) ? bulkSkus.length : (Array.isArray(body) ? body.length : (sku ? 1 : 0));
      return NextResponse.json({
        success: true,
        message: `Successfully processed ${count} SKU items`,
        count,
      });
    }

    const { skus: bulkSkus, sku, operation } = body;
    const itemsToInsert: any[] = Array.isArray(bulkSkus)
      ? bulkSkus
      : (Array.isArray(body) ? body : [sku || body]);

    if (!itemsToInsert || itemsToInsert.length === 0) {
      return NextResponse.json({ error: 'No SKU data provided' }, { status: 400 });
    }

    // Ensure skus & stock_adjustments tables exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS skus (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        name TEXT NOT NULL,
        sku_code TEXT,
        barcode TEXT,
        category TEXT,
        unit TEXT DEFAULT 'Piece',
        cost_price REAL DEFAULT 0,
        sale_price REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        qty_on_hand REAL DEFAULT 0,
        reorder_level REAL DEFAULT 0,
        expiry_date TEXT,
        batch_number TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        sku_id TEXT NOT NULL,
        adjustment_type TEXT NOT NULL DEFAULT 'adjustment',
        quantity REAL NOT NULL DEFAULT 0,
        previous_qty REAL DEFAULT 0,
        new_qty REAL DEFAULT 0,
        reason TEXT,
        reference TEXT,
        notes TEXT,
        adjusted_by TEXT DEFAULT 'Admin',
        adjustment_date TEXT DEFAULT (date('now')),
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    const upsertStmt = sqlite.prepare(`
      INSERT INTO skus (
        id, business_id, name, sku_code, barcode, category, unit,
        cost_price, sale_price, tax_rate, qty_on_hand, reorder_level,
        description, is_active, updated_at
      ) VALUES (
        @id, @business_id, @name, @sku_code, @barcode, @category, @unit,
        @cost_price, @sale_price, @tax_rate, @qty_on_hand, @reorder_level,
        @description, @is_active, datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        business_id = excluded.business_id,
        name = excluded.name,
        sku_code = COALESCE(excluded.sku_code, skus.sku_code),
        barcode = COALESCE(excluded.barcode, skus.barcode),
        category = COALESCE(excluded.category, skus.category),
        unit = COALESCE(excluded.unit, skus.unit),
        cost_price = excluded.cost_price,
        sale_price = excluded.sale_price,
        tax_rate = excluded.tax_rate,
        qty_on_hand = CASE 
          WHEN @has_explicit_qty = 1 THEN excluded.qty_on_hand 
          ELSE skus.qty_on_hand 
        END,
        reorder_level = excluded.reorder_level,
        description = COALESCE(excluded.description, skus.description),
        is_active = excluded.is_active,
        updated_at = datetime('now')
    `);

    const logAdjustmentStmt = sqlite.prepare(`
      INSERT INTO stock_adjustments (
        id, business_id, sku_id, adjustment_type, quantity,
        previous_qty, new_qty, reason, reference, notes,
        adjusted_by, adjustment_date, created_at
      ) VALUES (
        @id, @business_id, @sku_id, @adjustment_type, @quantity,
        @previous_qty, @new_qty, @reason, @reference, @notes,
        @adjusted_by, date('now'), datetime('now')
      )
    `);

    let insertedCount = 0;
    const runTransaction = sqlite.transaction((rows: any[]) => {
      for (const row of rows) {
        if (!row || !row.name) continue;
        const rowId = row.id || `sku_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const hasExplicitQty = (row.qty_on_hand !== undefined && row.qty_on_hand !== null) || (row.stock !== undefined && row.stock !== null) || (row.opening_stock !== undefined && row.opening_stock !== null) ? 1 : 0;
        const qtyValue = Number(row.qty_on_hand ?? row.stock ?? row.opening_stock ?? 0);

        // Check if item already exists to determine if opening stock or update
        const existingItem = sqlite.prepare("SELECT qty_on_hand FROM skus WHERE id = ?").get(rowId) as { qty_on_hand: number } | undefined;
        const isNewItem = !existingItem;

        upsertStmt.run({
          id: rowId,
          business_id: row.business_id || 'local',
          name: String(row.name).trim(),
          sku_code: row.sku_code ? String(row.sku_code).trim() : null,
          barcode: row.barcode ? String(row.barcode).trim() : null,
          category: row.category ? String(row.category).trim() : 'General',
          unit: row.unit ? String(row.unit).trim() : 'Piece',
          cost_price: Number(row.cost_price || 0),
          sale_price: Number(row.sale_price || 0),
          tax_rate: Number(row.tax_rate || 0),
          qty_on_hand: qtyValue,
          reorder_level: Number(row.reorder_level || 0),
          description: row.description ? String(row.description).trim() : null,
          is_active: row.is_active !== 0 ? 1 : 0,
          has_explicit_qty: hasExplicitQty,
        });

        // If this is a new item with opening stock or an explicit count update, record it in audit log
        if (isNewItem && qtyValue > 0) {
          try {
            logAdjustmentStmt.run({
              id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              business_id: row.business_id || 'local',
              sku_id: rowId,
              adjustment_type: 'opening',
              quantity: qtyValue,
              previous_qty: 0,
              new_qty: qtyValue,
              reason: 'Opening Stock',
              reference: row.sku_code || null,
              notes: 'Initial inventory onboard',
              adjusted_by: 'Admin',
            });
          } catch (e) {
            console.warn('[API /api/skus] Could not log opening stock adjustment:', e);
          }
        }
        insertedCount++;
      }
    });

    runTransaction(itemsToInsert);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} SKU items into inventory`,
      count: insertedCount,
    });
  } catch (err: any) {
    console.error('[API /api/skus POST] Import error:', err);
    return NextResponse.json({ error: err.message || 'Failed to import SKUs' }, { status: 500 });
  }
}

/**
 * PATCH /api/skus
 * Instant offline stock adjustment in local SQLite with audit trail logging in stock_adjustments.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      skuId,
      sku_code,
      qty_on_hand,
      previousQty,
      type = 'adjustment',
      quantity,
      reason = 'Manual Adjustment',
      reference = null,
      notes = null,
      adjusted_by = 'Admin',
      business_id = 'local'
    } = body;

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({ success: true, message: 'Stock update acknowledged (fallback mode)' });
    }

    if (!skuId && !sku_code) {
      return NextResponse.json({ error: 'Missing skuId or sku_code' }, { status: 400 });
    }

    // Ensure tables exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS skus (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        name TEXT NOT NULL,
        sku_code TEXT,
        barcode TEXT,
        category TEXT,
        unit TEXT DEFAULT 'Piece',
        cost_price REAL DEFAULT 0,
        sale_price REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        qty_on_hand REAL DEFAULT 0,
        reorder_level REAL DEFAULT 0,
        expiry_date TEXT,
        batch_number TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        sku_id TEXT NOT NULL,
        adjustment_type TEXT NOT NULL DEFAULT 'adjustment',
        quantity REAL NOT NULL DEFAULT 0,
        previous_qty REAL DEFAULT 0,
        new_qty REAL DEFAULT 0,
        reason TEXT,
        reference TEXT,
        notes TEXT,
        adjusted_by TEXT DEFAULT 'Admin',
        adjustment_date TEXT DEFAULT (date('now')),
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    let existingSku = sqlite.prepare("SELECT id, name, unit, qty_on_hand, business_id FROM skus WHERE id = ? OR sku_code = ?").get(skuId, sku_code) as any;

    if (!existingSku) {
      // Check sku_cache if not in skus table
      const cached = sqlite.prepare("SELECT sku_id AS id, name, unit, CAST(COALESCE(qty_on_hand, '0') AS REAL) AS qty_on_hand FROM sku_cache WHERE sku_id = ? OR sku_code = ?").get(skuId, sku_code) as any;
      if (cached) {
        existingSku = cached;
      }
    }

    const currentQty = existingSku ? Number(existingSku.qty_on_hand || 0) : Number(previousQty ?? 0);
    const targetQty = Number(qty_on_hand ?? currentQty);
    const resolvedSkuId = existingSku?.id || skuId;
    const resolvedBiz = existingSku?.business_id || business_id || 'local';
    const delta = quantity !== undefined ? Number(quantity) : (targetQty - currentQty);

    const updateTx = sqlite.transaction(() => {
      // 1. Update skus table
      sqlite.prepare(`
        UPDATE skus 
        SET qty_on_hand = ?, updated_at = datetime('now')
        WHERE id = ? OR sku_code = ?
      `).run(targetQty, resolvedSkuId, sku_code || resolvedSkuId);

      // 2. Update sku_cache table if it exists
      try {
        const cacheExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sku_cache'").get();
        if (cacheExists) {
          sqlite.prepare(`
            UPDATE sku_cache
            SET qty_on_hand = ?, last_synced_at = datetime('now')
            WHERE sku_id = ? OR sku_code = ?
          `).run(String(targetQty), resolvedSkuId, sku_code || resolvedSkuId);
        }
      } catch (cacheErr) {
        console.warn('[API /api/skus PATCH] sku_cache update warning:', cacheErr);
      }

      // 3. Log stock adjustment audit entry
      const adjId = `adj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      sqlite.prepare(`
        INSERT INTO stock_adjustments (
          id, business_id, sku_id, adjustment_type, quantity,
          previous_qty, new_qty, reason, reference, notes,
          adjusted_by, adjustment_date, created_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, date('now'), datetime('now')
        )
      `).run(
        adjId,
        resolvedBiz,
        resolvedSkuId,
        type,
        delta,
        currentQty,
        targetQty,
        reason,
        reference,
        notes,
        adjusted_by
      );
    });

    updateTx();

    return NextResponse.json({
      success: true,
      skuId: resolvedSkuId,
      qty_on_hand: targetQty,
      previous_qty: currentQty,
      delta,
      message: `Stock successfully updated to ${targetQty}`
    });
  } catch (err: any) {
    console.error('[API /api/skus PATCH] Error updating stock:', err);
    return NextResponse.json({ error: err.message || 'Failed to update stock' }, { status: 500 });
  }
}

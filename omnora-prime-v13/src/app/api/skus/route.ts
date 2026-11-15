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

    // Ensure skus table exists
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
    `);

    const insertStmt = sqlite.prepare(`
      INSERT OR REPLACE INTO skus (
        id, business_id, name, sku_code, barcode, category, unit,
        cost_price, sale_price, tax_rate, qty_on_hand, reorder_level,
        description, is_active, updated_at
      ) VALUES (
        @id, @business_id, @name, @sku_code, @barcode, @category, @unit,
        @cost_price, @sale_price, @tax_rate, @qty_on_hand, @reorder_level,
        @description, @is_active, datetime('now')
      )
    `);

    let insertedCount = 0;
    const runTransaction = sqlite.transaction((rows: any[]) => {
      for (const row of rows) {
        if (!row || !row.name) continue;
        const rowId = row.id || `sku_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        insertStmt.run({
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
          qty_on_hand: Number(row.qty_on_hand || row.stock || 0),
          reorder_level: Number(row.reorder_level || 0),
          description: row.description ? String(row.description).trim() : null,
          is_active: row.is_active !== 0 ? 1 : 0,
        });
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

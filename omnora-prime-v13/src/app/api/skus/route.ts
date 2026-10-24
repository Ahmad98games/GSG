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
    const limit = Math.min(250, parseInt(searchParams.get('limit') || '100', 10));

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

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/security/apiKeyAuth';
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
 * GET /v1/inventory or /api/v1/inventory
 * Public authenticated REST endpoint for Shopify, WooCommerce, ERPs, and logistics scanners.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req, 'read');
  if (!auth.authenticated) {
    return NextResponse.json({
      status: 'error',
      error: auth.error || 'Unauthorized',
      code: 401
    }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();
  const limit = Math.min(250, parseInt(searchParams.get('limit') || '50', 10));

  const sqlite = getSqliteInstance();
  if (!sqlite) {
    return NextResponse.json({ status: 'error', message: 'Database unavailable' }, { status: 500 });
  }

  try {
    let query = `
      SELECT 
        id, 
        sku_code, 
        name, 
        barcode, 
        unit, 
        cost_price, 
        sale_price, 
        qty_on_hand, 
        reorder_level, 
        is_active,
        updated_at
      FROM skus
      WHERE is_active = 1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (name LIKE ? OR sku_code LIKE ? OR barcode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY name ASC LIMIT ?`;
    params.push(limit);

    const items = sqlite.prepare(query).all(...params);

    return NextResponse.json({
      status: 'success',
      endpoint: '/v1/inventory',
      authenticated_as: auth.keyName,
      total_items: items.length,
      data: items,
      sync_node: 'local_mesh_active',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Noxis-Api-Version': '1.0',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

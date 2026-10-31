import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { createCargoDispatch, updateCargoStatus } from '@/lib/cargo/cargoEngine';

export const dynamic = 'force-dynamic';

function getSqlite() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoice_id');
    const status = searchParams.get('status') || 'all';
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '100', 10));

    const sqlite = getSqlite();
    if (!sqlite) return NextResponse.json([], { status: 200 });

    let query = `SELECT * FROM cargo_dispatches WHERE 1=1`;
    const params: any[] = [];

    if (invoiceId) {
      query += ` AND invoice_id = ?`;
      params.push(invoiceId);
    }
    if (status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const dispatches = sqlite.prepare(query).all(...params);
    return NextResponse.json(dispatches, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createCargoDispatch(body);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }
    const result = updateCargoStatus(id, status);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { generateGatePass, verifyGatePass } from '@/lib/gatepass/gatePassEngine';

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
    const passNo = searchParams.get('gate_pass_no');
    const invoiceId = searchParams.get('invoice_id');
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '100', 10));

    const sqlite = getSqlite();
    if (!sqlite) return NextResponse.json([], { status: 200 });

    if (passNo) {
      const pass = sqlite.prepare('SELECT * FROM gate_passes WHERE gate_pass_no = ?').get(passNo);
      return NextResponse.json(pass || null, { status: 200 });
    }

    let query = 'SELECT * FROM gate_passes WHERE 1=1';
    const params: any[] = [];

    if (invoiceId) {
      query += ' AND invoice_id = ?';
      params.push(invoiceId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const passes = sqlite.prepare(query).all(...params);
    return NextResponse.json(passes, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = generateGatePass(body);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { gate_pass_no, verified_by } = body;
    if (!gate_pass_no) {
      return NextResponse.json({ error: 'gate_pass_no is required' }, { status: 400 });
    }

    const result = verifyGatePass(gate_pass_no, verified_by || 'Gate Guard');
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

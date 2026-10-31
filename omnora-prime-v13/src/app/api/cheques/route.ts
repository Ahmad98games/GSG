import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { recordCheque, markChequeCleared, markChequeBounced } from '@/lib/cheques/chequeEngine';

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
    const status = searchParams.get('status') || 'all';
    const partyId = searchParams.get('party_id');
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '100', 10));

    const sqlite = getSqlite();
    if (!sqlite) return NextResponse.json([], { status: 200 });

    let query = `SELECT * FROM cheque_transactions WHERE 1=1`;
    const params: any[] = [];

    if (status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (partyId) {
      query += ` AND party_id = ?`;
      params.push(partyId);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const cheques = sqlite.prepare(query).all(...params);
    return NextResponse.json(cheques, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'record', ...payload } = body;

    if (action === 'record') {
      const res = recordCheque(payload);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    if (action === 'clear') {
      const res = markChequeCleared(payload.chequeId, payload.businessId || 'local');
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    if (action === 'bounce') {
      const res = markChequeBounced({
        chequeId: payload.chequeId,
        businessId: payload.businessId || 'local',
        reason: payload.reason || 'Insufficient Funds (Khaate me raqam na thi)',
        penaltyFee: Number(payload.penaltyFee || 0),
      });
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

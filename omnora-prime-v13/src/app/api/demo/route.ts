import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { seedDemoDataToSqlite, clearDemoDataFromSqlite, DEMO_BUSINESS_ID } from '@/lib/demo/demoSeed';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({ isLoaded: false, count: 0 });
    }

    const row = sqlite.prepare('SELECT COUNT(*) as count FROM skus WHERE business_id = ?').get(DEMO_BUSINESS_ID);
    const count = row?.count || 0;
    return NextResponse.json({
      isLoaded: count > 0,
      count,
      businessId: DEMO_BUSINESS_ID,
    });
  } catch (err: any) {
    return NextResponse.json({ isLoaded: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;
    const sqlite = getSqliteInstance();

    if (!sqlite) {
      return NextResponse.json(
        { success: false, message: 'Local SQLite engine is offline or uninitialized' },
        { status: 500 }
      );
    }

    if (action === 'load') {
      const result = seedDemoDataToSqlite(sqlite);
      return NextResponse.json(result);
    } else if (action === 'clear') {
      const result = clearDemoDataFromSqlite(sqlite);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Supported: load, clear' },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal Demo Server Error' },
      { status: 500 }
    );
  }
}


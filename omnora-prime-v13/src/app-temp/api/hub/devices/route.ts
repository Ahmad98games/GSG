import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const devices = await db.select().from(schema.authorizedDevices);
    return NextResponse.json(devices);
  } catch (error) {
    console.error("Failed to fetch authorized devices:", error);
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}

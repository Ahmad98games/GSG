import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyUserSession } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hub/devices
 * Returns all non-revoked authorized devices from the local SQLite DB.
 * Used by Settings → Connected Devices page.
 */
export async function GET() {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const devices = await db
      .select()
      .from(schema.authorizedDevices)
      .where(eq(schema.authorizedDevices.isRevoked, 0));

    return NextResponse.json(devices);
  } catch (error: any) {
    console.error('[API] Failed to fetch authorized devices:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch devices', details: error.message },
      { status: 500 }
    );
  }
}

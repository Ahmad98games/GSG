import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyUserSession } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/hub/devices/unrevoke
 * Body: { nodeId: string }
 *
 * Removes a device from the blacklist / revoked state so it may re-pair.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { nodeId, deviceId } = body as {
      nodeId?: string;
      deviceId?: string;
    };

    const targetId = nodeId || deviceId;
    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json(
        { error: 'nodeId or deviceId is required' },
        { status: 400 }
      );
    }

    await db
      .update(schema.authorizedDevices)
      .set({
        isRevoked: 0,
        isActive: 0,
        lastSeen: new Date().toISOString(),
      })
      .where(eq(schema.authorizedDevices.nodeId, targetId));

    return NextResponse.json({
      success: true,
      unrevoked: targetId,
    });
  } catch (error: any) {
    console.error('[API] Failed to unrevoke device:', error.message);
    return NextResponse.json(
      { error: 'Failed to unrevoke device', details: error.message },
      { status: 500 }
    );
  }
}

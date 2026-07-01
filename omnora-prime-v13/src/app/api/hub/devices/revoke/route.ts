import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { disconnectDevice } from '@/lib/mobile-bridge/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/hub/devices/revoke
 * Body: { nodeId: string }
 *
 * 1. Marks the device as is_revoked=1 in authorized_devices
 * 2. Calls disconnectDevice() to close the live WebSocket immediately
 *
 * The device will need to re-pair (re-scan QR code) to reconnect.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nodeId, deviceId } = body as {
      nodeId?: string;
      deviceId?: string;
    };

    // Accept either nodeId or deviceId from the client
    const targetId = nodeId || deviceId;
    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json(
        { error: 'nodeId or deviceId is required' },
        { status: 400 }
      );
    }

    // 1. Mark as revoked in SQLite
    const result = await db
      .update(schema.authorizedDevices)
      .set({
        isRevoked: 1,
        isActive: 0,
        lastSeen: new Date().toISOString(),
      })
      .where(eq(schema.authorizedDevices.nodeId, targetId));

    // 2. Disconnect live WebSocket if connected
    const wasConnected = disconnectDevice(targetId);

    console.log(
      `[API] Device revoked: ${targetId} — was live: ${wasConnected}`
    );

    return NextResponse.json({
      success: true,
      revoked: targetId,
      wasConnected,
    });
  } catch (error: any) {
    console.error('[API] Device revoke failed:', error.message);
    return NextResponse.json(
      { error: 'Failed to revoke device', details: error.message },
      { status: 500 }
    );
  }
}

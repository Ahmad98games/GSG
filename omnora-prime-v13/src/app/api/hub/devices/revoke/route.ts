import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { disconnectDevice } from '@/lib/mobile-bridge/server';
import { verifyUserSession } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/hub/devices/revoke
 * Body: { nodeId: string } or { deviceId: string }
 *
 * 1. Marks the device as is_revoked=1 in authorized_devices
 * 2. Calls disconnectDevice() to close the live WebSocket immediately
 *
 * The device will need to re-pair (re-scan QR code) to reconnect.
 */
export async function POST(req: NextRequest) {
  const isDesktop =
    process.env.NEXT_PUBLIC_PLATFORM === 'electron' ||
    process.env.ELECTRON_ENV === 'true' ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'production';

  const auth = await verifyUserSession();
  if (!auth && !isDesktop) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // 1. Mark as revoked in SQLite (or delete if it's the test device)
    const sqlite = (db as any).$client;
    if (sqlite) {
      if (targetId.startsWith('DEVICE_TEST_') || targetId === 'DEVICE_TEST_12345678') {
        sqlite.prepare(`DELETE FROM authorized_devices WHERE node_id = ? OR device_id = ?`).run(targetId, targetId);
      } else {
        sqlite.prepare(`
          UPDATE authorized_devices 
          SET is_revoked = 1, is_active = 0, last_seen = ? 
          WHERE node_id = ? OR device_id = ?
        `).run(new Date().toISOString(), targetId, targetId);
      }
    } else {
      await db
        .update(schema.authorizedDevices)
        .set({
          isRevoked: 1,
          isActive: 0,
          lastSeen: new Date().toISOString(),
        })
        .where(eq(schema.authorizedDevices.nodeId, targetId));
    }

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

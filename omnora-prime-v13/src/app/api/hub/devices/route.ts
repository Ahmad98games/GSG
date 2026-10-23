import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyUserSession } from '@/lib/security/authHelpers';
import { getBridgeStatus, broadcastToHubRenderer } from '@/lib/mobile-bridge/server';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/hub/devices
 * Returns all non-revoked authorized devices from the local SQLite DB,
 * combined with any live WebSocket bridge devices.
 */
export async function GET() {
  const isDesktop =
    process.env.NEXT_PUBLIC_PLATFORM === 'electron' ||
    process.env.ELECTRON_ENV === 'true' ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'production';

  const auth = await verifyUserSession();
  if (!auth && !isDesktop) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let devices: any[] = [];
  try {
    devices = await db
      .select()
      .from(schema.authorizedDevices)
      .where(eq(schema.authorizedDevices.isRevoked, 0));
  } catch (err: any) {
    // Fallback to direct SQLite
    const sqlite = getSqliteInstance();
    if (sqlite) {
      try {
        devices = sqlite.prepare('SELECT * FROM authorized_devices WHERE is_revoked = 0').all();
      } catch {}
    }
  }

  // Merge with live bridge connections to accurately reflect real-time online status
  let liveDeviceIds = new Set<string>();
  try {
    const bridgeStatus = getBridgeStatus();
    if (bridgeStatus && Array.isArray(bridgeStatus.pairedDevices)) {
      for (const live of bridgeStatus.pairedDevices) {
        if (live.deviceId) liveDeviceIds.add(live.deviceId);
        const found = devices.find(d => (d.deviceId || d.nodeId) === live.deviceId);
        if (!found) {
          devices.push({
            nodeId: live.deviceId,
            deviceId: live.deviceId,
            label: live.deviceLabel || 'Live Workstation Node',
            deviceLabel: live.deviceLabel || 'Live Workstation Node',
            isActive: 1,
            isLive: true,
            isRevoked: 0,
            lastSeen: live.lastHeartbeat,
            createdAt: live.connectedAt,
          });
        }
      }
    }
  } catch {}

  const result = devices.map(d => {
    const id = d.deviceId || d.nodeId;
    const isLive = liveDeviceIds.has(id);
    return {
      ...d,
      nodeId: d.nodeId || id,
      deviceId: id,
      label: d.label || d.deviceLabel || (isLive ? 'Active Workstation' : 'Offline Terminal'),
      deviceLabel: d.deviceLabel || d.label || (isLive ? 'Active Workstation' : 'Offline Terminal'),
      isActive: isLive ? 1 : 0,
      isLive,
    };
  });

  return NextResponse.json(result);
}

/**
 * DELETE /api/hub/devices
 * Clears all registered/stale device records from local storage.
 */
export async function DELETE() {
  try {
    const sqlite = getSqliteInstance();
    if (sqlite) {
      sqlite.prepare('DELETE FROM authorized_devices').run();
    } else {
      await db.delete(schema.authorizedDevices);
    }
    return NextResponse.json({ success: true, message: 'All device profiles cleared.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/hub/devices
 * Allows mobile handheld to pair or register via REST endpoint.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawDeviceId = String(body.deviceId || body.id || `dev-${Date.now()}`);
    const rawLabel = String(body.deviceLabel || body.label || 'Mobile Device').slice(0, 80);

    const sqlite = getSqliteInstance();
    if (sqlite) {
      try {
        sqlite.prepare(`
          INSERT INTO authorized_devices (node_id, mesh_key, label, is_active, business_id, device_id, device_label, last_seen, is_revoked, created_at)
          VALUES (?, '', ?, 1, 'local', ?, ?, datetime('now'), 0, datetime('now'))
          ON CONFLICT(node_id) DO UPDATE SET
            device_label = excluded.device_label,
            label = excluded.label,
            last_seen = excluded.last_seen,
            is_active = 1,
            is_revoked = 0
        `).run(rawDeviceId, rawLabel, rawDeviceId, rawLabel);
      } catch (dbErr: any) {
        console.warn('[API/devices] SQLite upsert warning:', dbErr.message);
      }
    } else {
      try {
        await db
          .insert(schema.authorizedDevices)
          .values({
            nodeId: rawDeviceId,
            meshKey: '',
            label: rawLabel,
            isActive: 1,
            businessId: 'local',
            deviceId: rawDeviceId,
            deviceLabel: rawLabel,
            lastSeen: new Date().toISOString(),
            isRevoked: 0,
          })
          .onConflictDoUpdate({
            target: schema.authorizedDevices.nodeId,
            set: {
              deviceLabel: rawLabel,
              label: rawLabel,
              lastSeen: new Date().toISOString(),
              isActive: 1,
              isRevoked: 0,
            },
          });
      } catch {}
    }

    try {
      broadcastToHubRenderer('DEVICE_COUNT_CHANGED', getBridgeStatus());
      broadcastToHubRenderer('DEVICE_PAIRED', { deviceId: rawDeviceId, deviceLabel: rawLabel });
    } catch {}

    return NextResponse.json({
      success: true,
      status: 'paired',
      deviceId: rawDeviceId,
      deviceLabel: rawLabel,
      hubVersion: '14.0.0',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

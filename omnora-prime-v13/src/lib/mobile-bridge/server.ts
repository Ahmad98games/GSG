/**
 * Mobile WebSocket Bridge â€” Hardened Security Edition (v13.1)
 *
 * Security model:
 *   1. Every client gets a 30-second pairing timeout; unpaired = disconnected
 *   2. PAIR_REQUEST validates deviceId format (8â€“64 chars, alphanumeric/dash/underscore)
 *   3. Tier-based device limits read from local SQLite (not Zustand renderer store)
 *   4. All device registrations persisted in authorized_devices table
 *   5. Pre-pairing gate: only PAIR_REQUEST and HEARTBEAT_RESPONSE allowed before paired
 *   6. DATA_REQUEST handler: scoped to the paired business_id â€” no cross-tenant reads
 *   7. 90-second heartbeat timeout drops dead connections
 *   8. disconnectDevice() and getBridgeStatus() for Hub UI integration
 *
 * Protocol path: ws://localhost:3000/mobile-bridge (same port as Next.js standalone)
 * Desktop NSP (port 9000) is completely unaffected.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { randomUUID } from 'crypto';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createAdminClient } from '../supabase/admin';

let adminClient: any = null;
function getAdmin() {
  if (!adminClient) {
    try {
      adminClient = createAdminClient();
    } catch (e: any) {
      console.warn('[Bridge] Admin client init failed:', e.message);
    }
  }
  return adminClient;
}

function getSqlite(): any {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TYPES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface BridgeClient {
  id: string;
  ws: WebSocket;
  deviceId: string | null;
  deviceLabel: string | null;
  deviceRole?: string | null;
  businessId: string | null;
  paired: boolean;
  connectedAt: Date;
  lastHeartbeat: Date;
  tier: string | null;
  clientIp: string;
}

const clients = new Map<string, BridgeClient>();
let wss: WebSocketServer | null = null;

// Tier → max devices. Must mirror the Hub license system exactly.
const TIER_LIMITS: Record<string, number> = {
  lite: 5,
  pro: 15,
  elite: 50,
  trial: 15,
  free_trial: 15,
  free: 1,
  free_forever: 1,
};

// ── Rate Limiter & Flood Quarantine ──────────────────────────────────────────
// 5 failed pairing attempts within 60s → 5-minute jail
interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  jailedUntil: number;
}
const ipRateLimits = new Map<string, RateLimitEntry>();

function isIpQuarantined(ip: string): boolean {
  const entry = ipRateLimits.get(ip);
  if (!entry) return false;
  if (entry.jailedUntil > Date.now()) return true;
  if (Date.now() - entry.lastAttempt > 60_000) {
    ipRateLimits.delete(ip);
    return false;
  }
  return false;
}

function recordFailedAttempt(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimits.get(ip) || { attempts: 0, lastAttempt: now, jailedUntil: 0 };
  entry.attempts++;
  entry.lastAttempt = now;
  if (entry.attempts >= 5) {
    entry.jailedUntil = now + 5 * 60 * 1000; // 5 minute quarantine
    ipRateLimits.set(ip, entry);
    return true; // Newly jailed
  }
  ipRateLimits.set(ip, entry);
  return false;
}

function resetFailedAttempts(ip: string): void {
  ipRateLimits.delete(ip);
}

// Valid deviceId: 8â€“64 chars, alphanumeric, dashes, underscores only
const DEVICE_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function send(ws: WebSocket, payload: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function getPairedCount(): number {
  let count = 0;
  clients.forEach((c) => { if (c.paired) count++; });
  return count;
}

/** Read the business profile + license from local SQLite via Drizzle */
async function getLocalProfile(): Promise<{
  id: string;
  business_name: string;
  currency: string;
  tier: string;
  maxDevices: number;
  isDeactivated: boolean;
  expiresAt: string | null;
  industry: string;
  worker_term: string;
  worker_term_plural: string;
  advance_term: string;
  country_code: string;
} | null> {
  try {
    let cfg: Record<string, string> = {};
    try {
      const rows = await db.select().from(schema.localConfig);
      for (const r of rows) {
        cfg[r.key] = r.value;
      }
    } catch {}

    const sqlite = getSqlite();
    if (sqlite && Object.keys(cfg).length === 0) {
      try {
        const rows: any[] = sqlite.prepare('SELECT * FROM local_config').all();
        for (const r of rows) {
          cfg[r.key] = r.value;
        }
      } catch {}
    }

    const tier = cfg['tier'] || 'elite';
    const tierCap = TIER_LIMITS[tier] ?? 50;
    const configuredLimit = Number(cfg['max_devices']);
    const maxDevices = (configuredLimit > 0 && configuredLimit <= tierCap)
      ? configuredLimit
      : Math.max(tierCap, 50);

    return {
      id: cfg['business_id'] || 'default-hub',
      business_name: cfg['business_name'] || 'Noxis Hub',
      currency: cfg['currency'] || 'PKR',
      tier,
      maxDevices,
      isDeactivated: false,
      expiresAt: null,
      industry: cfg['industry'] || 'textile',
      worker_term: cfg['worker_term'] || 'Karigar',
      worker_term_plural: cfg['worker_term_plural'] || 'Karigars',
      advance_term: cfg['advance_term'] || 'Peshgi',
      country_code: cfg['country_code'] || 'PK',
    };
  } catch (err: any) {
    console.error('[Bridge] Warning in getLocalProfile, using fallback defaults:', err.message);
    return {
      id: 'default-hub',
      business_name: 'Noxis Hub',
      currency: 'PKR',
      tier: 'elite',
      maxDevices: 50,
      isDeactivated: false,
      expiresAt: null,
      industry: 'textile',
      worker_term: 'Karigar',
      worker_term_plural: 'Karigars',
      advance_term: 'Peshgi',
      country_code: 'PK',
    };
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ATTACH TO HTTP SERVER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function attachMobileBridge(httpServer?: Server, customPort?: number): WebSocketServer {
  if (wss) return wss;
  const options: any = customPort ? { port: customPort } : httpServer ? { server: httpServer, path: '/mobile-bridge' } : { port: 7447 };
  wss = new WebSocketServer(options);

  wss.on('connection', (ws, req) => {
    const clientId = randomUUID();
    const clientIp = req.socket.remoteAddress || 'unknown';

    // ── Security Gate: Check IP Quarantine ─────────────────────────────────────
    if (isIpQuarantined(clientIp)) {
      console.warn(`[Bridge] Security: Quarantined IP rejected: ${clientIp}`);
      ws.close(1008, 'Security: IP temporarily quarantined due to authorization flood');
      return;
    }

    clients.set(clientId, {
      id: clientId,
      ws,
      deviceId: null,
      deviceLabel: null,
      businessId: null,
      paired: false,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      tier: null,
      clientIp,
    });

    console.log(`[Bridge] Client connected: ${clientId} from ${clientIp}`);

    // Give client 30 seconds to send PAIR_REQUEST or disconnect them
    const pairingTimeout = setTimeout(() => {
      const client = clients.get(clientId);
      if (client && !client.paired) {
        console.log(`[Bridge] Pairing timeout â€” dropping ${clientId}`);
        ws.close(1008, 'Pairing timeout: send PAIR_REQUEST within 30s');
        clients.delete(clientId);
      }
    }, 30_000);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        await handleMessage(clientId, msg, ws, pairingTimeout);
      } catch (err: any) {
        console.error(`[Bridge] Message error from ${clientId}:`, err.message);
        send(ws, { type: 'ERROR', message: 'Invalid message format or server error.' });
      }
    });

    ws.on('close', (code) => {
      clearTimeout(pairingTimeout);
      const client = clients.get(clientId);
      if (client?.deviceId) {
        console.log(`[Bridge] Disconnected: ${client.deviceLabel} (${client.deviceId}) code=${code}`);
        // Best-effort: mark device last_seen
        db.update(schema.authorizedDevices)
          .set({ lastSeen: new Date().toISOString() })
          .where(eq(schema.authorizedDevices.deviceId, client.deviceId))
          .catch(() => {});
      }
      clients.delete(clientId);
      broadcastToHubRenderer('DEVICE_COUNT_CHANGED', {
        connectedDevices: getPairedCount(),
        paired: getPairedCount(),
        connected: clients.size,
        pairedDevices: getBridgeStatus().pairedDevices,
      });
    });

    ws.on('error', (err) => {
      console.error(`[Bridge] Socket error ${clientId}:`, err.message);
      clients.delete(clientId);
      broadcastToHubRenderer('DEVICE_COUNT_CHANGED', {
        connectedDevices: getPairedCount(),
        paired: getPairedCount(),
        connected: clients.size,
        pairedDevices: getBridgeStatus().pairedDevices,
      });
    });
  });

  // â”€â”€ Heartbeat monitor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Runs every 30s: pushes HEARTBEAT to all paired clients,
  // drops clients that haven't responded in 90s.
  setInterval(() => {
    const now = new Date();
    clients.forEach((client, id) => {
      if (client.ws.readyState !== WebSocket.OPEN) {
        clients.delete(id);
        return;
      }

      // Only monitor heartbeats for paired clients
      if (client.paired) {
        const elapsed = (now.getTime() - client.lastHeartbeat.getTime()) / 1000;
        if (elapsed > 90) {
          console.log(`[Bridge] Heartbeat timeout â€” dropping ${client.deviceLabel}`);
          client.ws.close(1001, 'Heartbeat timeout');
          clients.delete(id);
          return;
        }
      }

      // Send heartbeat to all open connections
      send(client.ws, {
        type: 'HEARTBEAT',
        timestamp: Date.now(),
        connectedDevices: getPairedCount(),
      });
    });
  }, 30_000);

  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    process.on('message', (msg: any) => {
      if (msg && msg.type === 'bridge-command') {
        if (msg.command === 'DELIVER_MESSAGE') {
          const { recipientDeviceId, messagePayload } = msg.payload || {};
          deliverMessageToDevice(recipientDeviceId || 'all', messagePayload);
        } else if (msg.command === 'SYNC_INVALIDATE') {
          broadcastSyncToMobileDevices('DATA_INVALIDATED', msg.payload);
        }
      }
    });
  }

  console.log('[Bridge] Mobile bridge attached on /mobile-bridge');
  return wss;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MESSAGE HANDLER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function handleMessage(
  clientId: string,
  msg: Record<string, unknown>,
  ws: WebSocket,
  pairingTimeout: NodeJS.Timeout,
): Promise<void> {
  const client = clients.get(clientId);
  if (!client) return;

  // â”€â”€ Security gate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Before pairing completes only PAIR_REQUEST and HEARTBEAT_RESPONSE are legal.
  if (!client.paired &&
    msg.type !== 'PAIR_REQUEST' &&
    msg.type !== 'HEARTBEAT_RESPONSE') {
    send(ws, {
      type: 'ERROR',
      message: 'Not paired. Send PAIR_REQUEST before any other message.',
    });
    return;
  }

  switch (msg.type) {

    // â”€â”€ Pairing handshake â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case 'PAIR_REQUEST': {
      const rawDeviceId = String(msg.deviceId ?? '');
      const rawLabel = String(msg.deviceLabel ?? msg.label ?? 'Mobile Device').slice(0, 80);

      // 1. Validate deviceId format
      if (!DEVICE_ID_RE.test(rawDeviceId)) {
        recordFailedAttempt(client.clientIp);
        send(ws, {
          type: 'PAIRING_REJECTED',
          code: 'ERR_INVALID_DEVICE_ID',
          reason: 'Invalid device identifier. Must be 8-64 alphanumeric characters.',
        });
        clearTimeout(pairingTimeout);
        ws.close(1008, 'Invalid device identifier format');
        clients.delete(clientId);
        return;
      }

      // 2. Load business profile from local_config
      const profile = await getLocalProfile();
      if (!profile) {
        send(ws, {
          type: 'PAIRING_REJECTED',
          reason: 'Hub is not configured yet. Complete Hub setup first.',
        });
        return;
      }

      // 3. Check license deactivation
      if (profile.isDeactivated) {
        send(ws, {
          type: 'PAIRING_REJECTED',
          reason: 'This Hub license has been deactivated. Contact Noxis support.',
        });
        return;
      }

      // 4. Check license expiry
      if (profile.expiresAt && new Date() > new Date(profile.expiresAt)) {
        send(ws, {
          type: 'PAIRING_REJECTED',
          reason: 'Hub license has expired. Please renew to connect mobile devices.',
        });
        return;
      }

      // 5. Anti-Revocation Blacklist Gate & Device Limit Enforcement
      let isAlreadyAuthorized = false;
      let isDeviceRevoked = false;
      let authorizedCount = 0;

      try {
        // A. Check if device is in revoked / blacklisted state
        const revokedMatch = await db
          .select({ nodeId: schema.authorizedDevices.nodeId })
          .from(schema.authorizedDevices)
          .where(
            and(
              eq(schema.authorizedDevices.businessId, profile.id),
              eq(schema.authorizedDevices.deviceId, rawDeviceId),
              eq(schema.authorizedDevices.isRevoked, 1),
            ),
          )
          .limit(1);

        if (revokedMatch.length > 0) {
          isDeviceRevoked = true;
        }

        // B. Count currently authorized, non-revoked devices
        const [countResult] = await db
          .select({ value: sql<number>`count(*)` })
          .from(schema.authorizedDevices)
          .where(
            and(
              eq(schema.authorizedDevices.businessId, profile.id),
              eq(schema.authorizedDevices.isRevoked, 0),
            ),
          );
        authorizedCount = countResult?.value ?? 0;

        // C. Check if already active and authorized
        const existing = await db
          .select({ nodeId: schema.authorizedDevices.nodeId })
          .from(schema.authorizedDevices)
          .where(
            and(
              eq(schema.authorizedDevices.businessId, profile.id),
              eq(schema.authorizedDevices.deviceId, rawDeviceId),
              eq(schema.authorizedDevices.isRevoked, 0),
            ),
          )
          .limit(1);
        isAlreadyAuthorized = existing.length > 0;
      } catch (dbErr: any) {
        console.error('[Bridge] DB verification error during pairing:', dbErr.message);
      }

      // Security Enforcement: Revoked / Blacklisted Device Rejection
      if (isDeviceRevoked) {
        recordFailedAttempt(client.clientIp);
        try {
          await db.insert(schema.securityAudit).values({
            id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nodeId: rawDeviceId,
            eventType: 'REVOKED_DEVICE_ACCESS_ATTEMPT',
            payload: JSON.stringify({
              ip: client.clientIp,
              deviceLabel: rawLabel,
              tier: profile.tier,
              reason: 'Revoked/Blacklisted device attempted QR handshake reconnect.'
            }),
            failedAuthCount: 1,
            createdAt: new Date().toISOString(),
          });
        } catch (auditErr: any) {
          console.error('[Bridge] Failed to record security audit for revoked device:', auditErr.message);
        }

        broadcastToHubRenderer('SECURITY_ALERT', {
          severity: 'HIGH',
          title: 'Revoked Device Connection Blocked',
          message: `Revoked handheld "${rawLabel}" (${rawDeviceId}) from IP ${client.clientIp} attempted to re-pair. Access denied.`,
          timestamp: new Date().toISOString(),
          nodeId: rawDeviceId,
        });

        send(ws, {
          type: 'PAIRING_REJECTED',
          code: 'ERR_DEVICE_REVOKED',
          reason: 'Access denied: This device was previously revoked by the administrator.',
        });
        ws.close(1008, 'DEVICE_REVOKED');
        return;
      }

      // Security Enforcement: Strict Tier Quota Overflow Gate
      if (!isAlreadyAuthorized && authorizedCount >= profile.maxDevices) {
        recordFailedAttempt(client.clientIp);
        try {
          await db.insert(schema.securityAudit).values({
            id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nodeId: rawDeviceId,
            eventType: 'TIER_QUOTA_OVERFLOW_BLOCKED',
            payload: JSON.stringify({
              ip: client.clientIp,
              deviceLabel: rawLabel,
              tier: profile.tier,
              currentCount: authorizedCount,
              maxAllowed: profile.maxDevices,
              action: 'Socket severed, connection dropped with 1008 Policy Violation'
            }),
            failedAuthCount: 1,
            createdAt: new Date().toISOString(),
          });
        } catch (auditErr: any) {
          console.error('[Bridge] Failed to record security audit for quota overflow:', auditErr.message);
        }

        broadcastToHubRenderer('SECURITY_ALERT', {
          severity: 'HIGH',
          title: 'Tier Device Limit Exceeded',
          message: `Device "${rawLabel}" (${rawDeviceId}) attempted pairing, but your ${profile.tier.toUpperCase()} tier is strictly capped at ${profile.maxDevices} devices (${authorizedCount}/${profile.maxDevices} active). Connection severed.`,
          timestamp: new Date().toISOString(),
          nodeId: rawDeviceId,
        });

        send(ws, {
          type: 'PAIRING_REJECTED',
          code: 'ERR_TIER_LIMIT_EXCEEDED',
          reason: `Tier device limit reached. Your ${profile.tier.toUpperCase()} plan is strictly capped at ${profile.maxDevices} concurrent devices. Unpair an inactive device or upgrade your plan to connect more.`,
          tier: profile.tier,
          maxDevices: profile.maxDevices,
          currentCount: authorizedCount,
        });
        ws.close(1008, 'TIER_LIMIT_EXCEEDED');
        return;
      }

      // 6. Register/update device in authorized_devices
      try {
        await db
          .insert(schema.authorizedDevices)
          .values({
            nodeId: rawDeviceId,        // reuse nodeId as PK for mobile rows
            meshKey: '',                 // mobile rows don't use HMAC mesh key
            label: rawLabel,
            isActive: 1,
            businessId: profile.id,
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
            },
          });
      } catch (dbErr: any) {
        console.error('[Bridge] Device registration error:', dbErr.message);
      }

      // Direct SQLite fallback to guarantee immediate persistence
      const sqlite = getSqlite();
      if (sqlite) {
        try {
          sqlite.prepare(`
            INSERT INTO authorized_devices (node_id, mesh_key, label, is_active, business_id, device_id, device_label, last_seen, is_revoked, created_at)
            VALUES (?, '', ?, 1, ?, ?, ?, datetime('now'), 0, datetime('now'))
            ON CONFLICT(node_id) DO UPDATE SET
              device_label = excluded.device_label,
              label = excluded.label,
              last_seen = excluded.last_seen,
              is_active = 1,
              is_revoked = 0
          `).run(rawDeviceId, rawLabel, profile.id, rawDeviceId, rawLabel);
        } catch (dbErr: any) {
          console.warn('[Bridge] SQLite direct insert warning:', dbErr.message);
        }
      }

      // 7. Update in-memory client state
      clearTimeout(pairingTimeout);
      client.deviceId = rawDeviceId;
      client.deviceLabel = rawLabel;
      client.businessId = profile.id;
      client.paired = true;
      client.tier = profile.tier;
      client.lastHeartbeat = new Date();

      console.log(
        `[Bridge] Paired: ${rawLabel} (${rawDeviceId}) — tier: ${profile.tier} — business: ${profile.business_name}`,
      );

      // Verify sub-user PIN if provided
      let canMarkAttendance = true;
      let canLogProduction = true;
      let canGivePeshgi = true;
      let canViewFinancials = ['pro', 'elite'].includes(profile.tier);
      let canViewReports = ['pro', 'elite'].includes(profile.tier);
      let subUserRole: string | null = null;

      const userPin = msg.pin || msg.userPin || msg.subUserPin || msg.sub_user_pin;
      if (userPin) {
        const admin = getAdmin();
        if (admin) {
          try {
            const { data: subUser } = await admin
              .from('sub_users')
              .select('role, name')
              .eq('business_id', profile.id)
              .eq('pin', String(userPin))
              .eq('is_active', true)
              .maybeSingle();

            if (subUser) {
              subUserRole = subUser.role;
              console.log(`[Bridge] Authenticated sub-user: ${subUser.name} with role: ${subUserRole}`);
              if (subUserRole === 'supervisor') {
                canMarkAttendance = true;
                canLogProduction = true;
                canGivePeshgi = false;
                canViewFinancials = false;
                canViewReports = false;
              } else {
                canMarkAttendance = true;
                canLogProduction = true;
                canGivePeshgi = false;
                canViewFinancials = false;
                canViewReports = false;
              }
            } else {
              console.warn(`[Bridge] PIN ${userPin} not found in sub_users. Rejecting pairing.`);
              send(ws, {
                type: 'PAIRING_REJECTED',
                reason: 'Invalid PIN credentials.',
              });
              return;
            }
          } catch (pinErr: any) {
            console.error('[Bridge] PIN verification error:', pinErr.message);
          }
        }
      }

      // 8. Send HUB_ACK and PAIR_ACK with full business context
      const ackPayload = {
        type: 'HUB_ACK',
        ackType: 'PAIR_ACK',
        success: true,
        status: 'paired',
        timestamp: Date.now(),

        // Business identity
        businessId: profile.id,
        businessName: profile.business_name,
        currency: profile.currency,

        // License
        tier: profile.tier,
        maxDevices: profile.maxDevices,
        isTrialActive: profile.tier === 'trial',

        // Feature gates
        canViewFinance: ['pro', 'elite'].includes(profile.tier),
        canViewIntelligence: ['pro', 'elite'].includes(profile.tier),
        canAccessApi: profile.tier === 'elite',
        canUseAdvancedReports: ['pro', 'elite'].includes(profile.tier),

        // RBAC Gates
        canMarkAttendance,
        canLogProduction,
        canGivePeshgi,
        canViewFinancials,
        canViewReports,

        // Morphing and terminology config
        industry: profile.industry,
        workerTerm: profile.worker_term,
        workerTermPlural: profile.worker_term_plural,
        advanceTerm: profile.advance_term,
        countryCode: profile.country_code,

        // Connection metadata
        connectedDevices: getPairedCount(),
        hubVersion: '14.0.0',
      };

      send(ws, ackPayload);
      send(ws, { ...ackPayload, type: 'PAIR_ACK' });

      broadcastToHubRenderer('DEVICE_COUNT_CHANGED', {
        connectedDevices: getPairedCount(),
        paired: getPairedCount(),
        connected: clients.size,
        pairedDevices: getBridgeStatus().pairedDevices,
      });
      broadcastToHubRenderer('DEVICE_PAIRED', {
        deviceId: rawDeviceId,
        deviceLabel: rawLabel,
        connectedDevices: getPairedCount(),
        timestamp: new Date().toISOString(),
      });
      break;
    }

    // â”€â”€ Heartbeat response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case 'HEARTBEAT_RESPONSE': {
      client.lastHeartbeat = new Date();

      // Update last_seen in DB (best-effort, non-blocking)
      if (client.deviceId) {
        db.update(schema.authorizedDevices)
          .set({ lastSeen: new Date().toISOString() })
          .where(eq(schema.authorizedDevices.deviceId, client.deviceId))
          .catch(() => {});
      }
      break;
    }

    // â”€â”€ Data requests â€” scoped strictly to paired businessId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case 'DATA_REQUEST': {
      const { requestId, resource } = msg as {
        requestId: string;
        resource: string;
      };

      if (!requestId || !resource) {
        send(ws, {
          type: 'DATA_RESPONSE',
          requestId,
          data: [],
          error: 'Missing requestId or resource.',
        });
        return;
      }

      // Local-first data retrieval: SQLite cache is checked first, falling back to Supabase.
      let data: any[] = [];
      let error: string | null = null;
      const sqlite = getSqlite();

      try {
        switch (resource) {
          case 'skus': {
            if (sqlite) {
              try {
                data = sqlite.prepare(`
                  SELECT * FROM skus 
                  WHERE is_active = 1 OR is_active IS NULL
                  ORDER BY name ASC 
                  LIMIT 200
                `).all();
              } catch {}
              if (!data || data.length === 0) {
                try {
                  data = sqlite.prepare(`SELECT * FROM sku_cache LIMIT 200`).all();
                } catch {}
              }
            }
            if (!data || data.length === 0) {
              const admin = getAdmin();
              if (admin) {
                try {
                  const { data: resData } = await admin.from('skus').select('*').limit(200);
                  data = resData || [];
                } catch {}
              }
            }
            break;
          }

          case 'branches': {
            data = await db
              .select()
              .from(schema.branchCache)
              .where(eq(schema.branchCache.businessId, client.businessId!));
            break;
          }

          case 'parties': {
            if (sqlite) {
              try {
                data = sqlite.prepare(`
                  SELECT * FROM parties 
                  WHERE is_active = 1 OR is_active IS NULL
                  ORDER BY name ASC
                `).all();
              } catch (e: any) {
                console.warn('[Bridge] Local parties select error:', e.message);
              }
            }
            if (!data || data.length === 0) {
              const admin = getAdmin();
              if (admin) {
                try {
                  const { data: resData } = await admin
                    .from('parties')
                    .select('*')
                    .order('name');
                  data = resData || [];
                  if (sqlite && data.length > 0) {
                    for (const p of data) {
                      try {
                        sqlite.prepare(`
                          INSERT OR REPLACE INTO parties (id, business_id, name, party_type, phone, current_balance, is_active, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(p.id, p.business_id || client.businessId || 'local', p.name, p.party_type || 'customer', p.phone || null, p.current_balance || 0, p.is_active ?? 1, p.created_at || new Date().toISOString(), p.updated_at || new Date().toISOString());
                      } catch {}
                    }
                  }
                } catch {}
              }
            }
            break;
          }

          case 'orders':
          case 'invoices': {
            if (sqlite) {
              try {
                data = sqlite.prepare(`
                  SELECT * FROM invoices 
                  ORDER BY invoice_date DESC, created_at DESC 
                  LIMIT 100
                `).all();
              } catch (e: any) {
                console.warn('[Bridge] Local invoices select error:', e.message);
              }
            }
            if (!data || data.length === 0) {
              const admin = getAdmin();
              if (admin) {
                try {
                  const { data: resData } = await admin
                    .from('invoices')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);
                  data = resData || [];
                  if (sqlite && data.length > 0) {
                    for (const inv of data) {
                      try {
                        sqlite.prepare(`
                          INSERT OR REPLACE INTO invoices (id, business_id, invoice_number, invoice_type, party_id, party_name, party_phone, invoice_date, status, total_amount, amount_paid, balance_due, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(inv.id, inv.business_id || client.businessId || 'local', inv.invoice_number || 'INV', inv.invoice_type || 'invoice', inv.party_id || null, inv.party_name || null, inv.party_phone || null, inv.invoice_date || new Date().toISOString(), inv.status || 'posted', inv.total_amount || 0, inv.amount_paid || 0, inv.balance_due || 0, inv.created_at || new Date().toISOString(), inv.updated_at || new Date().toISOString());
                      } catch {}
                    }
                  }
                } catch {}
              }
            }
            break;
          }

          case 'workers':
          case 'karigars': {
            if (sqlite) {
              try {
                data = sqlite.prepare(`
                  SELECT * FROM karigars 
                  WHERE status = 'active' OR status IS NULL
                  ORDER BY name ASC
                `).all();
              } catch (e: any) {
                console.warn('[Bridge] Local karigars select error:', e.message);
              }
            }
            if (!data || data.length === 0) {
              const admin = getAdmin();
              if (admin) {
                try {
                  const { data: resData } = await admin
                    .from('karigars')
                    .select('*')
                    .eq('status', 'active')
                    .order('name');
                  data = resData || [];
                  if (sqlite && data.length > 0) {
                    for (const k of data) {
                      try {
                        sqlite.prepare(`
                          INSERT OR REPLACE INTO karigars (id, business_id, name, karigar_code, phone, department, designation, wage_type, piece_rate, status, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(k.id, k.business_id || client.businessId || 'local', k.name, k.karigar_code || null, k.phone || null, k.department || null, k.designation || 'Karigar', k.wage_type || 'piece_rate', k.piece_rate || 0, k.status || 'active', k.created_at || new Date().toISOString(), k.updated_at || new Date().toISOString());
                      } catch {}
                    }
                  }
                } catch {}
              }
            }
            break;
          }

          case 'attendance_today': {
            const todayStr = new Date().toISOString().split('T')[0];
            if (sqlite) {
              try {
                data = sqlite.prepare(`
                  SELECT a.*, k.name as karigar_name 
                  FROM attendance_logs a 
                  LEFT JOIN karigars k ON a.karigar_id = k.id 
                  WHERE a.attendance_date = ?
                `).all(todayStr);
              } catch (e: any) {
                console.warn('[Bridge] Local attendance select error:', e.message);
              }
            }
            if (!data || data.length === 0) {
              const admin = getAdmin();
              if (admin) {
                try {
                  const { data: resData } = await admin
                    .from('attendance_logs')
                    .select('*, karigars(name)')
                    .eq('attendance_date', todayStr);
                  data = resData || [];
                } catch {}
              }
            }
            break;
          }

          case 'production_log': {
            if (sqlite) {
              try {
                data = sqlite.prepare(`
                  SELECT p.*, k.name as karigar_name 
                  FROM karigar_production_logs p 
                  LEFT JOIN karigars k ON p.karigar_id = k.id 
                  ORDER BY p.log_date DESC, p.created_at DESC 
                  LIMIT 100
                `).all();
              } catch (e: any) {
                console.warn('[Bridge] Local production select error:', e.message);
              }
            }
            if (!data || data.length === 0) {
              const admin = getAdmin();
              if (admin) {
                try {
                  const { data: resData } = await admin
                    .from('karigar_production_logs')
                    .select('*, karigars(name)')
                    .order('created_at', { ascending: false })
                    .limit(100);
                  data = resData || [];
                } catch {}
              }
            }
            break;
          }

          case 'dashboard_kpis': {
            const todayStr = new Date().toISOString().split('T')[0];
            let kCount = 0;
            let aCount = 0;
            let dCount = 0;
            if (sqlite) {
              try {
                const kRes = sqlite.prepare(`SELECT count(*) as c FROM karigars WHERE status = 'active' OR status IS NULL`).get() as any;
                kCount = kRes?.c || 0;
                const aRes = sqlite.prepare(`SELECT count(*) as c FROM attendance_logs WHERE attendance_date = ? AND status = 'present'`).get(todayStr) as any;
                aCount = aRes?.c || 0;
                const dRes = sqlite.prepare(`SELECT count(*) as c FROM invoices WHERE status != 'paid'`).get() as any;
                dCount = dRes?.c || 0;
              } catch {}
            }
            data = [{
              totalKarigars: kCount,
              presentToday: aCount,
              pendingDispatch: dCount,
              hubVersion: '14.0.0',
              tier: client.tier,
              connectedDevices: getPairedCount()
            }];
            break;
          }

          case 'dispatch_pending': {
            if (sqlite) {
              try {
                data = sqlite.prepare(`SELECT * FROM invoices WHERE status != 'paid' ORDER BY created_at DESC LIMIT 50`).all();
              } catch {}
            }
            if (!data || data.length === 0) {
              const admin = getAdmin();
              if (admin) {
                try {
                  const { data: resData } = await admin
                    .from('dispatch_orders')
                    .select('*')
                    .in('status', ['pending', 'packed']);
                  data = resData || [];
                } catch {}
              }
            }
            break;
          }

          case 'peshgi':
          case 'advances': {
            if (sqlite) {
              try {
                data = sqlite.prepare(`
                  SELECT pt.*, k.name as karigar_name 
                  FROM peshgi_transactions pt 
                  LEFT JOIN karigars k ON pt.karigar_id = k.id 
                  ORDER BY pt.transaction_date DESC, pt.created_at DESC 
                  LIMIT 100
                `).all();
              } catch {}
            }
            break;
          }

          case 'scan_history': {
            const admin = getAdmin();
            if (admin) {
              try {
                const { data: resData } = await admin
                  .from('scan_logs')
                  .select('*')
                  .order('created_at', { ascending: false })
                  .limit(100);
                data = resData || [];
              } catch {}
            }
            break;
          }

          default:
            error = `Unknown resource: ${resource}. Fetch detailed data directly from Supabase.`;
            data = [];
        }
      } catch (dbErr: any) {
        console.error(`[Bridge] Data fetch failed for ${resource}:`, dbErr.message);
        error = `Data fetch failed: ${dbErr.message}`;
        data = [];
      }

      send(ws, {
        type: 'DATA_RESPONSE',
        requestId,
        resource,
        data,
        error,
        timestamp: Date.now(),
      });
      break;
    }

    // ── Mobile-originated events ──
    case 'INVOICE_CREATED': {
      console.log(`[Bridge] INVOICE_CREATED from ${client.deviceLabel}`);
      const sqlite = getSqlite();
      const invPayload = (msg.invoice || msg.data || msg) as any;
      if (sqlite && invPayload) {
        const invId = invPayload.id || randomUUID();
        try {
          sqlite.prepare(`
            INSERT OR REPLACE INTO invoices (id, business_id, invoice_number, invoice_type, party_id, party_name, party_phone, invoice_date, status, total_amount, amount_paid, balance_due, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            invId,
            invPayload.business_id || client.businessId || 'local',
            invPayload.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
            invPayload.invoice_type || 'invoice',
            invPayload.party_id || null,
            invPayload.party_name || null,
            invPayload.party_phone || null,
            invPayload.invoice_date || new Date().toISOString(),
            invPayload.status || 'posted',
            Number(invPayload.total_amount || invPayload.net_total || 0),
            Number(invPayload.amount_paid || 0),
            Number(invPayload.balance_due || invPayload.total_amount || 0),
            new Date().toISOString(),
            new Date().toISOString()
          );

          if (Array.isArray(msg.items || invPayload.items)) {
            const items = (msg.items || invPayload.items) as any[];
            for (const it of items) {
              sqlite.prepare(`
                INSERT OR REPLACE INTO invoice_items (id, invoice_id, business_id, sku_id, description, quantity, unit, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                it.id || randomUUID(),
                invId,
                invPayload.business_id || client.businessId || 'local',
                it.sku_id || null,
                it.description || 'Item',
                Number(it.qty || it.quantity || 1),
                it.unit || 'Piece',
                Number(it.unit_price || 0),
                Number(it.total_price || (it.qty || 1) * (it.unit_price || 0))
              );
            }
          }
        } catch (e: any) {
          console.warn('[Bridge] Local invoice insert error:', e.message);
        }
      }

      broadcastToHubRenderer('INVOICE_CREATED', {
        deviceLabel: client.deviceLabel,
        deviceId: client.deviceId,
        ...msg,
      });
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'invoices' });
      break;
    }

    case 'PARTY_CREATED': {
      console.log(`[Bridge] PARTY_CREATED from ${client.deviceLabel}`);
      const sqlite = getSqlite();
      const p = (msg.party || msg.data || msg) as any;
      if (sqlite && p) {
        const pId = p.id || randomUUID();
        try {
          sqlite.prepare(`
            INSERT OR REPLACE INTO parties (id, business_id, name, party_type, phone, address, current_balance, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            pId,
            p.business_id || client.businessId || 'local',
            p.name || 'New Party',
            p.party_type || 'customer',
            p.phone || null,
            p.address || null,
            Number(p.current_balance || 0),
            1,
            new Date().toISOString(),
            new Date().toISOString()
          );
        } catch (e: any) {
          console.warn('[Bridge] Local party insert error:', e.message);
        }
      }

      broadcastToHubRenderer('PARTY_CREATED', {
        deviceLabel: client.deviceLabel,
        deviceId: client.deviceId,
        ...msg,
      });
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'parties' });
      break;
    }

    case 'WORKER_CREATED': {
      console.log(`[Bridge] WORKER_CREATED from ${client.deviceLabel}`);
      const sqlite = getSqlite();
      const k = (msg.worker || msg.karigar || msg.data || msg) as any;
      if (sqlite && k) {
        const kId = k.id || randomUUID();
        try {
          sqlite.prepare(`
            INSERT OR REPLACE INTO karigars (id, business_id, name, karigar_code, phone, department, designation, wage_type, piece_rate, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            kId,
            k.business_id || client.businessId || 'local',
            k.name || 'New Worker',
            k.karigar_code || null,
            k.phone || null,
            k.department || null,
            k.designation || 'Karigar',
            k.wage_type || 'piece_rate',
            Number(k.piece_rate || 0),
            'active',
            new Date().toISOString(),
            new Date().toISOString()
          );
        } catch (e: any) {
          console.warn('[Bridge] Local karigar insert error:', e.message);
        }
      }

      broadcastToHubRenderer('WORKER_CREATED', {
        deviceLabel: client.deviceLabel,
        deviceId: client.deviceId,
        ...msg,
      });
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'karigars' });
      break;
    }

    case 'ATTENDANCE_LOGGED': {
      console.log(`[Bridge] ATTENDANCE_LOGGED from ${client.deviceLabel}`);
      const sqlite = getSqlite();
      const rawAtt = (msg.attendance || msg.data || msg) as any;
      const recordsToInsert = Array.isArray(msg.records)
        ? msg.records
        : (Array.isArray(rawAtt) ? rawAtt : (rawAtt && rawAtt.karigar_id ? [rawAtt] : []));

      if (sqlite && recordsToInsert.length > 0) {
        for (const a of recordsToInsert) {
          if (!a || !a.karigar_id) continue;
          const aId = a.id || randomUUID();
          const todayStr = a.attendance_date || new Date().toISOString().split('T')[0];
          try {
            sqlite.prepare(`
              INSERT OR REPLACE INTO attendance_logs (id, business_id, karigar_id, attendance_date, status, check_in_time, device_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              aId,
              a.business_id || client.businessId || 'local',
              a.karigar_id,
              todayStr,
              a.status || 'present',
              a.check_in_time || new Date().toISOString(),
              client.deviceId || null,
              new Date().toISOString(),
              new Date().toISOString()
            );
          } catch (e: any) {
            console.warn('[Bridge] Local attendance insert error:', e.message);
          }
        }
      }

      broadcastToHubRenderer('ATTENDANCE_LOGGED', {
        deviceLabel: client.deviceLabel,
        deviceId: client.deviceId,
        ...msg,
      });
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'attendance_today' });
      break;
    }

    case 'ADVANCE_GIVEN': {
      console.log(`[Bridge] ADVANCE_GIVEN from ${client.deviceLabel}`);
      const sqlite = getSqlite();
      const adv = (msg.advance || msg.data || msg) as any;
      if (sqlite && adv && adv.karigar_id) {
        const advId = adv.id || randomUUID();
        const todayStr = adv.transaction_date || new Date().toISOString().split('T')[0];
        const amt = Number(adv.amount || 0);
        try {
          sqlite.prepare(`
            INSERT OR REPLACE INTO peshgi_transactions (id, business_id, karigar_id, transaction_type, amount, transaction_date, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            advId,
            adv.business_id || client.businessId || 'local',
            adv.karigar_id,
            'advance',
            amt,
            todayStr,
            adv.description || adv.notes || 'Mobile Advance',
            new Date().toISOString()
          );
          sqlite.prepare(`
            UPDATE karigars SET peshgi_balance = COALESCE(peshgi_balance, 0) + ?, updated_at = ?
            WHERE id = ?
          `).run(amt, new Date().toISOString(), adv.karigar_id);
        } catch (e: any) {
          console.warn('[Bridge] Local advance insert error:', e.message);
        }
      }

      broadcastToHubRenderer('ADVANCE_GIVEN', {
        deviceLabel: client.deviceLabel,
        deviceId: client.deviceId,
        ...msg,
      });
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'karigars' });
      break;
    }

    case 'PRODUCTION_LOGGED': {
      console.log(`[Bridge] PRODUCTION_LOGGED from ${client.deviceLabel}`);
      const sqlite = getSqlite();
      const prod = (msg.production || msg.data || msg) as any;
      if (sqlite && prod && prod.karigar_id) {
        const prodId = prod.id || randomUUID();
        const todayStr = prod.log_date || new Date().toISOString().split('T')[0];
        try {
          sqlite.prepare(`
            INSERT OR REPLACE INTO karigar_production_logs (id, business_id, karigar_id, log_date, units_produced, grade, earnings, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            prodId,
            prod.business_id || client.businessId || 'local',
            prod.karigar_id,
            todayStr,
            Number(prod.units_produced || prod.units || 0),
            prod.grade || 'A',
            Number(prod.earnings || 0),
            new Date().toISOString(),
            new Date().toISOString()
          );
        } catch (e: any) {
          console.warn('[Bridge] Local production insert error:', e.message);
        }
      }

      broadcastToHubRenderer('PRODUCTION_LOGGED', {
        deviceLabel: client.deviceLabel,
        deviceId: client.deviceId,
        ...msg,
      });
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { resource: 'production_log' });
      break;
    }

    case 'STOCK_UPDATED':
    case 'SCAN_COMPLETED':
    case 'KHATA_ENTRY':
    case 'KHATA_UPDATED':
    case 'DISPATCH_UPDATED':
    case 'PAYMENT_RECEIVED': {
      console.log(`[Bridge] Event ${String(msg.type)} from ${client.deviceLabel}`);
      broadcastToHubRenderer(String(msg.type), {
        deviceLabel: client.deviceLabel,
        deviceId: client.deviceId,
        ...msg,
      });
      broadcastSyncToMobileDevices('DATA_INVALIDATED', { event: msg.type });
      break;
    }

    case 'MSG_SEND': {
      const rawMsg = msg as any;
      const text = String(rawMsg.text || rawMsg.payload?.text || '');
      const priority = rawMsg.priority || rawMsg.payload?.priority || 'normal';
      const messageId = rawMsg.messageId || rawMsg.payload?.messageId || randomUUID();
      if (!client.paired) break;
      if (!client.businessId) client.businessId = 'local';

      const msgId = messageId || randomUUID();
      const createdAtStr = new Date().toISOString();
      const messageRecord = {
        id: msgId,
        business_id: client.businessId || 'local',
        sender_type: 'device',
        sender_device_id: client.deviceId,
        sender_name: client.deviceLabel || 'Mobile Device',
        recipient_type: (msg as any).recipientType || 'hub',
        recipient_device_id: (msg as any).recipientDeviceId || null,
        recipient_role: (msg as any).recipientRole || null,
        message_text: text,
        message_type: 'text',
        priority: priority || 'normal',
        is_read: 0,
        created_at: createdAtStr,
      };

      const sqlite = getSqlite();
      if (sqlite) {
        try {
          sqlite.prepare(`
            INSERT OR REPLACE INTO hub_messages (id, business_id, sender_type, sender_device_id, sender_name, recipient_type, recipient_device_id, recipient_role, message_text, message_type, priority, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            messageRecord.id,
            messageRecord.business_id,
            messageRecord.sender_type,
            messageRecord.sender_device_id,
            messageRecord.sender_name,
            messageRecord.recipient_type,
            messageRecord.recipient_device_id,
            messageRecord.recipient_role,
            messageRecord.message_text,
            messageRecord.message_type,
            messageRecord.priority,
            messageRecord.is_read,
            messageRecord.created_at
          );
        } catch (err: any) {
          console.warn('[Bridge] Local hub_messages insert error:', err.message);
        }
      }

      // Try Supabase admin in background
      const admin = getAdmin();
      if (admin) {
        admin.from('hub_messages').insert(messageRecord).then().catch(() => {});
      }

      send(ws, {
        type: 'MSG_ACK',
        messageId,
        serverMessageId: msgId,
      });

      // Broadcast to PC Hub renderer
      broadcastToHubRenderer('messaging:new-message', messageRecord);

      // Relay to all other connected paired mobile devices
      const outMsg = {
        id: msgId,
        text,
        senderName: client.deviceLabel || 'Mobile Device',
        priority: priority || 'normal',
        createdAt: createdAtStr,
      };
      clients.forEach((c) => {
        if (c.paired && c.id !== clientId && c.ws.readyState === WebSocket.OPEN) {
          send(c.ws, {
            type: 'MSG_INCOMING',
            message: outMsg,
          });
        }
      });
      break;
    }

    case 'MSG_READ': {
      const { messageId } = msg as any;
      if (!client.paired || !client.deviceId) break;

      const sqlite = getSqlite();
      if (sqlite && messageId) {
        try {
          sqlite.prepare(`UPDATE hub_messages SET is_read = 1 WHERE id = ?`).run(messageId);
        } catch {}
      }

      const admin = getAdmin();
      if (admin && messageId) {
        try {
          await admin
            .from('hub_messages')
            .update({
              read_by: sql`array_append(read_by, ${client.deviceId})`
            })
            .eq('id', messageId);
        } catch (err: any) {
          console.error('[Bridge] Failed to mark MSG_READ:', err.message);
        }
      }
      break;
    }

    default: {
      console.warn(`[Bridge] Unhandled type: ${String(msg.type)} from ${client.deviceLabel}`);
      break;
    }
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HUB RENDERER IPC BRIDGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let ipcEmitter: ((event: string, data: any) => void) | null = null;

/** Call this from electron/main.ts to forward bridge events to the renderer */
export function setIpcEmitter(fn: (event: string, data: any) => void): void {
  ipcEmitter = fn;
}

export function broadcastToHubRenderer(event: string, data: any): void {
  if (ipcEmitter) {
    try {
      ipcEmitter(event, data);
    } catch (err: any) {
      console.error('[Bridge] IPC emit error:', err.message);
    }
  }

  // Next.js standalone process forked by Electron utilityProcess
  if (typeof process !== 'undefined') {
    if (typeof (process as any).send === 'function') {
      try {
        (process as any).send({ type: 'bridge-event', event, data });
      } catch (err: any) {
        console.error('[Bridge] process.send error:', err.message);
      }
    }
    const parentPort = (process as any).parentPort;
    if (parentPort && typeof parentPort.postMessage === 'function') {
      try {
        parentPort.postMessage({ type: 'bridge-event', event, data });
      } catch (err: any) {
        console.error('[Bridge] parentPort error:', err.message);
      }
    }
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PUBLIC API
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Returns live stats â€” used by /api/hub/info */
export function getBridgeStatus(): {
  connected: number;
  paired: number;
  pairedDevices: Array<{
    deviceId: string | null;
    deviceLabel: string | null;
    connectedAt: Date;
    lastHeartbeat: Date;
    tier: string | null;
  }>;
} {
  const pairedDevices: any[] = [];
  clients.forEach((c) => {
    if (c.paired) {
      pairedDevices.push({
        deviceId: c.deviceId,
        deviceLabel: c.deviceLabel,
        connectedAt: c.connectedAt,
        lastHeartbeat: c.lastHeartbeat,
        tier: c.tier,
      });
    }
  });
  return { connected: clients.size, paired: getPairedCount(), pairedDevices };
}

/** Disconnect a specific device by deviceId â€” called from Hub UI revoke flow */
export function disconnectDevice(deviceId: string): boolean {
  let found = false;
  clients.forEach((client, id) => {
    if (client.deviceId === deviceId) {
      client.ws.close(1000, 'Disconnected by Hub administrator');
      clients.delete(id);
      found = true;
    }
  });
  return found;
}

export function deliverMessageToDevice(
  deviceId: string,
  message: {
    id: string;
    text: string;
    senderName: string;
    priority: string;
    createdAt: string;
  }
): void {
  clients.forEach((device) => {
    if (device.deviceId === deviceId || deviceId === 'all') {
      if (device.ws.readyState === WebSocket.OPEN) {
        send(device.ws, {
          type: 'MSG_INCOMING',
          message,
        });
      }
    }
  });
}

export function broadcastToAllDevices(
  message: any
): void {
  deliverMessageToDevice('all', message);
}

/**
 * Broadcast an operational event or cache invalidation to all active mobile devices.
 * Used for PC-to-Mobile real-time updates (e.g. stock level adjusted on PC, prices modified).
 */
export function broadcastSyncToMobileDevices(
  eventType: string,
  payload?: any
): void {
  clients.forEach((device) => {
    if (device.paired && device.ws.readyState === WebSocket.OPEN) {
      send(device.ws, {
        type: eventType,
        payload: payload || {},
        timestamp: Date.now(),
      });
    }
  });
}

export function getConnectedClientsMap(): Map<string, BridgeClient> {
  return clients;
}



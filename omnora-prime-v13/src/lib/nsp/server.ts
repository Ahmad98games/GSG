import net from 'net';
import { Worker } from 'worker_threads';
import path from 'path';
import crypto from 'crypto';
import { NSPEncryption } from './encryption';
import { NSPProtobuf } from './protobuf';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { NspBroadcaster } from '@/server/NspBroadcaster';
import { Decimal } from 'decimal.js';
import { useTierStore } from '@/stores/tierStore';

const DEVICE_LIMITS = {
  lite: 5,
  pro: 15,
  elite: 50,
} as const;

const connectedDevices = new Map<string, net.Socket>();

const SHARED_KEY = Buffer.alloc(32, process.env.NSP_SHARED_KEY || 'test-key-001');
const WORKER_PATH = path.resolve(__dirname, './nsp-worker.ts');

// Simple Worker Pool (x4)
const workers: Worker[] = [];
if (process.env.NODE_ENV !== 'test') {
  for (let i = 0; i < 4; i++) {
    workers.push(new Worker(WORKER_PATH, { execArgv: ['-r', 'ts-node/register'] }));
  }
}
let currentWorker = 0;

setInterval(() => {
  const heartbeatPayload = {
    heartbeat: {
      timestamp: Date.now(),
    }
  };
  const encoded = NSPProtobuf.encode('NspEnvelope', heartbeatPayload);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(encoded.length);
  const packet = Buffer.concat([lenBuf, encoded]);

  connectedDevices.forEach((socket, deviceId) => {
    if (socket.destroyed) {
      connectedDevices.delete(deviceId);
      logger.info({ deviceId }, '[NSP] Removed destroyed device during heartbeat');
      return;
    }

    try {
      socket.write(packet);
    } catch (err) {
      connectedDevices.delete(deviceId);
      logger.warn({ err, deviceId }, '[NSP] Removed dead device during heartbeat');
    }
  });
}, 30000);

interface NspEnvelope {
  __type: string;
  node_id: string;
  packet_id?: string;
  [key: string]: any;
}

export function createNSPServer(onActivity?: () => void) {
  return net.createServer((socket) => {
    socket.on('data', async (data) => {
      try {
        if (data.length < 4) return;
        
        onActivity?.();
        const length = data.readUInt32LE(0);
        if (length > 1024 * 1024) {
          socket.write(Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]));
          socket.destroy();
          return;
        }

        const encrypted = data.subarray(4);
        
        // --- 1. Decryption (Sync in tests, offloaded in prod) ---
        let status = 'ok';
        let payload: NspEnvelope;
        let error: string | undefined;

        if (process.env.NODE_ENV === 'test') {
          try {
            const decrypted = NSPEncryption.decrypt(encrypted, SHARED_KEY);
            payload = JSON.parse(decrypted.toString()); // Protobuf decode simulation
          } catch (err) {
            status = 'error';
            error = 'DECRYPT_FAIL';
            payload = {} as any;
          }
        } else {
          const worker = workers[currentWorker];
          currentWorker = (currentWorker + 1) % workers.length;

          const res: any = await new Promise((resolve) => {
            worker.once('message', resolve);
            worker.postMessage({ encrypted, key: SHARED_KEY });
          });
          status = res.status;
          payload = res.payload;
          error = res.error;
        }

        if (status === 'error') {
          logger.error({ error, nodeId: payload?.node_id }, '[NSP] Decryption failed');
          const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: error || 'DECRYPT_FAIL' });
          socket.write(Buffer.concat([Buffer.alloc(4), errorMsg]));
          return;
        }

        // --- Tier-based connection enforcement ---
        const tierStore = useTierStore.getState();
        if (payload.node_id) {
          const currentTier = tierStore.tier as keyof typeof DEVICE_LIMITS;
          const limit = DEVICE_LIMITS[currentTier] ?? Number.MAX_SAFE_INTEGER;
          const isNewConnection = !connectedDevices.has(payload.node_id);

          if (isNewConnection && connectedDevices.size >= limit) {
            logger.warn({ nodeId: payload.node_id, deviceCount: connectedDevices.size, tier: currentTier, limit }, '[NSP] Pairing Rejected: Limit Reached');
            const rejectPayload = {
              pairing_rejected: {
                reason: `Device limit (${limit}) reached for ${currentTier} plan`,
                tier: currentTier,
                limit,
              }
            };
            const encodedReject = NSPProtobuf.encode('NspEnvelope', rejectPayload);
            const encryptedReject = NSPEncryption.encrypt(encodedReject, SHARED_KEY);
            const lBuf = Buffer.alloc(4);
            lBuf.writeUInt32LE(encryptedReject.length);
            socket.write(Buffer.concat([lBuf, encryptedReject]));
            socket.destroy();
            return;
          }

          const existingSocket = connectedDevices.get(payload.node_id);
          if (existingSocket && existingSocket !== socket && !existingSocket.destroyed) {
            existingSocket.destroy();
          }

          connectedDevices.set(payload.node_id, socket);
          NspBroadcaster.registerSocket(payload.node_id, socket);
        }

        // --- 2. Event Handling ---
        try {
          if (payload.__type === 'HeartbeatEvent') {
            await db.insert(schema.tcpSessions).values({
              nodeId: payload.node_id,
              ipAddress: socket.remoteAddress || '127.0.0.1',
              port: socket.remotePort || 0,
              pairedAt: new Date().toISOString(),
              lastHeartbeatAt: new Date().toISOString(),
              batteryPercent: payload.battery_percent,
              signalStrength: payload.signal_strength,
              status: 'online'
            }).onConflictDoUpdate({
              target: schema.tcpSessions.nodeId,
              set: {
                lastHeartbeatAt: new Date().toISOString(),
                batteryPercent: payload.battery_percent,
                signalStrength: payload.signal_strength,
                status: 'online'
              }
            });
          }

          if (payload.__type === 'sentinel_breach') {
            const event = payload;
            if (!event.node_id || !event.zone_id || !event.detected_class || event.confidence === undefined) {
              const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: 'INVALID_BREACH_PAYLOAD' });
              socket.write(Buffer.concat([Buffer.alloc(4), errorMsg]));
              return;
            }

            // Write to DB
            await db.insert(schema.aiDetectionEvents).values({
              nodeId: event.node_id,
              zoneId: event.zone_id,
              detectedClass: event.detected_class,
              confidence: event.confidence.toString(),
              timestamp: event.timestamp || Date.now(),
              jpegFrame: event.jpeg_frame ? Buffer.from(event.jpeg_frame, 'base64') : null,
              acknowledged: 0
            });

            await db.insert(schema.securityAudit).values({
              nodeId: event.node_id,
              eventType: 'sentinel_breach',
              payload: JSON.stringify(event)
            });

            // Broadcast
            NspBroadcaster.broadcastToAll({ sentinel_breach: event });

            logger.warn({
              event: 'sentinel_breach_routed',
              zone_id: event.zone_id,
              detected_class: event.detected_class,
              confidence: event.confidence,
              node_count: NspBroadcaster.getConnectedCount()
            });

            const ack = NSPProtobuf.encode('HubAck', { status: 'routed', packet_id: payload.packet_id });
            const encAck = NSPEncryption.encrypt(ack, SHARED_KEY);
            const lBuf = Buffer.alloc(4);
            lBuf.writeUInt32LE(encAck.length);
            socket.write(Buffer.concat([lBuf, encAck]));
            return;
          }

          if (payload.__type === 'guardian_response') {
            const [request] = await db.select()
              .from(schema.guardianAuthRequests)
              .where(eq(schema.guardianAuthRequests.requestId, payload.request_id))
              .limit(1);

            if (!request) {
              const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: 'AUTH_REQUEST_NOT_FOUND' });
              socket.write(Buffer.concat([Buffer.alloc(4), errorMsg]));
              return;
            }

            if (request.expiresAt < Date.now()) {
              const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: 'AUTH_REQUEST_EXPIRED' });
              socket.write(Buffer.concat([Buffer.alloc(4), errorMsg]));
              return;
            }

            const [device] = await db.select()
              .from(schema.authorizedDevices)
              .where(eq(schema.authorizedDevices.nodeId, payload.node_id))
              .limit(1);

            if (!device) {
              const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: 'NODE_NOT_AUTHORIZED' });
              socket.write(Buffer.concat([Buffer.alloc(4), errorMsg]));
              return;
            }

            const expectedInput = `${payload.request_id}:${payload.timestamp}`;
            const expectedHmac = crypto.createHmac('sha256', device.meshKey).update(expectedInput).digest('hex');

            if (!crypto.timingSafeEqual(Buffer.from(expectedHmac, 'hex'), Buffer.from(payload.auth_token, 'hex'))) {
              logger.error({ event: 'guardian_hmac_fail', node_id: payload.node_id, request_id: payload.request_id });
              await db.insert(schema.securityAudit).values({
                nodeId: payload.node_id,
                eventType: 'hmac_fail',
                payload: JSON.stringify(payload),
                failedAuthCount: 1
              }).onConflictDoUpdate({
                target: schema.securityAudit.nodeId,
                set: { failedAuthCount: sql`${schema.securityAudit.failedAuthCount} + 1` }
              });
              const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: 'HMAC_INVALID' });
              socket.write(Buffer.concat([Buffer.alloc(4), errorMsg]));
              return;
            }

            if (payload.approved) {
              const action = JSON.parse(request.hubAction);
              logger.info({ event: 'guardian_approved', action, node_id: payload.node_id });

              // If action is acknowledging a breach, update the DB
              if (action.type === 'acknowledge_breach' && action.event_id) {
                await db.update(schema.aiDetectionEvents)
                  .set({ acknowledged: 1 })
                  .where(eq(schema.aiDetectionEvents.id, action.event_id));
              }
              
              const ack = NSPProtobuf.encode('HubAck', { status: 'guardian_approved' });
              const encAck = NSPEncryption.encrypt(ack, SHARED_KEY);
              const lBuf = Buffer.alloc(4);
              lBuf.writeUInt32LE(encAck.length);
              socket.write(Buffer.concat([lBuf, encAck]));
              return;
            }
          }

          if (payload.__type === 'ScanEvent') {
            const eventHash = crypto.createHash('sha256')
              .update(`${payload.node_id}${payload.barcode}${payload.timestamp}`)
              .digest('hex');

            const [existing] = await db.select()
              .from(schema.processedEvents)
              .where(eq(schema.processedEvents.eventHash, eventHash))
              .limit(1);

            if (existing) {
              const ack = NSPProtobuf.encode('HubAck', { status: 'ok', already_processed: true });
              socket.write(Buffer.concat([Buffer.alloc(4), ack]));
              return;
            }

            // Insert idempotency
            await db.insert(schema.processedEvents).values({
              eventHash,
              nodeId: payload.node_id,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

            // Process Scan
            const [sku] = await db.select()
              .from(schema.skuCache)
              .where(eq(schema.skuCache.barcode, payload.barcode))
              .limit(1);

            if (sku) {
              const currentQty = new Decimal(sku.qtyOnHand);
              const delta = new Decimal(payload.qty || '1');
              const newQty = payload.type === 'sale' ? currentQty.minus(delta) : currentQty.plus(delta);
              
              await db.update(schema.skuCache)
                .set({ qtyOnHand: newQty.toString() })
                .where(eq(schema.skuCache.skuId, sku.skuId));

              if (payload.type === 'sale') {
                await db.insert(schema.ledgerEntries).values({
                  nodeId: payload.node_id,
                  amount: delta.mul(sku.salePrice).toString(),
                  entryType: 'credit',
                  description: `POS Sale: ${sku.name}`
                });
              }
            }

            await db.insert(schema.syncQueue).values({
              tableName: 'scan_events',
              operation: 'insert',
              recordId: payload.batch_id || payload.packet_id || 'unknown',
              payload: JSON.stringify(payload),
              status: 'pending'
            });
          }

          if (payload.__type === 'StockLookupRequest') {
            const [sku] = await db.select()
              .from(schema.skuCache)
              .where(eq(schema.skuCache.barcode, payload.barcode))
              .limit(1);

            if (!sku) {
              const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: 'BARCODE_NOT_FOUND' });
              const encryptedErr = NSPEncryption.encrypt(errorMsg, SHARED_KEY);
              const lenBuf = Buffer.alloc(4);
              lenBuf.writeUInt32LE(encryptedErr.length);
              socket.write(Buffer.concat([lenBuf, encryptedErr]));
              return;
            }

            const response = NSPProtobuf.encode('StockLookupResponse', {
              sku_code: sku.skuCode,
              qty_on_hand: sku.qtyOnHand
            });
            const encryptedResp = NSPEncryption.encrypt(response, SHARED_KEY);
            const lenBuf = Buffer.alloc(4);
            lenBuf.writeUInt32LE(encryptedResp.length);
            socket.write(Buffer.concat([lenBuf, encryptedResp]));
            return;
          }

          if (payload.__type === 'TacticalMessage') {
            await db.insert(schema.meshMessages).values({
              fromNodeId: payload.from_node_id,
              toNodeId: payload.to_node_id,
              encryptedPayload: Buffer.from(payload.encrypted_payload, 'base64'),
              mediaType: 'text',
              status: 'queued'
            });

            const ack = NSPProtobuf.encode('HubAck', { status: 'queued', timestamp: Date.now() });
            const encAck = NSPEncryption.encrypt(ack, SHARED_KEY);
            const lBuf = Buffer.alloc(4);
            lBuf.writeUInt32LE(encAck.length);
            socket.write(Buffer.concat([lBuf, encAck]));
            return;
          }

        } catch (dbErr) {
          logger.error({ dbErr, payload }, '[NSP] DB operation failed');
          const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: 'DB_WRITE_FAIL' });
          const encryptedErr = NSPEncryption.encrypt(errorMsg, SHARED_KEY);
          const lenBuf = Buffer.alloc(4);
          lenBuf.writeUInt32LE(encryptedErr.length);
          socket.write(Buffer.concat([lenBuf, encryptedErr]));
          return;
        }

        // Standard Acknowledgment with Tier Info
        const ack = NSPProtobuf.encode('HubAck', { 
          status: 'ok', 
          timestamp: Date.now(),
          tier: tierStore.tier,
          expires_at: tierStore.expiresAt,
          limits: tierStore.limits
        });
        const encryptedAck = NSPEncryption.encrypt(ack, SHARED_KEY);
        const lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt32LE(encryptedAck.length);
        socket.write(Buffer.concat([lenBuf, encryptedAck]));

      } catch (err) {
        logger.error({ err }, '[NSP] Server Critical Error');
      }
    });

    socket.on('close', () => {
      NspBroadcaster.unregisterSocket(socket);
      for (const [deviceId, s] of connectedDevices.entries()) {
        if (s === socket) {
          connectedDevices.delete(deviceId);
          break;
        }
      }
    });

    socket.on('error', () => {
      for (const [deviceId, s] of connectedDevices.entries()) {
        if (s === socket) {
          connectedDevices.delete(deviceId);
          break;
        }
      }
    });
  });
}


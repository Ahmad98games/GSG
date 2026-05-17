import net from 'net';
import { getGlobalPool, TaskPriority } from './WorkerPool';
import { NSPEncryption } from '../lib/nsp/encryption';
import { NSPProtobuf } from '../lib/nsp/protobuf';
import { logger } from '../lib/logger';
import { NspBroadcaster } from './NspBroadcaster';
import { db } from '../lib/db/client';
import * as schema from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Noxis v13.0 — Hardened TCP Server
 * Features: Backpressure handling & Priority Task Offloading.
 */
export function createTCPServer(onActivity?: () => void) {
  const server = net.createServer((socket) => {
    // CRASH PROTECTION: Handle socket errors locally so they don't propagate to process
    socket.on('error', (err) => {
      logger.error({ err }, 'TCP Socket Error - Connection closed safely');
    });

    socket.on('timeout', () => {
      logger.warn('TCP Socket Timeout - Destroying connection');
      socket.destroy();
    });

    socket.on('data', async (data) => {
      try {
        if (data.length < 4) return;
        
        onActivity?.();

        const metrics = getGlobalPool().getMetrics();
        if (metrics.queueDepth > 500) {
          try {
            const errorMsg = NSPProtobuf.encode('ErrorEvent', { error_code: 'SERVER_BUSY' });
            const lenBuf = Buffer.alloc(4);
            lenBuf.writeUInt32LE(errorMsg.length);
            socket.write(Buffer.concat([lenBuf, errorMsg]));
          } catch (e) {}
          return;
        }

        getGlobalPool().enqueue('DECRYPT_AND_PARSE', { data }, TaskPriority.HIGH)
          .then(async (envelope) => {
            let businessId = 'SYSTEM_DEFAULT';
            try {
              const config = await db.select()
                .from(schema.localConfig)
                .where(eq(schema.localConfig.key, 'business_id'))
                .limit(1);
              if (config.length > 0) {
                businessId = config[0].value;
              }
            } catch (err) {
              logger.error({ err }, 'Failed to fetch businessId from DB');
            }
            
            const responsePayload = await NspBroadcaster.handleRequest(envelope, businessId);

            if (socket.writable) {
              if (responsePayload) {
                const encodedResponse = NSPProtobuf.encode('NspEnvelope', responsePayload);
                const lenBuf = Buffer.alloc(4);
                lenBuf.writeUInt32LE(encodedResponse.length);
                socket.write(Buffer.concat([lenBuf, encodedResponse]));
              } else {
                const ack = NSPProtobuf.encode('HubAck', { status: 'ok', timestamp: Date.now() });
                const lenBuf = Buffer.alloc(4);
                lenBuf.writeUInt32LE(ack.length);
                socket.write(Buffer.concat([lenBuf, ack]));
              }
            }
          })
          .catch((err) => {
            logger.error({ err }, 'TCP packet processing failed');
          });

      } catch (err) {
        logger.error({ err }, 'TCP data processing error');
      }
    });
  });

  return server;
}


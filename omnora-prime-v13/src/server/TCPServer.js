"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTCPServer = createTCPServer;
const net_1 = __importDefault(require("net"));
const WorkerPool_1 = require("./WorkerPool");
const protobuf_1 = require("../lib/nsp/protobuf");
const logger_1 = require("@/lib/logger");
const NspBroadcaster_1 = require("./NspBroadcaster");
const BusinessProfileStore_1 = require("@/store/BusinessProfileStore");
/**
 * Noxis v13.0 — Hardened TCP Server
 * Features: Backpressure handling & Priority Task Offloading.
 */
function createTCPServer(onActivity) {
    return net_1.default.createServer((socket) => {
        socket.on('data', async (data) => {
            try {
                if (data.length < 4)
                    return;
                // Notify inactivity timer
                onActivity?.();
                // PERFORMANCE: Backpressure Check
                // If queue depth > 500, reject non-critical packets immediately to save CPU
                const metrics = WorkerPool_1.globalPool.getMetrics();
                if (metrics.queueDepth > 500) {
                    // Send ErrorEvent: BUSY
                    const errorMsg = protobuf_1.NSPProtobuf.encode('ErrorEvent', { error_code: 'SERVER_BUSY' });
                    socket.write(Buffer.concat([Buffer.alloc(4), errorMsg]));
                    return;
                }
                // Offload to Worker Pool with priority
                WorkerPool_1.globalPool.enqueue('DECRYPT_AND_PARSE', { data }, WorkerPool_1.TaskPriority.HIGH)
                    .then(async (envelope) => {
                    // Retrieve businessId from profile store
                    const businessId = BusinessProfileStore_1.useBusinessProfileStore.getState().profile?.id || 'SYSTEM_DEFAULT';
                    // Route through Broadcaster
                    const responsePayload = await NspBroadcaster_1.NspBroadcaster.handleRequest(envelope, businessId);
                    if (responsePayload) {
                        const encodedResponse = protobuf_1.NSPProtobuf.encode('NspEnvelope', responsePayload);
                        const lenBuf = Buffer.alloc(4);
                        lenBuf.writeUInt32LE(encodedResponse.length);
                        socket.write(Buffer.concat([lenBuf, encodedResponse]));
                    }
                    else {
                        // Standard Acknowledgment
                        const ack = protobuf_1.NSPProtobuf.encode('HubAck', { status: 'ok', timestamp: Date.now() });
                        const lenBuf = Buffer.alloc(4);
                        lenBuf.writeUInt32LE(ack.length);
                        socket.write(Buffer.concat([lenBuf, ack]));
                    }
                })
                    .catch((err) => {
                    logger_1.logger.error({ err }, 'TCP packet processing failed');
                });
            }
            catch (err) {
                logger_1.logger.error({ err }, 'TCP socket error');
            }
        });
    });
}

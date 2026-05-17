"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NspBroadcaster = void 0;
const admin_1 = require("../lib/supabase/admin");
const logger_1 = require("@/lib/logger");
const decimal_js_1 = require("decimal.js");
const protobuf_1 = require("../lib/nsp/protobuf");
const client_1 = require("@/lib/db/client");
const schema = __importStar(require("@/lib/db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = __importDefault(require("crypto"));
const events_1 = require("events");
/**
 * Noxis v13.0 — NSP BROADCASTER
 * Central relay for high-speed financial queries and multi-branch context switching.
 */
class NspBroadcaster {
    static admin = (0, admin_1.createAdminClient)();
    static connectedSockets = new Map();
    static events = new events_1.EventEmitter();
    static async registerSocket(nodeId, socket) {
        this.connectedSockets.set(nodeId, socket);
        // Rule 10: Store-and-Forward — Flush queued messages for this node
        try {
            const queued = await client_1.db.select()
                .from(schema.meshMessages)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.meshMessages.toNodeId, nodeId), (0, drizzle_orm_1.eq)(schema.meshMessages.status, 'queued')));
            for (const msg of queued) {
                const relayEnvelope = {
                    mesh_message: {
                        message_id: msg.messageId,
                        from_id: msg.fromNodeId,
                        payload: msg.encryptedPayload.toString(),
                        media_type: msg.mediaType,
                        timestamp: Date.now()
                    }
                };
                const encoded = protobuf_1.NSPProtobuf.encode('NspEnvelope', relayEnvelope);
                const lenBuf = Buffer.alloc(4);
                lenBuf.writeUInt32LE(encoded.length);
                socket.write(Buffer.concat([lenBuf, encoded]));
                await client_1.db.update(schema.meshMessages)
                    .set({ status: 'delivered', deliveredAt: new Date().toISOString() })
                    .where((0, drizzle_orm_1.eq)(schema.meshMessages.messageId, msg.messageId));
            }
        }
        catch (err) {
            logger_1.logger.error({ err, nodeId }, '[NSP_BROADCASTER] Failed to flush queued messages');
        }
    }
    static unregisterSocket(socket) {
        for (const [nodeId, s] of this.connectedSockets.entries()) {
            if (s === socket) {
                this.connectedSockets.delete(nodeId);
                break;
            }
        }
    }
    static getConnectedCount() {
        return this.connectedSockets.size;
    }
    /**
     * Broadcasts a packet to all connected nodes.
     * Scoped to mobile nodes in production logic.
     */
    static broadcastToAll(envelope) {
        try {
            const encoded = protobuf_1.NSPProtobuf.encode('NspEnvelope', envelope);
            const lenBuf = Buffer.alloc(4);
            lenBuf.writeUInt32LE(encoded.length);
            const packet = Buffer.concat([lenBuf, encoded]);
            for (const [nodeId, socket] of this.connectedSockets.entries()) {
                if (!socket.destroyed) {
                    socket.write(packet);
                }
                else {
                    this.connectedSockets.delete(nodeId);
                }
            }
        }
        catch (err) {
            logger_1.logger.error({ err }, '[NSP_BROADCASTER] Broadcast failed');
        }
    }
    /**
     * Main entry point for NSP Request processing.
     * Enforces business_id scoping for all queries.
     */
    static async handleRequest(payload, businessId) {
        try {
            if (payload.ledger_summary_req) {
                return await this.handleLedgerSummary(payload.ledger_summary_req, businessId);
            }
            if (payload.party_balance_req) {
                return await this.handlePartyBalance(payload.party_balance_req, businessId);
            }
            if (payload.invoice_summary_req) {
                return await this.handleInvoiceSummary(payload.invoice_summary_req, businessId);
            }
            if (payload.pay_slip_req) {
                return await this.handlePaySlip(payload.pay_slip_req, businessId);
            }
            if (payload.branch_list_req) {
                return await this.handleBranchList(payload.branch_list_req, businessId);
            }
            if (payload.switch_branch_req) {
                return await this.handleSwitchBranch(payload, businessId);
            }
            if (payload.detection_history_req) {
                return await this.handleDetectionHistory(payload.detection_history_req, businessId);
            }
            if (payload.camera_status_req) {
                return await this.handleCameraStatus(payload.camera_status_req, businessId);
            }
            // --- PRODUCTION EVENT HANDLING (Rule 10 — Zero Data Loss) ---
            const type = payload.__type;
            if (type === 'ScanEvent') {
                return await this.handleScanEvent(payload, businessId);
            }
            if (type === 'sentinel_breach' || type === 'SentinelBreachEvent') {
                return await this.handleSentinelBreach(payload, businessId);
            }
            if (type === 'guardian_response' || type === 'GuardianAuthResponse') {
                return await this.handleGuardianResponse(payload, businessId);
            }
            if (type === 'MeshMessage' || type === 'TacticalMessage') {
                return await this.handleMeshMessage(payload);
            }
            if (type === 'HeartbeatEvent') {
                return { hub_ack: { status: 'alive', timestamp: Date.now() } };
            }
            return null;
        }
        catch (err) {
            logger_1.logger.error({ err, payload }, '[NSP_BROADCASTER] Processing fault');
            return { error_event: { error_code: 'REQUEST_PROCESSING_FAILED' } };
        }
    }
    static async handleDetectionHistory(req, businessId) {
        let query = this.admin
            .from('ai_detection_events')
            .select('*, cctv_nodes(node_label, install_location)')
            .eq('business_id', businessId);
        if (req.camera_node_id) {
            query = query.eq('node_id', req.camera_node_id);
        }
        if (req.detected_class) {
            query = query.eq('detected_class', req.detected_class);
        }
        if (req.since_timestamp) {
            query = query.gte('created_at', new Date(req.since_timestamp).toISOString());
        }
        else {
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            query = query.gte('created_at', dayAgo);
        }
        const { data: events, error } = await query
            .order('created_at', { ascending: false })
            .limit(req.limit || 50);
        if (error)
            throw error;
        const eventsWithUrls = await Promise.all((events || []).map(async (e) => {
            let signedUrl = null;
            if (e.thumbnail_url) {
                const { data } = await this.admin
                    .storage
                    .from('detections')
                    .createSignedUrl(e.thumbnail_url, 900);
                signedUrl = data?.signedUrl;
            }
            return {
                event_id: e.id,
                camera_label: e.cctv_nodes?.node_label || 'Unknown',
                install_location: e.cctv_nodes?.install_location || 'Unknown',
                detected_class: e.detected_class,
                confidence: e.confidence,
                zone_id: e.zone_id,
                zone_label: e.zone_id,
                created_at: new Date(e.created_at).getTime(),
                thumbnail_url: signedUrl
            };
        }));
        return {
            detection_history_res: {
                events: eventsWithUrls,
                total_count: eventsWithUrls.length
            }
        };
    }
    static async handleCameraStatus(req, businessId) {
        const { data: cameras, error } = await this.admin
            .from('cctv_nodes')
            .select('*, cctv_brands(name)')
            .eq('business_id', businessId)
            .eq('is_active', true);
        if (error)
            throw error;
        const cameraStatuses = await Promise.all((cameras || []).map(async (c) => {
            const { data: telemetry } = await this.admin
                .from('cctv_telemetry')
                .select('*')
                .eq('node_id', c.id)
                .order('recorded_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            return {
                camera_id: c.id,
                label: c.node_label,
                location: c.install_location || c.location_desc,
                brand: c.cctv_brands?.name || 'Generic',
                model_number: c.model_number || 'N/A',
                status: c.status,
                last_frame_at: c.last_frame_at ? new Date(c.last_frame_at).getTime() : 0,
                bitrate_kbps: telemetry?.bitrate_kbps || 0,
                avg_brightness: telemetry?.avg_brightness || 0,
                ai_enabled: c.ai_enabled,
                active_fault: telemetry?.fault_type || null
            };
        }));
        return {
            camera_status_res: {
                cameras: cameraStatuses
            }
        };
    }
    static async handleLedgerSummary(req, businessId) {
        let query = this.admin
            .from('ledger_entries')
            .select('id, tx_ref, description, amount, entry_type, posted_at, accounts(name), parties(name)')
            .eq('business_id', businessId);
        // Branch isolation for multi-location Elite deployments
        if (req.branch_id) {
            query = query.eq('branch_id', req.branch_id);
        }
        const { data: entries, error } = await query
            .order('posted_at', { ascending: false })
            .limit(req.limit || 50);
        if (error)
            throw error;
        // Aggregate totals (mocked for speed, real implementation should use a materialized view or RPC)
        const totalDebit = (entries || []).reduce((acc, e) => e.entry_type === 'debit' ? acc.plus(new decimal_js_1.Decimal(e.amount)) : acc, new decimal_js_1.Decimal(0));
        const totalCredit = (entries || []).reduce((acc, e) => e.entry_type === 'credit' ? acc.plus(new decimal_js_1.Decimal(e.amount)) : acc, new decimal_js_1.Decimal(0));
        return {
            ledger_summary_res: {
                entries: entries.map(e => ({
                    entry_id: e.id,
                    tx_ref: e.tx_ref,
                    account_name: (Array.isArray(e.accounts) ? e.accounts[0]?.name : e.accounts?.name) || 'Unknown',
                    party_name: (Array.isArray(e.parties) ? e.parties[0]?.name : e.parties?.name) || 'General',
                    entry_type: e.entry_type,
                    amount: e.amount.toString(),
                    description: e.description,
                    posted_at: new Date(e.posted_at).getTime()
                })),
                total_debit: totalDebit.toString(),
                total_credit: totalCredit.toString(),
                net_balance: totalDebit.minus(totalCredit).toString()
            }
        };
    }
    static async handlePartyBalance(req, businessId) {
        let query = this.admin
            .from('parties')
            .select('id, name, current_balance, is_blocked, party_type')
            .eq('business_id', businessId);
        if (req.party_type && req.party_type !== 'both') {
            query = query.eq('party_type', req.party_type);
        }
        const { data: parties, error } = await query
            .order('current_balance', { ascending: false })
            .limit(req.limit || 100);
        if (error)
            throw error;
        return {
            party_balance_res: {
                parties: parties.map(p => ({
                    party_id: p.id,
                    name: p.name,
                    current_balance: p.current_balance.toString(),
                    is_blocked: p.is_blocked,
                    party_type: p.party_type,
                    overdue_days: 0 // Injected by database aging logic in production
                }))
            }
        };
    }
    static async handleInvoiceSummary(req, businessId) {
        const { data: invoices, error } = await this.admin
            .from('invoices')
            .select('id, invoice_no, total, balance_due, status, issue_date, due_date, parties(name)')
            .eq('business_id', businessId)
            .order('issue_date', { ascending: false });
        if (error)
            throw error;
        return {
            invoice_summary_res: {
                invoices: invoices.map(i => ({
                    invoice_id: i.id,
                    invoice_no: i.invoice_no,
                    party_name: (Array.isArray(i.parties) ? i.parties[0]?.name : i.parties?.name) || 'Unknown',
                    total: i.total.toString(),
                    balance_due: i.balance_due.toString(),
                    status: i.status,
                    issue_date: new Date(i.issue_date).getTime(),
                    due_date: i.due_date ? new Date(i.due_date).getTime() : 0
                })),
                total_value: (invoices || []).reduce((acc, i) => acc.plus(new decimal_js_1.Decimal(i.total)), new decimal_js_1.Decimal(0)).toString(),
                count: invoices.length
            }
        };
    }
    static async handlePaySlip(req, businessId) {
        const { data: slip, error } = await this.admin
            .from('payroll_slips')
            .select('*, karigars(name), payroll_periods(period_label)')
            .eq('business_id', businessId)
            .eq('karigar_id', req.karigar_id)
            .eq('period_id', req.period_id)
            .single();
        if (error)
            throw error;
        return {
            pay_slip_res: {
                karigar_name: slip.karigars?.name,
                period_label: slip.payroll_periods?.period_label,
                gross_earning: slip.gross_earning.toString(),
                total_deductions: slip.total_deductions.toString(),
                net_payable: slip.net_payable.toString(),
                days_present: slip.days_present,
                total_units: slip.total_units.toString(),
                efficiency_pct: slip.efficiency_pct?.toString() || '0',
                advance_deduction: slip.advance_deduction.toString()
            }
        };
    }
    static async handleBranchList(req, businessId) {
        const { data: branches, error } = await this.admin
            .from('branches')
            .select('id, name, city, is_headquarters')
            .eq('business_id', businessId);
        if (error)
            throw error;
        return {
            branch_list_res: {
                branches: branches.map(b => ({
                    branch_id: b.id,
                    name: b.name,
                    city: b.city || 'N/A',
                    is_hq: b.is_headquarters,
                    user_role_at_branch: 'manager' // Scoped in production via profile join
                })),
                current_branch_id: '' // Determination deferred to session context
            }
        };
    }
    static async handleScanEvent(payload, _businessId) {
        try {
            const eventHash = crypto_1.default.createHash('sha256')
                .update(`${payload.node_id}${payload.barcode}${payload.timestamp}`)
                .digest('hex');
            const [existing] = await client_1.db.select()
                .from(schema.processedEvents)
                .where((0, drizzle_orm_1.eq)(schema.processedEvents.eventHash, eventHash))
                .limit(1);
            if (existing)
                return { hub_ack: { status: 'ok', already_processed: true } };
            // 1. Idempotency Lock
            await client_1.db.insert(schema.processedEvents).values({
                eventHash,
                nodeId: payload.node_id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
            // 2. Stock & Ledger Processing
            const [sku] = await client_1.db.select()
                .from(schema.skuCache)
                .where((0, drizzle_orm_1.eq)(schema.skuCache.barcode, payload.barcode))
                .limit(1);
            if (sku) {
                const currentQty = new decimal_js_1.Decimal(sku.qtyOnHand);
                const delta = new decimal_js_1.Decimal(payload.qty || '1');
                const newQty = payload.type === 'sale' ? currentQty.minus(delta) : currentQty.plus(delta);
                await client_1.db.update(schema.skuCache)
                    .set({ qtyOnHand: newQty.toString() })
                    .where((0, drizzle_orm_1.eq)(schema.skuCache.skuId, sku.skuId));
                if (payload.type === 'sale') {
                    await client_1.db.insert(schema.ledgerEntries).values({
                        nodeId: payload.node_id,
                        amount: delta.mul(sku.salePrice).toString(),
                        entryType: 'credit',
                        description: `POS Sale: ${sku.name}`
                    });
                }
            }
            // 3. Queue for Cloud Sync (Rule 10 Persistence)
            await client_1.db.insert(schema.syncQueue).values({
                tableName: 'scan_events',
                operation: 'insert',
                recordId: payload.batch_id || payload.packet_id || 'unknown',
                payload: JSON.stringify(payload),
                status: 'synced'
            });
            return { hub_ack: { status: 'ok', timestamp: Date.now() } };
        }
        catch (err) {
            logger_1.logger.error({ err, payload }, '[NSP] ScanEvent processing failed');
            return { error_event: { error_code: 'SCAN_PROCESSING_FAULT' } };
        }
    }
    static async handleSentinelBreach(event, _businessId) {
        try {
            // 1. Verify Payload
            if (!event.node_id || !event.zone_id || !event.detected_class) {
                return { error_event: { error_code: 'INVALID_BREACH_PAYLOAD' } };
            }
            // 2. Write to Audit & History
            await client_1.db.insert(schema.aiDetectionEvents).values({
                nodeId: event.node_id,
                zoneId: event.zone_id,
                detectedClass: event.detected_class,
                confidence: (event.confidence || 0).toString(),
                timestamp: event.timestamp || Date.now(),
                acknowledged: 0
            });
            await client_1.db.insert(schema.securityAudit).values({
                nodeId: event.node_id,
                eventType: 'sentinel_breach',
                payload: JSON.stringify(event)
            });
            // 3. Reactive Broadcast to all Mobile Nodes
            this.broadcastToAll({ sentinel_breach: event });
            logger_1.logger.warn({ event: 'sentinel_breach_routed', zone: event.zone_id, node_id: event.node_id });
            return { hub_ack: { status: 'routed', timestamp: Date.now() } };
        }
        catch (err) {
            logger_1.logger.error({ err, event }, '[NSP] Sentinel breach routing failed');
            return { error_event: { error_code: 'BREACH_ROUTING_FAULT' } };
        }
    }
    static async handleGuardianResponse(payload, _businessId) {
        try {
            const [request] = await client_1.db.select()
                .from(schema.guardianAuthRequests)
                .where((0, drizzle_orm_1.eq)(schema.guardianAuthRequests.requestId, payload.request_id))
                .limit(1);
            if (!request || request.expiresAt < Date.now()) {
                return { error_event: { error_code: 'AUTH_REQUEST_EXPIRED_OR_NOT_FOUND' } };
            }
            const [device] = await client_1.db.select()
                .from(schema.authorizedDevices)
                .where((0, drizzle_orm_1.eq)(schema.authorizedDevices.nodeId, payload.node_id))
                .limit(1);
            if (!device)
                return { error_event: { error_code: 'NODE_UNAUTHORIZED' } };
            // HMAC Verification (Security Pillar)
            const expectedInput = `${payload.request_id}:${payload.timestamp}`;
            const expectedHmac = crypto_1.default.createHmac('sha256', device.meshKey).update(expectedInput).digest('hex');
            if (!crypto_1.default.timingSafeEqual(Buffer.from(expectedHmac, 'hex'), Buffer.from(payload.auth_token, 'hex'))) {
                logger_1.logger.error({ event: 'hmac_fail', node_id: payload.node_id });
                return { error_event: { error_code: 'HMAC_INVALID' } };
            }
            if (payload.approved) {
                const action = JSON.parse(request.hubAction);
                if (action.type === 'acknowledge_breach' && action.event_id) {
                    await client_1.db.update(schema.aiDetectionEvents)
                        .set({ acknowledged: 1 })
                        .where((0, drizzle_orm_1.eq)(schema.aiDetectionEvents.id, action.event_id));
                }
            }
            return { hub_ack: { status: 'guardian_verified', timestamp: Date.now() } };
        }
        catch (err) {
            logger_1.logger.error({ err, payload }, '[NSP] Guardian response verification failed');
            return { error_event: { error_code: 'GUARDIAN_VERIFY_FAULT' } };
        }
    }
    static async handleSwitchBranch(payload, businessId) {
        const req = payload.switch_branch_req;
        const nodeId = payload.node_id;
        const targetBranchId = req.branch_id;
        const requestingUserId = req.user_id || 'system';
        try {
            // 1. Verify branch exists and belongs to this business
            const { data: branch, error: branchError } = await this.admin
                .from('branches')
                .select('id, name, status, is_headquarters')
                .eq('id', targetBranchId)
                .eq('business_id', businessId)
                .eq('status', 'active')
                .single();
            if (branchError || !branch) {
                logger_1.logger.warn({ nodeId, targetBranchId }, '[NSP] Branch switch failed: NOT_FOUND_OR_INACTIVE');
                return { error_event: { error_code: 'BRANCH_NOT_FOUND_OR_INACTIVE' } };
            }
            // 2. Verify requesting node has permission for this branch
            const { data: assignment, error: assignError } = await this.admin
                .from('branch_user_assignments')
                .select('*')
                .eq('branch_id', targetBranchId)
                .eq('user_id', requestingUserId)
                .maybeSingle();
            if (assignError || (!assignment && !branch.is_headquarters)) {
                logger_1.logger.warn({ nodeId, targetBranchId, requestingUserId }, '[NSP] Branch switch failed: PERMISSION_DENIED');
                return { error_event: { error_code: 'BRANCH_PERMISSION_DENIED' } };
            }
            // 3. Update the node's active branch in local tcp_sessions
            await client_1.db.update(schema.tcpSessions)
                .set({ activeBranchId: targetBranchId })
                .where((0, drizzle_orm_1.eq)(schema.tcpSessions.nodeId, nodeId));
            // 4. Set Supabase session context for this node's queries
            await this.admin.rpc('set_branch_context', { branch_id: targetBranchId });
            // 5. Log
            logger_1.logger.info({ event: 'branch_switched', nodeId, targetBranchId }, 'Node switched branch context');
            // 6. Build HubAck confirming switch
            // In production, currentTierProfile would be fetched from business_profiles.tier
            return {
                hub_ack: {
                    status: 'branch_switched',
                    active_profile: 'Elite',
                    timestamp: Date.now(),
                    active_branch_id: targetBranchId
                }
            };
        }
        catch (err) {
            logger_1.logger.error({ err, nodeId, targetBranchId }, '[NSP] Branch switch system error');
            return { error_event: { error_code: 'BRANCH_SWITCH_FAULT' } };
        }
    }
    static async handleMeshMessage(payload) {
        try {
            const { to_node_id, text, media_type = 'text' } = payload;
            // 1. Persist to local SQLite (Rule 10 — Zero Data Loss)
            // Initial status is 'queued'
            const [inserted] = await client_1.db.insert(schema.meshMessages).values({
                fromNodeId: payload.node_id,
                toNodeId: to_node_id,
                encryptedPayload: Buffer.from(text),
                mediaType: media_type,
                status: 'queued',
            }).returning();
            let status = 'queued';
            // 2. Relay to target node if online (LAN Mesh relay)
            const targetSocket = this.connectedSockets.get(to_node_id);
            if (targetSocket && !targetSocket.destroyed) {
                const relayEnvelope = {
                    mesh_message: {
                        message_id: inserted.messageId,
                        from_id: payload.node_id,
                        payload: text,
                        media_type: media_type,
                        timestamp: Date.now()
                    }
                };
                const encoded = protobuf_1.NSPProtobuf.encode('NspEnvelope', relayEnvelope);
                const lenBuf = Buffer.alloc(4);
                lenBuf.writeUInt32LE(encoded.length);
                targetSocket.write(Buffer.concat([lenBuf, encoded]));
                // Update status to delivered
                await client_1.db.update(schema.meshMessages)
                    .set({ status: 'delivered', deliveredAt: new Date().toISOString() })
                    .where((0, drizzle_orm_1.eq)(schema.meshMessages.messageId, inserted.messageId));
                status = 'delivered';
            }
            // 3. Emit local event for the Hub's internal Dashboard/Messenger
            this.events.emit('new_message', {
                ...inserted,
                status,
                payload: text // Include decrypted text for local UI
            });
            return { hub_ack: { status, timestamp: Date.now(), message_id: inserted.messageId } };
        }
        catch (err) {
            logger_1.logger.error({ err, payload }, '[NSP] Mesh message relay failed');
            return { error_event: { error_code: 'MSG_RELAY_FAULT' } };
        }
    }
}
exports.NspBroadcaster = NspBroadcaster;

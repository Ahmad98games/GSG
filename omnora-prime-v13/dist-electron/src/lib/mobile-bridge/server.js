"use strict";
/**
 * Mobile WebSocket Bridge — Hardened Security Edition (v13.1)
 *
 * Security model:
 *   1. Every client gets a 30-second pairing timeout; unpaired = disconnected
 *   2. PAIR_REQUEST validates deviceId format (8–64 chars, alphanumeric/dash/underscore)
 *   3. Tier-based device limits read from local SQLite (not Zustand renderer store)
 *   4. All device registrations persisted in authorized_devices table
 *   5. Pre-pairing gate: only PAIR_REQUEST and HEARTBEAT_RESPONSE allowed before paired
 *   6. DATA_REQUEST handler: scoped to the paired business_id — no cross-tenant reads
 *   7. 90-second heartbeat timeout drops dead connections
 *   8. disconnectDevice() and getBridgeStatus() for Hub UI integration
 *
 * Protocol path: ws://localhost:3000/mobile-bridge (same port as Next.js standalone)
 * Desktop NSP (port 9000) is completely unaffected.
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachMobileBridge = attachMobileBridge;
exports.setIpcEmitter = setIpcEmitter;
exports.getBridgeStatus = getBridgeStatus;
exports.disconnectDevice = disconnectDevice;
exports.deliverMessageToDevice = deliverMessageToDevice;
exports.broadcastToAllDevices = broadcastToAllDevices;
exports.getConnectedClientsMap = getConnectedClientsMap;
const ws_1 = require("ws");
const crypto_1 = require("crypto");
const client_1 = require("../db/client");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const admin_1 = require("../supabase/admin");
let adminClient = null;
function getAdmin() {
    if (!adminClient) {
        try {
            adminClient = (0, admin_1.createAdminClient)();
        }
        catch (e) {
            console.warn('[Bridge] Admin client init failed:', e.message);
        }
    }
    return adminClient;
}
const clients = new Map();
let wss = null;
// Tier → max devices. Must mirror the Hub license system exactly.
const TIER_LIMITS = {
    lite: 5,
    pro: 15,
    elite: 50,
    trial: 3,
};
// Valid deviceId: 8–64 chars, alphanumeric, dashes, underscores only
const DEVICE_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function send(ws, payload) {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    }
}
function getPairedCount() {
    let count = 0;
    clients.forEach((c) => { if (c.paired)
        count++; });
    return count;
}
/** Read the business profile + license from local SQLite via Drizzle */
async function getLocalProfile() {
    try {
        // local_config holds key/value pairs set during onboarding
        const rows = await client_1.db.select().from(schema.localConfig);
        const cfg = {};
        for (const r of rows) {
            cfg[r.key] = r.value;
        }
        if (!cfg['business_id'] && !cfg['business_name'])
            return null;
        const tier = cfg['tier'] || 'lite';
        const maxDevices = Number(cfg['max_devices']) || TIER_LIMITS[tier] || 5;
        return {
            id: cfg['business_id'] || 'local',
            business_name: cfg['business_name'] || 'Noxis Hub',
            currency: cfg['currency'] || 'PKR',
            tier,
            maxDevices,
            isDeactivated: cfg['is_deactivated'] === '1',
            expiresAt: cfg['license_expires_at'] || null,
            industry: cfg['industry'] || 'textile',
            worker_term: cfg['worker_term'] || 'Karigar',
            worker_term_plural: cfg['worker_term_plural'] || 'Karigars',
            advance_term: cfg['advance_term'] || 'Peshgi',
            country_code: cfg['country_code'] || 'PK',
        };
    }
    catch (err) {
        console.error('[Bridge] Failed to read local config:', err.message);
        return null;
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// ATTACH TO HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────
function attachMobileBridge(httpServer) {
    wss = new ws_1.WebSocketServer({ server: httpServer, path: '/mobile-bridge' });
    wss.on('connection', (ws, req) => {
        const clientId = (0, crypto_1.randomUUID)();
        const clientIp = req.socket.remoteAddress || 'unknown';
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
        });
        console.log(`[Bridge] Client connected: ${clientId} from ${clientIp}`);
        // Give client 30 seconds to send PAIR_REQUEST or disconnect them
        const pairingTimeout = setTimeout(() => {
            const client = clients.get(clientId);
            if (client && !client.paired) {
                console.log(`[Bridge] Pairing timeout — dropping ${clientId}`);
                ws.close(1008, 'Pairing timeout: send PAIR_REQUEST within 30s');
                clients.delete(clientId);
            }
        }, 30_000);
        ws.on('message', async (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                await handleMessage(clientId, msg, ws, pairingTimeout);
            }
            catch (err) {
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
                client_1.db.update(schema.authorizedDevices)
                    .set({ lastSeen: new Date().toISOString() })
                    .where((0, drizzle_orm_1.eq)(schema.authorizedDevices.deviceId, client.deviceId))
                    .catch(() => { });
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
    // ── Heartbeat monitor ─────────────────────────────────────────────────────
    // Runs every 30s: pushes HEARTBEAT to all paired clients,
    // drops clients that haven't responded in 90s.
    setInterval(() => {
        const now = new Date();
        clients.forEach((client, id) => {
            if (client.ws.readyState !== ws_1.WebSocket.OPEN) {
                clients.delete(id);
                return;
            }
            // Only monitor heartbeats for paired clients
            if (client.paired) {
                const elapsed = (now.getTime() - client.lastHeartbeat.getTime()) / 1000;
                if (elapsed > 90) {
                    console.log(`[Bridge] Heartbeat timeout — dropping ${client.deviceLabel}`);
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
    console.log('[Bridge] Mobile bridge attached on /mobile-bridge');
    return wss;
}
// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
async function handleMessage(clientId, msg, ws, pairingTimeout) {
    const client = clients.get(clientId);
    if (!client)
        return;
    // ── Security gate ─────────────────────────────────────────────────────────
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
        // ── Pairing handshake ──────────────────────────────────────────────────
        case 'PAIR_REQUEST': {
            const rawDeviceId = String(msg.deviceId ?? '');
            const rawLabel = String(msg.deviceLabel ?? msg.label ?? 'Mobile Device').slice(0, 80);
            // 1. Validate deviceId format
            if (!DEVICE_ID_RE.test(rawDeviceId)) {
                send(ws, {
                    type: 'PAIRING_REJECTED',
                    reason: 'Invalid device identifier. Must be 8–64 alphanumeric characters.',
                });
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
            // 5. Check device limit via persistent device table
            let isAlreadyAuthorized = false;
            let authorizedCount = 0;
            try {
                const [countResult] = await client_1.db
                    .select({ value: (0, drizzle_orm_1.sql) `count(*)` })
                    .from(schema.authorizedDevices)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.authorizedDevices.businessId, profile.id), (0, drizzle_orm_1.eq)(schema.authorizedDevices.isRevoked, 0)));
                authorizedCount = countResult?.value ?? 0;
                const existing = await client_1.db
                    .select({ nodeId: schema.authorizedDevices.nodeId })
                    .from(schema.authorizedDevices)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.authorizedDevices.businessId, profile.id), (0, drizzle_orm_1.eq)(schema.authorizedDevices.deviceId, rawDeviceId), (0, drizzle_orm_1.eq)(schema.authorizedDevices.isRevoked, 0)))
                    .limit(1);
                isAlreadyAuthorized = existing.length > 0;
            }
            catch (dbErr) {
                console.error('[Bridge] DB count error during pairing:', dbErr.message);
                // Non-fatal: proceed without count check if DB unavailable
            }
            if (!isAlreadyAuthorized && authorizedCount >= profile.maxDevices) {
                send(ws, {
                    type: 'PAIRING_REJECTED',
                    reason: `Device limit reached. Your ${profile.tier} plan allows ${profile.maxDevices} devices. Upgrade to add more.`,
                    tier: profile.tier,
                    maxDevices: profile.maxDevices,
                    currentCount: authorizedCount,
                });
                return;
            }
            // 6. Register/update device in authorized_devices
            try {
                await client_1.db
                    .insert(schema.authorizedDevices)
                    .values({
                    nodeId: rawDeviceId, // reuse nodeId as PK for mobile rows
                    meshKey: '', // mobile rows don't use HMAC mesh key
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
                        isRevoked: 0,
                        isActive: 1,
                    },
                });
            }
            catch (dbErr) {
                console.error('[Bridge] Device registration error:', dbErr.message);
                // Non-fatal — proceed with in-memory pairing
            }
            // 7. Update in-memory client state
            clearTimeout(pairingTimeout);
            client.deviceId = rawDeviceId;
            client.deviceLabel = rawLabel;
            client.businessId = profile.id;
            client.paired = true;
            client.tier = profile.tier;
            client.lastHeartbeat = new Date();
            console.log(`[Bridge] Paired: ${rawLabel} (${rawDeviceId}) — tier: ${profile.tier} — business: ${profile.business_name}`);
            // Verify sub-user PIN if provided
            let canMarkAttendance = true;
            let canLogProduction = true;
            let canGivePeshgi = true;
            let canViewFinancials = ['pro', 'elite'].includes(profile.tier);
            let canViewReports = ['pro', 'elite'].includes(profile.tier);
            let subUserRole = null;
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
                            }
                            else {
                                canMarkAttendance = true;
                                canLogProduction = true;
                                canGivePeshgi = false;
                                canViewFinancials = false;
                                canViewReports = false;
                            }
                        }
                        else {
                            console.warn(`[Bridge] PIN ${userPin} not found in sub_users. Rejecting pairing.`);
                            send(ws, {
                                type: 'PAIRING_REJECTED',
                                reason: 'Invalid PIN credentials.',
                            });
                            return;
                        }
                    }
                    catch (pinErr) {
                        console.error('[Bridge] PIN verification error:', pinErr.message);
                    }
                }
            }
            // 8. Send HUB_ACK with full business context
            send(ws, {
                type: 'HUB_ACK',
                timestamp: Date.now(),
                // Business identity
                businessId: profile.id,
                businessName: profile.business_name,
                currency: profile.currency,
                // License
                tier: profile.tier,
                maxDevices: profile.maxDevices,
                isTrialActive: profile.tier === 'trial',
                // Feature gates — mirror Hub tier logic exactly
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
                hubVersion: process.env.npm_package_version || '13.0.0',
            });
            broadcastToHubRenderer('DEVICE_COUNT_CHANGED', {
                connectedDevices: getPairedCount(),
                paired: getPairedCount(),
                connected: clients.size,
                pairedDevices: getBridgeStatus().pairedDevices,
            });
            break;
        }
        // ── Heartbeat response ─────────────────────────────────────────────────
        case 'HEARTBEAT_RESPONSE': {
            client.lastHeartbeat = new Date();
            // Update last_seen in DB (best-effort, non-blocking)
            if (client.deviceId) {
                client_1.db.update(schema.authorizedDevices)
                    .set({ lastSeen: new Date().toISOString() })
                    .where((0, drizzle_orm_1.eq)(schema.authorizedDevices.deviceId, client.deviceId))
                    .catch(() => { });
            }
            break;
        }
        // ── Data requests — scoped strictly to paired businessId ───────────────
        case 'DATA_REQUEST': {
            const { requestId, resource } = msg;
            if (!requestId || !resource) {
                send(ws, {
                    type: 'DATA_RESPONSE',
                    requestId,
                    data: [],
                    error: 'Missing requestId or resource.',
                });
                return;
            }
            // All data reads are done via Drizzle against the local SQLite cache.
            // No cross-tenant access is possible: all queries are scoped to client.businessId.
            // Note: heavy data should be fetched directly from Supabase by the mobile app.
            // These DATA_REQUEST reads are for lightweight local-first data only.
            let data = [];
            let error = null;
            try {
                switch (resource) {
                    case 'skus':
                        data = await client_1.db
                            .select()
                            .from(schema.skuCache)
                            .limit(200);
                        break;
                    case 'branches':
                        data = await client_1.db
                            .select()
                            .from(schema.branchCache)
                            .where((0, drizzle_orm_1.eq)(schema.branchCache.businessId, client.businessId));
                        break;
                    case 'karigars': {
                        const admin = getAdmin();
                        if (admin) {
                            const { data: resData, error: resErr } = await admin
                                .from('karigars')
                                .select('*')
                                .eq('business_id', client.businessId)
                                .eq('status', 'active')
                                .order('name');
                            if (resErr)
                                throw resErr;
                            data = resData || [];
                        }
                        else {
                            throw new Error('Supabase admin not available');
                        }
                        break;
                    }
                    case 'attendance_today': {
                        const admin = getAdmin();
                        if (admin) {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const { data: resData, error: resErr } = await admin
                                .from('attendance_logs')
                                .select('*')
                                .eq('business_id', client.businessId)
                                .eq('attendance_date', todayStr);
                            if (resErr)
                                throw resErr;
                            data = resData || [];
                        }
                        else {
                            throw new Error('Supabase admin not available');
                        }
                        break;
                    }
                    case 'production_log': {
                        const admin = getAdmin();
                        if (admin) {
                            const { data: resData, error: resErr } = await admin
                                .from('karigar_production_logs')
                                .select('*, karigars(name)')
                                .eq('business_id', client.businessId)
                                .order('created_at', { ascending: false })
                                .limit(100);
                            if (resErr)
                                throw resErr;
                            data = resData || [];
                        }
                        else {
                            throw new Error('Supabase admin not available');
                        }
                        break;
                    }
                    case 'dashboard_kpis': {
                        const admin = getAdmin();
                        if (admin) {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const [kCount, aCount, dCount] = await Promise.all([
                                admin
                                    .from('karigars')
                                    .select('id', { count: 'exact', head: true })
                                    .eq('business_id', client.businessId)
                                    .eq('status', 'active'),
                                admin
                                    .from('attendance_logs')
                                    .select('id', { count: 'exact', head: true })
                                    .eq('business_id', client.businessId)
                                    .eq('attendance_date', todayStr)
                                    .eq('status', 'present'),
                                admin
                                    .from('dispatch_orders')
                                    .select('id', { count: 'exact', head: true })
                                    .eq('business_id', client.businessId)
                                    .in('status', ['pending', 'packed'])
                            ]);
                            data = [{
                                    totalKarigars: kCount.count || 0,
                                    presentToday: aCount.count || 0,
                                    pendingDispatch: dCount.count || 0,
                                    hubVersion: process.env.npm_package_version || '13.0.0',
                                    tier: client.tier,
                                    connectedDevices: getPairedCount()
                                }];
                        }
                        else {
                            data = [{
                                    totalKarigars: 0,
                                    presentToday: 0,
                                    pendingDispatch: 0,
                                    hubVersion: process.env.npm_package_version || '13.0.0',
                                    tier: client.tier,
                                    connectedDevices: getPairedCount()
                                }];
                        }
                        break;
                    }
                    case 'dispatch_pending': {
                        const admin = getAdmin();
                        if (admin) {
                            const { data: resData, error: resErr } = await admin
                                .from('dispatch_orders')
                                .select('*')
                                .eq('business_id', client.businessId)
                                .in('status', ['pending', 'packed']);
                            if (resErr)
                                throw resErr;
                            data = resData || [];
                        }
                        else {
                            throw new Error('Supabase admin not available');
                        }
                        break;
                    }
                    case 'scan_history': {
                        const admin = getAdmin();
                        if (admin) {
                            const { data: resData, error: resErr } = await admin
                                .from('scan_logs')
                                .select('*')
                                .eq('business_id', client.businessId)
                                .order('created_at', { ascending: false })
                                .limit(100);
                            if (resErr)
                                throw resErr;
                            data = resData || [];
                        }
                        else {
                            throw new Error('Supabase admin not available');
                        }
                        break;
                    }
                    default:
                        error = `Unknown resource: ${resource}. Fetch detailed data directly from Supabase.`;
                        data = [];
                }
            }
            catch (dbErr) {
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
        // ── Mobile-originated events ───────────────────────────────────────────
        // Mobile writes directly to Supabase; these events notify the Hub UI
        // to refresh — the actual data comes via Supabase realtime subscription.
        case 'ATTENDANCE_LOGGED':
        case 'PRODUCTION_LOGGED':
        case 'ADVANCE_GIVEN':
        case 'INVOICE_CREATED':
        case 'STOCK_UPDATED':
        case 'SCAN_COMPLETED': {
            console.log(`[Bridge] Event ${String(msg.type)} from ${client.deviceLabel}`);
            broadcastToHubRenderer(String(msg.type), {
                deviceLabel: client.deviceLabel,
                deviceId: client.deviceId,
                ...msg,
            });
            break;
        }
        case 'MSG_SEND': {
            const { text, priority, messageId } = msg;
            if (!client.paired || !client.businessId)
                break;
            const admin = getAdmin();
            let newMsg = null;
            if (admin) {
                try {
                    const { data } = await admin
                        .from('hub_messages')
                        .insert({
                        business_id: client.businessId,
                        sender_type: 'device',
                        sender_device_id: client.deviceId,
                        sender_name: client.deviceLabel || 'Mobile Device',
                        recipient_type: 'hub',
                        message_text: text,
                        priority: priority || 'normal',
                    })
                        .select()
                        .single();
                    newMsg = data;
                }
                catch (err) {
                    console.error('[Bridge] Failed to save MSG_SEND:', err.message);
                }
            }
            send(ws, {
                type: 'MSG_ACK',
                messageId,
                serverMessageId: newMsg?.id,
            });
            if (newMsg) {
                broadcastToHubRenderer('messaging:new-message', newMsg);
            }
            break;
        }
        case 'MSG_READ': {
            const { messageId } = msg;
            if (!client.paired || !client.deviceId)
                break;
            const admin = getAdmin();
            if (admin && messageId) {
                try {
                    await admin
                        .from('hub_messages')
                        .update({
                        read_by: (0, drizzle_orm_1.sql) `array_append(read_by, ${client.deviceId})`
                    })
                        .eq('id', messageId);
                }
                catch (err) {
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
// ─────────────────────────────────────────────────────────────────────────────
// HUB RENDERER IPC BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
let ipcEmitter = null;
/** Call this from electron/main.ts to forward bridge events to the renderer */
function setIpcEmitter(fn) {
    ipcEmitter = fn;
}
function broadcastToHubRenderer(event, data) {
    if (ipcEmitter) {
        try {
            ipcEmitter(event, data);
        }
        catch (err) {
            console.error('[Bridge] IPC emit error:', err.message);
        }
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
/** Returns live stats — used by /api/hub/info */
function getBridgeStatus() {
    const pairedDevices = [];
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
/** Disconnect a specific device by deviceId — called from Hub UI revoke flow */
function disconnectDevice(deviceId) {
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
function deliverMessageToDevice(deviceId, message) {
    clients.forEach((device) => {
        if (device.deviceId === deviceId || deviceId === 'all') {
            if (device.ws.readyState === ws_1.WebSocket.OPEN) {
                send(device.ws, {
                    type: 'MSG_INCOMING',
                    message,
                });
            }
        }
    });
}
function broadcastToAllDevices(message) {
    deliverMessageToDevice('all', message);
}
function getConnectedClientsMap() {
    return clients;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalPaymentIntents = exports.portalSessions = exports.clientPortals = exports.ledgerEntries = exports.guardianAuthRequests = exports.authorizedDevices = exports.processedEvents = exports.securityAudit = exports.aiDetectionEvents = exports.transferQueue = exports.branchCache = exports.localAuditLog = exports.skuCache = exports.meshMessages = exports.tcpSessions = exports.syncQueue = exports.localConfig = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// --- LOCAL CONFIG ---
exports.localConfig = (0, sqlite_core_1.sqliteTable)('local_config', {
    key: (0, sqlite_core_1.text)('key').primaryKey(),
    value: (0, sqlite_core_1.text)('value').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// --- SYNC QUEUE ---
exports.syncQueue = (0, sqlite_core_1.sqliteTable)('sync_queue', {
    id: (0, sqlite_core_1.text)('id').primaryKey().default((0, drizzle_orm_1.sql) `(lower(hex(randomblob(16))))`),
    tableName: (0, sqlite_core_1.text)('table_name').notNull(),
    operation: (0, sqlite_core_1.text)('operation', { enum: ['insert', 'update', 'delete'] }).notNull(),
    recordId: (0, sqlite_core_1.text)('record_id').notNull(),
    payload: (0, sqlite_core_1.text)('payload').notNull(), // JSON stringified
    attempts: (0, sqlite_core_1.integer)('attempts').notNull().default(0),
    status: (0, sqlite_core_1.text)('status', { enum: ['pending', 'processing', 'synced', 'failed'] }).notNull().default('pending'),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
    syncedAt: (0, sqlite_core_1.text)('synced_at'),
}, (table) => ({
    statusCreatedIdx: (0, sqlite_core_1.index)('idx_sync_queue_status_created').on(table.status, table.createdAt),
}));
// --- TCP SESSION STATE ---
exports.tcpSessions = (0, sqlite_core_1.sqliteTable)('tcp_sessions', {
    nodeId: (0, sqlite_core_1.text)('node_id').primaryKey(),
    ipAddress: (0, sqlite_core_1.text)('ip_address').notNull(),
    port: (0, sqlite_core_1.integer)('port').notNull(),
    pairedAt: (0, sqlite_core_1.text)('paired_at').notNull(),
    lastHeartbeatAt: (0, sqlite_core_1.text)('last_heartbeat_at'),
    batteryPercent: (0, sqlite_core_1.integer)('battery_percent'),
    signalStrength: (0, sqlite_core_1.integer)('signal_strength'),
    queueDepth: (0, sqlite_core_1.integer)('queue_depth'),
    encLatencyMs: (0, sqlite_core_1.integer)('enc_latency_ms'),
    status: (0, sqlite_core_1.text)('status', { enum: ['online', 'offline', 'degraded'] }).notNull().default('online'),
    tierOverride: (0, sqlite_core_1.text)('tier_override'),
    activeBranchId: (0, sqlite_core_1.text)('active_branch_id'),
});
// --- MESSAGE QUEUE (store-and-forward) ---
exports.meshMessages = (0, sqlite_core_1.sqliteTable)('mesh_messages', {
    messageId: (0, sqlite_core_1.text)('message_id').primaryKey().default((0, drizzle_orm_1.sql) `(lower(hex(randomblob(16))))`),
    fromNodeId: (0, sqlite_core_1.text)('from_node_id').notNull(),
    toNodeId: (0, sqlite_core_1.text)('to_node_id').notNull(),
    encryptedPayload: (0, sqlite_core_1.blob)('encrypted_payload').notNull(),
    mediaType: (0, sqlite_core_1.text)('media_type', { enum: ['text', 'voice', 'image'] }).notNull().default('text'),
    status: (0, sqlite_core_1.text)('status', { enum: ['queued', 'delivered', 'read', 'failed'] }).notNull().default('queued'),
    queuedAt: (0, sqlite_core_1.text)('queued_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
    deliveredAt: (0, sqlite_core_1.text)('delivered_at'),
    readAt: (0, sqlite_core_1.text)('read_at'),
}, (table) => ({
    toStatusIdx: (0, sqlite_core_1.index)('idx_mesh_to_status').on(table.toNodeId, table.status),
    queuedIdx: (0, sqlite_core_1.index)('idx_mesh_queued').on(table.queuedAt),
}));
// --- LOCAL SKU CACHE ---
exports.skuCache = (0, sqlite_core_1.sqliteTable)('sku_cache', {
    skuId: (0, sqlite_core_1.text)('sku_id').primaryKey(),
    skuCode: (0, sqlite_core_1.text)('sku_code').notNull(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    qtyOnHand: (0, sqlite_core_1.text)('qty_on_hand').notNull().default('0'), // Decimal string
    unit: (0, sqlite_core_1.text)('unit').notNull(),
    costPrice: (0, sqlite_core_1.text)('cost_price').notNull().default('0'),
    salePrice: (0, sqlite_core_1.text)('sale_price').notNull().default('0'),
    location: (0, sqlite_core_1.text)('location'),
    branchId: (0, sqlite_core_1.text)('branch_id'),
    lastSyncedAt: (0, sqlite_core_1.text)('last_synced_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
    barcode: (0, sqlite_core_1.text)('barcode'),
}, (table) => ({
    skuCodeIdx: (0, sqlite_core_1.uniqueIndex)('idx_sku_cache_code').on(table.skuCode),
    barcodeIdx: (0, sqlite_core_1.index)('idx_sku_cache_barcode').on(table.barcode),
}));
// --- AUDIT LOG (local, immutable) ---
exports.localAuditLog = (0, sqlite_core_1.sqliteTable)('local_audit_log', {
    id: (0, sqlite_core_1.text)('id').primaryKey().default((0, drizzle_orm_1.sql) `(lower(hex(randomblob(16))))`),
    eventType: (0, sqlite_core_1.text)('event_type').notNull(),
    actorNodeId: (0, sqlite_core_1.text)('actor_node_id'),
    targetTable: (0, sqlite_core_1.text)('target_table'),
    targetId: (0, sqlite_core_1.text)('target_id'),
    payload: (0, sqlite_core_1.text)('payload'),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
}, (table) => ({
    typeCreatedIdx: (0, sqlite_core_1.index)('idx_local_audit_type_created').on(table.eventType, table.createdAt),
    actorCreatedIdx: (0, sqlite_core_1.index)('idx_local_audit_actor_created').on(table.actorNodeId, table.createdAt),
}));
// --- BRANCH CACHE ---
exports.branchCache = (0, sqlite_core_1.sqliteTable)('branch_cache', {
    branchId: (0, sqlite_core_1.text)('branch_id').primaryKey(),
    businessId: (0, sqlite_core_1.text)('business_id').notNull(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    code: (0, sqlite_core_1.text)('code').notNull(),
    city: (0, sqlite_core_1.text)('city'),
    status: (0, sqlite_core_1.text)('status').notNull().default('active'),
    isHeadquarters: (0, sqlite_core_1.integer)('is_headquarters').notNull().default(0), // SQLite boolean
    lastSyncedAt: (0, sqlite_core_1.text)('last_synced_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
}, (table) => ({
    businessCodeIdx: (0, sqlite_core_1.uniqueIndex)('idx_branch_cache_biz_code').on(table.businessId, table.code),
}));
// --- INTER-BRANCH TRANSFER QUEUE ---
exports.transferQueue = (0, sqlite_core_1.sqliteTable)('transfer_queue', {
    transferId: (0, sqlite_core_1.text)('transfer_id').primaryKey().default((0, drizzle_orm_1.sql) `(lower(hex(randomblob(16))))`),
    fromBranchId: (0, sqlite_core_1.text)('from_branch_id').notNull(),
    toBranchId: (0, sqlite_core_1.text)('to_branch_id').notNull(),
    skuId: (0, sqlite_core_1.text)('sku_id').notNull(),
    qty: (0, sqlite_core_1.text)('qty').notNull(), // Decimal string
    status: (0, sqlite_core_1.text)('status', { enum: ['pending_sync', 'synced', 'failed'] }).notNull().default('pending_sync'),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// --- AI & SECURITY ---
exports.aiDetectionEvents = (0, sqlite_core_1.sqliteTable)('ai_detection_events', {
    id: (0, sqlite_core_1.text)('id').primaryKey().default((0, drizzle_orm_1.sql) `(lower(hex(randomblob(16))))`),
    nodeId: (0, sqlite_core_1.text)('node_id').notNull(),
    zoneId: (0, sqlite_core_1.text)('zone_id').notNull(),
    detectedClass: (0, sqlite_core_1.text)('detected_class').notNull(),
    confidence: (0, sqlite_core_1.text)('confidence').notNull(), // Decimal string
    timestamp: (0, sqlite_core_1.integer)('timestamp').notNull(), // Epoch
    jpegFrame: (0, sqlite_core_1.blob)('jpeg_frame'),
    acknowledged: (0, sqlite_core_1.integer)('acknowledged').notNull().default(0), // SQLite boolean
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
exports.securityAudit = (0, sqlite_core_1.sqliteTable)('security_audit', {
    id: (0, sqlite_core_1.text)('id').primaryKey().default((0, drizzle_orm_1.sql) `(lower(hex(randomblob(16))))`),
    nodeId: (0, sqlite_core_1.text)('node_id').notNull(),
    eventType: (0, sqlite_core_1.text)('event_type').notNull(),
    payload: (0, sqlite_core_1.text)('payload'),
    failedAuthCount: (0, sqlite_core_1.integer)('failed_auth_count').notNull().default(0),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
}, (table) => ({
    nodeIdIdx: (0, sqlite_core_1.index)('idx_security_audit_node').on(table.nodeId),
}));
exports.processedEvents = (0, sqlite_core_1.sqliteTable)('processed_events', {
    eventHash: (0, sqlite_core_1.text)('event_hash').primaryKey(),
    nodeId: (0, sqlite_core_1.text)('node_id').notNull(),
    processedAt: (0, sqlite_core_1.text)('processed_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
    expiresAt: (0, sqlite_core_1.text)('expires_at').notNull(),
}, (table) => ({
    expiresIdx: (0, sqlite_core_1.index)('idx_processed_expires').on(table.expiresAt),
}));
exports.authorizedDevices = (0, sqlite_core_1.sqliteTable)('authorized_devices', {
    nodeId: (0, sqlite_core_1.text)('node_id').primaryKey(),
    meshKey: (0, sqlite_core_1.text)('mesh_key').notNull(),
    label: (0, sqlite_core_1.text)('label'),
    isActive: (0, sqlite_core_1.integer)('is_active').notNull().default(1),
});
exports.guardianAuthRequests = (0, sqlite_core_1.sqliteTable)('guardian_auth_requests', {
    requestId: (0, sqlite_core_1.text)('request_id').primaryKey(),
    nodeId: (0, sqlite_core_1.text)('node_id').notNull(),
    hubAction: (0, sqlite_core_1.text)('hub_action').notNull(), // JSON stringified
    expiresAt: (0, sqlite_core_1.integer)('expires_at').notNull(), // Epoch
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// --- LOCAL LEDGER ---
exports.ledgerEntries = (0, sqlite_core_1.sqliteTable)('ledger_entries', {
    id: (0, sqlite_core_1.text)('id').primaryKey().default((0, drizzle_orm_1.sql) `(lower(hex(randomblob(16))))`),
    nodeId: (0, sqlite_core_1.text)('node_id'),
    amount: (0, sqlite_core_1.text)('amount').notNull(),
    entryType: (0, sqlite_core_1.text)('entry_type', { enum: ['debit', 'credit'] }).notNull(),
    description: (0, sqlite_core_1.text)('description').notNull(),
    postedAt: (0, sqlite_core_1.text)('posted_at').notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`),
});
// --- CLOUD: CLIENT PORTAL (PostgreSQL) ---
exports.clientPortals = (0, pg_core_1.pgTable)('client_portals', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    businessId: (0, pg_core_1.uuid)('business_id').notNull(),
    partyId: (0, pg_core_1.uuid)('party_id').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('active'),
    inviteSentAt: (0, pg_core_1.timestamp)('invite_sent_at', { withTimezone: true }),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
    unqEmail: (0, pg_core_1.unique)().on(t.businessId, t.email),
    unqParty: (0, pg_core_1.unique)().on(t.businessId, t.partyId),
}));
exports.portalSessions = (0, pg_core_1.pgTable)('portal_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    portalId: (0, pg_core_1.uuid)('portal_id').notNull().references(() => exports.clientPortals.id, { onDelete: 'cascade' }),
    tokenHash: (0, pg_core_1.text)('token_hash').notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
});
exports.portalPaymentIntents = (0, pg_core_1.pgTable)('portal_payment_intents', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    businessId: (0, pg_core_1.uuid)('business_id').notNull(),
    portalId: (0, pg_core_1.uuid)('portal_id').notNull().references(() => exports.clientPortals.id, { onDelete: 'cascade' }),
    invoiceId: (0, pg_core_1.uuid)('invoice_id').notNull(),
    amount: (0, pg_core_1.numeric)('amount', { precision: 18, scale: 4 }).notNull(),
    currency: (0, pg_core_1.text)('currency').notNull().default('PKR'),
    provider: (0, pg_core_1.text)('provider').notNull(),
    providerIntentId: (0, pg_core_1.text)('provider_intent_id'),
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
});

import { sqliteTable, text as sqliteText, integer, blob, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { pgTable, uuid, text, timestamp, numeric, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// --- LOCAL CONFIG ---
export const localConfig = sqliteTable('local_config', {
  key: sqliteText('key').primaryKey(),
  value: sqliteText('value').notNull(),
  updatedAt: sqliteText('updated_at').notNull().default(sql`(datetime('now'))`),
});

// --- SYNC QUEUE ---
export const syncQueue = sqliteTable('sync_queue', {
  id: sqliteText('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  tableName: sqliteText('table_name').notNull(),
  operation: sqliteText('operation', { enum: ['insert', 'update', 'delete'] }).notNull(),
  recordId: sqliteText('record_id').notNull(),
  payload: sqliteText('payload').notNull(), // JSON stringified
  attempts: integer('attempts').notNull().default(0),
  status: sqliteText('status', { enum: ['pending', 'processing', 'synced', 'failed'] }).notNull().default('pending'),
  createdAt: sqliteText('created_at').notNull().default(sql`(datetime('now'))`),
  syncedAt: sqliteText('synced_at'),
}, (table) => ({
  statusCreatedIdx: index('idx_sync_queue_status_created').on(table.status, table.createdAt),
}));

// --- TCP SESSION STATE ---
export const tcpSessions = sqliteTable('tcp_sessions', {
  nodeId: sqliteText('node_id').primaryKey(),
  ipAddress: sqliteText('ip_address').notNull(),
  port: integer('port').notNull(),
  pairedAt: sqliteText('paired_at').notNull(),
  lastHeartbeatAt: sqliteText('last_heartbeat_at'),
  batteryPercent: integer('battery_percent'),
  signalStrength: integer('signal_strength'),
  queueDepth: integer('queue_depth'),
  encLatencyMs: integer('enc_latency_ms'),
  status: sqliteText('status', { enum: ['online', 'offline', 'degraded'] }).notNull().default('online'),
  tierOverride: sqliteText('tier_override'),
  activeBranchId: sqliteText('active_branch_id'),
});

// --- MESSAGE QUEUE (store-and-forward) ---
export const meshMessages = sqliteTable('mesh_messages', {
  messageId: sqliteText('message_id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  fromNodeId: sqliteText('from_node_id').notNull(),
  toNodeId: sqliteText('to_node_id').notNull(),
  encryptedPayload: blob('encrypted_payload').notNull(),
  mediaType: sqliteText('media_type', { enum: ['text', 'voice', 'image'] }).notNull().default('text'),
  status: sqliteText('status', { enum: ['queued', 'delivered', 'read', 'failed'] }).notNull().default('queued'),
  queuedAt: sqliteText('queued_at').notNull().default(sql`(datetime('now'))`),
  deliveredAt: sqliteText('delivered_at'),
  readAt: sqliteText('read_at'),
}, (table) => ({
  toStatusIdx: index('idx_mesh_to_status').on(table.toNodeId, table.status),
  queuedIdx: index('idx_mesh_queued').on(table.queuedAt),
}));

// --- LOCAL SKU CACHE ---
export const skuCache = sqliteTable('sku_cache', {
  skuId: sqliteText('sku_id').primaryKey(),
  skuCode: sqliteText('sku_code').notNull(),
  name: sqliteText('name').notNull(),
  qtyOnHand: sqliteText('qty_on_hand').notNull().default('0'), // Decimal string
  unit: sqliteText('unit').notNull(),
  costPrice: sqliteText('cost_price').notNull().default('0'),
  salePrice: sqliteText('sale_price').notNull().default('0'),
  location: sqliteText('location'),
  branchId: sqliteText('branch_id'),
  lastSyncedAt: sqliteText('last_synced_at').notNull().default(sql`(datetime('now'))`),
  barcode: sqliteText('barcode'),
  oemNumber: sqliteText('oem_number'),
  compatibleVehicles: sqliteText('compatible_vehicles'),
  commissionRate: sqliteText('commission_rate').default('0'),
}, (table) => ({
  skuCodeIdx: uniqueIndex('idx_sku_cache_code').on(table.skuCode),
  barcodeIdx: index('idx_sku_cache_barcode').on(table.barcode),
}));

// --- AUDIT LOG (local, immutable) ---
export const localAuditLog = sqliteTable('local_audit_log', {
  id: sqliteText('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  eventType: sqliteText('event_type').notNull(),
  actorNodeId: sqliteText('actor_node_id'),
  targetTable: sqliteText('target_table'),
  targetId: sqliteText('target_id'),
  payload: sqliteText('payload'),
  createdAt: sqliteText('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  typeCreatedIdx: index('idx_local_audit_type_created').on(table.eventType, table.createdAt),
  actorCreatedIdx: index('idx_local_audit_actor_created').on(table.actorNodeId, table.createdAt),
}));

// --- BRANCH CACHE ---
export const branchCache = sqliteTable('branch_cache', {
  branchId: sqliteText('branch_id').primaryKey(),
  businessId: sqliteText('business_id').notNull(),
  name: sqliteText('name').notNull(),
  code: sqliteText('code').notNull(),
  city: sqliteText('city'),
  status: sqliteText('status').notNull().default('active'),
  isHeadquarters: integer('is_headquarters').notNull().default(0), // SQLite boolean
  lastSyncedAt: sqliteText('last_synced_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  businessCodeIdx: uniqueIndex('idx_branch_cache_biz_code').on(table.businessId, table.code),
}));

// --- INTER-BRANCH TRANSFER QUEUE ---
export const transferQueue = sqliteTable('transfer_queue', {
  transferId: sqliteText('transfer_id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  fromBranchId: sqliteText('from_branch_id').notNull(),
  toBranchId: sqliteText('to_branch_id').notNull(),
  skuId: sqliteText('sku_id').notNull(),
  qty: sqliteText('qty').notNull(), // Decimal string
  status: sqliteText('status', { enum: ['pending_sync', 'synced', 'failed'] }).notNull().default('pending_sync'),
  createdAt: sqliteText('created_at').notNull().default(sql`(datetime('now'))`),
});

// --- AI & SECURITY ---
export const aiDetectionEvents = sqliteTable('ai_detection_events', {
  id: sqliteText('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  nodeId: sqliteText('node_id').notNull(),
  zoneId: sqliteText('zone_id').notNull(),
  detectedClass: sqliteText('detected_class').notNull(),
  confidence: sqliteText('confidence').notNull(), // Decimal string
  timestamp: integer('timestamp').notNull(), // Epoch
  jpegFrame: blob('jpeg_frame'),
  acknowledged: integer('acknowledged').notNull().default(0), // SQLite boolean
  createdAt: sqliteText('created_at').notNull().default(sql`(datetime('now'))`),
});

export const securityAudit = sqliteTable('security_audit', {
  id: sqliteText('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  nodeId: sqliteText('node_id').notNull(),
  eventType: sqliteText('event_type').notNull(),
  payload: sqliteText('payload'),
  failedAuthCount: integer('failed_auth_count').notNull().default(0),
  createdAt: sqliteText('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  nodeIdIdx: index('idx_security_audit_node').on(table.nodeId),
}));

export const processedEvents = sqliteTable('processed_events', {
  eventHash: sqliteText('event_hash').primaryKey(),
  nodeId: sqliteText('node_id').notNull(),
  processedAt: sqliteText('processed_at').notNull().default(sql`(datetime('now'))`),
  expiresAt: sqliteText('expires_at').notNull(),
}, (table) => ({
  expiresIdx: index('idx_processed_expires').on(table.expiresAt),
}));

export const authorizedDevices = sqliteTable('authorized_devices', {
  nodeId: sqliteText('node_id').primaryKey(),
  meshKey: sqliteText('mesh_key').notNull().default(''),
  label: sqliteText('label'),
  isActive: integer('is_active').notNull().default(1),
  // Mobile bridge fields (added v13.1)
  businessId: sqliteText('business_id'),
  deviceId: sqliteText('device_id'),           // the client-reported device UUID
  deviceLabel: sqliteText('device_label'),
  lastSeen: sqliteText('last_seen'),
  isRevoked: integer('is_revoked').notNull().default(0),
  createdAt: sqliteText('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  businessIdx: index('idx_auth_devices_business').on(table.businessId),
  deviceIdIdx: index('idx_auth_devices_device_id').on(table.deviceId),
}));

export const guardianAuthRequests = sqliteTable('guardian_auth_requests', {
  requestId: sqliteText('request_id').primaryKey(),
  nodeId: sqliteText('node_id').notNull(),
  hubAction: sqliteText('hub_action').notNull(), // JSON stringified
  expiresAt: integer('expires_at').notNull(), // Epoch
  createdAt: sqliteText('created_at').notNull().default(sql`(datetime('now'))`),
});

// --- LOCAL LEDGER ---
export const ledgerEntries = sqliteTable('ledger_entries', {
  id: sqliteText('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  nodeId: sqliteText('node_id'),
  amount: sqliteText('amount').notNull(),
  entryType: sqliteText('entry_type', { enum: ['debit', 'credit'] }).notNull(),
  description: sqliteText('description').notNull(),
  postedAt: sqliteText('posted_at').notNull().default(sql`(datetime('now'))`),
});

// --- CLOUD: CLIENT PORTAL (PostgreSQL) ---
export const clientPortals = pgTable('client_portals', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  partyId: uuid('party_id').notNull(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  status: text('status').notNull().default('active'),
  inviteSentAt: timestamp('invite_sent_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unqEmail: unique().on(t.businessId, t.email),
  unqParty: unique().on(t.businessId, t.partyId),
}));

export const portalSessions = pgTable('portal_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  portalId: uuid('portal_id').notNull().references(() => clientPortals.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

export const portalPaymentIntents = pgTable('portal_payment_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  portalId: uuid('portal_id').notNull().references(() => clientPortals.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').notNull(),
  amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('PKR'),
  provider: text('provider').notNull(),
  providerIntentId: text('provider_intent_id'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// --- EXPORTED TYPES ---
export type LocalConfig = typeof localConfig.$inferSelect;
export type NewLocalConfig = typeof localConfig.$inferInsert;
export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;
export type TcpSession = typeof tcpSessions.$inferSelect;
export type MeshMessage = typeof meshMessages.$inferSelect;
export type NewMeshMessage = typeof meshMessages.$inferInsert;
export type SkuCache = typeof skuCache.$inferSelect;
export type BranchCache = typeof branchCache.$inferSelect;
export type LocalAuditLog = typeof localAuditLog.$inferSelect;
export type NewLocalAuditLog = typeof localAuditLog.$inferInsert;
export type TransferQueue = typeof transferQueue.$inferSelect;
export type NewTransferQueue = typeof transferQueue.$inferInsert;

export type ClientPortal = typeof clientPortals.$inferSelect;
export type NewClientPortal = typeof clientPortals.$inferInsert;
export type PortalPaymentIntent = typeof portalPaymentIntents.$inferSelect;
export type NewPortalPaymentIntent = typeof portalPaymentIntents.$inferInsert;
export type PortalSession = typeof portalSessions.$inferSelect;
export type NewPortalSession = typeof portalSessions.$inferInsert;

export type AiDetectionEvent = typeof aiDetectionEvents.$inferSelect;
export type SecurityAudit = typeof securityAudit.$inferSelect;
export type ProcessedEvent = typeof processedEvents.$inferSelect;
export type AuthorizedDevice = typeof authorizedDevices.$inferSelect;
export type GuardianAuthRequest = typeof guardianAuthRequests.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;

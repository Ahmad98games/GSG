CREATE TABLE `branch_cache` (
	`branch_id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`city` text,
	`status` text DEFAULT 'active' NOT NULL,
	`is_headquarters` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `local_audit_log` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`event_type` text NOT NULL,
	`actor_node_id` text,
	`target_table` text,
	`target_id` text,
	`payload` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `local_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mesh_messages` (
	`message_id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`from_node_id` text NOT NULL,
	`to_node_id` text NOT NULL,
	`encrypted_payload` blob NOT NULL,
	`media_type` text DEFAULT 'text' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`queued_at` text DEFAULT (datetime('now')) NOT NULL,
	`delivered_at` text,
	`read_at` text
);
--> statement-breakpoint
CREATE TABLE `sku_cache` (
	`sku_id` text PRIMARY KEY NOT NULL,
	`sku_code` text NOT NULL,
	`name` text NOT NULL,
	`qty_on_hand` text DEFAULT '0' NOT NULL,
	`unit` text NOT NULL,
	`cost_price` text DEFAULT '0' NOT NULL,
	`sale_price` text DEFAULT '0' NOT NULL,
	`location` text,
	`branch_id` text,
	`last_synced_at` text DEFAULT (datetime('now')) NOT NULL,
	`barcode` text
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`table_name` text NOT NULL,
	`operation` text NOT NULL,
	`record_id` text NOT NULL,
	`payload` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `tcp_sessions` (
	`node_id` text PRIMARY KEY NOT NULL,
	`ip_address` text NOT NULL,
	`port` integer NOT NULL,
	`paired_at` text NOT NULL,
	`last_heartbeat_at` text,
	`battery_percent` integer,
	`signal_strength` integer,
	`queue_depth` integer,
	`enc_latency_ms` integer,
	`status` text DEFAULT 'online' NOT NULL,
	`tier_override` text
);
--> statement-breakpoint
CREATE TABLE `transfer_queue` (
	`transfer_id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`from_branch_id` text NOT NULL,
	`to_branch_id` text NOT NULL,
	`sku_id` text NOT NULL,
	`qty` text NOT NULL,
	`status` text DEFAULT 'pending_sync' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_branch_cache_biz_code` ON `branch_cache` (`business_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_local_audit_type_created` ON `local_audit_log` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_local_audit_actor_created` ON `local_audit_log` (`actor_node_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_mesh_to_status` ON `mesh_messages` (`to_node_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_mesh_queued` ON `mesh_messages` (`queued_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sku_cache_code` ON `sku_cache` (`sku_code`);--> statement-breakpoint
CREATE INDEX `idx_sku_cache_barcode` ON `sku_cache` (`barcode`);--> statement-breakpoint
CREATE INDEX `idx_sync_queue_status_created` ON `sync_queue` (`status`,`created_at`);


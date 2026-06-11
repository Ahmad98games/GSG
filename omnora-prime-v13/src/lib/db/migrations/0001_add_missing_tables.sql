CREATE TABLE `ai_detection_events` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`node_id` text NOT NULL,
	`zone_id` text NOT NULL,
	`detected_class` text NOT NULL,
	`confidence` text NOT NULL,
	`timestamp` integer NOT NULL,
	`jpeg_frame` blob,
	`acknowledged` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `security_audit` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`node_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload` text,
	`failed_auth_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `processed_events` (
	`event_hash` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`processed_at` text DEFAULT (datetime('now')) NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `authorized_devices` (
	`node_id` text PRIMARY KEY NOT NULL,
	`mesh_key` text NOT NULL,
	`label` text,
	`is_active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guardian_auth_requests` (
	`request_id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`hub_action` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`node_id` text,
	`amount` text NOT NULL,
	`entry_type` text NOT NULL,
	`description` text NOT NULL,
	`posted_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_security_audit_node` ON `security_audit` (`node_id`);--> statement-breakpoint
CREATE INDEX `idx_processed_expires` ON `processed_events` (`expires_at`);--> statement-breakpoint
ALTER TABLE `tcp_sessions` ADD COLUMN `active_branch_id` text;


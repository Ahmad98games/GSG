-- Migration 0002: Extend authorized_devices for mobile bridge security (v13.1)
-- Uses ALTER TABLE ADD COLUMN (safe — SQLite allows this without data loss)
-- All new columns are nullable so existing NSP rows are unaffected

ALTER TABLE `authorized_devices` ADD COLUMN `business_id` text;
--> statement-breakpoint
ALTER TABLE `authorized_devices` ADD COLUMN `device_id` text;
--> statement-breakpoint
ALTER TABLE `authorized_devices` ADD COLUMN `device_label` text;
--> statement-breakpoint
ALTER TABLE `authorized_devices` ADD COLUMN `last_seen` text;
--> statement-breakpoint
ALTER TABLE `authorized_devices` ADD COLUMN `is_revoked` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `authorized_devices` ADD COLUMN `created_at` text DEFAULT (datetime('now')) NOT NULL;
--> statement-breakpoint
-- Allow meshKey to be empty for mobile-only device rows
-- (NSP rows will still have a mesh_key, mobile rows use device_id instead)
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_auth_devices_business` ON `authorized_devices` (`business_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_auth_devices_device_id` ON `authorized_devices` (`device_id`);

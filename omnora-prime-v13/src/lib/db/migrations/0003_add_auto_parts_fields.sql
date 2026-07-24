ALTER TABLE `sku_cache` ADD COLUMN `oem_number` text;
ALTER TABLE `sku_cache` ADD COLUMN `compatible_vehicles` text;
ALTER TABLE `sku_cache` ADD COLUMN `commission_rate` text DEFAULT '0';

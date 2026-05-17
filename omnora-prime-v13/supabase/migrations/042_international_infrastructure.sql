-- International Infrastructure Layer
-- Sets up core columns for multi-country support

ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS country_code text
  DEFAULT 'PK';

ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS tax_name text
  DEFAULT 'GST';

ALTER TABLE business_profiles  
ADD COLUMN IF NOT EXISTS tax_rate numeric
  DEFAULT 17;

-- Ensure these are included in any relevant views if they exist
-- (Checking for common views in Noxis Hub)

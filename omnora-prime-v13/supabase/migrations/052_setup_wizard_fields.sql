ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'PK';
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS tax_label text DEFAULT 'GST';
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 17;

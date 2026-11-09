-- ==============================================================================
-- NOXIS HUB — COMMERCIAL LICENSING, HWID TELEMETRY & REMOTE ACCESS CONTROL
-- Migration: 20261108000000_commercial_licenses_hwid_access_control.sql
-- Description: Sets up production-grade license management, machine HWID binding,
--              website lead capture, 1-click workstation ban, and tier upgrades.
-- ==============================================================================

-- 1. ENSURE LICENSES TABLE HAS COMPLETE COMMERCIAL COLUMNS
CREATE TABLE IF NOT EXISTS licenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key text UNIQUE NOT NULL,
  tier text NOT NULL DEFAULT 'trial',
  max_devices integer DEFAULT 1,
  business_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_whatsapp text,
  brand_name text,
  city text,
  hwid text,
  validity_type text DEFAULT 'trial', -- 'trial', 'monthly', 'yearly', 'lifetime'
  is_trial boolean DEFAULT true,
  is_active boolean DEFAULT true,
  is_deactivated boolean DEFAULT false, -- REMOTE WORKSTATION BAN TOGGLE (true = BANNED)
  payment_method text,
  payment_reference text,
  amount_paid numeric DEFAULT 0,
  currency text DEFAULT 'PKR',
  months integer DEFAULT 1,
  notes text,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Idempotent column additions for pre-existing tables
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS customer_whatsapp text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS brand_name text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS hwid text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS validity_type text DEFAULT 'trial';
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS is_trial boolean DEFAULT true;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS is_deactivated boolean DEFAULT false;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS months integer DEFAULT 1;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS currency text DEFAULT 'PKR';
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS activated_at timestamptz;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. CREATE INDEXES FOR HIGH-CONCURRENCY LOOKUPS & TELEMETRY
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_hwid ON licenses(hwid);
CREATE INDEX IF NOT EXISTS idx_licenses_phone ON licenses(customer_phone);
CREATE INDEX IF NOT EXISTS idx_licenses_whatsapp ON licenses(customer_whatsapp);
CREATE INDEX IF NOT EXISTS idx_licenses_deactivated ON licenses(is_deactivated);
CREATE INDEX IF NOT EXISTS idx_licenses_tier ON licenses(tier);

-- 3. AUTO-UPDATE TRIGGER FOR updated_at
CREATE OR REPLACE FUNCTION update_licenses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_licenses_timestamp ON licenses;
CREATE TRIGGER trigger_update_licenses_timestamp
BEFORE UPDATE ON licenses
FOR EACH ROW
EXECUTE FUNCTION update_licenses_timestamp();

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) FOR LIVE APP & WEB TELEMETRY
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Drop prior conflicting policies
DROP POLICY IF EXISTS "anon_insert_leads" ON licenses;
DROP POLICY IF EXISTS "anon_select_licenses" ON licenses;
DROP POLICY IF EXISTS "anon_update_device" ON licenses;
DROP POLICY IF EXISTS "service_role_all" ON licenses;
DROP POLICY IF EXISTS "Allow anon full access" ON licenses;
DROP POLICY IF EXISTS "allow_anon_read_all" ON licenses;
DROP POLICY IF EXISTS "allow_anon_insert" ON licenses;
DROP POLICY IF EXISTS "allow_anon_update" ON licenses;

-- Allow website visitors to submit download leads
CREATE POLICY "anon_insert_leads"
ON licenses FOR INSERT
TO anon
WITH CHECK (true);

-- Allow client workstations to read license & check ban status
CREATE POLICY "anon_select_licenses"
ON licenses FOR SELECT
TO anon
USING (true);

-- Allow client workstations to sync machine HWID on first boot
CREATE POLICY "anon_update_device"
ON licenses FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow service role full administrative power
CREATE POLICY "service_role_all"
ON licenses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. CONVENIENT VIEWS FOR ADMIN MONITORING IN SUPABASE
-- View: All Workstations with Clean Formatted Columns
CREATE OR REPLACE VIEW live_workstations_view AS
SELECT
  id,
  license_key,
  customer_name AS user_name,
  COALESCE(brand_name, 'Standard Business') AS brand_name,
  COALESCE(city, 'N/A') AS city,
  COALESCE(customer_whatsapp, customer_phone) AS whatsapp_number,
  COALESCE(hwid, 'Pending First Run') AS hardware_id,
  tier,
  validity_type,
  is_trial,
  CASE WHEN is_deactivated = true THEN 'BANNED' ELSE 'ACTIVE' END AS access_status,
  is_deactivated AS is_banned,
  expires_at,
  created_at,
  updated_at
FROM licenses
ORDER BY created_at DESC;

-- View: Banned Workstations
CREATE OR REPLACE VIEW banned_workstations_view AS
SELECT * FROM live_workstations_view WHERE is_banned = true;

-- View: Active Free Trials
CREATE OR REPLACE VIEW active_trials_view AS
SELECT * FROM live_workstations_view WHERE is_trial = true AND is_banned = false;

-- Grant permissions for views
GRANT SELECT ON live_workstations_view TO anon, authenticated, service_role;
GRANT SELECT ON banned_workstations_view TO anon, authenticated, service_role;
GRANT SELECT ON active_trials_view TO anon, authenticated, service_role;

-- 6. ADMIN STORED PROCEDURES (Run in Supabase SQL Editor for 1-Click Control)

-- Ban any workstation immediately (supports Phone number, HWID, or License Key)
CREATE OR REPLACE FUNCTION ban_workstation(p_key text, p_reason text DEFAULT 'You cannot use this software. Please pay for the license to continue.')
RETURNS json AS $$
DECLARE
  v_clean_phone text;
  v_phone_last7 text;
  v_count int := 0;
  v_keys text[];
  v_hwids text[];
BEGIN
  v_clean_phone := regexp_replace(p_key, '[^0-9]', '', 'g');
  IF length(v_clean_phone) >= 7 THEN
    v_phone_last7 := right(v_clean_phone, 7);
  ELSE
    v_phone_last7 := 'NOMATCH___';
  END IF;

  -- Collect matching license_keys and hwids
  SELECT 
    coalesce(array_agg(license_key), ARRAY[]::text[]),
    coalesce(array_agg(coalesce(hwid, 'N/A')), ARRAY[]::text[])
  INTO v_keys, v_hwids
  FROM licenses
  WHERE 
    license_key = p_key 
    OR hwid = p_key 
    OR hwid ILIKE '%' || p_key || '%'
    OR notes ILIKE '%' || p_key || '%'
    OR customer_phone = p_key 
    OR customer_whatsapp = p_key
    OR regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = v_clean_phone
    OR regexp_replace(COALESCE(customer_whatsapp, ''), '[^0-9]', '', 'g') = v_clean_phone
    OR (length(v_phone_last7) >= 7 AND (customer_phone ILIKE '%' || v_phone_last7 OR customer_whatsapp ILIKE '%' || v_phone_last7));

  -- Update ALL matching workstations to banned/deactivated
  UPDATE licenses
  SET is_deactivated = true,
      is_active = false,
      notes = COALESCE(notes, '') || ' | BANNED: ' || p_reason || ' (' || now()::text || ')'
  WHERE 
    license_key = p_key 
    OR hwid = p_key 
    OR hwid ILIKE '%' || p_key || '%'
    OR notes ILIKE '%' || p_key || '%'
    OR customer_phone = p_key 
    OR customer_whatsapp = p_key
    OR regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = v_clean_phone
    OR regexp_replace(COALESCE(customer_whatsapp, ''), '[^0-9]', '', 'g') = v_clean_phone
    OR (length(v_phone_last7) >= 7 AND (customer_phone ILIKE '%' || v_phone_last7 OR customer_whatsapp ILIKE '%' || v_phone_last7));
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    RETURN json_build_object(
      'success', true, 
      'message', 'Workstation(s) banned successfully', 
      'banned_count', v_count,
      'keys', v_keys,
      'hwids', v_hwids,
      'matched_input', p_key
    );
  ELSE
    RETURN json_build_object(
      'success', false, 
      'message', 'No workstation found matching input: ' || p_key,
      'banned_count', 0
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unban a workstation (supports Phone number, HWID, or License Key)
CREATE OR REPLACE FUNCTION unban_workstation(p_key text)
RETURNS json AS $$
DECLARE
  v_clean_phone text;
  v_phone_last7 text;
  v_count int := 0;
  v_keys text[];
  v_hwids text[];
BEGIN
  v_clean_phone := regexp_replace(p_key, '[^0-9]', '', 'g');
  IF length(v_clean_phone) >= 7 THEN
    v_phone_last7 := right(v_clean_phone, 7);
  ELSE
    v_phone_last7 := 'NOMATCH___';
  END IF;

  SELECT 
    coalesce(array_agg(license_key), ARRAY[]::text[]),
    coalesce(array_agg(coalesce(hwid, 'N/A')), ARRAY[]::text[])
  INTO v_keys, v_hwids
  FROM licenses
  WHERE 
    license_key = p_key 
    OR hwid = p_key 
    OR hwid ILIKE '%' || p_key || '%'
    OR customer_phone = p_key 
    OR customer_whatsapp = p_key
    OR regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = v_clean_phone
    OR regexp_replace(COALESCE(customer_whatsapp, ''), '[^0-9]', '', 'g') = v_clean_phone
    OR (length(v_phone_last7) >= 7 AND (customer_phone ILIKE '%' || v_phone_last7 OR customer_whatsapp ILIKE '%' || v_phone_last7));

  UPDATE licenses
  SET is_deactivated = false,
      is_active = true,
      notes = COALESCE(notes, '') || ' | UNBANNED: Restored by admin (' || now()::text || ')'
  WHERE 
    license_key = p_key 
    OR hwid = p_key 
    OR hwid ILIKE '%' || p_key || '%'
    OR customer_phone = p_key 
    OR customer_whatsapp = p_key
    OR regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = v_clean_phone
    OR regexp_replace(COALESCE(customer_whatsapp, ''), '[^0-9]', '', 'g') = v_clean_phone
    OR (length(v_phone_last7) >= 7 AND (customer_phone ILIKE '%' || v_phone_last7 OR customer_whatsapp ILIKE '%' || v_phone_last7));
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    RETURN json_build_object(
      'success', true, 
      'message', 'Workstation(s) unbanned successfully', 
      'unbanned_count', v_count,
      'keys', v_keys,
      'hwids', v_hwids
    );
  ELSE
    RETURN json_build_object('success', false, 'message', 'No workstation found matching: ' || p_key);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upgrade a workstation (e.g. SELECT upgrade_workstation('HWID-A1B2C3D4', 'elite', 'lifetime', 999);)
CREATE OR REPLACE FUNCTION upgrade_workstation(
  p_key text,
  p_tier text,
  p_validity text DEFAULT 'yearly',
  p_months integer DEFAULT 12
)
RETURNS json AS $$
DECLARE
  v_row licenses%ROWTYPE;
  v_expiry timestamptz;
BEGIN
  IF lower(p_validity) = 'lifetime' OR lower(p_validity) = 'permanent' THEN
    v_expiry := '2099-12-31 23:59:59+00'::timestamptz;
  ELSE
    v_expiry := now() + (p_months || ' months')::interval;
  END IF;

  UPDATE licenses
  SET tier = lower(p_tier),
      is_trial = false,
      validity_type = lower(p_validity),
      months = p_months,
      expires_at = v_expiry,
      is_active = true,
      is_deactivated = false
  WHERE license_key = p_key OR hwid = p_key OR customer_phone = p_key OR customer_whatsapp = p_key
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Upgraded to ' || p_tier || ' (' || p_validity || ')',
      'key', v_row.license_key,
      'tier', v_row.tier,
      'expires_at', v_row.expires_at
    );
  ELSE
    RETURN json_build_object('success', false, 'message', 'Workstation not found');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


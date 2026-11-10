-- ==============================================================================
-- NOXIS HUB — LIVE ACCESS CONTROL & 1-CLICK REMOTE WORKSTATION BAN
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Enable Supabase Realtime for instant, zero-delay live ban broadcasts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'licenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE licenses;
  END IF;
END $$;

-- 2. Enhanced ban_workstation:
-- BANS ALL workstations associated with a Phone number, HWID, or License Key
CREATE OR REPLACE FUNCTION ban_workstation(
  p_key text, 
  p_reason text DEFAULT 'You cannot use this software. Please pay for the license to continue.'
)
RETURNS json AS $$
DECLARE
  v_clean_phone text;
  v_phone_last7 text;
  v_count int := 0;
  v_keys text[];
  v_hwids text[];
  v_users text[];
BEGIN
  -- Normalize phone numbers (strips spaces, dashes, + signs)
  v_clean_phone := regexp_replace(p_key, '[^0-9]', '', 'g');
  IF length(v_clean_phone) >= 7 THEN
    v_phone_last7 := right(v_clean_phone, 7);
  ELSE
    v_phone_last7 := 'NOMATCH___';
  END IF;

  -- 1. Identify all matching workstations
  SELECT 
    coalesce(array_agg(DISTINCT license_key), ARRAY[]::text[]),
    coalesce(array_agg(DISTINCT coalesce(hwid, 'N/A')), ARRAY[]::text[]),
    coalesce(array_agg(DISTINCT coalesce(customer_name, brand_name, 'Workstation')), ARRAY[]::text[])
  INTO v_keys, v_hwids, v_users
  FROM licenses
  WHERE 
    license_key = p_key 
    OR hwid = p_key 
    OR hwid ILIKE '%' || p_key || '%'
    OR notes ILIKE '%' || p_key || '%'
    OR customer_phone = p_key 
    OR customer_whatsapp = p_key
    OR (length(v_clean_phone) >= 7 AND regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = v_clean_phone)
    OR (length(v_clean_phone) >= 7 AND regexp_replace(COALESCE(customer_whatsapp, ''), '[^0-9]', '', 'g') = v_clean_phone)
    OR (length(v_phone_last7) >= 7 AND (customer_phone ILIKE '%' || v_phone_last7 OR customer_whatsapp ILIKE '%' || v_phone_last7));

  -- 2. Lock down ALL matching workstations
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
    OR (length(v_clean_phone) >= 7 AND regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = v_clean_phone)
    OR (length(v_clean_phone) >= 7 AND regexp_replace(COALESCE(customer_whatsapp, ''), '[^0-9]', '', 'g') = v_clean_phone)
    OR (length(v_phone_last7) >= 7 AND (customer_phone ILIKE '%' || v_phone_last7 OR customer_whatsapp ILIKE '%' || v_phone_last7));
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    RETURN json_build_object(
      'success', true, 
      'message', v_count || ' workstation(s) banned successfully', 
      'banned_count', v_count,
      'banned_keys', v_keys,
      'banned_hwids', v_hwids,
      'banned_users', v_users,
      'query', p_key
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

-- 3. Enhanced unban_workstation
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
    coalesce(array_agg(DISTINCT license_key), ARRAY[]::text[]),
    coalesce(array_agg(DISTINCT coalesce(hwid, 'N/A')), ARRAY[]::text[])
  INTO v_keys, v_hwids
  FROM licenses
  WHERE 
    license_key = p_key 
    OR hwid = p_key 
    OR hwid ILIKE '%' || p_key || '%'
    OR customer_phone = p_key 
    OR customer_whatsapp = p_key
    OR (length(v_clean_phone) >= 7 AND regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = v_clean_phone)
    OR (length(v_clean_phone) >= 7 AND regexp_replace(COALESCE(customer_whatsapp, ''), '[^0-9]', '', 'g') = v_clean_phone)
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
    OR (length(v_clean_phone) >= 7 AND regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = v_clean_phone)
    OR (length(v_clean_phone) >= 7 AND regexp_replace(COALESCE(customer_whatsapp, ''), '[^0-9]', '', 'g') = v_clean_phone)
    OR (length(v_phone_last7) >= 7 AND (customer_phone ILIKE '%' || v_phone_last7 OR customer_whatsapp ILIKE '%' || v_phone_last7));
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    RETURN json_build_object(
      'success', true, 
      'message', v_count || ' workstation(s) unbanned successfully', 
      'unbanned_count', v_count,
      'unbanned_keys', v_keys,
      'unbanned_hwids', v_hwids
    );
  ELSE
    RETURN json_build_object('success', false, 'message', 'No workstation found matching: ' || p_key);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test run on your number right now:
-- SELECT ban_workstation('923264742678');

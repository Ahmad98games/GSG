-- supabase/migrations/032_sentinel_storage.sql

CREATE TABLE IF NOT EXISTS sentinel_recordings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id),
  camera_id uuid not null references cctv_nodes(id),
  detection_event_id uuid references ai_detection_events(id),
  
  -- Recording metadata
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  
  -- Pre-roll buffer
  preroll_seconds integer not null default 10,
  
  -- Storage
  file_path text,
  file_size_bytes bigint,
  storage_bucket text default 'sentinel-recordings',
  
  -- Classification
  recording_type text not null default 'human_detection'
    check (recording_type in (
      'human_detection', 'breach', 'fire', 
      'vehicle', 'continuous', 'manual'
    )),
  
  -- Forensic integrity
  hmac_hash text,
  is_tampered boolean default false,
  is_archived boolean default false,
  
  -- Retention
  auto_delete_at timestamptz,
  flagged_permanent boolean default false,
  
  created_at timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE sentinel_recordings ENABLE ROW LEVEL SECURITY;

-- Policy (Assumes business_id isolation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sentinel_recordings' AND policyname = 'business_isolation'
    ) THEN
        CREATE POLICY "business_isolation" ON sentinel_recordings
          FOR ALL USING (business_id = current_user_business_id());
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_recordings_camera_time
  ON sentinel_recordings(camera_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_auto_delete
  ON sentinel_recordings(auto_delete_at)
  WHERE auto_delete_at IS NOT NULL
  AND flagged_permanent = false;

-- Add recording columns to cctv_nodes
ALTER TABLE cctv_nodes ADD COLUMN IF NOT EXISTS recording_enabled boolean default true;
ALTER TABLE cctv_nodes ADD COLUMN IF NOT EXISTS preroll_seconds integer default 10;
ALTER TABLE cctv_nodes ADD COLUMN IF NOT EXISTS retention_days integer default 30;
ALTER TABLE cctv_nodes ADD COLUMN IF NOT EXISTS tier_slot integer;

-- Tier limit function
CREATE OR REPLACE FUNCTION get_tier_camera_limit(
  p_business_id uuid
) RETURNS integer AS $$
DECLARE
  tier text;
BEGIN
  SELECT active_profile INTO tier
  FROM authorized_devices
  WHERE business_id = p_business_id
  LIMIT 1;

  RETURN CASE
    WHEN tier ILIKE '%elite%' THEN 999
    WHEN tier ILIKE '%pro%' THEN 8
    ELSE 2  -- Lite default
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

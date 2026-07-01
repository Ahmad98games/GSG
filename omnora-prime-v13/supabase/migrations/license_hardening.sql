-- CREATE TABLE FOR LICENSE ACTIVATION LOGS
CREATE TABLE IF NOT EXISTS license_activation_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id uuid REFERENCES licenses(id),
  key_attempted text,
  event text NOT NULL,
  device_id text,
  machine_info jsonb,
  app_version text,
  created_at timestamptz DEFAULT now()
);

-- CREATE INDEXES FOR SECURITY AND PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_activation_log_license
  ON license_activation_log(license_id);
CREATE INDEX IF NOT EXISTS idx_activation_log_event
  ON license_activation_log(event, created_at DESC);

-- ROW LEVEL SECURITY FOR SYSTEM AUDITING ONLY
ALTER TABLE license_activation_log
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_only" ON license_activation_log;
CREATE POLICY "service_only"
ON license_activation_log
USING (false) WITH CHECK (false);

-- ADD COLUMNS TO LICENSES TABLE IF THEY DO NOT EXIST
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS last_activated_at timestamptz;
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS last_device_id text;
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS activation_count integer DEFAULT 0;

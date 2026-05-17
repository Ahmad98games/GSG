-- supabase/migrations/010_cctv_v2.sql

-- Camera brands and model database
CREATE TABLE cctv_brands (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT UNIQUE NOT NULL,  -- "Hikvision","Dahua","Axis","Bosch","Hanwha","Uniview","TVT","Reolink","TP-Link Tapo","Generic"
  logo_url   TEXT,
  is_popular BOOLEAN DEFAULT false
);

-- Pre-populate popular brands
INSERT INTO cctv_brands (name, is_popular) VALUES
  ('Hikvision', true), ('Dahua', true), ('Axis', true),
  ('Bosch', true), ('Hanwha / Samsung', true), ('Uniview', true),
  ('TVT', true), ('Reolink', true), ('TP-Link Tapo', true),
  ('CP Plus', true), ('Provision ISR', false), ('Avigilon', false),
  ('Pelco', false), ('Generic / Unknown', true);

-- Camera type definitions
CREATE TABLE cctv_camera_types (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_code TEXT UNIQUE NOT NULL,  -- 'dome','bullet','ptz','fisheye','box','turret','pinhole'
  label     TEXT NOT NULL
);

INSERT INTO cctv_camera_types (type_code, label) VALUES
  ('dome','Dome'), ('bullet','Bullet'), ('ptz','PTZ (Pan-Tilt-Zoom)'),
  ('fisheye','Fisheye 360°'), ('box','Box'), ('turret','Turret'), ('pinhole','Pinhole / Covert');

-- Extend cctv_nodes (from Phase 4) with full camera specs
ALTER TABLE cctv_nodes
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES cctv_brands(id),
  ADD COLUMN IF NOT EXISTS model_number TEXT,          -- e.g. "DS-2CD2143G2-I"
  ADD COLUMN IF NOT EXISTS camera_type_id UUID REFERENCES cctv_camera_types(id),
  ADD COLUMN IF NOT EXISTS resolution_mp NUMERIC(4,1), -- 2.0, 4.0, 8.0 (4K), 12.0
  ADD COLUMN IF NOT EXISTS has_ir BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ir_range_m INTEGER,         -- infrared range in meters
  ADD COLUMN IF NOT EXISTS has_poe BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS port INTEGER DEFAULT 554,   -- RTSP port
  ADD COLUMN IF NOT EXISTS username TEXT,              -- RTSP auth (stored encrypted)
  ADD COLUMN IF NOT EXISTS password TEXT,              -- RTSP auth (stored encrypted)
  ADD COLUMN IF NOT EXISTS install_date DATE,
  ADD COLUMN IF NOT EXISTS install_location TEXT,      -- "Main Gate", "Production Floor A", "Office"
  ADD COLUMN IF NOT EXISTS detection_zones JSONB,      -- array of polygon coordinates for AI zones
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'ssd_mobilenet_v2',  -- which AI model to use
  ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- AI detection events (from vision_engine.py + browser TF.js)
CREATE TABLE ai_detection_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID NOT NULL REFERENCES business_profiles(id),
  node_id          UUID NOT NULL REFERENCES cctv_nodes(id),
  detected_class   TEXT NOT NULL,      -- 'person','fire','vehicle','animal'
  confidence       NUMERIC(5,4) NOT NULL,
  zone_id          TEXT,               -- which detection zone was breached
  bbox_x           NUMERIC(6,4),       -- bounding box normalized 0-1
  bbox_y           NUMERIC(6,4),
  bbox_w           NUMERIC(6,4),
  bbox_h           NUMERIC(6,4),
  thumbnail_url    TEXT,               -- 200x200 JPEG stored in Supabase Storage
  detection_source TEXT DEFAULT 'browser' CHECK (detection_source IN ('browser','python_engine')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_detection_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_events_rls" ON ai_detection_events FOR ALL USING (business_id = current_user_business_id());

CREATE INDEX idx_ai_events_node ON ai_detection_events(node_id, created_at DESC);
CREATE INDEX idx_ai_events_class ON ai_detection_events(business_id, detected_class, created_at DESC);

-- Tier enforcement for CCTV
-- Enforce camera count limit based on tier at INSERT time
CREATE OR REPLACE FUNCTION enforce_camera_tier_limit() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_count INT;
  camera_limit INT;
  user_tier TEXT;
BEGIN
  SELECT tier INTO user_tier FROM licenses WHERE tenant_id = NEW.business_id AND status='active' LIMIT 1;
  camera_limit := CASE user_tier WHEN 'lite' THEN 2 WHEN 'pro' THEN 8 ELSE 9999 END;
  SELECT COUNT(*) INTO current_count FROM cctv_nodes WHERE business_id=NEW.business_id AND is_active=true;
  IF current_count >= camera_limit THEN
    RAISE EXCEPTION 'Camera limit reached for your plan (%). Upgrade to add more cameras.', user_tier;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_camera_limit BEFORE INSERT ON cctv_nodes FOR EACH ROW EXECUTE FUNCTION enforce_camera_tier_limit();


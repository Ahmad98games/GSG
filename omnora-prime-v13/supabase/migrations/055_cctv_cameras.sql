-- Noxis Hub — CCTV Camera Management Schema
-- Migration: 055_cctv_cameras
-- Run in Supabase SQL Editor or via supabase db push

-- ── CAMERAS ─────────────────────────────────────────────────────────────────
-- One row per physical camera added to the system.
-- Passwords are stored AES-256-GCM encrypted (never plaintext).

CREATE TABLE IF NOT EXISTS cctv_cameras (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id               uuid NOT NULL
                              REFERENCES business_profiles(id)
                              ON DELETE CASCADE,

  -- User-visible identity
  name                      text NOT NULL,
  -- e.g. "Front Gate", "Warehouse", "Office Entrance"

  -- Hardware identity (from ONVIF discovery)
  manufacturer              text,   -- 'hikvision' | 'imou' | 'dahua' | 'other'
  model                     text,
  serial_number             text,
  firmware_version          text,

  -- Network config
  ip_address                text NOT NULL,
  onvif_port                integer DEFAULT 80,
  rtsp_port                 integer DEFAULT 554,
  username                  text DEFAULT 'admin',
  password_encrypted        text,   -- AES-256-GCM encrypted, never plaintext

  -- Stream URLs (populated after ONVIF init)
  rtsp_url_main             text,   -- Full-resolution stream
  rtsp_url_sub              text,   -- Sub-stream (lower res, for mobile/bandwidth)
  webrtc_url                text,   -- mediamtx proxy URL for in-browser viewing

  -- Physical setup
  connection_type           text DEFAULT 'wired', -- 'wired' | 'wireless'
  status                    text DEFAULT 'offline', -- 'online' | 'offline' | 'error'
  last_seen_at              timestamptz,

  -- Recording settings
  recording_mode            text DEFAULT 'event',
  -- 'continuous' | 'event' | 'scheduled'
  record_on_motion          boolean DEFAULT true,
  record_on_human           boolean DEFAULT true,
  record_on_vehicle         boolean DEFAULT false,
  pre_record_seconds        integer DEFAULT 5,
  post_record_seconds       integer DEFAULT 15,

  -- Local storage
  storage_path              text,   -- Absolute path where recordings are saved
  max_storage_gb            integer DEFAULT 10,

  -- Capabilities detected from camera
  supports_ptz              boolean DEFAULT false,
  supports_audio            boolean DEFAULT false,
  supports_human_detection  boolean DEFAULT false,
  supports_vehicle_detection boolean DEFAULT false,

  resolution_main           text,   -- '1920×1080', '3840×2160', etc.
  resolution_sub            text,   -- '704×480', '1280×720', etc.

  -- License tier control
  -- Lite: slots 1-2 | Pro: slots 1-4 | Elite: slots 1-6
  slot_number               integer NOT NULL,
  is_active                 boolean DEFAULT true,

  notes                     text,
  created_at                timestamptz DEFAULT now(),

  UNIQUE(business_id, slot_number)
);

-- ── EVENTS ──────────────────────────────────────────────────────────────────
-- AI/motion events emitted by cameras or detected locally.

CREATE TABLE IF NOT EXISTS cctv_events (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id                 uuid NOT NULL,
  camera_id                   uuid NOT NULL
                                REFERENCES cctv_cameras(id)
                                ON DELETE CASCADE,

  event_type                  text NOT NULL,
  -- 'human_detected' | 'motion' | 'vehicle' | 'line_crossing'
  -- 'zone_intrusion' | 'camera_tamper' | 'camera_offline' | 'camera_online'

  severity                    text DEFAULT 'info',
  -- 'critical' | 'warning' | 'info'

  recording_file              text,   -- Local path to clip (if recorded)
  recording_duration_seconds  integer,
  thumbnail_path              text,

  occurred_at                 timestamptz DEFAULT now(),
  acknowledged                boolean DEFAULT false,
  acknowledged_at             timestamptz,
  metadata                    jsonb DEFAULT '{}'
);

-- ── RECORDINGS ──────────────────────────────────────────────────────────────
-- Metadata about recorded video clips (actual files live on local disk).

CREATE TABLE IF NOT EXISTS cctv_recordings (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id      uuid NOT NULL,
  camera_id        uuid NOT NULL
                     REFERENCES cctv_cameras(id)
                     ON DELETE CASCADE,
  event_id         uuid REFERENCES cctv_events(id),

  file_path        text NOT NULL,   -- Absolute local path
  file_size_mb     float,
  duration_seconds integer,
  started_at       timestamptz NOT NULL,
  ended_at         timestamptz,

  trigger_type     text,   -- 'human' | 'motion' | 'manual' | 'scheduled'
  thumbnail_path   text,
  is_flagged       boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────────────────────
-- Each business can only see its own cameras, events, and recordings.

ALTER TABLE cctv_cameras    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cctv_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cctv_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_owns_cameras"
ON cctv_cameras FOR ALL
USING (
  business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "business_owns_events"
ON cctv_events FOR ALL
USING (
  business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "business_owns_recordings"
ON cctv_recordings FOR ALL
USING (
  business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- ── PERFORMANCE INDEXES ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cctv_cameras_business_id
  ON cctv_cameras(business_id);

CREATE INDEX IF NOT EXISTS idx_cctv_cameras_status
  ON cctv_cameras(business_id, status);

CREATE INDEX IF NOT EXISTS idx_cctv_events_camera_id
  ON cctv_events(camera_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_cctv_events_type
  ON cctv_events(business_id, event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_cctv_recordings_camera_id
  ON cctv_recordings(camera_id, started_at DESC);

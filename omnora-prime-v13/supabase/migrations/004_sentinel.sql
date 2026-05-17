-- supabase/migrations/004_sentinel.sql

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'node_status') THEN
        CREATE TYPE node_status AS ENUM ('online','offline','obscured','degraded','unknown');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
        CREATE TYPE alert_severity AS ENUM ('critical','warning','info');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_state') THEN
        CREATE TYPE alert_state AS ENUM ('active','acknowledged','auto_resolved');
    END IF;
END $$;

-- CCTV Nodes
CREATE TABLE IF NOT EXISTS cctv_nodes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  node_label      TEXT NOT NULL,
  rtsp_url        TEXT NOT NULL,
  location_desc   TEXT,
  status          node_status NOT NULL DEFAULT 'unknown',
  last_frame_at   TIMESTAMPTZ,
  last_ping_at    TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- CCTV Telemetry (Partitioned)
CREATE TABLE IF NOT EXISTS cctv_telemetry (
  id              UUID DEFAULT uuid_generate_v4(),
  node_id         UUID NOT NULL REFERENCES cctv_nodes(id),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  bitrate_kbps    NUMERIC(10,2),
  latency_ms      NUMERIC(8,2),
  frame_variance  NUMERIC(10,4),
  avg_brightness  NUMERIC(8,4),
  fault_type      TEXT CHECK (fault_type IN ('lens_obscured','lens_dirty','node_offline','bitrate_low','frame_freeze')),
  fps_actual      NUMERIC(5,2),
  recorded_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Initial partitions for 2025
-- Partitions don't support IF NOT EXISTS in all versions, but we can wrap them
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cctv_telemetry_2025_01') THEN
    CREATE TABLE cctv_telemetry_2025_01 PARTITION OF cctv_telemetry FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cctv_telemetry_2025_02') THEN
    CREATE TABLE cctv_telemetry_2025_02 PARTITION OF cctv_telemetry FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cctv_telemetry_2025_03') THEN
    CREATE TABLE cctv_telemetry_2025_03 PARTITION OF cctv_telemetry FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cctv_telemetry_2025_04') THEN
    CREATE TABLE cctv_telemetry_2025_04 PARTITION OF cctv_telemetry FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cctv_telemetry_2025_05') THEN
    CREATE TABLE cctv_telemetry_2025_05 PARTITION OF cctv_telemetry FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
  END IF;
END $$;

-- Security Audit (Forensic Alert Log)
CREATE TABLE IF NOT EXISTS security_audit (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  node_id         UUID NOT NULL REFERENCES cctv_nodes(id),
  alert_type      TEXT NOT NULL,
  severity        alert_severity NOT NULL DEFAULT 'critical',
  state           alert_state NOT NULL DEFAULT 'active',
  triggered_at    TIMESTAMPTZ DEFAULT now(),
  auto_resolved_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  ack_code        TEXT,
  operator_notes  TEXT,
  details         JSONB
);

-- RLS
ALTER TABLE cctv_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cctv_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_owns_nodes" ON cctv_nodes;
CREATE POLICY "business_owns_nodes" ON cctv_nodes FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_telemetry" ON cctv_telemetry;
CREATE POLICY "business_owns_telemetry" ON cctv_telemetry FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_audit" ON security_audit;
CREATE POLICY "business_owns_audit" ON security_audit FOR ALL USING (business_id = current_user_business_id());

-- Auto-resolve alerts trigger
CREATE OR REPLACE FUNCTION auto_resolve_alert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'online' AND OLD.status != 'online' THEN
    UPDATE security_audit
    SET state = 'auto_resolved', auto_resolved_at = now()
    WHERE node_id = NEW.id AND state = 'active' AND severity != 'critical';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_resolve ON cctv_nodes;
CREATE TRIGGER trg_auto_resolve AFTER UPDATE ON cctv_nodes
  FOR EACH ROW EXECUTE FUNCTION auto_resolve_alert();

-- Optimized indexes
CREATE INDEX IF NOT EXISTS idx_audit_active_critical ON security_audit(business_id, state, severity)
  WHERE state = 'active' AND severity = 'critical';

CREATE INDEX IF NOT EXISTS idx_cctv_nodes_status ON cctv_nodes(business_id, status);


-- supabase/migrations/002_inventory.sql

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_location') THEN
        CREATE TYPE stock_location AS ENUM ('karkhana','warehouse','retail_shop','in_transit','disposed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status') THEN
        CREATE TYPE transfer_status AS ENUM ('pending','completed','cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_status') THEN
        CREATE TYPE audit_status AS ENUM ('open','locked','in_progress','finalized');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adjustment_type') THEN
        CREATE TYPE adjustment_type AS ENUM ('shrinkage','surplus','damage','correction');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS skus (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  sku_code         TEXT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  category         TEXT,
  unit             TEXT NOT NULL,       -- 'meter','kg','piece','carton','liter'
  current_location stock_location NOT NULL DEFAULT 'warehouse',
  qty_on_hand      NUMERIC(15,4) NOT NULL DEFAULT 0 CHECK (qty_on_hand >= 0),
  qty_reserved     NUMERIC(15,4) NOT NULL DEFAULT 0,  -- reserved for pending orders
  reorder_level    NUMERIC(15,4) DEFAULT 0,
  cost_price       NUMERIC(15,2),       -- Decimal — do NOT use REAL/FLOAT for money
  sale_price       NUMERIC(15,2),
  barcode          TEXT,                -- EAN-13 / QR / custom
  thumbnail_url    TEXT,
  is_active        BOOLEAN DEFAULT true,
  -- Industry-specific metadata
  gsm              NUMERIC(8,2),
  weave_type       TEXT,
  color_code       TEXT,
  fabric_width_cm  NUMERIC(8,2),
  batch_number     TEXT,
  expiry_date      DATE,
  drug_license_no  TEXT,
  oem_part_number  TEXT,
  compatible_models TEXT[],
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, sku_code)
);

CREATE TABLE IF NOT EXISTS sku_gallery (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku_id      UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  label       TEXT,       -- 'front','back','defect','spec-sheet'
  sort_order  INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_locations_map (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  location_code stock_location NOT NULL,
  label         TEXT NOT NULL,        -- "Ground Floor Karkhana", "Lahore Warehouse"
  address       TEXT,
  is_active     BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS transfer_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  sku_id          UUID NOT NULL REFERENCES skus(id),
  from_location   stock_location NOT NULL,
  to_location     stock_location NOT NULL,
  qty             NUMERIC(15,4) NOT NULL CHECK (qty > 0),
  status          transfer_status NOT NULL DEFAULT 'pending',
  reference_no    TEXT,               -- e.g. "TRF-2025-00441"
  initiated_by    UUID REFERENCES auth.users(id),
  confirmed_by    UUID REFERENCES auth.users(id),
  initiated_at    TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  gps_lat         NUMERIC(10,8),      -- GPS at time of transfer confirmation
  gps_lng         NUMERIC(11,8),
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS audit_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  label           TEXT NOT NULL,      -- "Q1 2025 Annual Audit"
  status          audit_status NOT NULL DEFAULT 'open',
  locked_at       TIMESTAMPTZ,
  finalized_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  finalized_by    UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS audit_counts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES audit_sessions(id),
  sku_id          UUID NOT NULL REFERENCES skus(id),
  digital_qty     NUMERIC(15,4) NOT NULL,   -- snapshot at time of lock
  physical_qty    NUMERIC(15,4),            -- entered by auditor
  variance        NUMERIC(15,4) GENERATED ALWAYS AS (physical_qty - digital_qty) STORED,
  adjustment_type adjustment_type,
  reason_code     TEXT,               -- required if |variance| > 0
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ
);

-- RLS: enable on ALL tables
ALTER TABLE skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_locations_map ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "business_owns_skus" ON skus;
CREATE POLICY "business_owns_skus" ON skus FOR ALL
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_transfers" ON transfer_logs;
CREATE POLICY "business_owns_transfers" ON transfer_logs FOR ALL
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_audits" ON audit_sessions;
CREATE POLICY "business_owns_audits" ON audit_sessions FOR ALL
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_audit_counts" ON audit_counts;
CREATE POLICY "business_owns_audit_counts" ON audit_counts FOR ALL
  USING (session_id IN (SELECT id FROM audit_sessions WHERE business_id = current_user_business_id()));

DROP POLICY IF EXISTS "sku_gallery_via_sku" ON sku_gallery;
CREATE POLICY "sku_gallery_via_sku" ON sku_gallery FOR ALL
  USING (sku_id IN (SELECT id FROM skus WHERE business_id = current_user_business_id()));

DROP POLICY IF EXISTS "business_owns_locations" ON stock_locations_map;
CREATE POLICY "business_owns_locations" ON stock_locations_map FOR ALL
  USING (business_id = current_user_business_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skus_business_active ON skus(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_skus_location ON skus(business_id, current_location);
CREATE INDEX IF NOT EXISTS idx_skus_reorder ON skus(business_id) WHERE qty_on_hand <= reorder_level AND reorder_level > 0;
CREATE INDEX IF NOT EXISTS idx_transfer_logs_sku ON transfer_logs(sku_id, initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_counts_session ON audit_counts(session_id, sku_id);

-- Trigger for reference number
CREATE OR REPLACE FUNCTION generate_transfer_ref()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.reference_no = 'TRF-' || TO_CHAR(now(), 'YYYY') || '-' ||
    LPAD((SELECT COUNT(*)+1 FROM transfer_logs WHERE business_id = NEW.business_id)::TEXT, 5, '0');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_transfer_ref ON transfer_logs;
CREATE TRIGGER trg_transfer_ref BEFORE INSERT ON transfer_logs
  FOR EACH ROW WHEN (NEW.reference_no IS NULL) EXECUTE FUNCTION generate_transfer_ref();

-- Trigger: auto-update updated_at on skus
CREATE OR REPLACE FUNCTION update_sku_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_skus_updated ON skus;
CREATE TRIGGER trg_skus_updated
  BEFORE UPDATE ON skus
  FOR EACH ROW EXECUTE FUNCTION update_sku_updated_at();


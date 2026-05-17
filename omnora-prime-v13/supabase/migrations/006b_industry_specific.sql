-- Add email to parties for GDPR support
ALTER TABLE parties ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_parties_email ON parties(email);

-- Medical / Pharma: expiry and batch compliance
CREATE TABLE IF NOT EXISTS product_batches_medical (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku_id          UUID NOT NULL REFERENCES skus(id),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  batch_number    TEXT NOT NULL,
  manufacture_date DATE,
  expiry_date     DATE NOT NULL,
  quantity_in     NUMERIC(15,4) NOT NULL,
  quantity_remain NUMERIC(15,4) NOT NULL,
  drug_license    TEXT,
  supplier_id     UUID REFERENCES parties(id),
  recall_status   TEXT DEFAULT 'clear' CHECK (recall_status IN ('clear','under_review','recalled')),
  storage_temp_min NUMERIC(5,2),  -- degrees Celsius
  storage_temp_max NUMERIC(5,2),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sku_id, batch_number)
);
ALTER TABLE product_batches_medical ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "medical_batches" ON product_batches_medical;
CREATE POLICY "medical_batches" ON product_batches_medical FOR ALL USING (business_id = current_user_business_id());
CREATE INDEX IF NOT EXISTS idx_med_batch_expiry ON product_batches_medical(business_id, expiry_date ASC) WHERE recall_status = 'clear';

-- Cold chain: temperature logs (Pharma / Food / Cold Storage)
CREATE TABLE IF NOT EXISTS cold_chain_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  location_label TEXT NOT NULL,   -- "Freezer A", "Chiller 2"
  temp_celsius  NUMERIC(5,2) NOT NULL,
  recorded_at   TIMESTAMPTZ DEFAULT now(),
  breach        BOOLEAN GENERATED ALWAYS AS (temp_celsius > 8 OR temp_celsius < 2) STORED,
  noted_by      UUID REFERENCES auth.users(id)
);
ALTER TABLE cold_chain_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coldchain_logs" ON cold_chain_logs;
CREATE POLICY "coldchain_logs" ON cold_chain_logs FOR ALL USING (business_id = current_user_business_id());
CREATE INDEX IF NOT EXISTS idx_coldchain_breach ON cold_chain_logs(business_id, recorded_at DESC) WHERE breach = true;

-- Logistics / Warehouse: shipments and SLA tracking
CREATE TABLE IF NOT EXISTS shipments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  shipment_ref    TEXT NOT NULL,
  carrier         TEXT,
  tracking_number TEXT,
  origin          TEXT NOT NULL,
  destination     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked','in_transit','out_for_delivery','delivered','exception','cancelled')),
  sla_due_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  sla_met         BOOLEAN GENERATED ALWAYS AS (delivered_at IS NULL OR delivered_at <= sla_due_at) STORED,
  client_id       UUID REFERENCES parties(id),
  total_weight_kg NUMERIC(10,3),
  total_pieces    INTEGER,
  freight_charge  NUMERIC(12,2),
  invoice_id      UUID REFERENCES invoices(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_shipments" ON shipments;
CREATE POLICY "business_shipments" ON shipments FOR ALL USING (business_id = current_user_business_id());
CREATE INDEX IF NOT EXISTS idx_shipments_sla ON shipments(business_id, sla_due_at) WHERE status NOT IN ('delivered','cancelled');

-- Cloud Kitchen: menu and live orders
CREATE TABLE menu_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,    -- "Main Course", "Beverage", "Dessert"
  sale_price    NUMERIC(10,2) NOT NULL,
  food_cost     NUMERIC(10,2),    -- raw ingredient cost per portion
  food_cost_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN sale_price > 0 THEN (food_cost / sale_price) * 100 ELSE NULL END
  ) STORED,
  is_available  BOOLEAN DEFAULT true,
  prep_time_min INTEGER,
  image_url     TEXT
);
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_menu" ON menu_items FOR ALL USING (business_id = current_user_business_id());

-- GDPR data export log (International / EU / UK only)
CREATE TABLE gdpr_export_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  requested_by    UUID REFERENCES auth.users(id),
  subject_email   TEXT NOT NULL,  -- the data subject (customer whose data is being exported)
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','delivered','deleted')),
  export_url      TEXT,           -- Supabase Storage signed URL to the ZIP
  requested_at    TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  deletion_request BOOLEAN DEFAULT false  -- true if this is a "right to be forgotten" request
);
ALTER TABLE gdpr_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gdpr_requests" ON gdpr_export_requests FOR ALL USING (business_id = current_user_business_id());

-- Compliance Checks (FDA / GMP / SLA Checklist)
CREATE TABLE compliance_checks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  check_type      TEXT NOT NULL, -- 'fda', 'gmp', 'sla', 'internal'
  item_key        TEXT NOT NULL, -- 'batch_records_complete', 'temp_logs_current', etc.
  is_passed       BOOLEAN DEFAULT false,
  signed_by       UUID REFERENCES auth.users(id),
  signed_at       TIMESTAMPTZ DEFAULT now(),
  notes           TEXT
);
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_compliance" ON compliance_checks FOR ALL USING (business_id = current_user_business_id());

-- Helper RPC for Cold Chain
CREATE OR REPLACE FUNCTION get_latest_cold_chain_logs()
RETURNS TABLE (
  location_label TEXT,
  temp_celsius NUMERIC,
  recorded_at TIMESTAMPTZ,
  breach BOOLEAN
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (l.location_label)
    l.location_label,
    l.temp_celsius,
    l.recorded_at,
    l.breach
  FROM cold_chain_logs l
  WHERE l.business_id = current_user_business_id()
  ORDER BY l.location_label, l.recorded_at DESC;
END;
$$;


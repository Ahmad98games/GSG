-- supabase/migrations/041_enterprise_features.sql
-- Noxis Hub Enterprise Features Migration
-- Features: Customer Portal Tokens, Recurring Invoices, Staff Access, Batch Tracking, Supplier Payments

-- ═══════════════════════════════════════════════════════
-- FEATURE 1: Customer Portal Tokens (JWT-based read-only)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS party_portal_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  party_id     UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  token        TEXT UNIQUE NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON party_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_party ON party_portal_tokens(party_id);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_expiry ON party_portal_tokens(expires_at);

ALTER TABLE party_portal_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_manage_portal_tokens" ON party_portal_tokens;
CREATE POLICY "hub_manage_portal_tokens" ON party_portal_tokens
  FOR ALL USING (business_id = current_user_business_id());


-- ═══════════════════════════════════════════════════════
-- FEATURE 2: Recurring Invoices
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recurring_invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  party_id      UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  line_items    JSONB NOT NULL,
  frequency     TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
  next_run_date DATE NOT NULL,
  end_date      DATE,
  auto_post     BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_next_run ON recurring_invoices(next_run_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_business ON recurring_invoices(business_id);

ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_manage_recurring" ON recurring_invoices;
CREATE POLICY "hub_manage_recurring" ON recurring_invoices
  FOR ALL USING (business_id = current_user_business_id());


-- ═══════════════════════════════════════════════════════
-- FEATURE 3: Staff Users / Multi-User Access
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS staff_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id),
  email        TEXT NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner', 'manager', 'accountant', 'supervisor', 'salesman', 'viewer')),
  is_active    BOOLEAN DEFAULT true,
  invited_at   TIMESTAMPTZ DEFAULT now(),
  accepted_at  TIMESTAMPTZ,
  UNIQUE(business_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_business ON staff_users(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_user ON staff_users(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff_users(email);

ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_manage_staff" ON staff_users;
CREATE POLICY "hub_manage_staff" ON staff_users
  FOR ALL USING (business_id = current_user_business_id());


-- ═══════════════════════════════════════════════════════
-- FEATURE 4: Inventory Batch / Lot Tracking
-- ═══════════════════════════════════════════════════════

ALTER TABLE skus ADD COLUMN IF NOT EXISTS batch_tracking BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS sku_batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  sku_id           UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
  batch_number     TEXT NOT NULL,
  lot_number       TEXT,
  manufacture_date DATE,
  expiry_date      DATE,
  qty_received     NUMERIC NOT NULL,
  qty_remaining    NUMERIC NOT NULL,
  cost_price       NUMERIC,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_sku ON sku_batches(sku_id);
CREATE INDEX IF NOT EXISTS idx_batches_business ON sku_batches(business_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON sku_batches(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batches_remaining ON sku_batches(qty_remaining) WHERE qty_remaining > 0;

ALTER TABLE sku_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_manage_batches" ON sku_batches;
CREATE POLICY "hub_manage_batches" ON sku_batches
  FOR ALL USING (business_id = current_user_business_id());


-- ═══════════════════════════════════════════════════════
-- FEATURE 5: Supplier Payment Tracking
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS supplier_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  party_id        UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  po_id           UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  amount          NUMERIC NOT NULL,
  payment_method  TEXT,
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  reference       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_po ON supplier_payments(po_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_party ON supplier_payments(party_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_business ON supplier_payments(business_id);

ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_manage_supplier_payments" ON supplier_payments;
CREATE POLICY "hub_manage_supplier_payments" ON supplier_payments
  FOR ALL USING (business_id = current_user_business_id());

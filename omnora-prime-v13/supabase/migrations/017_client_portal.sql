-- supabase/migrations/017_client_portal.sql

-- 1. Extend business_profiles with a slug for portal URLs
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Populate slug for existing businesses (basic slugification)
UPDATE business_profiles 
SET slug = LOWER(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- 2. Client Portal Tables
CREATE TABLE IF NOT EXISTS portal_customers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  party_id     UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  name         TEXT NOT NULL,
  portal_enabled BOOLEAN DEFAULT true,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, email)
);

CREATE TABLE IF NOT EXISTS portal_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID NOT NULL REFERENCES portal_customers(id) ON DELETE CASCADE,
  otp_hash     TEXT,              -- bcrypt hash of 6-digit OTP
  otp_expires  TIMESTAMPTZ,
  session_token TEXT UNIQUE,      -- issued after OTP verified
  token_expires TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id     UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES portal_customers(id) ON DELETE CASCADE,
  gateway        TEXT NOT NULL,    -- 'jazzcash'|'easypaisa'|'paddle'
  gateway_txn_id TEXT,
  amount         NUMERIC(12,2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'PKR',
  status         TEXT DEFAULT 'pending',
  initiated_at   TIMESTAMPTZ DEFAULT now(),
  completed_at   TIMESTAMPTZ
);

-- 3. RLS Policies
ALTER TABLE portal_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_payments ENABLE ROW LEVEL SECURITY;

-- Admin access (Hub users)
CREATE POLICY "hub_manage_portal_customers" ON portal_customers
  FOR ALL USING (business_id = current_user_business_id());

CREATE POLICY "hub_view_portal_sessions" ON portal_sessions
  FOR SELECT USING (customer_id IN (SELECT id FROM portal_customers WHERE business_id = current_user_business_id()));

CREATE POLICY "hub_view_portal_payments" ON portal_payments
  FOR SELECT USING (customer_id IN (SELECT id FROM portal_customers WHERE business_id = current_user_business_id()));

-- Customer access (via session_token - this will be handled in Edge Functions mostly, 
-- but we can add policies for direct access if needed using a custom claim)
-- For now, we rely on Edge Functions for portal data fetching to keep it secure and separate.


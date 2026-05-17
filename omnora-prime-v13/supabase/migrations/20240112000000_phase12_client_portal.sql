-- supabase/migrations/20240112000000_phase12_client_portal.sql

-- 1. Client Portals Table
CREATE TABLE IF NOT EXISTS client_portals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  party_id        UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'suspended', 'revoked')),
  invite_sent_at  TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, email),
  UNIQUE(business_id, party_id)
);

-- 2. Portal Sessions Table
CREATE TABLE IF NOT EXISTS portal_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id       UUID NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE, -- SHA-256
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address      TEXT,
  user_agent      TEXT
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_hash ON portal_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_expiry ON portal_sessions(expires_at);

-- 3. Portal Payment Intents Table
CREATE TABLE IF NOT EXISTS portal_payment_intents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  portal_id           UUID NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount              NUMERIC(18,4) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'PKR',
  provider            TEXT NOT NULL CHECK (provider IN ('stripe', 'jazzcash', 'easypaisa')),
  provider_intent_id  TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ppi_invoice ON portal_payment_intents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ppi_portal ON portal_payment_intents(portal_id);

-- 4. Helper: current_portal_id()
CREATE OR REPLACE FUNCTION current_portal_id()
RETURNS UUID AS $$
  SELECT current_setting('app.portal_id', true)::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Logic: get_client_statement
CREATE OR REPLACE FUNCTION get_client_statement(
  p_portal_id UUID,
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
)
RETURNS TABLE (
  invoice_id UUID,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  subtotal NUMERIC,
  tax_amount NUMERIC,
  total_amount NUMERIC,
  amount_paid NUMERIC,
  outstanding NUMERIC,
  status TEXT,
  days_overdue INT
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_party_id UUID;
BEGIN
  -- Get party_id for this portal
  SELECT party_id INTO v_party_id FROM client_portals WHERE id = p_portal_id;

  RETURN QUERY
  SELECT 
    i.id,
    i.invoice_no,
    i.issue_date,
    i.due_date,
    i.subtotal,
    i.tax_amount,
    i.total,
    i.paid_amount,
    (i.total - i.paid_amount) as outstanding,
    CASE 
      WHEN i.paid_amount >= i.total THEN 'paid'
      WHEN i.paid_amount > 0 THEN 'partial'
      WHEN i.due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'pending'
    END as status,
    CASE 
      WHEN i.due_date < CURRENT_DATE AND (i.total - i.paid_amount) > 0 
      THEN (CURRENT_DATE - i.due_date)::INT 
      ELSE NULL 
    END as days_overdue
  FROM invoices i
  WHERE i.party_id = v_party_id
    AND (p_from IS NULL OR i.issue_date >= p_from)
    AND (p_to IS NULL OR i.issue_date <= p_to)
  ORDER BY i.issue_date DESC;
END;
$$;

-- 6. Logic: get_client_summary
CREATE OR REPLACE FUNCTION get_client_summary(p_portal_id UUID)
RETURNS TABLE (
  total_invoiced NUMERIC,
  total_paid NUMERIC,
  total_outstanding NUMERIC,
  overdue_count INT,
  oldest_overdue_days INT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(total_amount)::NUMERIC,
    SUM(amount_paid)::NUMERIC,
    SUM(outstanding)::NUMERIC,
    COUNT(*) FILTER (WHERE status = 'overdue')::INT,
    MAX(days_overdue)::INT
  FROM get_client_statement(p_portal_id);
END;
$$;

-- 7. Logic: verify_portal_token
CREATE OR REPLACE FUNCTION verify_portal_token(p_token_hash TEXT)
RETURNS UUID AS $$
DECLARE
  v_portal_id UUID;
BEGIN
  SELECT ps.portal_id INTO v_portal_id
  FROM portal_sessions ps
  JOIN client_portals cp ON cp.id = ps.portal_id
  WHERE ps.token_hash = p_token_hash
    AND ps.expires_at > now()
    AND cp.status = 'active';

  IF v_portal_id IS NOT NULL THEN
    PERFORM set_config('app.portal_id', v_portal_id::TEXT, true);
    RETURN v_portal_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS Policies
ALTER TABLE client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_payment_intents ENABLE ROW LEVEL SECURITY;

-- client_portals
DROP POLICY IF EXISTS "hub_manage_portals" ON client_portals;
CREATE POLICY "hub_manage_portals" ON client_portals
  FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "portal_self_read" ON client_portals;
CREATE POLICY "portal_self_read" ON client_portals
  FOR SELECT USING (id = current_portal_id());

-- portal_sessions: Server side only (no direct RLS policies for external access)

-- portal_payment_intents
DROP POLICY IF EXISTS "hub_view_intents" ON portal_payment_intents;
CREATE POLICY "hub_view_intents" ON portal_payment_intents
  FOR SELECT USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "portal_view_intents" ON portal_payment_intents;
CREATE POLICY "portal_view_intents" ON portal_payment_intents
  FOR SELECT USING (portal_id = current_portal_id());

-- 9. Updated At Trigger
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_client_portals ON client_portals;
CREATE TRIGGER set_timestamp_client_portals
  BEFORE UPDATE ON client_portals
  FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cp_business_status ON client_portals(business_id, status);
CREATE INDEX IF NOT EXISTS idx_cp_email ON client_portals(email);


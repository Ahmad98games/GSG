-- supabase/migrations/008_tax_protection.sql

-- 1. Security Audit Table
CREATE TABLE IF NOT EXISTS security_audit (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  user_id         UUID NOT NULL,
  action          TEXT NOT NULL, -- e.g., 'PERIOD_UNLOCK'
  resource_type   TEXT,          -- e.g., 'tax_return_filings'
  resource_id     UUID,
  reason          TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Tax Configurations Table
CREATE TABLE IF NOT EXISTS tax_configurations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code    CHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
  tax_label       TEXT NOT NULL,
  default_rate    NUMERIC(5,2) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  UNIQUE(country_code, tax_label)
);

INSERT INTO tax_configurations (country_code, tax_label, default_rate) VALUES
('PK', 'GST', 18.00),
('AE', 'VAT', 5.00),
('US', 'Sales Tax', 8.00),
('GB', 'VAT', 20.00),
('IN', 'GST', 18.00)
ON CONFLICT (country_code, tax_label) DO UPDATE SET default_rate = EXCLUDED.default_rate;

-- 3. Update tax_return_filings with forensic fields
ALTER TABLE tax_return_filings ADD COLUMN IF NOT EXISTS forensic_fingerprint TEXT;

-- 4. Period Lock Trigger Function
CREATE OR REPLACE FUNCTION fn_check_period_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_is_locked BOOLEAN;
  v_tx_date DATE;
  v_business_id UUID;
BEGIN
  -- Determine transaction date and business_id based on table
  CASE TG_TABLE_NAME
    WHEN 'ledger_entries' THEN 
      v_tx_date := NEW.posted_at::DATE;
      v_business_id := NEW.business_id;
    WHEN 'invoices' THEN 
      v_tx_date := NEW.issue_date;
      v_business_id := NEW.business_id;
    WHEN 'purchase_orders' THEN 
      v_tx_date := NEW.order_date;
      v_business_id := NEW.business_id;
    ELSE RETURN NEW;
  END CASE;

  -- Check if any filed tax return overlaps with this date
  SELECT EXISTS (
    SELECT 1 FROM tax_return_filings
    WHERE business_id = v_business_id
      AND status = 'filed'
      AND v_tx_date BETWEEN period_from AND period_to
  ) INTO v_is_locked;

  IF v_is_locked AND TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'PERIOD_LOCKED: This transaction (date: %) belongs to a filed tax period and cannot be modified.', v_tx_date;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach Triggers to Core Financial Tables
DROP TRIGGER IF EXISTS trg_lock_ledger ON ledger_entries;
CREATE TRIGGER trg_lock_ledger 
  BEFORE INSERT OR UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION fn_check_period_lock();

DROP TRIGGER IF EXISTS trg_lock_invoices ON invoices;
CREATE TRIGGER trg_lock_invoices 
  BEFORE INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION fn_check_period_lock();

DROP TRIGGER IF EXISTS trg_lock_po ON purchase_orders;
CREATE TRIGGER trg_lock_po 
  BEFORE INSERT OR UPDATE OR DELETE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION fn_check_period_lock();

-- 6. Admin Unlock RPC
CREATE OR REPLACE FUNCTION unlock_tax_period(
  p_filing_id UUID,
  p_reason    TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Log the action to security audit
  INSERT INTO security_audit (business_id, user_id, action, resource_type, resource_id, reason)
  SELECT business_id, auth.uid(), 'PERIOD_UNLOCK', 'tax_return_filings', id, p_reason
  FROM tax_return_filings WHERE id = p_filing_id;

  -- Change status to amended to allow modifications
  UPDATE tax_return_filings
  SET status = 'amended'
  WHERE id = p_filing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


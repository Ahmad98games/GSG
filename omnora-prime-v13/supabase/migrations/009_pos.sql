-- supabase/migrations/009_pos.sql

CREATE TYPE sale_status AS ENUM ('open','completed','refunded','voided');
CREATE TYPE payment_mode_pos AS ENUM ('cash','card','jazzcash','easypaisa','bank_transfer','credit');

CREATE TABLE pos_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES business_profiles(id),
  location_id    UUID REFERENCES stock_locations_map(id),
  opened_by      UUID NOT NULL REFERENCES auth.users(id),
  opened_at      TIMESTAMPTZ DEFAULT now(),
  closed_at      TIMESTAMPTZ,
  opening_cash   NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_cash   NUMERIC(12,2),
  expected_cash  NUMERIC(12,2),   -- calculated: opening + cash sales - cash refunds
  cash_variance  NUMERIC(12,2) GENERATED ALWAYS AS (closing_cash - expected_cash) STORED,
  total_sales    NUMERIC(15,2) DEFAULT 0,
  is_closed      BOOLEAN DEFAULT false
);

CREATE TABLE pos_sales (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES business_profiles(id),
  session_id     UUID NOT NULL REFERENCES pos_sessions(id),
  sale_ref       TEXT NOT NULL,         -- SL-2025-00001
  party_id       UUID REFERENCES parties(id),
  status         sale_status NOT NULL DEFAULT 'open',
  subtotal       NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amt   NUMERIC(12,2) DEFAULT 0,
  tax_amount     NUMERIC(12,2) DEFAULT 0,
  total          NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_tendered NUMERIC(15,2),        -- cash given by customer
  change_due     NUMERIC(12,2) GENERATED ALWAYS AS (GREATEST(0, amount_tendered - total)) STORED,
  completed_at   TIMESTAMPTZ,
  ledger_entry_id UUID,
  UNIQUE(business_id, sale_ref)
);

CREATE TABLE pos_sale_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id      UUID NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  sku_id       UUID NOT NULL REFERENCES skus(id),
  qty          NUMERIC(10,4) NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  line_total   NUMERIC(12,2) GENERATED ALWAYS AS (qty * unit_price * (1 - discount_pct/100)) STORED
);

CREATE TABLE pos_payments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id    UUID NOT NULL REFERENCES pos_sales(id),
  mode       payment_mode_pos NOT NULL,
  amount     NUMERIC(12,2) NOT NULL,
  reference  TEXT       -- JazzCash TxID, card last4, etc.
);

-- RLS
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_sessions_rls" ON pos_sessions FOR ALL USING (business_id = current_user_business_id());
CREATE POLICY "pos_sales_rls" ON pos_sales FOR ALL USING (business_id = current_user_business_id());
CREATE POLICY "pos_items_rls" ON pos_sale_items FOR ALL USING (sale_id IN (SELECT id FROM pos_sales WHERE business_id = current_user_business_id()));
CREATE POLICY "pos_payments_rls" ON pos_payments FOR ALL USING (sale_id IN (SELECT id FROM pos_sales WHERE business_id = current_user_business_id()));

-- Auto sale ref
CREATE OR REPLACE FUNCTION generate_sale_ref() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.sale_ref = 'SL-' || TO_CHAR(now(),'YYYY') || '-' ||
    LPAD((SELECT COUNT(*)+1 FROM pos_sales WHERE business_id=NEW.business_id)::TEXT,5,'0');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sale_ref BEFORE INSERT ON pos_sales FOR EACH ROW
  WHEN (NEW.sale_ref IS NULL OR NEW.sale_ref='') EXECUTE FUNCTION generate_sale_ref();

-- On completed sale: deduct stock, post double-entry
CREATE OR REPLACE FUNCTION process_pos_completion() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status='completed' AND OLD.status='open' THEN
    -- Deduct stock for each line item
    UPDATE skus s SET qty_on_hand = qty_on_hand - i.qty
    FROM pos_sale_items i WHERE i.sale_id=NEW.id AND i.sku_id=s.id;
    -- Double-entry is posted via Edge Function (called from app layer on completion)
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_pos_complete AFTER UPDATE ON pos_sales FOR EACH ROW EXECUTE FUNCTION process_pos_completion();

CREATE INDEX idx_pos_sales_session ON pos_sales(session_id, completed_at DESC);
CREATE INDEX idx_pos_session_open ON pos_sessions(business_id) WHERE is_closed=false;


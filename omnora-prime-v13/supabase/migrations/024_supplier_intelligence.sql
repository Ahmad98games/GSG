-- supabase/migrations/024_supplier_intelligence.sql

-- Part A: Supplier Reliability Score
CREATE OR REPLACE FUNCTION get_supplier_scorecard(
  p_business_id uuid,
  p_supplier_id uuid
) RETURNS jsonb AS $$
DECLARE
  total_orders integer;
  on_time_orders integer;
  total_items_received integer;
  rejected_items integer;
  avg_lead_days numeric;
  price_variance numeric;
  score numeric;
BEGIN
  SELECT
    COUNT(*),
    COUNT(CASE WHEN gr.received_date <= po.expected_date 
               THEN 1 END),
    AVG(EXTRACT(DAY FROM gr.received_date - po.created_at))
  INTO total_orders, on_time_orders, avg_lead_days
  FROM purchase_orders po
  LEFT JOIN goods_received_notes gr ON gr.po_id = po.id
  WHERE po.business_id = p_business_id
  AND po.supplier_id = p_supplier_id
  AND po.status = 'received';

  on_time_orders := COALESCE(on_time_orders, 0);
  total_orders := GREATEST(total_orders, 1);

  -- Score: 40% on-time, 40% quality, 20% lead time
  score := ROUND(
    (on_time_orders::numeric / total_orders * 40) +
    (CASE WHEN avg_lead_days < 7 THEN 20
          WHEN avg_lead_days < 14 THEN 15
          WHEN avg_lead_days < 30 THEN 10
          ELSE 5 END) +
    40, -- quality score placeholder until rejection tracking added
    1
  );

  RETURN jsonb_build_object(
    'score', LEAST(score, 100),
    'total_orders', total_orders,
    'on_time_rate', ROUND(on_time_orders::numeric/total_orders*100, 1),
    'avg_lead_days', ROUND(COALESCE(avg_lead_days, 0), 1),
    'grade', CASE
      WHEN score >= 85 THEN 'A'
      WHEN score >= 70 THEN 'B'
      WHEN score >= 50 THEN 'C'
      ELSE 'D'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part B: Multi-Currency Support
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS currency text not null default 'PKR';
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS exchange_rate numeric(18,6) not null default 1.0;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS amount_base_currency numeric(18,4);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency text not null default 'PKR';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS exchange_rate numeric(18,6) not null default 1.0;

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id),
  from_currency text not null,
  to_currency text not null,
  rate numeric(18,6) not null,
  effective_date date not null,
  source text default 'manual',
  created_at timestamptz default now(),
  UNIQUE(business_id, from_currency, to_currency, effective_date)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_isolation" ON exchange_rates;
CREATE POLICY "business_isolation" ON exchange_rates
FOR ALL USING (business_id = current_user_business_id());

CREATE OR REPLACE FUNCTION create_invoice_atomic(
  p_business_id UUID,
  p_branch_id   UUID,
  p_party_id    UUID,
  p_invoice_no   TEXT,
  p_issue_date  DATE,
  p_due_date    DATE,
  p_items       JSONB,
  p_discount_pct NUMERIC,
  p_tax_pct      NUMERIC,
  p_posted_by    UUID,
  p_currency     TEXT DEFAULT 'PKR',
  p_exchange_rate NUMERIC DEFAULT 1.0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_item       RECORD;
  v_subtotal   NUMERIC := 0;
  v_disc_amt   NUMERIC := 0;
  v_tax_amt    NUMERIC := 0;
  v_total      NUMERIC := 0;
  v_ar_acc     UUID;
  v_sales_acc  UUID;
  v_tax_acc    UUID;
  v_cogs_acc   UUID;
  v_inv_acc    UUID;
  v_item_total NUMERIC;
  v_total_cost NUMERIC := 0;
  v_sku_cost   NUMERIC;
BEGIN
  SELECT id INTO v_ar_acc FROM accounts WHERE business_id = p_business_id AND account_code = '1100' LIMIT 1;
  SELECT id INTO v_sales_acc FROM accounts WHERE business_id = p_business_id AND account_code = '4001' LIMIT 1;
  SELECT id INTO v_tax_acc FROM accounts WHERE business_id = p_business_id AND account_code = '2100' LIMIT 1;
  SELECT id INTO v_cogs_acc FROM accounts WHERE business_id = p_business_id AND account_code = '5001' LIMIT 1;
  SELECT id INTO v_inv_acc FROM accounts WHERE business_id = p_business_id AND account_code = '1200' LIMIT 1;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(sku_id UUID, description TEXT, qty NUMERIC, unit TEXT, unit_price NUMERIC)
  LOOP
    v_item_total := v_item.qty * v_item.unit_price;
    v_subtotal := v_subtotal + v_item_total;
    IF v_item.sku_id IS NOT NULL THEN
      SELECT cost_price INTO v_sku_cost FROM skus WHERE id = v_item.sku_id;
      v_total_cost := v_total_cost + (COALESCE(v_sku_cost, 0) * v_item.qty);
    END IF;
  END LOOP;

  v_disc_amt := v_subtotal * (p_discount_pct / 100);
  v_tax_amt  := (v_subtotal - v_disc_amt) * (p_tax_pct / 100);
  v_total    := v_subtotal - v_disc_amt + v_tax_amt;

  INSERT INTO invoices (
    business_id, branch_id, party_id, invoice_no, status, issue_date, due_date,
    subtotal, discount_pct, discount_amount, tax_pct, tax_amount, total,
    currency, exchange_rate
  ) VALUES (
    p_business_id, p_branch_id, p_party_id, p_invoice_no, 'issued', p_issue_date, p_due_date,
    v_subtotal, p_discount_pct, v_disc_amt, p_tax_pct, v_tax_amt, v_total,
    p_currency, p_exchange_rate
  ) RETURNING id INTO v_invoice_id;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(sku_id UUID, description TEXT, qty NUMERIC, unit TEXT, unit_price NUMERIC)
  LOOP
    INSERT INTO invoice_items (invoice_id, sku_id, description, qty, unit, unit_price)
    VALUES (v_invoice_id, v_item.sku_id, v_item.description, v_item.qty, v_item.unit, v_item.unit_price);
    IF v_item.sku_id IS NOT NULL THEN
      UPDATE skus SET qty_on_hand = qty_on_hand - v_item.qty, updated_at = now() WHERE id = v_item.sku_id;
    END IF;
  END LOOP;

  -- Ledger entries with currency context
  INSERT INTO ledger_entries (business_id, branch_id, tx_ref, entry_type, account_id, party_id, amount, description, posted_by, invoice_id, currency, exchange_rate, amount_base_currency)
  VALUES (p_business_id, p_branch_id, p_invoice_no, 'debit', v_ar_acc, p_party_id, v_total, 'Sales Invoice: ' || p_invoice_no, p_posted_by, v_invoice_id, p_currency, p_exchange_rate, v_total * p_exchange_rate);

  INSERT INTO ledger_entries (business_id, branch_id, tx_ref, entry_type, account_id, party_id, amount, description, posted_by, invoice_id, currency, exchange_rate, amount_base_currency)
  VALUES (p_business_id, p_branch_id, p_invoice_no, 'credit', v_sales_acc, p_party_id, v_subtotal - v_disc_amt, 'Sales Revenue: ' || p_invoice_no, p_posted_by, v_invoice_id, p_currency, p_exchange_rate, (v_subtotal - v_disc_amt) * p_exchange_rate);

  IF v_tax_amt > 0 AND v_tax_acc IS NOT NULL THEN
    INSERT INTO ledger_entries (business_id, branch_id, tx_ref, entry_type, account_id, party_id, amount, description, posted_by, invoice_id, currency, exchange_rate, amount_base_currency)
    VALUES (p_business_id, p_branch_id, p_invoice_no, 'credit', v_tax_acc, p_party_id, v_tax_amt, 'Sales Tax: ' || p_invoice_no, p_posted_by, v_invoice_id, p_currency, p_exchange_rate, v_tax_amt * p_exchange_rate);
  END IF;

  RETURN v_invoice_id;
END;
CREATE OR REPLACE FUNCTION convert_currency(
  p_amount numeric,
  p_from text,
  p_to text,
  p_business_id uuid,
  p_date date default CURRENT_DATE
) RETURNS numeric AS $$
DECLARE
  rate numeric;
BEGIN
  IF p_from = p_to THEN RETURN p_amount; END IF;
  
  SELECT er.rate INTO rate
  FROM exchange_rates er
  WHERE er.business_id = p_business_id
  AND er.from_currency = p_from
  AND er.to_currency = p_to
  AND er.effective_date <= p_date
  ORDER BY er.effective_date DESC
  LIMIT 1;
  
  IF rate IS NULL THEN
    RAISE EXCEPTION 'No exchange rate found for % to % on %',
      p_from, p_to, p_date;
  END IF;
  
  RETURN ROUND(p_amount * rate, 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

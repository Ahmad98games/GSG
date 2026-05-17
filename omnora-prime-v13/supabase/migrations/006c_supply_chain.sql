-- supabase/migrations/006c_supply_chain.sql

DO $$ BEGIN
  CREATE TYPE po_status AS ENUM ('draft','sent','partially_received','received','cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE grn_status AS ENUM ('pending','inspected','accepted','rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  po_number       TEXT NOT NULL,
  supplier_id     UUID NOT NULL REFERENCES parties(id),
  status          po_status NOT NULL DEFAULT 'draft',
  order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_by     DATE,
  subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_pct         NUMERIC(5,2) DEFAULT 0,
  tax_amount      NUMERIC(15,2) DEFAULT 0,
  total           NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount     NUMERIC(15,2) DEFAULT 0,
  balance_due     NUMERIC(15,2) GENERATED ALWAYS AS (total - paid_amount) STORED,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, po_number)
);

CREATE TABLE IF NOT EXISTS po_line_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id       UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  sku_id      UUID REFERENCES skus(id),
  description TEXT NOT NULL,
  qty_ordered NUMERIC(15,4) NOT NULL,
  qty_received NUMERIC(15,4) DEFAULT 0,
  qty_pending  NUMERIC(15,4) GENERATED ALWAYS AS (qty_ordered - qty_received) STORED,
  unit        TEXT NOT NULL,
  unit_cost   NUMERIC(15,2) NOT NULL,
  line_total  NUMERIC(15,2) GENERATED ALWAYS AS (qty_ordered * unit_cost) STORED
);

-- Goods Received Note: actual physical receipt
CREATE TABLE IF NOT EXISTS goods_received_notes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  grn_number    TEXT NOT NULL,
  po_id         UUID REFERENCES purchase_orders(id),
  supplier_id   UUID NOT NULL REFERENCES parties(id),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status        grn_status NOT NULL DEFAULT 'pending',
  received_by   UUID REFERENCES auth.users(id),
  inspected_by  UUID REFERENCES auth.users(id),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, grn_number)
);

CREATE TABLE IF NOT EXISTS grn_line_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grn_id        UUID NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
  po_line_id    UUID REFERENCES po_line_items(id),
  sku_id        UUID NOT NULL REFERENCES skus(id),
  qty_received  NUMERIC(15,4) NOT NULL,
  qty_accepted  NUMERIC(15,4),    -- after inspection
  qty_rejected  NUMERIC(15,4),    -- defective/wrong
  reject_reason TEXT,
  unit_cost     NUMERIC(15,2) NOT NULL
);

-- Supplier scorecards (auto-calculated)
CREATE OR REPLACE VIEW supplier_scorecards AS
SELECT
  p.id AS supplier_id, p.name AS supplier_name, p.business_id,
  COUNT(DISTINCT po.id) AS total_pos,
  SUM(po.total) AS total_ordered_value,
  AVG(grn.received_date - po.expected_by) AS avg_delivery_variance_days,
  SUM(gli.qty_rejected) / NULLIF(SUM(gli.qty_received), 0) * 100 AS rejection_rate_pct,
  COUNT(CASE WHEN grn.received_date <= po.expected_by THEN 1 END)::NUMERIC /
    NULLIF(COUNT(DISTINCT grn.id), 0) * 100 AS on_time_delivery_pct,
  (SELECT order_date FROM purchase_orders WHERE supplier_id = p.id ORDER BY order_date DESC LIMIT 1) as last_order_date
FROM parties p
JOIN purchase_orders po ON po.supplier_id = p.id AND po.status != 'cancelled'
JOIN goods_received_notes grn ON grn.po_id = po.id
JOIN grn_line_items gli ON gli.grn_id = grn.id
WHERE p.party_type IN ('supplier','both')
GROUP BY p.id, p.name, p.business_id;

-- Auto-reorder suggestions (for low-stock items with configured reorder_level)
CREATE OR REPLACE VIEW reorder_suggestions AS
SELECT
  s.id AS sku_id, s.business_id, s.sku_code, s.name, s.unit,
  s.qty_on_hand, s.reorder_level,
  s.reorder_level - s.qty_on_hand AS qty_to_order,
  s.cost_price AS estimated_unit_cost,
  (s.reorder_level - s.qty_on_hand) * s.cost_price AS estimated_po_value,
  -- Last supplier for this SKU
  (SELECT po.supplier_id FROM po_line_items pli
   JOIN purchase_orders po ON po.id = pli.po_id
   WHERE pli.sku_id = s.id ORDER BY po.order_date DESC LIMIT 1) AS last_supplier_id
FROM skus s
WHERE s.is_active = true AND s.qty_on_hand < s.reorder_level AND s.reorder_level > 0;

-- RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_received_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_pos" ON purchase_orders;
CREATE POLICY "business_pos" ON purchase_orders FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_grns" ON goods_received_notes;
CREATE POLICY "business_grns" ON goods_received_notes FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "po_lines_via_po" ON po_line_items;
CREATE POLICY "po_lines_via_po" ON po_line_items FOR ALL USING (
  po_id IN (SELECT id FROM purchase_orders WHERE business_id = current_user_business_id()));

DROP POLICY IF EXISTS "grn_lines_via_grn" ON grn_line_items;
CREATE POLICY "grn_lines_via_grn" ON grn_line_items FOR ALL USING (
  grn_id IN (SELECT id FROM goods_received_notes WHERE business_id = current_user_business_id()));

-- Auto-generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.po_number = 'PO-' || TO_CHAR(now(), 'YYYY') || '-' ||
    LPAD((SELECT COUNT(*)+1 FROM purchase_orders WHERE business_id = NEW.business_id)::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_po_number ON purchase_orders;
CREATE TRIGGER trg_po_number BEFORE INSERT ON purchase_orders
  FOR EACH ROW WHEN (NEW.po_number IS NULL OR NEW.po_number = '') EXECUTE FUNCTION generate_po_number();

-- On GRN acceptance: update skus.qty_on_hand, po_line_items.qty_received AND post to ledger
CREATE OR REPLACE FUNCTION process_grn_acceptance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total_accepted_value NUMERIC(15,2);
  v_inventory_account_id UUID;
  v_ap_account_id UUID;
  v_payload JSONB;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- 1. Update stock
    UPDATE skus s SET qty_on_hand = qty_on_hand + gli.qty_accepted
    FROM grn_line_items gli WHERE gli.grn_id = NEW.id AND gli.sku_id = s.id;
    
    -- 2. Update PO received qty
    UPDATE po_line_items pli SET qty_received = qty_received + gli.qty_accepted
    FROM grn_line_items gli WHERE gli.grn_id = NEW.id AND gli.po_line_id = pli.id;
    
    -- 3. Status update for PO
    UPDATE purchase_orders SET status = 'partially_received' 
    WHERE id = NEW.po_id AND status != 'received';

    -- 4. FINANCIAL RECONCILIATION
    -- Calculate total accepted value
    SELECT SUM(qty_accepted * unit_cost) INTO v_total_accepted_value
    FROM grn_line_items WHERE grn_id = NEW.id;

    -- Identify Accounts (Standard codes: STOCK for Inventory, ACPAY for Accounts Payable)
    SELECT id INTO v_inventory_account_id FROM accounts WHERE business_id = NEW.business_id AND account_code = 'STOCK' LIMIT 1;
    SELECT id INTO v_ap_account_id FROM accounts WHERE business_id = NEW.business_id AND account_code = 'ACPAY' LIMIT 1;

    IF v_inventory_account_id IS NOT NULL AND v_ap_account_id IS NOT NULL AND v_total_accepted_value > 0 THEN
      v_payload = jsonb_build_object(
        'txRef', 'GRN-' || NEW.grn_number,
        'entries', jsonb_build_array(
          jsonb_build_object(
            'business_id', NEW.business_id,
            'entry_type', 'debit',
            'account_id', v_inventory_account_id,
            'amount', v_total_accepted_value,
            'description', 'Inventory Inward via GRN ' || NEW.grn_number
          ),
          jsonb_build_object(
            'business_id', NEW.business_id,
            'entry_type', 'credit',
            'account_id', v_ap_account_id,
            'party_id', NEW.supplier_id,
            'amount', v_total_accepted_value,
            'description', 'Liability to Supplier via GRN ' || NEW.grn_number
          )
        )
      );

      -- Dispatch to post-transaction Edge Function
      -- In production, the URL and key are managed via Supabase Vault or environment variables.
      -- We use a placeholder path that the infrastructure resolves.
      PERFORM net.http_post(
        url := 'https://' || NEW.business_id || '.supabase.co/functions/v1/post-transaction',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer service-role-key-placeholder'),
        body := v_payload
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grn_accept ON goods_received_notes;
CREATE TRIGGER trg_grn_accept AFTER UPDATE ON goods_received_notes
  FOR EACH ROW EXECUTE FUNCTION process_grn_acceptance();


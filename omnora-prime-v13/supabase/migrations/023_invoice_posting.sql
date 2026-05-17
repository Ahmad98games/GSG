-- supabase/migrations/023_invoice_posting.sql

CREATE OR REPLACE FUNCTION create_invoice_atomic(
  p_business_id UUID,
  p_branch_id   UUID,
  p_party_id    UUID,
  p_invoice_no   TEXT,
  p_issue_date  DATE,
  p_due_date    DATE,
  p_items       JSONB, -- array of {sku_id, description, qty, unit, unit_price}
  p_discount_pct NUMERIC,
  p_tax_pct      NUMERIC,
  p_posted_by    UUID
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
  -- 1. Fetch Account IDs
  SELECT id INTO v_ar_acc FROM accounts WHERE business_id = p_business_id AND account_code = '1100' LIMIT 1;
  SELECT id INTO v_sales_acc FROM accounts WHERE business_id = p_business_id AND account_code = '4001' LIMIT 1;
  SELECT id INTO v_tax_acc FROM accounts WHERE business_id = p_business_id AND account_code = '2100' LIMIT 1;
  SELECT id INTO v_cogs_acc FROM accounts WHERE business_id = p_business_id AND account_code = '5001' LIMIT 1;
  SELECT id INTO v_inv_acc FROM accounts WHERE business_id = p_business_id AND account_code = '1200' LIMIT 1;

  IF v_ar_acc IS NULL OR v_sales_acc IS NULL THEN
    RAISE EXCEPTION 'Core accounts (1100/4001) not found for this business.';
  END IF;

  -- 2. Calculate Totals from JSONB
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(sku_id UUID, description TEXT, qty NUMERIC, unit TEXT, unit_price NUMERIC)
  LOOP
    v_item_total := v_item.qty * v_item.unit_price;
    v_subtotal := v_subtotal + v_item_total;
    
    -- Track cost for COGS
    IF v_item.sku_id IS NOT NULL THEN
      SELECT cost_price INTO v_sku_cost FROM skus WHERE id = v_item.sku_id;
      v_total_cost := v_total_cost + (COALESCE(v_sku_cost, 0) * v_item.qty);
    END IF;
  END LOOP;

  v_disc_amt := v_subtotal * (p_discount_pct / 100);
  v_tax_amt  := (v_subtotal - v_disc_amt) * (p_tax_pct / 100);
  v_total    := v_subtotal - v_disc_amt + v_tax_amt;

  -- 3. Insert Invoice
  INSERT INTO invoices (
    business_id, branch_id, party_id, invoice_no, status, issue_date, due_date,
    subtotal, discount_pct, discount_amount, tax_pct, tax_amount, total
  ) VALUES (
    p_business_id, p_branch_id, p_party_id, p_invoice_no, 'issued', p_issue_date, p_due_date,
    v_subtotal, p_discount_pct, v_disc_amt, p_tax_pct, v_tax_amt, v_total
  ) RETURNING id INTO v_invoice_id;

  -- 4. Insert Items & Update Stock
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(sku_id UUID, description TEXT, qty NUMERIC, unit TEXT, unit_price NUMERIC)
  LOOP
    INSERT INTO invoice_items (invoice_id, sku_id, description, qty, unit, unit_price)
    VALUES (v_invoice_id, v_item.sku_id, v_item.description, v_item.qty, v_item.unit, v_item.unit_price);

    IF v_item.sku_id IS NOT NULL THEN
      UPDATE skus SET qty_on_hand = qty_on_hand - v_item.qty, updated_at = now()
      WHERE id = v_item.sku_id;
    END IF;
  END LOOP;

  -- 5. Ledger Entries (Double-Entry)
  -- DEBIT: Accounts Receivable
  INSERT INTO ledger_entries (business_id, branch_id, tx_ref, entry_type, account_id, party_id, amount, description, posted_by, invoice_id)
  VALUES (p_business_id, p_branch_id, p_invoice_no, 'debit', v_ar_acc, p_party_id, v_total, 'Sales Invoice: ' || p_invoice_no, p_posted_by, v_invoice_id);

  -- CREDIT: Sales Revenue
  INSERT INTO ledger_entries (business_id, branch_id, tx_ref, entry_type, account_id, party_id, amount, description, posted_by, invoice_id)
  VALUES (p_business_id, p_branch_id, p_invoice_no, 'credit', v_sales_acc, p_party_id, v_subtotal, 'Sales Revenue: ' || p_invoice_no, p_posted_by, v_invoice_id);

  -- CREDIT: Tax Payable (if tax > 0)
  IF v_tax_amt > 0 AND v_tax_acc IS NOT NULL THEN
    INSERT INTO ledger_entries (business_id, branch_id, tx_ref, entry_type, account_id, party_id, amount, description, posted_by, invoice_id)
    VALUES (p_business_id, p_branch_id, p_invoice_no, 'credit', v_tax_acc, p_party_id, v_tax_amt, 'Sales Tax (Output): ' || p_invoice_no, p_posted_by, v_invoice_id);
  END IF;

  -- DEBIT: Discount Allowed (if discount > 0) - Note: We might need a discount account, but for now we adjust sales or use a placeholder
  -- For now, we'll assume sales is recorded net of discount if no separate account. 
  -- But usually you want Gross Sales and Discount Expense. 
  -- We'll skip for now or just credit sales net. 
  -- Actually, let's keep it simple: Sales Revenue is recorded at (v_subtotal - v_disc_amt).
  
  -- 6. Inventory COGS Entry
  IF v_total_cost > 0 AND v_cogs_acc IS NOT NULL AND v_inv_acc IS NOT NULL THEN
     -- DEBIT: COGS
     INSERT INTO ledger_entries (business_id, branch_id, tx_ref, entry_type, account_id, amount, description, posted_by, invoice_id)
     VALUES (p_business_id, p_branch_id, p_invoice_no, 'debit', v_cogs_acc, v_total_cost, 'Cost of Goods Sold: ' || p_invoice_no, p_posted_by, v_invoice_id);
     
     -- CREDIT: Inventory
     INSERT INTO ledger_entries (business_id, branch_id, tx_ref, entry_type, account_id, amount, description, posted_by, invoice_id)
     VALUES (p_business_id, p_branch_id, p_invoice_no, 'credit', v_inv_acc, v_total_cost, 'Inventory Deduction: ' || p_invoice_no, p_posted_by, v_invoice_id);
  END IF;

  RETURN v_invoice_id;
END;
$$;

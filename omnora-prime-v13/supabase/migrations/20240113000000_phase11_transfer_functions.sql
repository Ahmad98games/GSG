-- supabase/migrations/20240113000000_phase11_transfer_functions.sql

-- 1. Initiate Transfer
CREATE OR REPLACE FUNCTION initiate_inter_branch_transfer(
  p_business_id   UUID,
  p_from_branch_id UUID,
  p_to_branch_id   UUID,
  p_sku_id         UUID,
  p_qty            NUMERIC,
  p_notes          TEXT,
  p_user_id        UUID
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_transfer_id UUID;
  v_ledger_id UUID;
  v_inv_acc_id UUID;
  v_transit_acc_id UUID;
  v_cost_price NUMERIC;
  v_total_value NUMERIC;
  v_sku_name TEXT;
BEGIN
  -- 1. Validate qty
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  -- 2. Lock SKU at origin
  SELECT qty_on_hand, cost_price, name INTO v_cost_price, v_cost_price, v_sku_name
  FROM skus 
  WHERE id = p_sku_id AND branch_id = p_from_branch_id
  FOR UPDATE;

  -- 3. Check availability
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SKU_NOT_FOUND_IN_BRANCH';
  END IF;

  -- 4. Get current qty and check
  DECLARE
    v_current_qty NUMERIC;
  BEGIN
    SELECT qty_on_hand, cost_price INTO v_current_qty, v_cost_price FROM skus WHERE id = p_sku_id;
    IF v_current_qty < p_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK';
    END IF;
  END;

  -- 5. Deduct Stock
  UPDATE skus SET qty_on_hand = qty_on_hand - p_qty WHERE id = p_sku_id;

  -- 6. Get Accounts
  SELECT id INTO v_inv_acc_id FROM accounts WHERE business_id = p_business_id AND account_code = '1200' LIMIT 1;
  SELECT id INTO v_transit_acc_id FROM accounts WHERE business_id = p_business_id AND account_code = '1210' LIMIT 1;

  IF v_inv_acc_id IS NULL OR v_transit_acc_id IS NULL THEN
    RAISE EXCEPTION 'SYSTEM_ACCOUNTS_MISSING';
  END IF;

  -- 7. Calculate Value
  v_total_value := p_qty * v_cost_price;

  -- 8. Create Ledger Entry (Credit Inventory at Origin)
  INSERT INTO ledger_entries (
    business_id, branch_id, tx_ref, entry_type, account_id, amount, description, posted_by, sku_id
  ) VALUES (
    p_business_id, p_from_branch_id, 'IBT-INIT-' || p_sku_id, 'credit', v_inv_acc_id, v_total_value, 
    'Inter-branch transfer initiation: ' || v_sku_name || ' (' || p_qty || ')', p_user_id, p_sku_id
  ) RETURNING id INTO v_ledger_id;

  -- (Debit Transit Asset - System wide or specific branch? User says "at fromBranch")
  INSERT INTO ledger_entries (
    business_id, branch_id, tx_ref, entry_type, account_id, amount, description, posted_by, sku_id
  ) VALUES (
    p_business_id, p_from_branch_id, 'IBT-INIT-' || p_sku_id, 'debit', v_transit_acc_id, v_total_value, 
    'Inter-branch transfer transit: ' || v_sku_name || ' (' || p_qty || ')', p_user_id, p_sku_id
  );

  -- 9. Create Transfer Record
  INSERT INTO inter_branch_transfers (
    business_id, from_branch_id, to_branch_id, sku_id, qty, status, initiated_by, notes, from_ledger_entry_id
  ) VALUES (
    p_business_id, p_from_branch_id, p_to_branch_id, p_sku_id, p_qty, 'in_transit', p_user_id, p_notes, v_ledger_id
  ) RETURNING id INTO v_transfer_id;

  RETURN v_transfer_id;
END;
$$;

-- 2. Receive Transfer
CREATE OR REPLACE FUNCTION receive_inter_branch_transfer(
  p_transfer_id UUID,
  p_user_id      UUID
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_transfer RECORD;
  v_inv_acc_id UUID;
  v_transit_acc_id UUID;
  v_cost_price NUMERIC;
  v_total_value NUMERIC;
  v_to_ledger_id UUID;
  v_sku_name TEXT;
BEGIN
  -- 1. Fetch Transfer
  SELECT * INTO v_transfer FROM inter_branch_transfers WHERE id = p_transfer_id FOR UPDATE;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSFER_NOT_FOUND'; END IF;
  IF v_transfer.status != 'in_transit' THEN RAISE EXCEPTION 'TRANSFER_NOT_IN_TRANSIT'; END IF;

  -- 2. Fetch SKU info
  SELECT cost_price, name INTO v_cost_price, v_sku_name FROM skus WHERE id = v_transfer.sku_id;

  -- 3. Update Stock at To Branch
  -- Check if SKU exists at to_branch, if not create/link it?
  -- Assumption: SKU must exist at all branches or we upsert.
  -- The prompt says "Add qty to skus.qty_on_hand at toBranch"
  UPDATE skus SET qty_on_hand = qty_on_hand + v_transfer.qty 
  WHERE id = v_transfer.sku_id AND branch_id = v_transfer.to_branch_id;

  IF NOT FOUND THEN
    -- If not found, we might need to create the row for this branch if skus are unique per branch
    -- But the schema has id as primary key. Usually skus are unique per product, but here skus table has branch_id.
    -- This implies there is a row per SKU per Branch.
    INSERT INTO skus (id, business_id, branch_id, sku_code, name, cost_price, qty_on_hand, unit)
    SELECT gen_random_uuid(), business_id, v_transfer.to_branch_id, sku_code, name, cost_price, v_transfer.qty, unit
    FROM skus WHERE id = v_transfer.sku_id;
  END IF;

  -- 4. Accounts
  SELECT id INTO v_inv_acc_id FROM accounts WHERE business_id = v_transfer.business_id AND account_code = '1200' LIMIT 1;
  SELECT id INTO v_transit_acc_id FROM accounts WHERE business_id = v_transfer.business_id AND account_code = '1210' LIMIT 1;

  -- 5. Value
  v_total_value := v_transfer.qty * v_cost_price;

  -- 6. Ledger: Debit Inventory at To Branch
  INSERT INTO ledger_entries (
    business_id, branch_id, tx_ref, entry_type, account_id, amount, description, posted_by, sku_id
  ) VALUES (
    v_transfer.business_id, v_transfer.to_branch_id, 'IBT-RECV-' || v_transfer.id, 'debit', v_inv_acc_id, v_total_value, 
    'Inter-branch transfer receipt: ' || v_sku_name, p_user_id, v_transfer.sku_id
  ) RETURNING id INTO v_to_ledger_id;

  -- 7. Ledger: Credit Transit Asset at To Branch
  INSERT INTO ledger_entries (
    business_id, branch_id, tx_ref, entry_type, account_id, amount, description, posted_by, sku_id
  ) VALUES (
    v_transfer.business_id, v_transfer.to_branch_id, 'IBT-RECV-' || v_transfer.id, 'credit', v_transit_acc_id, v_total_value, 
    'Inter-branch transfer settlement', p_user_id, v_transfer.sku_id
  );

  -- 8. Update Transfer
  UPDATE inter_branch_transfers SET 
    status = 'received',
    received_by = p_user_id,
    received_at = now(),
    to_ledger_entry_id = v_to_ledger_id
  WHERE id = p_transfer_id;
END;
$$;

-- 3. Cancel Transfer
CREATE OR REPLACE FUNCTION cancel_inter_branch_transfer(
  p_transfer_id UUID,
  p_user_id      UUID
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_transfer RECORD;
  v_inv_acc_id UUID;
  v_transit_acc_id UUID;
  v_cost_price NUMERIC;
  v_total_value NUMERIC;
  v_sku_name TEXT;
BEGIN
  -- 1. Fetch
  SELECT * INTO v_transfer FROM inter_branch_transfers WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSFER_NOT_FOUND'; END IF;
  IF v_transfer.status != 'in_transit' THEN RAISE EXCEPTION 'CANNOT_CANCEL_RECEIVED'; END IF;

  -- 2. Reverse Stock at Origin
  UPDATE skus SET qty_on_hand = qty_on_hand + v_transfer.qty 
  WHERE id = v_transfer.sku_id AND branch_id = v_transfer.from_branch_id;

  -- 3. Ledger Reversal
  SELECT cost_price, name INTO v_cost_price, v_sku_name FROM skus WHERE id = v_transfer.sku_id;
  v_total_value := v_transfer.qty * v_cost_price;

  SELECT id INTO v_inv_acc_id FROM accounts WHERE business_id = v_transfer.business_id AND account_code = '1200' LIMIT 1;
  SELECT id INTO v_transit_acc_id FROM accounts WHERE business_id = v_transfer.business_id AND account_code = '1210' LIMIT 1;

  -- Debit Inventory (Reversal of Credit)
  INSERT INTO ledger_entries (
    business_id, branch_id, tx_ref, entry_type, account_id, amount, description, posted_by, sku_id, status, reversal_of
  ) VALUES (
    v_transfer.business_id, v_transfer.from_branch_id, 'IBT-CNCL-' || v_transfer.id, 'debit', v_inv_acc_id, v_total_value, 
    'REVERSAL: Inter-branch transfer cancelled', p_user_id, v_transfer.sku_id, 'posted', v_transfer.from_ledger_entry_id
  );

  -- Credit Transit (Reversal of Debit)
  INSERT INTO ledger_entries (
    business_id, branch_id, tx_ref, entry_type, account_id, amount, description, posted_by, sku_id, status
  ) VALUES (
    v_transfer.business_id, v_transfer.from_branch_id, 'IBT-CNCL-' || v_transfer.id, 'credit', v_transit_acc_id, v_total_value, 
    'REVERSAL: Inter-branch transfer settlement', p_user_id, v_transfer.sku_id, 'posted'
  );

  -- 4. Update
  UPDATE inter_branch_transfers SET status = 'cancelled' WHERE id = p_transfer_id;
END;
$$;


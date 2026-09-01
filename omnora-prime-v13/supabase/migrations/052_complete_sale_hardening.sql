-- Migration 052: Complete Sale Hardening (Tenant Isolation, Aggregate Stock Locking, Server Price Verification, Input Validation, NULL Safety)

CREATE OR REPLACE FUNCTION complete_sale(
  p_business_id UUID,
  p_user_id UUID,
  p_client_transaction_id TEXT,
  p_invoice_date DATE,
  p_party_id UUID DEFAULT NULL,
  p_party_name TEXT DEFAULT NULL,
  p_party_phone TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_invoice_currency TEXT DEFAULT 'PKR',
  p_subtotal NUMERIC(15,2) DEFAULT 0,
  p_discount_amount NUMERIC(15,2) DEFAULT 0,
  p_discount_percent NUMERIC(5,2) DEFAULT 0,
  p_tax_amount NUMERIC(15,2) DEFAULT 0,
  p_grand_total NUMERIC(15,2) DEFAULT 0,
  p_items JSONB DEFAULT '[]',
  p_payments JSONB DEFAULT '[]'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_amount_paid NUMERIC(15,2) := 0;
  v_balance_due NUMERIC(15,2) := 0;
  v_unallocated NUMERIC(15,2) := 0;
  v_invoice_status TEXT;
  v_item JSONB;
  v_payment JSONB;
  v_sku_id UUID;
  v_qty_available NUMERIC(12,4);
  v_qty_requested NUMERIC(12,4);
  v_total_allocated NUMERIC(15,2) := 0;
  v_has_credit BOOLEAN := FALSE;
  v_existing_invoice_id UUID;
  v_seq INTEGER;
  v_prefix TEXT := 'INV';
  v_dr_total NUMERIC(15,2) := 0;
  v_cr_total NUMERIC(15,2) := 0;

  -- Price verification variables
  v_db_price NUMERIC(15,2);
  v_db_sku_biz UUID;
  v_item_unit_price NUMERIC(15,2);
  v_item_qty NUMERIC(12,4);
  v_item_disc_amt NUMERIC(15,2);
  v_item_tax_amt NUMERIC(15,2);
  v_item_line_total NUMERIC(15,2);
  v_calc_subtotal NUMERIC(15,2) := 0;
  v_calc_tax NUMERIC(15,2) := 0;
  v_calc_grand_total NUMERIC(15,2) := 0;
  v_is_owner BOOLEAN := FALSE;
  v_sku_rec RECORD;
BEGIN

  -- 1. TENANT AUTHORIZATION (PHASE A)
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM business_profiles WHERE id = p_business_id AND user_id = auth.uid()
      UNION
      SELECT 1 FROM branch_user_assignments WHERE business_id = p_business_id AND user_id = auth.uid()
    ) THEN
      RETURN jsonb_build_object(
        'status', 'ERROR',
        'error_code', 'UNAUTHORIZED_BUSINESS',
        'message', 'Caller is not authorized for this business'
      );
    END IF;

    -- Check if user is owner for price override permission
    SELECT EXISTS (
      SELECT 1 FROM business_profiles WHERE id = p_business_id AND user_id = auth.uid()
    ) INTO v_is_owner;
  ELSE
    v_is_owner := TRUE; -- System / service_role context
  END IF;

  -- Validate Party Tenant Match
  IF p_party_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM parties WHERE id = p_party_id AND business_id = p_business_id
    ) THEN
      RETURN jsonb_build_object(
        'status', 'ERROR',
        'error_code', 'INVALID_PARTY',
        'message', 'Customer party does not belong to this business'
      );
    END IF;
  END IF;

  -- 2. IDEMPOTENCY CHECK
  SELECT id INTO v_existing_invoice_id
  FROM invoices
  WHERE business_id = p_business_id
  AND client_transaction_id = p_client_transaction_id
  LIMIT 1;

  IF v_existing_invoice_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'ALREADY_COMPLETED',
      'invoice_id', v_existing_invoice_id,
      'idempotent', true
    );
  END IF;

  -- 3. VALIDATE BUSINESS & LOCK FOR INVOICE COUNTER
  SELECT COALESCE(invoice_counter, 1), COALESCE(invoice_prefix, 'INV')
  INTO v_seq, v_prefix
  FROM business_profiles
  WHERE id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'ERROR',
      'error_code', 'INVALID_BUSINESS',
      'message', 'Business profile not found'
    );
  END IF;

  -- 4. VALIDATE PAYLOAD STRUCTURE & PAYMENTS (PHASE D)
  IF jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object(
      'status', 'ERROR',
      'error_code', 'INVALID_PAYLOAD',
      'message', 'No items in sale'
    );
  END IF;

  IF p_grand_total <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'ERROR',
      'error_code', 'INVALID_TOTAL',
      'message', 'Grand total must be positive'
    );
  END IF;

  -- Validate Payments
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    DECLARE
      v_pay_amt NUMERIC(15,2) := (v_payment->>'amount')::NUMERIC;
      v_pay_meth TEXT := v_payment->>'method';
    BEGIN
      IF v_pay_amt <= 0 THEN
        RETURN jsonb_build_object(
          'status', 'ERROR',
          'error_code', 'INVALID_PAYMENT',
          'message', 'Payment amount must be greater than zero'
        );
      END IF;

      IF v_pay_meth NOT IN ('cash', 'bank', 'jazzcash', 'easypaisa', 'credit', 'cheque') THEN
        RETURN jsonb_build_object(
          'status', 'ERROR',
          'error_code', 'INVALID_PAYMENT',
          'message', format('Unsupported payment method: %s', v_pay_meth)
        );
      END IF;

      v_total_allocated := v_total_allocated + v_pay_amt;
      IF v_pay_meth = 'credit' THEN
        v_has_credit := TRUE;
      END IF;
    END;
  END LOOP;

  v_unallocated := GREATEST(0, p_grand_total - v_total_allocated);

  IF (v_has_credit OR v_unallocated > 0) AND p_party_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'ERROR',
      'error_code', 'CREDIT_REQUIRES_PARTY',
      'message', 'Credit payment requires a customer'
    );
  END IF;

  -- 5. SERVER-SIDE PRICE INTEGRITY & INPUT VALIDATION (PHASE C & D)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_sku_id := (v_item->>'sku_id')::UUID;
    v_item_qty := (v_item->>'quantity')::NUMERIC;
    v_item_unit_price := (v_item->>'unit_price')::NUMERIC;
    v_item_disc_amt := COALESCE((v_item->>'discount_amount')::NUMERIC, 0);
    v_item_tax_amt := COALESCE((v_item->>'tax_amount')::NUMERIC, 0);
    v_item_line_total := (v_item->>'line_total')::NUMERIC;

    IF v_item_qty <= 0 THEN
      RETURN jsonb_build_object(
        'status', 'ERROR',
        'error_code', 'INVALID_QUANTITY',
        'message', format('Quantity must be greater than zero for SKU: %s', v_sku_id)
      );
    END IF;

    IF v_item_unit_price < 0 OR v_item_disc_amt < 0 OR v_item_tax_amt < 0 THEN
      RETURN jsonb_build_object(
        'status', 'ERROR',
        'error_code', 'INVALID_PAYLOAD',
        'message', 'Unit price, discount and tax must be non-negative'
      );
    END IF;

    -- Fetch DB price & tenant verification
    SELECT sale_price, business_id INTO v_db_price, v_db_sku_biz
    FROM skus WHERE id = v_sku_id AND is_active = TRUE;

    IF NOT FOUND OR v_db_sku_biz != p_business_id THEN
      RETURN jsonb_build_object(
        'status', 'ERROR',
        'error_code', 'INVALID_SKU',
        'message', format('SKU not found or does not belong to business: %s', v_sku_id)
      );
    END IF;

    -- Enforce price override permission
    IF v_item_unit_price != v_db_price AND NOT v_is_owner THEN
      RETURN jsonb_build_object(
        'status', 'ERROR',
        'error_code', 'PRICE_MISMATCH',
        'message', format('Price override not authorized for SKU: %s', v_sku_id)
      );
    END IF;

    v_calc_subtotal := v_calc_subtotal + ((v_item_unit_price * v_item_qty) - v_item_disc_amt);
    v_calc_tax := v_calc_tax + v_item_tax_amt;
  END LOOP;

  v_calc_grand_total := round(v_calc_subtotal - p_discount_amount + v_calc_tax, 2);

  IF round(v_calc_grand_total, 2) != round(p_grand_total, 2) THEN
    RETURN jsonb_build_object(
      'status', 'ERROR',
      'error_code', 'PRICE_MISMATCH',
      'message', format('Grand total mismatch. Client: %s, Calculated: %s', p_grand_total, v_calc_grand_total)
    );
  END IF;

  -- 6. AGGREGATE DUPLICATE SKUs & LOCK INVENTORY ROWS (PHASE B)
  FOR v_sku_rec IN
    SELECT (item->>'sku_id')::UUID AS sku_id, SUM((item->>'quantity')::NUMERIC) AS total_qty
    FROM jsonb_array_elements(p_items) item
    GROUP BY 1
  LOOP
    SELECT qty_on_hand INTO v_qty_available
    FROM skus
    WHERE id = v_sku_rec.sku_id
    AND business_id = p_business_id
    AND is_active = TRUE
    FOR UPDATE;

    IF v_qty_available < v_sku_rec.total_qty THEN
      RETURN jsonb_build_object(
        'status', 'ERROR',
        'error_code', 'INSUFFICIENT_STOCK',
        'sku_id', v_sku_rec.sku_id,
        'available', v_qty_available,
        'requested', v_sku_rec.total_qty,
        'message', format('Insufficient stock for SKU %s. Available: %s, Requested: %s', v_sku_rec.sku_id, v_qty_available, v_sku_rec.total_qty)
      );
    END IF;
  END LOOP;

  -- 7. GENERATE INVOICE NUMBER
  v_invoice_number := v_prefix || '-' || LPAD(v_seq::TEXT, 6, '0');

  UPDATE business_profiles
  SET invoice_counter = invoice_counter + 1,
      updated_at = NOW()
  WHERE id = p_business_id;

  -- 8. CALCULATE PAYMENT STATE
  v_amount_paid := 0;
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    IF (v_payment->>'method') != 'credit' THEN
      v_amount_paid := v_amount_paid + (v_payment->>'amount')::NUMERIC;
    END IF;
  END LOOP;

  v_balance_due := GREATEST(0, p_grand_total - v_amount_paid);

  v_invoice_status := CASE
    WHEN v_balance_due <= 0 THEN 'paid'
    WHEN v_amount_paid > 0 THEN 'partial'
    ELSE 'posted'
  END;

  -- 9. CREATE INVOICE
  v_invoice_id := gen_random_uuid();

  INSERT INTO invoices (
    id, business_id, invoice_number,
    invoice_type, party_id,
    party_name, party_phone,
    invoice_date, status,
    subtotal, discount_amount,
    discount_percent, tax_amount,
    total_amount, amount_paid,
    balance_due, invoice_currency,
    client_transaction_id, notes,
    created_at, updated_at
  ) VALUES (
    v_invoice_id, p_business_id,
    v_invoice_number, 'invoice',
    p_party_id, p_party_name,
    p_party_phone, p_invoice_date,
    v_invoice_status,
    p_subtotal, p_discount_amount,
    p_discount_percent, p_tax_amount,
    p_grand_total, v_amount_paid,
    v_balance_due, p_invoice_currency,
    p_client_transaction_id, p_notes,
    NOW(), NOW()
  );

  -- 10. INSERT ITEMS & DEDUCT AGGREGATED STOCK ATOMICALLY
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO invoice_items (
      id, invoice_id, business_id,
      sku_id, description,
      quantity, unit, unit_price,
      discount_percent, discount_amount,
      tax_rate, tax_amount, total_price,
      sort_order
    ) VALUES (
      gen_random_uuid(),
      v_invoice_id,
      p_business_id,
      (v_item->>'sku_id')::UUID,
      v_item->>'description',
      (v_item->>'quantity')::NUMERIC,
      v_item->>'unit',
      (v_item->>'unit_price')::NUMERIC,
      COALESCE((v_item->>'discount_percent')::NUMERIC, 0),
      COALESCE((v_item->>'discount_amount')::NUMERIC, 0),
      COALESCE((v_item->>'tax_rate')::NUMERIC, 0),
      COALESCE((v_item->>'tax_amount')::NUMERIC, 0),
      (v_item->>'line_total')::NUMERIC,
      0
    );
  END LOOP;

  -- Deduct aggregated stock quantities
  FOR v_sku_rec IN
    SELECT (item->>'sku_id')::UUID AS sku_id, SUM((item->>'quantity')::NUMERIC) AS total_qty
    FROM jsonb_array_elements(p_items) item
    GROUP BY 1
  LOOP
    UPDATE skus SET
      qty_on_hand = qty_on_hand - v_sku_rec.total_qty,
      updated_at = NOW()
    WHERE id = v_sku_rec.sku_id
    AND business_id = p_business_id;

    INSERT INTO stock_adjustments (
      id, business_id, sku_id,
      adjustment_type, quantity,
      reason, reference,
      adjustment_date, adjusted_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      p_business_id,
      v_sku_rec.sku_id,
      'decrease',
      -v_sku_rec.total_qty,
      'sale',
      v_invoice_number,
      p_invoice_date,
      COALESCE(p_user_id::TEXT, auth.uid()::TEXT),
      NOW()
    );
  END LOOP;

  -- 11. RECORD PAYMENTS
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    INSERT INTO payments (
      id, business_id, invoice_id,
      party_id, payment_type,
      amount, payment_date,
      payment_method, reference,
      created_at
    ) VALUES (
      gen_random_uuid(),
      p_business_id,
      v_invoice_id,
      p_party_id,
      'received',
      (v_payment->>'amount')::NUMERIC,
      p_invoice_date,
      v_payment->>'method',
      v_payment->>'reference',
      NOW()
    );
  END LOOP;

  IF v_unallocated > 0 THEN
    INSERT INTO payments (
      id, business_id, invoice_id,
      party_id, payment_type,
      amount, payment_date,
      payment_method, reference,
      created_at
    ) VALUES (
      gen_random_uuid(),
      p_business_id,
      v_invoice_id,
      p_party_id,
      'received',
      v_unallocated,
      p_invoice_date,
      'credit',
      'Auto Unallocated Credit',
      NOW()
    );
  END IF;

  -- 12. DOUBLE-ENTRY ACCOUNTING
  INSERT INTO ledger_entries (
    id, business_id, party_id,
    entry_type, entry_date,
    description, debit, credit,
    source_table, source_id,
    created_at
  ) VALUES (
    gen_random_uuid(), p_business_id,
    p_party_id, 'sales',
    p_invoice_date,
    'Sale: ' || v_invoice_number,
    0, p_grand_total,
    'invoices', v_invoice_id,
    NOW()
  );
  v_cr_total := v_cr_total + p_grand_total;

  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    DECLARE
      v_pay_amount NUMERIC(15,2) := (v_payment->>'amount')::NUMERIC;
      v_pay_method TEXT := v_payment->>'method';
      v_account_desc TEXT;
    BEGIN
      v_account_desc := CASE v_pay_method
        WHEN 'cash' THEN 'Cash Received'
        WHEN 'bank' THEN 'Bank Transfer Received'
        WHEN 'jazzcash' THEN 'JazzCash Received'
        WHEN 'easypaisa' THEN 'EasyPaisa Received'
        WHEN 'credit' THEN 'Accounts Receivable'
        ELSE 'Payment Received'
      END;

      INSERT INTO ledger_entries (
        id, business_id, party_id,
        entry_type, entry_date,
        description, debit, credit,
        source_table, source_id,
        created_at
      ) VALUES (
        gen_random_uuid(),
        p_business_id,
        p_party_id,
        'sales',
        p_invoice_date,
        v_account_desc || ': ' || v_invoice_number,
        v_pay_amount, 0,
        'invoices', v_invoice_id,
        NOW()
      );
      v_dr_total := v_dr_total + v_pay_amount;
    END;
  END LOOP;

  IF v_unallocated > 0 THEN
    INSERT INTO ledger_entries (
      id, business_id, party_id,
      entry_type, entry_date,
      description, debit, credit,
      source_table, source_id,
      created_at
    ) VALUES (
      gen_random_uuid(),
      p_business_id,
      p_party_id,
      'sales',
      p_invoice_date,
      'Accounts Receivable: ' || v_invoice_number,
      v_unallocated, 0,
      'invoices', v_invoice_id,
      NOW()
    );
    v_dr_total := v_dr_total + v_unallocated;
  END IF;

  IF round(v_dr_total, 2) != round(v_cr_total, 2) THEN
    RAISE EXCEPTION 'ACCOUNTING_IMBALANCE: DR=% CR=%', v_dr_total, v_cr_total;
  END IF;

  -- 13. UPDATE PARTY BALANCE WITH NULL SAFETY (PHASE E)
  IF p_party_id IS NOT NULL AND v_balance_due > 0 THEN
    UPDATE parties SET
      current_balance = COALESCE(current_balance, 0) + v_balance_due,
      updated_at = NOW()
    WHERE id = p_party_id
    AND business_id = p_business_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'SUCCESS',
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'invoice_status', v_invoice_status,
    'amount_paid', v_amount_paid,
    'balance_due', v_balance_due,
    'idempotent', false
  );

EXCEPTION
  WHEN unique_violation THEN
    SELECT id INTO v_existing_invoice_id
    FROM invoices
    WHERE business_id = p_business_id
    AND client_transaction_id = p_client_transaction_id
    LIMIT 1;

    RETURN jsonb_build_object(
      'status', 'ALREADY_COMPLETED',
      'invoice_id', v_existing_invoice_id,
      'idempotent', true
    );

  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'ERROR',
      'error_code', 'TRANSACTION_FAILED',
      'message', SQLERRM
    );
END;
$$;

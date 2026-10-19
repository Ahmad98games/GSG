-- Migration 053: Fix complete_sale RPC for Live Production Schema
-- Compatible with 003_fintech.sql and supports POS walk-in sales without p_user_id or party_id

-- 1. Ensure idempotency & counter columns exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_transaction_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_client_transaction_id
  ON invoices(business_id, client_transaction_id)
  WHERE client_transaction_id IS NOT NULL;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Allow walk-in retail sales where party_id is not specified
ALTER TABLE invoices ALTER COLUMN party_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN party_id DROP NOT NULL;

-- 3. Ensure business_profiles has invoice numbering columns
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS invoice_counter INTEGER DEFAULT 1;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';

-- 4. Drop all previous / duplicate conflicting complete_sale signatures to eliminate overload ambiguity (PGRST203)
DROP FUNCTION IF EXISTS complete_sale(UUID, UUID, TEXT, DATE, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, JSONB);
DROP FUNCTION IF EXISTS complete_sale(UUID, TEXT, DATE, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, JSONB);
DROP FUNCTION IF EXISTS complete_sale(UUID, TEXT, DATE, UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, JSONB);

-- 5. Unified complete_sale RPC (handles both 16 and 15 argument calls with p_user_id DEFAULT NULL)
CREATE OR REPLACE FUNCTION complete_sale(
  p_business_id UUID,
  p_client_transaction_id TEXT,
  p_invoice_date DATE,
  p_user_id UUID DEFAULT NULL,
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
  p_items JSONB DEFAULT '[]'::jsonb,
  p_payments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_invoice_id UUID;
  v_invoice_id UUID;
  v_payment_id UUID;
  v_invoice_number TEXT;
  v_seq INTEGER;
  v_prefix TEXT := 'INV';
  v_amount_paid NUMERIC(15,2) := 0;
  v_balance_due NUMERIC(15,2) := 0;
  v_invoice_status invoice_status;
  v_item JSONB;
  v_payment JSONB;
  v_sku_id UUID;
  v_item_qty NUMERIC(15,4);
  v_item_unit_price NUMERIC(15,2);
BEGIN
  -- 1. Idempotency Check
  IF p_client_transaction_id IS NOT NULL AND p_client_transaction_id != '' THEN
    SELECT id, invoice_no INTO v_existing_invoice_id, v_invoice_number
    FROM invoices
    WHERE business_id = p_business_id
    AND client_transaction_id = p_client_transaction_id
    LIMIT 1;

    IF v_existing_invoice_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'status', 'ALREADY_COMPLETED',
        'invoice_id', v_existing_invoice_id,
        'invoice_number', v_invoice_number,
        'idempotent', true
      );
    END IF;
  END IF;

  -- 2. Lock and retrieve sequence from business_profiles
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

  -- 3. Calculate sequence and update counter
  v_invoice_number := v_prefix || '-' || LPAD(v_seq::TEXT, 6, '0');

  UPDATE business_profiles
  SET invoice_counter = COALESCE(invoice_counter, 1) + 1,
      updated_at = NOW()
  WHERE id = p_business_id;

  -- 4. Calculate Payment & Balance
  v_amount_paid := 0;
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    IF (v_payment->>'method') != 'credit' THEN
      v_amount_paid := v_amount_paid + COALESCE((v_payment->>'amount')::NUMERIC, 0);
    END IF;
  END LOOP;

  v_balance_due := GREATEST(0, p_grand_total - v_amount_paid);

  v_invoice_status := CASE
    WHEN v_balance_due <= 0 THEN 'paid'::invoice_status
    WHEN v_amount_paid > 0 THEN 'partially_paid'::invoice_status
    ELSE 'issued'::invoice_status
  END;

  -- 5. Insert Invoice
  v_invoice_id := gen_random_uuid();

  INSERT INTO invoices (
    id,
    business_id,
    invoice_no,
    party_id,
    status,
    issue_date,
    subtotal,
    discount_pct,
    discount_amount,
    tax_pct,
    tax_amount,
    total,
    paid_amount,
    notes,
    client_transaction_id,
    created_at,
    updated_at
  ) VALUES (
    v_invoice_id,
    p_business_id,
    v_invoice_number,
    p_party_id,
    v_invoice_status,
    p_invoice_date,
    p_subtotal,
    p_discount_percent,
    p_discount_amount,
    CASE WHEN p_subtotal > 0 THEN ROUND((p_tax_amount / p_subtotal) * 100, 2) ELSE 0 END,
    p_tax_amount,
    p_grand_total,
    v_amount_paid,
    p_notes,
    p_client_transaction_id,
    NOW(),
    NOW()
  );

  -- 6. Insert Items & Decrement Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_sku_id := NULL;
    IF (v_item->>'sku_id') IS NOT NULL AND (v_item->>'sku_id') != '' THEN
      BEGIN
        v_sku_id := (v_item->>'sku_id')::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_sku_id := NULL;
      END;
    END IF;

    v_item_qty := COALESCE((v_item->>'quantity')::NUMERIC, 1);
    v_item_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0);

    INSERT INTO invoice_items (
      id,
      invoice_id,
      sku_id,
      description,
      qty,
      unit,
      unit_price
    ) VALUES (
      gen_random_uuid(),
      v_invoice_id,
      v_sku_id,
      COALESCE(v_item->>'description', 'POS Sale Item'),
      v_item_qty,
      COALESCE(v_item->>'unit', 'pcs'),
      v_item_unit_price
    );

    IF v_sku_id IS NOT NULL THEN
      UPDATE skus
      SET qty_on_hand = GREATEST(0, COALESCE(qty_on_hand, 0) - v_item_qty),
          updated_at = NOW()
      WHERE id = v_sku_id
      AND business_id = p_business_id;
    END IF;
  END LOOP;

  -- 7. Record Payments & Payment Splits
  IF v_amount_paid > 0 THEN
    v_payment_id := gen_random_uuid();

    INSERT INTO payments (
      id,
      business_id,
      invoice_id,
      party_id,
      total_amount,
      payment_date,
      notes,
      created_at
    ) VALUES (
      v_payment_id,
      p_business_id,
      v_invoice_id,
      p_party_id,
      v_amount_paid,
      p_invoice_date,
      'POS Sale Receipt #' || v_invoice_number,
      NOW()
    );

    FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
    LOOP
      DECLARE
        v_split_mode_str TEXT := LOWER(COALESCE(v_payment->>'method', 'cash'));
        v_split_mode payment_mode;
        v_split_amt NUMERIC(15,2) := COALESCE((v_payment->>'amount')::NUMERIC, 0);
      BEGIN
        IF v_split_amt > 0 AND v_split_mode_str != 'credit' THEN
          v_split_mode := CASE v_split_mode_str
            WHEN 'cash' THEN 'cash'::payment_mode
            WHEN 'bank' THEN 'bank_transfer'::payment_mode
            WHEN 'bank_transfer' THEN 'bank_transfer'::payment_mode
            WHEN 'cheque' THEN 'cheque'::payment_mode
            WHEN 'credit' THEN 'credit'::payment_mode
            ELSE 'digital_wallet'::payment_mode
          END;

          INSERT INTO payment_splits (
            id,
            payment_id,
            mode,
            amount,
            reference
          ) VALUES (
            gen_random_uuid(),
            v_payment_id,
            v_split_mode,
            v_split_amt,
            v_payment->>'reference'
          );
        END IF;
      END;
    END LOOP;
  END IF;

  -- 8. Customer party balance update (if credit/party provided)
  IF p_party_id IS NOT NULL AND v_balance_due > 0 THEN
    UPDATE parties
    SET current_balance = COALESCE(current_balance, 0) + v_balance_due
    WHERE id = p_party_id
    AND business_id = p_business_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'SUCCESS',
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'invoice_status', v_invoice_status::TEXT,
    'amount_paid', v_amount_paid,
    'balance_due', v_balance_due,
    'idempotent', false
  );

EXCEPTION
  WHEN unique_violation THEN
    SELECT id, invoice_no INTO v_existing_invoice_id, v_invoice_number
    FROM invoices
    WHERE business_id = p_business_id
    AND client_transaction_id = p_client_transaction_id
    LIMIT 1;

    IF v_existing_invoice_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'status', 'ALREADY_COMPLETED',
        'invoice_id', v_existing_invoice_id,
        'invoice_number', v_invoice_number,
        'idempotent', true
      );
    ELSE
      RETURN jsonb_build_object(
        'status', 'ERROR',
        'error_code', 'UNIQUE_VIOLATION',
        'message', SQLERRM
      );
    END IF;

  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'ERROR',
      'error_code', 'TRANSACTION_FAILED',
      'message', SQLERRM
    );
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION complete_sale(UUID, TEXT, DATE, UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, JSONB) TO anon, authenticated, service_role;

-- Migration: 057_fix_owner_phone_and_ledger_payments.sql
-- 1. Fix Business Profiles: Add owner_phone and profile customization fields
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS owner_phone TEXT;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS industry_key TEXT DEFAULT 'general';
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS industry_last_changed_at TIMESTAMPTZ;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'custom';
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS avatar_last_changed TIMESTAMPTZ;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS avatar_preset_id INTEGER DEFAULT 1;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS worker_term TEXT DEFAULT 'Karigar';

-- Sync existing phone to owner_phone if empty
UPDATE business_profiles 
SET owner_phone = phone 
WHERE (owner_phone IS NULL OR owner_phone = '') AND (phone IS NOT NULL AND phone != '');

UPDATE business_profiles 
SET phone = owner_phone 
WHERE (phone IS NULL OR phone = '') AND (owner_phone IS NOT NULL AND owner_phone != '');

-- Bidirectional trigger to keep phone and owner_phone synchronized
CREATE OR REPLACE FUNCTION trg_sync_business_profile_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_phone IS NOT NULL AND NEW.owner_phone != '' AND (NEW.phone IS NULL OR NEW.phone = '') THEN
    NEW.phone := NEW.owner_phone;
  ELSIF NEW.phone IS NOT NULL AND NEW.phone != '' AND (NEW.owner_phone IS NULL OR NEW.owner_phone = '') THEN
    NEW.owner_phone := NEW.phone;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_phone ON business_profiles;
CREATE TRIGGER trg_sync_phone
  BEFORE INSERT OR UPDATE ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_business_profile_phone();

-- 2. Fix Ledger Entries: Add backward-compatibility columns for compiled desktop apps
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS credit_account TEXT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS debit_account TEXT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS voucher_type TEXT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS entry_date TIMESTAMPTZ DEFAULT now();

-- Expand entry_type enum to include payment types
DO $$
BEGIN
  ALTER TYPE entry_type ADD VALUE IF NOT EXISTS 'payment_received';
  ALTER TYPE entry_type ADD VALUE IF NOT EXISTS 'payment_made';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Relax constraints on ledger_entries so direct inserts don't fail on missing tx_ref or account_id
ALTER TABLE ledger_entries ALTER COLUMN tx_ref DROP NOT NULL;
ALTER TABLE ledger_entries ALTER COLUMN tx_ref SET DEFAULT ('PAY-' || floor(extract(epoch from now()))::text);
ALTER TABLE ledger_entries ALTER COLUMN account_id DROP NOT NULL;

-- Automatically populate account_id if not supplied by desktop app
CREATE OR REPLACE FUNCTION trg_auto_fill_ledger_entries()
RETURNS TRIGGER AS $$
DECLARE
  v_acc_id UUID;
BEGIN
  IF NEW.tx_ref IS NULL OR NEW.tx_ref = '' THEN
    NEW.tx_ref := 'PAY-' || to_hex(floor(extract(epoch from now()))::bigint);
  END IF;

  IF NEW.account_id IS NULL THEN
    SELECT id INTO v_acc_id FROM accounts WHERE business_id = NEW.business_id LIMIT 1;
    NEW.account_id := v_acc_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_autofill ON ledger_entries;
CREATE TRIGGER trg_ledger_autofill
  BEFORE INSERT ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION trg_auto_fill_ledger_entries();

-- 3. Fix Payments table: Support extra columns and mirror ledger payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC(15,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'received';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_no TEXT;

-- Auto-sync total_amount and amount
UPDATE payments SET amount = total_amount WHERE amount IS NULL AND total_amount IS NOT NULL;

-- Mirror ledger payments into payments table if inserted from ledger
CREATE OR REPLACE FUNCTION trg_mirror_ledger_to_payments()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.party_id IS NOT NULL AND NEW.amount > 0 AND (NEW.entry_type::text IN ('payment_received', 'credit')) THEN
    INSERT INTO payments (
      id,
      business_id,
      party_id,
      total_amount,
      amount,
      payment_date,
      notes,
      reference,
      payment_type
    ) VALUES (
      NEW.id,
      NEW.business_id,
      NEW.party_id,
      NEW.amount,
      NEW.amount,
      COALESCE(NEW.entry_date::date, CURRENT_DATE),
      NEW.description,
      NEW.tx_ref,
      'received'
    )
    ON CONFLICT (id) DO UPDATE SET
      total_amount = EXCLUDED.total_amount,
      amount = EXCLUDED.amount,
      notes = EXCLUDED.notes;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ledger_payments ON ledger_entries;
CREATE TRIGGER trg_sync_ledger_payments
  AFTER INSERT OR UPDATE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION trg_mirror_ledger_to_payments();

-- 4. Tell PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';


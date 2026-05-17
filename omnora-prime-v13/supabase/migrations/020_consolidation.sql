-- Noxis v13.0 — Phase 20: Grand Consolidation
-- FINAL Audit & Integrity Hardening

-- 1. Ensure RLS on ALL missing tables (catch-all)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            SELECT tablename FROM pg_tables pt
            JOIN pg_class pc ON pc.relname = pt.tablename
            JOIN pg_namespace pn ON pn.oid = pc.relnamespace AND pn.nspname = 'public'
            WHERE pc.relrowsecurity = true
        )
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    END LOOP;
END $$;

-- 2. Data Integrity Constraints (Missing FK checks)
ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS fk_ledger_account;
ALTER TABLE ledger_entries ADD CONSTRAINT fk_ledger_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoice_party;
ALTER TABLE invoices ADD CONSTRAINT fk_invoice_party FOREIGN KEY (party_id) REFERENCES parties(id);

-- 3. Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_party_posted ON ledger_entries(party_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_sku ON invoice_items(sku_id);
CREATE INDEX IF NOT EXISTS idx_karigar_attendance_date ON attendance_logs(karigar_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_slips_karigar ON payroll_slips(karigar_id, period_id);

-- 4. Secure Masking Views for Non-Admins
CREATE OR REPLACE VIEW secure_karigars AS
SELECT 
  id, business_id, name, grade_id, 
  CASE WHEN current_setting('app.is_admin', true) = 'true' THEN cnic_number ELSE '*****-*******-*' END as cnic_number,
  status, created_at
FROM karigars;

-- 5. Final Trial Balance Integrity Function (Audit Pass)
CREATE OR REPLACE FUNCTION audit_system_integrity()
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    unbalanced_count INT;
    orphaned_ledger INT;
    result JSONB;
BEGIN
    -- Check for unbalanced transactions
    SELECT COUNT(*) INTO unbalanced_count FROM (
        SELECT tx_ref FROM ledger_entries
        GROUP BY tx_ref
        HAVING SUM(CASE WHEN entry_type='debit' THEN amount ELSE -amount END) != 0
    ) t;

    -- Check for orphaned ledger entries
    SELECT COUNT(*) INTO orphaned_ledger 
    FROM ledger_entries 
    WHERE account_id NOT IN (SELECT id FROM accounts);

    result = jsonb_build_object(
        'is_balanced', (unbalanced_count = 0),
        'unbalanced_tx_count', unbalanced_count,
        'orphaned_ledger_count', orphaned_ledger,
        'audit_timestamp', now()
    );
    
    RETURN result;
END;
$$;


-- supabase/migrations/043_security_hardening_rls.sql
-- Noxis v13.0 — Security Hardening: RLS Policy Fixes
-- Ensures ALL tables have correct, working RLS policies

-- ═══════════════════════════════════════════════════════
-- FIX 1: audit_trail — broken policy references "users" table (doesn't exist)
-- Replace with correct business_profiles lookup via current_user_business_id()
-- Also add INSERT policy (trigger inserts via SECURITY DEFINER, but policy still needed)
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "business_isolation" ON audit_trail;

-- Read access: users can see audit trail for their own business
CREATE POLICY "audit_trail_select"
  ON audit_trail FOR SELECT
  USING (business_id = current_user_business_id());

-- Insert: allow system (trigger uses SECURITY DEFINER) and authenticated users for their business
CREATE POLICY "audit_trail_insert"
  ON audit_trail FOR INSERT
  WITH CHECK (business_id = current_user_business_id());


-- ═══════════════════════════════════════════════════════
-- FIX 2: lens_scans_incoming — policy references "profiles" table (doesn't exist)
-- Replace with current_user_business_id() pattern
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "business_isolation" ON lens_scans_incoming;

CREATE POLICY "lens_scans_business_isolation"
  ON lens_scans_incoming FOR ALL
  USING (business_id = current_user_business_id());

-- Also fix the storage policy that references wrong table
DROP POLICY IF EXISTS "business_storage_isolation" ON storage.objects;
CREATE POLICY "lens_storage_business_isolation"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'lens-scans' 
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM business_profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );


-- ═══════════════════════════════════════════════════════
-- FIX 3: Ensure enterprise feature tables have RLS (re-apply if migration 041 was partial)
-- These are idempotent — safe to re-run
-- ═══════════════════════════════════════════════════════

-- party_portal_tokens
ALTER TABLE IF EXISTS party_portal_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hub_manage_portal_tokens" ON party_portal_tokens;
CREATE POLICY "hub_manage_portal_tokens" ON party_portal_tokens
  FOR ALL USING (business_id = current_user_business_id());

-- recurring_invoices
ALTER TABLE IF EXISTS recurring_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hub_manage_recurring" ON recurring_invoices;
CREATE POLICY "hub_manage_recurring" ON recurring_invoices
  FOR ALL USING (business_id = current_user_business_id());

-- staff_users
ALTER TABLE IF EXISTS staff_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hub_manage_staff" ON staff_users;
CREATE POLICY "hub_manage_staff" ON staff_users
  FOR ALL USING (business_id = current_user_business_id());

-- sku_batches
ALTER TABLE IF EXISTS sku_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hub_manage_batches" ON sku_batches;
CREATE POLICY "hub_manage_batches" ON sku_batches
  FOR ALL USING (business_id = current_user_business_id());

-- supplier_payments
ALTER TABLE IF EXISTS supplier_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hub_manage_supplier_payments" ON supplier_payments;
CREATE POLICY "hub_manage_supplier_payments" ON supplier_payments
  FOR ALL USING (business_id = current_user_business_id());


-- ═══════════════════════════════════════════════════════
-- FIX 4: production_logs alias — table is actually "karigar_production_logs"
-- Create a VIEW so code referencing "production_logs" works transparently
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE VIEW production_logs AS
  SELECT * FROM karigar_production_logs;


-- ═══════════════════════════════════════════════════════
-- FIX 5: Create backups storage bucket for automated backup system
-- ═══════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "backups_business_isolation"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'backups'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM business_profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

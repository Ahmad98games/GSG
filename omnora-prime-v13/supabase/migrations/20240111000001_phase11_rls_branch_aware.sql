-- supabase/migrations/20240111000001_phase11_rls_branch_aware.sql

/*
  TWO-FACTOR RLS PATTERN: BUSINESS & BRANCH SCOPING
  --------------------------------------------------
  Pattern: (business_id = current_user_business_id() AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL))

  1. Mandatory Tenant Isolation: Every query MUST match the user's business_id.
  2. Optional Site Scoping:
     - If current_branch_id() is SET (via set_branch_context), rows are filtered to that specific branch.
     - If current_branch_id() is NULL, the system operates in Global/HQ mode (visible to all branches of the business).
     - Legacy Support: Rows where branch_id is NULL (legacy or global config) are always visible to maintain continuity.
  3. Dynamic Insert/Update: Rows are automatically tagged with the active branch_id if a context is set.
*/

-- 1. Table: skus
DROP POLICY IF EXISTS "business_owns_skus" ON skus;
CREATE POLICY "branch_scoped_select" ON skus
FOR SELECT USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
);
CREATE POLICY "branch_scoped_insert" ON skus
FOR INSERT WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);
CREATE POLICY "branch_scoped_update" ON skus
FOR UPDATE USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
) WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);

-- 2. Table: ledger_entries
-- NOTE: Immutable ledger rules (no UPDATE/DELETE on posted) are handled by RULES and are not modified here.
DROP POLICY IF EXISTS "business_owns_ledger" ON ledger_entries;
CREATE POLICY "branch_scoped_select" ON ledger_entries
FOR SELECT USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
);
CREATE POLICY "branch_scoped_insert" ON ledger_entries
FOR INSERT WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);

-- 3. Table: invoices
DROP POLICY IF EXISTS "business_owns_invoices" ON invoices;
CREATE POLICY "branch_scoped_select" ON invoices
FOR SELECT USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
);
CREATE POLICY "branch_scoped_insert" ON invoices
FOR INSERT WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);
CREATE POLICY "branch_scoped_update" ON invoices
FOR UPDATE USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
) WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);

-- 4. Table: pos_sessions
DROP POLICY IF EXISTS "pos_sessions_rls" ON pos_sessions;
CREATE POLICY "branch_scoped_select" ON pos_sessions
FOR SELECT USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
);
CREATE POLICY "branch_scoped_insert" ON pos_sessions
FOR INSERT WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);
CREATE POLICY "branch_scoped_update" ON pos_sessions
FOR UPDATE USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
) WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);

-- 5. Table: purchase_orders
DROP POLICY IF EXISTS "business_pos" ON purchase_orders;
CREATE POLICY "branch_scoped_select" ON purchase_orders
FOR SELECT USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
);
CREATE POLICY "branch_scoped_insert" ON purchase_orders
FOR INSERT WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);
CREATE POLICY "branch_scoped_update" ON purchase_orders
FOR UPDATE USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
) WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);

-- 6. Table: payroll_periods
DROP POLICY IF EXISTS "business_periods" ON payroll_periods;
CREATE POLICY "branch_scoped_select" ON payroll_periods
FOR SELECT USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
);
CREATE POLICY "branch_scoped_insert" ON payroll_periods
FOR INSERT WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);
CREATE POLICY "branch_scoped_update" ON payroll_periods
FOR UPDATE USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
) WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);

-- 7. Table: karigars
DROP POLICY IF EXISTS "business_karigars" ON karigars;
CREATE POLICY "branch_scoped_select" ON karigars
FOR SELECT USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
);
CREATE POLICY "branch_scoped_insert" ON karigars
FOR INSERT WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);
CREATE POLICY "branch_scoped_update" ON karigars
FOR UPDATE USING (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id() OR branch_id IS NULL)
) WITH CHECK (
  business_id = current_user_business_id()
  AND (current_branch_id() IS NULL OR branch_id = current_branch_id())
);


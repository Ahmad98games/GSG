-- ─── ADMIN DASHBOARD RLS POLICIES ───────────────────────────────────────────
-- Run this in Supabase SQL Editor to allow the admin dashboard (anon key)
-- to read and manage the licenses table.
-- The admin HTML page already enforces a password gate on top of this.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Make sure RLS is enabled
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting policies if any
DROP POLICY IF EXISTS "admin_anon_select"  ON licenses;
DROP POLICY IF EXISTS "admin_anon_insert"  ON licenses;
DROP POLICY IF EXISTS "admin_anon_update"  ON licenses;

-- 3. Allow anon key to SELECT all licenses (admin dashboard read)
CREATE POLICY "admin_anon_select"
  ON licenses FOR SELECT
  TO anon
  USING (true);

-- 4. Allow anon key to INSERT new licenses (generate key feature)
CREATE POLICY "admin_anon_insert"
  ON licenses FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Allow anon key to UPDATE licenses (deactivate / extend)
CREATE POLICY "admin_anon_update"
  ON licenses FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

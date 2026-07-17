CREATE TABLE IF NOT EXISTS branches (
  id uuid DEFAULT gen_random_uuid()
    PRIMARY KEY,
  business_id uuid NOT NULL
    REFERENCES business_profiles(id)
    ON DELETE CASCADE,
  name text NOT NULL,
  city text,
  address text,
  branch_code text NOT NULL,
  is_headquarters boolean DEFAULT false,
  is_active boolean DEFAULT true,
  manager_name text,
  manager_phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE branches
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_manages_branches"
ON branches FOR ALL
USING (
  business_id IN (
    SELECT id FROM business_profiles
    WHERE user_id = auth.uid()
  )
);

-- Add branch_id to key transaction tables
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS
    branch_id uuid REFERENCES branches(id);

ALTER TABLE dispatch_orders
  ADD COLUMN IF NOT EXISTS
    branch_id uuid REFERENCES branches(id);

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS
    branch_id uuid REFERENCES branches(id);

ALTER TABLE attendance_logs
  ADD COLUMN IF NOT EXISTS
    branch_id uuid REFERENCES branches(id);

-- Index for branch queries
CREATE INDEX IF NOT EXISTS idx_invoices_branch
  ON invoices(branch_id)
  WHERE branch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dispatch_branch
  ON dispatch_orders(branch_id)
  WHERE branch_id IS NOT NULL;

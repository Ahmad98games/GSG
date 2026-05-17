-- supabase/migrations/20240111000000_phase11_branches.sql

-- 1. Create table: branches
CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL, -- unique per business e.g. "KHI-01"
  address         TEXT,
  city            TEXT,
  manager_user_id UUID REFERENCES auth.users(id),
  timezone        TEXT NOT NULL DEFAULT 'Asia/Karachi',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, code)
);

-- Only one headquarters per business
CREATE UNIQUE INDEX one_hq_per_business
ON branches(business_id) WHERE is_headquarters = true;

-- 2. Add column branch_id to existing tables
ALTER TABLE skus ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE ledger_entries ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE invoices ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE pos_sessions ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE purchase_orders ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE payroll_periods ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE karigars ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE transfer_logs ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE audit_sessions ADD COLUMN branch_id UUID REFERENCES branches(id);

-- 3. Create table: branch_user_assignments
CREATE TABLE branch_user_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  branch_id       UUID NOT NULL REFERENCES branches(id),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  role            TEXT NOT NULL CHECK (role IN ('manager','operator','viewer')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id, user_id)
);

-- 4. Create table: inter_branch_transfers
CREATE TABLE inter_branch_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  from_branch_id  UUID NOT NULL REFERENCES branches(id),
  to_branch_id    UUID NOT NULL REFERENCES branches(id),
  sku_id          UUID NOT NULL REFERENCES skus(id),
  qty             NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  status          TEXT NOT NULL DEFAULT 'in_transit' CHECK (status IN ('in_transit','received','cancelled')),
  initiated_by    UUID REFERENCES auth.users(id),
  received_by     UUID REFERENCES auth.users(id),
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at     TIMESTAMPTZ,
  from_ledger_entry_id UUID REFERENCES ledger_entries(id),
  to_ledger_entry_id   UUID REFERENCES ledger_entries(id),
  notes           TEXT,
  CHECK (from_branch_id != to_branch_id)
);

-- 5. Create PostgreSQL function: current_branch_id()
CREATE OR REPLACE FUNCTION current_branch_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT NULLIF(current_setting('app.branch_id', true), '')::UUID;
$$;

-- 6. Create PostgreSQL function: assign_existing_rows_to_hq()
CREATE OR REPLACE FUNCTION assign_existing_rows_to_hq()
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    biz_rec RECORD;
    hq_id UUID;
BEGIN
    FOR biz_rec IN SELECT id, business_name FROM business_profiles LOOP
        -- Check if HQ already exists
        SELECT id INTO hq_id FROM branches 
        WHERE business_id = biz_rec.id AND is_headquarters = true LIMIT 1;

        -- Create HQ if not exists
        IF hq_id IS NULL THEN
            INSERT INTO branches (business_id, name, code, is_headquarters)
            VALUES (biz_rec.id, biz_rec.business_name || ' HQ', 'HQ-01', true)
            RETURNING id INTO hq_id;
        END IF;

        -- Update all tables
        UPDATE skus SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
        UPDATE ledger_entries SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
        UPDATE invoices SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
        UPDATE pos_sessions SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
        UPDATE purchase_orders SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
        UPDATE payroll_periods SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
        UPDATE karigars SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
        UPDATE transfer_logs SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
        UPDATE audit_sessions SET branch_id = hq_id WHERE business_id = biz_rec.id AND branch_id IS NULL;
    END LOOP;
END;
$$;

-- 7. Apply RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inter_branch_transfers ENABLE ROW LEVEL SECURITY;

-- Branches Policies
CREATE POLICY "branches_select" ON branches
  FOR SELECT USING (business_id = current_user_business_id());

CREATE POLICY "branches_insert" ON branches
  FOR INSERT WITH CHECK (
    business_id = current_user_business_id()
    AND (is_headquarters = false OR NOT EXISTS (
      SELECT 1 FROM branches b 
      WHERE b.business_id = current_user_business_id() 
      AND b.is_headquarters = true
    ))
  );

CREATE POLICY "branches_update" ON branches
  FOR UPDATE USING (business_id = current_user_business_id())
  WITH CHECK (
    business_id = current_user_business_id()
    AND (is_headquarters = false OR NOT EXISTS (
      SELECT 1 FROM branches b 
      WHERE b.business_id = current_user_business_id() 
      AND b.is_headquarters = true 
      AND b.id != id
    ))
  );

-- Branch User Assignments Policies
CREATE POLICY "branch_user_assignments_rls" ON branch_user_assignments
  FOR ALL USING (business_id = current_user_business_id());

-- Inter-Branch Transfers Policies
CREATE POLICY "inter_branch_transfers_rls" ON inter_branch_transfers
  FOR ALL USING (business_id = current_user_business_id());

-- 8. Add Indexes
CREATE INDEX idx_branches_business_status ON branches(business_id, status);
CREATE INDEX idx_ibt_business_status_initiated ON inter_branch_transfers(business_id, status, initiated_at DESC);
CREATE INDEX idx_branch_user_assignments_user_business ON branch_user_assignments(user_id, business_id);

-- 9. Add updated_at trigger
CREATE TRIGGER trg_branches_updated
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 10. Call assign_existing_rows_to_hq()
DO $$
BEGIN
    PERFORM assign_existing_rows_to_hq();
END $$;

-- 11. RPC: Set Branch Context
CREATE OR REPLACE FUNCTION set_branch_context(branch_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.branch_id', branch_id::TEXT, false);
END;
$$;


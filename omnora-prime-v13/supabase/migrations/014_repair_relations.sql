-- Noxis v13.0 — Emergency Relation Repair
-- This script ensures missing tables and functions are created safely.

-- 1. Ensure current_branch_id() exists (needed by RLS policies)
CREATE OR REPLACE FUNCTION current_branch_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT NULLIF(current_setting('app.branch_id', true), '')::UUID;
$$;

-- 2. Ensure payroll_periods exists if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payroll_periods') THEN
    CREATE TABLE payroll_periods (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id   UUID NOT NULL REFERENCES business_profiles(id),
      period_label  TEXT NOT NULL,
      period_start  DATE NOT NULL,
      period_end    DATE NOT NULL,
      status        TEXT NOT NULL DEFAULT 'open',
      locked_at     TIMESTAMPTZ,
      paid_at       TIMESTAMPTZ,
      total_payroll NUMERIC(15,2),
      locked_by     UUID REFERENCES auth.users(id),
      paid_by       UUID REFERENCES auth.users(id),
      branch_id     UUID,
      UNIQUE(business_id, period_start)
    );
  END IF;
END $$;

-- 3. Ensure karigar_production_logs exists if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'karigar_production_logs') THEN
    CREATE TABLE karigar_production_logs (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id     UUID NOT NULL REFERENCES business_profiles(id),
      karigar_id      UUID NOT NULL, -- Reference added later to avoid circular issues
      batch_id        UUID,
      sku_id          UUID,
      log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
      qty_produced    NUMERIC(15,4) NOT NULL CHECK (qty_produced >= 0),
      unit            TEXT NOT NULL,
      piece_rate_used NUMERIC(10,4) NOT NULL,
      quality_grade   TEXT CHECK (quality_grade IN ('A','B','C','rejected')),
      logged_by       UUID REFERENCES auth.users(id),
      created_at      TIMESTAMPTZ DEFAULT now(),
      branch_id       UUID
    );
  END IF;
END $$;

-- 4. Ensure branch_id column exists on these tables (common migration failure point)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payroll_periods') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payroll_periods' AND column_name='branch_id') THEN
      ALTER TABLE payroll_periods ADD COLUMN branch_id UUID;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'karigars') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='karigars' AND column_name='branch_id') THEN
      ALTER TABLE karigars ADD COLUMN branch_id UUID;
    END IF;
  END IF;
END $$;


-- supabase/migrations/005_karigar.sql

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wage_type') THEN
        CREATE TYPE wage_type AS ENUM ('piece_rate','daily_wage','monthly_salary');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'karigar_status') THEN
        CREATE TYPE karigar_status AS ENUM ('active','inactive','terminated','on_leave');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('present','absent','half_day','leave','holiday');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_period_status') THEN
        CREATE TYPE payroll_period_status AS ENUM ('open','locked','paid');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advance_status') THEN
        CREATE TYPE advance_status AS ENUM ('pending','approved','rejected','settled');
    END IF;
END $$;

-- Karigar Grades
CREATE TABLE IF NOT EXISTS karigar_grades (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES business_profiles(id),
  grade_name   TEXT NOT NULL,
  base_rate    NUMERIC(10,2),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, grade_name)
);

-- Karigar Registry
CREATE TABLE IF NOT EXISTS karigars (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID NOT NULL REFERENCES business_profiles(id),
  karigar_code     TEXT NOT NULL,
  name             TEXT NOT NULL,
  father_name      TEXT,
  cnic             TEXT,
  phone            TEXT,
  address          TEXT,
  skill_type       TEXT NOT NULL,
  grade_id         UUID REFERENCES karigar_grades(id),
  wage_type        wage_type NOT NULL DEFAULT 'piece_rate',
  piece_rate       NUMERIC(10,4),
  daily_rate       NUMERIC(10,2),
  monthly_salary   NUMERIC(10,2),
  eobi_enrolled    BOOLEAN DEFAULT true,
  sessi_enrolled   BOOLEAN DEFAULT false,
  joining_date     DATE NOT NULL,
  status           karigar_status NOT NULL DEFAULT 'active',
  photo_url        TEXT,
  bank_account     TEXT,
  whatsapp_number  TEXT,
  current_advance  NUMERIC(12,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, karigar_code)
);

-- Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES business_profiles(id),
  karigar_id   UUID NOT NULL REFERENCES karigars(id),
  log_date     DATE NOT NULL,
  status       attendance_status NOT NULL,
  shift_hours  NUMERIC(4,2) DEFAULT 8,
  overtime_hrs NUMERIC(4,2) DEFAULT 0,
  noted_by     UUID REFERENCES auth.users(id),
  notes        TEXT,
  UNIQUE(karigar_id, log_date)
);

-- Production Logs
CREATE TABLE IF NOT EXISTS karigar_production_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  karigar_id      UUID NOT NULL REFERENCES karigars(id),
  batch_id        UUID REFERENCES production_batches(id),
  sku_id          UUID REFERENCES skus(id),
  log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  qty_produced    NUMERIC(15,4) NOT NULL CHECK (qty_produced >= 0),
  unit            TEXT NOT NULL,
  piece_rate_used NUMERIC(10,4) NOT NULL,
  line_earning    NUMERIC(12,2) GENERATED ALWAYS AS (qty_produced * piece_rate_used) STORED,
  quality_grade   TEXT CHECK (quality_grade IN ('A','B','C','rejected')),
  effective_qty   NUMERIC(15,4) GENERATED ALWAYS AS (
    CASE WHEN quality_grade = 'rejected' THEN 0 ELSE qty_produced END
  ) STORED,
  effective_earning NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN quality_grade = 'rejected' THEN 0 ELSE qty_produced * piece_rate_used END
  ) STORED,
  logged_by       UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Payroll Periods
CREATE TABLE IF NOT EXISTS payroll_periods (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  period_label  TEXT NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  status        payroll_period_status NOT NULL DEFAULT 'open',
  locked_at     TIMESTAMPTZ,
  paid_at       TIMESTAMPTZ,
  total_payroll NUMERIC(15,2),
  locked_by     UUID REFERENCES auth.users(id),
  paid_by       UUID REFERENCES auth.users(id),
  UNIQUE(business_id, period_start)
);

-- Advances
CREATE TABLE IF NOT EXISTS karigar_advances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  karigar_id    UUID NOT NULL REFERENCES karigars(id),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reason        TEXT,
  advance_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status        advance_status NOT NULL DEFAULT 'pending',
  approved_by   UUID REFERENCES auth.users(id),
  approved_at   TIMESTAMPTZ,
  settled_in_period UUID REFERENCES payroll_periods(id),
  ledger_entry_id UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Payroll Slips
CREATE TABLE IF NOT EXISTS payroll_slips (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id       UUID NOT NULL REFERENCES business_profiles(id),
  period_id         UUID NOT NULL REFERENCES payroll_periods(id),
  karigar_id        UUID NOT NULL REFERENCES karigars(id),
  piece_rate_earning NUMERIC(12,2) DEFAULT 0,
  daily_wage_earning NUMERIC(12,2) DEFAULT 0,
  monthly_base      NUMERIC(12,2) DEFAULT 0,
  overtime_earning  NUMERIC(12,2) DEFAULT 0,
  gross_earning     NUMERIC(12,2) NOT NULL,
  advance_deduction NUMERIC(12,2) DEFAULT 0,
  eobi_deduction    NUMERIC(12,2) DEFAULT 0,
  sessi_deduction   NUMERIC(12,2) DEFAULT 0,
  other_deductions  NUMERIC(12,2) DEFAULT 0,
  total_deductions  NUMERIC(12,2) NOT NULL,
  net_payable       NUMERIC(12,2) NOT NULL,
  days_present      INTEGER DEFAULT 0,
  days_absent       INTEGER DEFAULT 0,
  total_units       NUMERIC(15,4) DEFAULT 0,
  efficiency_pct    NUMERIC(5,2),
  is_finalized      BOOLEAN DEFAULT false,
  ledger_entry_id   UUID,
  slip_sent_at      TIMESTAMPTZ,
  UNIQUE(period_id, karigar_id)
);

-- RLS
ALTER TABLE karigar_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE karigars ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE karigar_production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE karigar_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_slips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_karigars" ON karigars;
CREATE POLICY "business_karigars" ON karigars FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_attendance" ON attendance_logs;
CREATE POLICY "business_attendance" ON attendance_logs FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_prod_logs" ON karigar_production_logs;
CREATE POLICY "business_prod_logs" ON karigar_production_logs FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_advances" ON karigar_advances;
CREATE POLICY "business_advances" ON karigar_advances FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_periods" ON payroll_periods;
CREATE POLICY "business_periods" ON payroll_periods FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_slips" ON payroll_slips;
CREATE POLICY "business_slips" ON payroll_slips FOR ALL USING (business_id = current_user_business_id());

-- Locked Period Guard
CREATE OR REPLACE FUNCTION block_locked_period_write()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE period_locked BOOLEAN;
BEGIN
  SELECT (status != 'open') INTO period_locked
  FROM payroll_periods
  WHERE business_id = NEW.business_id
    AND period_start <= NEW.log_date
    AND period_end >= NEW.log_date;
  IF period_locked THEN
    RAISE EXCEPTION 'Cannot modify records in a locked payroll period';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_block_locked_attendance ON attendance_logs;
CREATE TRIGGER trg_block_locked_attendance BEFORE INSERT OR UPDATE ON attendance_logs
  FOR EACH ROW EXECUTE FUNCTION block_locked_period_write();

CREATE OR REPLACE FUNCTION block_locked_production_write()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE period_locked BOOLEAN;
BEGIN
  SELECT (status != 'open') INTO period_locked
  FROM payroll_periods
  WHERE business_id = NEW.business_id
    AND period_start <= NEW.log_date
    AND period_end >= NEW.log_date;
  IF period_locked THEN
    RAISE EXCEPTION 'Cannot modify records in a locked payroll period';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_block_locked_production ON karigar_production_logs;
CREATE TRIGGER trg_block_locked_production BEFORE INSERT OR UPDATE ON karigar_production_logs
  FOR EACH ROW EXECUTE FUNCTION block_locked_production_write();

-- Karigar Code Generator
CREATE OR REPLACE FUNCTION generate_karigar_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.karigar_code = 'K-' || LPAD(
    (SELECT COUNT(*)+1 FROM karigars WHERE business_id = NEW.business_id)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_karigar_code ON karigars;
CREATE TRIGGER trg_karigar_code BEFORE INSERT ON karigars
  FOR EACH ROW WHEN (NEW.karigar_code IS NULL OR NEW.karigar_code = '')
  EXECUTE FUNCTION generate_karigar_code();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_karigar_date ON attendance_logs(karigar_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_prod_logs_karigar_date ON karigar_production_logs(karigar_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_prod_logs_period ON karigar_production_logs(business_id, log_date);
CREATE INDEX IF NOT EXISTS idx_advances_karigar ON karigar_advances(karigar_id, status);
CREATE INDEX IF NOT EXISTS idx_slips_period ON payroll_slips(period_id);


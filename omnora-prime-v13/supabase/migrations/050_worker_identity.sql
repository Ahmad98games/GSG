-- Migration file for API Keys and Worker Identity features

-- =====================================================================
-- Part 1: API Platform Schema
-- =====================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{read}',
  last_used_at timestamptz,
  total_requests integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Webhooks endpoint/alias table to ensure queries to `webhooks` succeed
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name text,
  url text NOT NULL,
  events text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- API Keys RLS Policies
DROP POLICY IF EXISTS "api_keys_select" ON api_keys;
CREATE POLICY "api_keys_select" ON api_keys FOR SELECT
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "api_keys_insert" ON api_keys;
CREATE POLICY "api_keys_insert" ON api_keys FOR INSERT
  WITH CHECK (business_id = current_user_business_id());

DROP POLICY IF EXISTS "api_keys_update" ON api_keys;
CREATE POLICY "api_keys_update" ON api_keys FOR UPDATE
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "api_keys_delete" ON api_keys;
CREATE POLICY "api_keys_delete" ON api_keys FOR DELETE
  USING (business_id = current_user_business_id());

-- Webhooks RLS Policies
DROP POLICY IF EXISTS "webhooks_select" ON webhooks;
CREATE POLICY "webhooks_select" ON webhooks FOR SELECT
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "webhooks_insert" ON webhooks;
CREATE POLICY "webhooks_insert" ON webhooks FOR INSERT
  WITH CHECK (business_id = current_user_business_id());

DROP POLICY IF EXISTS "webhooks_update" ON webhooks;
CREATE POLICY "webhooks_update" ON webhooks FOR UPDATE
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "webhooks_delete" ON webhooks;
CREATE POLICY "webhooks_delete" ON webhooks FOR DELETE
  USING (business_id = current_user_business_id());

-- =====================================================================
-- Part 2: Worker Identity Schema
-- =====================================================================

CREATE TABLE IF NOT EXISTS worker_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  karigar_id uuid NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  current_employer_id uuid REFERENCES business_profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  is_public boolean NOT NULL DEFAULT false, -- Private vs Share-with-network
  open_to_work boolean NOT NULL DEFAULT false, -- Worker Network flag
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_identity_id uuid NOT NULL REFERENCES worker_identities(id) ON DELETE CASCADE,
  employer_name text NOT NULL,
  role text NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worker_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_identity_id uuid NOT NULL REFERENCES worker_identities(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  employer_name text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE worker_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;

-- Worker Identities RLS Policies (Allow public SELECT if is_public = true)
DROP POLICY IF EXISTS "worker_identities_select" ON worker_identities;
CREATE POLICY "worker_identities_select" ON worker_identities FOR SELECT
  USING (business_id = current_user_business_id() OR is_public = true);

DROP POLICY IF EXISTS "worker_identities_all_owned" ON worker_identities;
CREATE POLICY "worker_identities_all_owned" ON worker_identities FOR ALL
  USING (business_id = current_user_business_id());

-- Work History RLS Policies
DROP POLICY IF EXISTS "work_history_select" ON work_history;
CREATE POLICY "work_history_select" ON work_history FOR SELECT
  USING (
    worker_identity_id IN (
      SELECT id FROM worker_identities WHERE business_id = current_user_business_id() OR is_public = true
    )
  );

DROP POLICY IF EXISTS "work_history_all_owned" ON work_history;
CREATE POLICY "work_history_all_owned" ON work_history FOR ALL
  USING (
    worker_identity_id IN (
      SELECT id FROM worker_identities WHERE business_id = current_user_business_id()
    )
  );

-- Worker Skills RLS Policies
DROP POLICY IF EXISTS "worker_skills_select" ON worker_skills;
CREATE POLICY "worker_skills_select" ON worker_skills FOR SELECT
  USING (
    worker_identity_id IN (
      SELECT id FROM worker_identities WHERE business_id = current_user_business_id() OR is_public = true
    )
  );

DROP POLICY IF EXISTS "worker_skills_all_owned" ON worker_skills;
CREATE POLICY "worker_skills_all_owned" ON worker_skills FOR ALL
  USING (
    worker_identity_id IN (
      SELECT id FROM worker_identities WHERE business_id = current_user_business_id()
    )
  );

-- =====================================================================
-- Part 3: Attendance and Production RPCs
-- =====================================================================

-- RPC to get karigar attendance rate
CREATE OR REPLACE FUNCTION get_karigar_attendance_rate(
  p_karigar_id uuid,
  p_days integer
) RETURNS numeric AS $$
DECLARE
  v_total integer;
  v_present numeric;
BEGIN
  SELECT 
    COUNT(*),
    SUM(CASE WHEN status = 'present' THEN 1.0 WHEN status = 'half_day' THEN 0.5 ELSE 0 END)
  INTO v_total, v_present
  FROM attendance_logs
  WHERE karigar_id = p_karigar_id
    AND log_date >= CURRENT_DATE - p_days;
    
  IF v_total = 0 THEN
    RETURN 100.0;
  END IF;
  
  RETURN ROUND((v_present / v_total) * 100.0, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get karigar production stats
CREATE OR REPLACE FUNCTION get_karigar_production_stats(
  p_karigar_id uuid,
  p_days integer
) RETURNS TABLE(
  avg_units_per_day numeric,
  avg_grade_a_pct numeric
) AS $$
DECLARE
  v_avg_daily numeric;
  v_grade_a numeric;
BEGIN
  -- Avg units per day logged
  SELECT COALESCE(AVG(daily_sum), 0)
  INTO v_avg_daily
  FROM (
    SELECT SUM(qty_produced) as daily_sum
    FROM karigar_production_logs
    WHERE karigar_id = p_karigar_id
      AND log_date >= CURRENT_DATE - p_days
    GROUP BY log_date
  ) daily;
  
  -- Grade A pct
  SELECT 
    CASE WHEN SUM(qty_produced) > 0 
      THEN (SUM(CASE WHEN quality_grade = 'A' THEN qty_produced ELSE 0 END) / SUM(qty_produced)) * 100.0
      ELSE 0 
    END
  INTO v_grade_a
  FROM karigar_production_logs
  WHERE karigar_id = p_karigar_id
    AND log_date >= CURRENT_DATE - p_days;
    
  RETURN QUERY SELECT ROUND(v_avg_daily, 1), ROUND(v_grade_a, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

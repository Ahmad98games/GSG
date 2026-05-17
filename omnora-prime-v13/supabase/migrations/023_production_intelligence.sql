-- supabase/migrations/023_production_intelligence.sql

-- Add enhanced production tracking columns
ALTER TABLE karigar_production_logs 
ADD COLUMN IF NOT EXISTS department text CHECK (department IN ('cutting','stitching','finishing','packing','other')),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS time_taken_minutes integer;

-- Department Performance Tracking
CREATE TABLE IF NOT EXISTS department_output_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id),
  department text not null,
  date date not null,
  total_units integer not null default 0,
  total_minutes integer not null default 0,
  efficiency_score numeric(5,2),
  created_at timestamptz default now()
);

-- Bottleneck Analysis RPC
CREATE OR REPLACE FUNCTION get_bottleneck_analysis(
  p_business_id uuid,
  p_from date,
  p_to date
) RETURNS TABLE(
  department text,
  avg_daily_output numeric,
  avg_efficiency numeric,
  wip_accumulation numeric,
  bottleneck_score numeric,
  recommendation text
) AS $$
BEGIN
  RETURN QUERY
  WITH dept_stats AS (
    SELECT
      kpl.department,
      AVG(kpl.qty_produced) as avg_output,
      AVG(CASE WHEN kpl.time_taken_minutes > 0 
               THEN kpl.qty_produced::numeric / 
                    kpl.time_taken_minutes * 60
               ELSE NULL END) as avg_efficiency,
      COUNT(*) as log_count
    FROM karigar_production_logs kpl
    WHERE kpl.business_id = p_business_id
    AND kpl.log_date BETWEEN p_from AND p_to
    AND kpl.department IS NOT NULL
    GROUP BY kpl.department
  ),
  prev_dept AS (
    SELECT kpl.department,
           AVG(kpl.qty_produced) as prev_avg
    FROM karigar_production_logs kpl
    WHERE kpl.business_id = p_business_id
    AND kpl.log_date BETWEEN p_from - INTERVAL '30 days' AND p_from
    GROUP BY kpl.department
  )
  SELECT
    ds.department,
    ROUND(ds.avg_output, 2),
    ROUND(ds.avg_efficiency, 2),
    ROUND(ds.avg_output - COALESCE(pd.prev_avg, ds.avg_output), 2),
    ROUND(
      CASE
        WHEN ds.avg_output < COALESCE(pd.prev_avg,ds.avg_output) * 0.7
          THEN 10
        WHEN ds.avg_output < COALESCE(pd.prev_avg,ds.avg_output) * 0.85
          THEN 6
        ELSE 2
      END, 1
    ) as bottleneck_score,
    CASE
      WHEN ds.avg_output < COALESCE(pd.prev_avg,ds.avg_output) * 0.7
        THEN 'Critical: Output down 30%+ vs last period'
      WHEN ds.avg_output < COALESCE(pd.prev_avg,ds.avg_output) * 0.85
        THEN 'Warning: Output down 15% vs last period'
      ELSE 'Normal operations'
    END as recommendation
  FROM dept_stats ds
  LEFT JOIN prev_dept pd ON pd.department = ds.department
  ORDER BY bottleneck_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Karigar Efficiency Ranking RPC
CREATE OR REPLACE FUNCTION get_karigar_efficiency_ranking(
  p_business_id uuid,
  p_from date,
  p_to date
) RETURNS TABLE(
  karigar_id uuid,
  karigar_name text,
  karigar_code text,
  department text,
  total_units numeric,
  quality_score numeric,
  efficiency_score numeric,
  rank integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.name,
    k.karigar_code,
    kpl.department,
    SUM(kpl.qty_produced) as total_units,
    ROUND(
      100.0 * COUNT(CASE WHEN kpl.quality_grade = 'A' THEN 1 END)
      / NULLIF(COUNT(*), 0), 1
    ) as quality_score,
    ROUND(
      SUM(kpl.qty_produced)::numeric /
      NULLIF(SUM(kpl.time_taken_minutes), 0) * 60, 2
    ) as efficiency_score,
    RANK() OVER (
      PARTITION BY kpl.department
      ORDER BY SUM(kpl.qty_produced) DESC
    )::integer
  FROM karigars k
  JOIN karigar_production_logs kpl ON kpl.karigar_id = k.id
  WHERE k.business_id = p_business_id
  AND kpl.log_date BETWEEN p_from AND p_to
  GROUP BY k.id, k.name, k.karigar_code, kpl.department
  ORDER BY department, rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE department_output_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_isolation" ON department_output_logs;
CREATE POLICY "business_isolation" ON department_output_logs
FOR ALL USING (business_id = current_user_business_id());

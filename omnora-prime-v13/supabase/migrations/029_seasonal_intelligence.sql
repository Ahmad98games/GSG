-- Migration: 029_seasonal_intelligence.sql

-- Add seasonality tracking to business profiles
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS industry_seasonality jsonb DEFAULT '[]'::jsonb;

-- Create seasonal targets table
CREATE TABLE IF NOT EXISTS seasonal_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business_profiles(id),
  season_name text NOT NULL,
  season_start_month integer NOT NULL CHECK (season_start_month BETWEEN 1 AND 12),
  season_end_month integer NOT NULL CHECK (season_end_month BETWEEN 1 AND 12),
  revenue_target numeric(18,4),
  production_target integer,
  notes text,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE seasonal_targets ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
-- Note: Assuming current_user_business_id() is a defined helper function in this DB
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'seasonal_targets' AND policyname = 'business_isolation'
    ) THEN
        CREATE POLICY "business_isolation" ON seasonal_targets
          FOR ALL USING (business_id = (SELECT business_id FROM auth.users WHERE id = auth.uid() LIMIT 1));
    END IF;
END $$;

-- Create context function
CREATE OR REPLACE FUNCTION get_seasonal_context(
  p_business_id uuid
) RETURNS jsonb AS $$
DECLARE
  current_month integer := EXTRACT(MONTH FROM CURRENT_DATE);
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'current_season', st.season_name,
    'days_remaining', (
      MAKE_DATE(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        st.season_end_month, 28
      ) - CURRENT_DATE
    ),
    'revenue_target', st.revenue_target,
    'production_target', st.production_target
  ) INTO result
  FROM seasonal_targets st
  WHERE st.business_id = p_business_id
  AND (
    (st.season_start_month <= st.season_end_month AND current_month BETWEEN st.season_start_month AND st.season_end_month)
    OR
    (st.season_start_month > st.season_end_month AND (current_month >= st.season_start_month OR current_month <= st.season_end_month))
  )
  ORDER BY st.year DESC
  LIMIT 1;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

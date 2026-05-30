-- Supabase migration file for Embedded Finance module

CREATE TABLE IF NOT EXISTS finance_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business_profiles(id),
  amount_requested numeric NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  purpose text NOT NULL,
  repayment_months integer NOT NULL,
  status text NOT NULL DEFAULT 'submitted', -- 'submitted', 'reviewed', 'approved', 'rejected'
  partner_name text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE finance_applications ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "finance_applications_select" ON finance_applications;
CREATE POLICY "finance_applications_select"
  ON finance_applications FOR SELECT
  USING (business_id = current_user_business_id());

-- Insert policy
DROP POLICY IF EXISTS "finance_applications_insert" ON finance_applications;
CREATE POLICY "finance_applications_insert"
  ON finance_applications FOR INSERT
  WITH CHECK (business_id = current_user_business_id());

-- Update policy
DROP POLICY IF EXISTS "finance_applications_update" ON finance_applications;
CREATE POLICY "finance_applications_update"
  ON finance_applications FOR UPDATE
  USING (business_id = current_user_business_id());

-- Delete policy
DROP POLICY IF EXISTS "finance_applications_delete" ON finance_applications;
CREATE POLICY "finance_applications_delete"
  ON finance_applications FOR DELETE
  USING (business_id = current_user_business_id());

-- RPC to calculate monthly revenue trend
CREATE OR REPLACE FUNCTION get_monthly_revenue_trend(
  p_business_id uuid,
  p_months integer
) RETURNS TABLE(
  month text,
  revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT 
      TO_CHAR(d, 'YYYY-MM') as month_bucket,
      MIN(d) as month_start
    FROM generate_series(
      DATE_TRUNC('month', NOW() - (p_months - 1) * INTERVAL '1 month'),
      DATE_TRUNC('month', NOW()),
      '1 month'::interval
    ) d
    GROUP BY month_bucket
  )
  SELECT 
    m.month_bucket::text as month,
    COALESCE(SUM(i.total), 0)::numeric as revenue
  FROM months m
  LEFT JOIN invoices i ON 
    i.business_id = p_business_id 
    AND i.status IN ('issued', 'partially_paid', 'paid')
    AND TO_CHAR(COALESCE(i.issue_date, i.created_at), 'YYYY-MM') = m.month_bucket
  GROUP BY m.month_bucket, m.month_start
  ORDER BY m.month_start ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

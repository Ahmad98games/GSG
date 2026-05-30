-- Supabase migration file for Predictions and Intelligence RPCs
CREATE TABLE IF NOT EXISTS predictions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id),
  prediction_type text not null,
  entity_type text,
  entity_id uuid,
  entity_name text,
  title text not null,
  description text,
  confidence numeric,
  recommended_action text,
  action_route text,
  action_label text,
  urgency text default 'medium',
  status text default 'active',
  dismissed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  UNIQUE(business_id, prediction_type, entity_id)
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "predictions_select" ON predictions;
CREATE POLICY "predictions_select"
  ON predictions FOR SELECT
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "predictions_insert" ON predictions;
CREATE POLICY "predictions_insert"
  ON predictions FOR INSERT
  WITH CHECK (business_id = current_user_business_id());

DROP POLICY IF EXISTS "predictions_update" ON predictions;
CREATE POLICY "predictions_update"
  ON predictions FOR UPDATE
  USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "predictions_delete" ON predictions;
CREATE POLICY "predictions_delete"
  ON predictions FOR DELETE
  USING (business_id = current_user_business_id());

-- Customer churn risk RPC
CREATE OR REPLACE FUNCTION
  get_churn_risk_customers(
    p_business_id uuid,
    p_recent_cutoff timestamptz,
    p_historical_cutoff timestamptz
  ) RETURNS TABLE(
    party_id uuid,
    party_name text,
    days_since_last_order integer,
    prev_order_count bigint
  ) AS $$
BEGIN
  RETURN QUERY
  WITH recent AS (
    SELECT invoices.party_id, COUNT(*) as recent_count
    FROM invoices
    WHERE business_id = p_business_id
    AND created_at > p_recent_cutoff
    GROUP BY invoices.party_id
  ),
  historical AS (
    SELECT invoices.party_id, COUNT(*) as hist_count,
      MAX(created_at) as last_order
    FROM invoices
    WHERE business_id = p_business_id
    AND created_at BETWEEN
      p_historical_cutoff AND p_recent_cutoff
    GROUP BY invoices.party_id
  )
  SELECT
    h.party_id,
    p.name as party_name,
    EXTRACT(DAY FROM NOW() - h.last_order)::integer as days_since,
    h.hist_count
  FROM historical h
  LEFT JOIN recent r ON r.party_id = h.party_id
  JOIN parties p ON p.id = h.party_id
  WHERE r.party_id IS NULL
  AND h.hist_count >= 2
  ORDER BY h.last_order ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Margin trend calculations RPC
CREATE OR REPLACE FUNCTION get_margin_trend(
  p_business_id uuid,
  p_months integer
) RETURNS TABLE(
  trend text,
  change_pct numeric,
  prev_margin numeric,
  current_margin numeric
) AS $$
DECLARE
  curr_rev numeric := 0;
  curr_cost numeric := 0;
  prev_rev numeric := 0;
  prev_cost numeric := 0;
  curr_margin_calc numeric := 0;
  prev_margin_calc numeric := 0;
  pct_change numeric := 0;
  trend_result text := 'stable';
BEGIN
  -- Current period: last 30 days
  SELECT 
    COALESCE(SUM(ii.line_total), 0),
    COALESCE(SUM(ii.qty * COALESCE(s.cost_price, 0)), 0)
  INTO curr_rev, curr_cost
  FROM invoice_items ii
  JOIN invoices i ON i.id = ii.invoice_id
  JOIN skus s ON s.id = ii.sku_id
  WHERE i.business_id = p_business_id
    AND i.created_at >= NOW() - INTERVAL '30 days'
    AND i.status != 'cancelled';

  -- Previous period: 30 to 90 days ago
  SELECT 
    COALESCE(SUM(ii.line_total), 0),
    COALESCE(SUM(ii.qty * COALESCE(s.cost_price, 0)), 0)
  INTO prev_rev, prev_cost
  FROM invoice_items ii
  JOIN invoices i ON i.id = ii.invoice_id
  JOIN skus s ON s.id = ii.sku_id
  WHERE i.business_id = p_business_id
    AND i.created_at >= NOW() - INTERVAL '90 days'
    AND i.created_at < NOW() - INTERVAL '30 days'
    AND i.status != 'cancelled';

  -- Margins calculation
  IF curr_rev > 0 THEN
    curr_margin_calc := ((curr_rev - curr_cost) / curr_rev) * 100;
  ELSE
    curr_margin_calc := 0;
  END IF;

  IF prev_rev > 0 THEN
    prev_margin_calc := ((prev_rev - prev_cost) / prev_rev) * 100;
  ELSE
    prev_margin_calc := 0;
  END IF;

  -- Change pct
  IF prev_margin_calc > 0 THEN
    pct_change := ((curr_margin_calc - prev_margin_calc) / prev_margin_calc) * 100;
  ELSE
    pct_change := curr_margin_calc - prev_margin_calc;
  END IF;

  -- Trend determination
  IF pct_change < -5 THEN
    trend_result := 'declining';
  ELSIF pct_change > 5 THEN
    trend_result := 'rising';
  ELSE
    trend_result := 'stable';
  END IF;

  RETURN QUERY SELECT trend_result, pct_change, prev_margin_calc, curr_margin_calc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

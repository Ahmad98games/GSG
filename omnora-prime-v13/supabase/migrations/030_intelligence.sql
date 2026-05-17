-- supabase/migrations/030_intelligence.sql

-- Part 1: Smart Dashboard Narrative
CREATE OR REPLACE FUNCTION get_daily_brief(
  p_business_id uuid
) RETURNS jsonb AS $$
DECLARE
  today_revenue numeric;
  yesterday_revenue numeric;
  today_units integer;
  top_karigar text;
  overdue_count integer;
  overdue_amount numeric;
  low_stock_count integer;
  result jsonb;
BEGIN
  -- Today's revenue (Total from invoices issued today)
  SELECT COALESCE(SUM(total), 0)
  INTO today_revenue
  FROM invoices
  WHERE business_id = p_business_id
  AND DATE(issue_date) = CURRENT_DATE
  AND status IN ('issued', 'partially_paid', 'paid');

  -- Yesterday's revenue
  SELECT COALESCE(SUM(total), 0)
  INTO yesterday_revenue
  FROM invoices
  WHERE business_id = p_business_id
  AND DATE(issue_date) = CURRENT_DATE - 1
  AND status IN ('issued', 'partially_paid', 'paid');

  -- Today's production
  SELECT COALESCE(SUM(qty_produced), 0)
  INTO today_units
  FROM karigar_production_logs
  WHERE business_id = p_business_id
  AND log_date = CURRENT_DATE;

  -- Overdue invoices
  SELECT COUNT(*), COALESCE(SUM(balance_due), 0)
  INTO overdue_count, overdue_amount
  FROM invoices
  WHERE business_id = p_business_id
  AND status IN ('issued', 'partially_paid')
  AND due_date < CURRENT_DATE;

  -- Low stock count
  SELECT COUNT(*)
  INTO low_stock_count
  FROM skus
  WHERE business_id = p_business_id
  AND qty_on_hand <= reorder_level
  AND is_active = true;

  -- Top karigar today
  SELECT k.name
  INTO top_karigar
  FROM karigar_production_logs kpl
  JOIN karigars k ON k.id = kpl.karigar_id
  WHERE kpl.business_id = p_business_id
  AND kpl.log_date = CURRENT_DATE
  GROUP BY k.name
  ORDER BY SUM(kpl.qty_produced) DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'today_revenue', today_revenue,
    'yesterday_revenue', yesterday_revenue,
    'revenue_change_pct',
      CASE WHEN yesterday_revenue > 0
        THEN ROUND(((today_revenue - yesterday_revenue) / yesterday_revenue * 100)::numeric, 1)
        ELSE NULL
      END,
    'today_units', today_units,
    'overdue_count', overdue_count,
    'overdue_amount', overdue_amount,
    'low_stock_count', low_stock_count,
    'top_karigar', top_karigar,
    'day_of_week', TRIM(TO_CHAR(CURRENT_DATE, 'Day'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 2: Pattern Detection Alerts
CREATE OR REPLACE FUNCTION detect_business_patterns(
  p_business_id uuid
) RETURNS TABLE(
  pattern_type text,
  severity text,
  title text,
  detail text,
  action_label text,
  action_url text
) AS $$
BEGIN
  -- Pattern 1: Karigar who is always absent Mondays
  RETURN QUERY
  SELECT
    'attendance_pattern'::text,
    'info'::text,
    k.name || ' is frequently absent on Mondays'::text,
    'Absent ' || COUNT(*)::text || ' Mondays in the last 2 months'::text,
    'View Karigar'::text,
    '/karigars/' || k.id::text
  FROM attendance_logs al
  JOIN karigars k ON k.id = al.karigar_id
  WHERE al.business_id = p_business_id
  AND al.status = 'absent'
  AND EXTRACT(DOW FROM al.log_date) = 1
  AND al.log_date > CURRENT_DATE - 60
  GROUP BY k.id, k.name
  HAVING COUNT(*) >= 3;

  -- Pattern 2: Supplier consistently late
  RETURN QUERY
  SELECT
    'supplier_pattern'::text,
    'warning'::text,
    par.name || ' delivers late consistently'::text,
    'Average ' ||
      ROUND(AVG(
        grn.received_date - po.expected_by
      ))::text || ' days after expected'::text,
    'Review Supplier'::text,
    '/parties/' || par.id::text
  FROM goods_received_notes grn
  JOIN purchase_orders po ON po.id = grn.po_id
  JOIN parties par ON par.id = po.supplier_id
  WHERE po.business_id = p_business_id
  AND grn.received_date > po.expected_by + 3
  AND po.created_at > NOW() - INTERVAL '90 days'
  GROUP BY par.id, par.name
  HAVING COUNT(*) >= 2;

  -- Pattern 3: Customer who always pays late
  RETURN QUERY
  SELECT
    'payment_pattern'::text,
    'warning'::text,
    par.name || ' consistently pays late'::text,
    'Average ' ||
      ROUND(AVG(
        CURRENT_DATE - i.due_date
      ))::text || ' days overdue'::text,
    'Send Reminder'::text,
    '/parties/' || par.id::text
  FROM invoices i
  JOIN parties par ON par.id = i.party_id
  WHERE i.business_id = p_business_id
  AND i.status IN ('issued', 'partially_paid')
  AND i.due_date < CURRENT_DATE - 7
  AND i.created_at > NOW() - INTERVAL '90 days'
  GROUP BY par.id, par.name
  HAVING COUNT(*) >= 2;

  -- Pattern 4: Stock that never gets reordered (Frequent zero hits)
  RETURN QUERY
  SELECT
    'stock_pattern'::text,
    'info'::text,
    s.name || ' has been out of stock before'::text,
    'Hit zero ' || COUNT(*)::text || ' times in 90 days'::text,
    'Update Reorder Level'::text,
    '/stock/' || s.id::text
  FROM transfer_logs tl
  JOIN skus s ON s.id = tl.sku_id
  WHERE tl.business_id = p_business_id
  AND tl.operation_type = 'adjustment'
  AND tl.created_at > NOW() - INTERVAL '90 days'
  GROUP BY s.id, s.name
  HAVING MIN(
    CASE WHEN tl.operation_type = 'adjustment'
    THEN 0 ELSE 1 END
  ) = 0 AND COUNT(*) >= 2;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 3: Credit Risk Indicator
CREATE OR REPLACE FUNCTION get_party_credit_risk(
  p_business_id uuid,
  p_party_id uuid
) RETURNS jsonb AS $$
DECLARE
  outstanding numeric;
  credit_limit numeric;
  avg_days_late numeric;
  overdue_invoices integer;
  risk_score integer;
  risk_level text;
BEGIN
  SELECT
    COALESCE(SUM(balance_due), 0),
    COALESCE(SUM(CASE
      WHEN due_date < CURRENT_DATE
        AND status IN ('issued', 'partially_paid')
      THEN 1 ELSE 0 END), 0),
    COALESCE(AVG(CASE
      WHEN due_date < CURRENT_DATE
        AND status IN ('issued', 'partially_paid')
      THEN CURRENT_DATE - due_date
      ELSE NULL END), 0)
  INTO outstanding, overdue_invoices, avg_days_late
  FROM invoices
  WHERE business_id = p_business_id
  AND party_id = p_party_id;

  SELECT COALESCE(credit_limit, 0)
  INTO credit_limit
  FROM parties
  WHERE id = p_party_id;

  -- Risk score 0-100
  risk_score := LEAST(100, (
    CASE WHEN credit_limit > 0 AND outstanding > credit_limit * 0.8
      THEN 40 ELSE 0 END +
    CASE WHEN overdue_invoices > 0
      THEN LEAST(40, overdue_invoices * 10) ELSE 0 END +
    CASE WHEN avg_days_late > 30
      THEN 20 ELSE ROUND((avg_days_late / 30.0 * 20.0)::numeric)::integer END
  ));

  risk_level := CASE
    WHEN risk_score >= 70 THEN 'high'
    WHEN risk_score >= 40 THEN 'medium'
    ELSE 'low'
  END;

  RETURN jsonb_build_object(
    'risk_level', risk_level,
    'risk_score', risk_score,
    'outstanding', outstanding,
    'credit_limit', credit_limit,
    'overdue_invoices', overdue_invoices,
    'avg_days_late', ROUND(avg_days_late)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 4: Production Momentum
CREATE OR REPLACE FUNCTION get_production_momentum(
  p_business_id uuid
) RETURNS jsonb AS $$
DECLARE
  today_units numeric;
  week_avg numeric;
BEGIN
  -- Today's units
  SELECT COALESCE(SUM(qty_produced), 0)
  INTO today_units
  FROM karigar_production_logs
  WHERE business_id = p_business_id
  AND log_date = CURRENT_DATE;

  -- Week average (last 7 days excluding today)
  SELECT COALESCE(AVG(daily_qty), 0)
  INTO week_avg
  FROM (
    SELECT log_date, SUM(qty_produced) as daily_qty
    FROM karigar_production_logs
    WHERE business_id = p_business_id
    AND log_date >= CURRENT_DATE - 7
    AND log_date < CURRENT_DATE
    GROUP BY log_date
  ) daily_sums;

  RETURN jsonb_build_object(
    'today_units', today_units,
    'week_avg', CASE WHEN week_avg = 0 THEN 1 ELSE week_avg END,
    'momentum', CASE WHEN week_avg = 0 THEN 1 ELSE (today_units / week_avg) END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

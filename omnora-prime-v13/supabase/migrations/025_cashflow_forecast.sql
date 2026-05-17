-- supabase/migrations/025_cashflow_forecast.sql

CREATE OR REPLACE FUNCTION get_cashflow_forecast(
  p_business_id uuid,
  p_days integer default 90
) RETURNS TABLE(
  forecast_date date,
  expected_inflows numeric,
  expected_outflows numeric,
  net_position numeric,
  cumulative_position numeric,
  inflow_sources jsonb,
  outflow_sources jsonb,
  risk_level text
) AS $$
DECLARE
  current_cash numeric;
BEGIN
  -- Get current cash balance from ledger
  SELECT COALESCE(SUM(
    CASE WHEN le.entry_type = 'debit' THEN le.amount
         ELSE -le.amount END
  ), 0) INTO current_cash
  FROM ledger_entries le
  JOIN accounts a ON a.id = le.account_id
  WHERE le.business_id = p_business_id
  AND (a.name ILIKE '%cash%' OR a.name ILIKE '%bank%')
  AND le.status = 'posted';

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE,
      CURRENT_DATE + p_days,
      '1 day'::interval
    )::date as forecast_date
  ),
  -- Expected inflows from unpaid invoices by due date
  invoice_inflows AS (
    SELECT
      COALESCE(due_date, created_at::date + 30) as flow_date,
      SUM(total - COALESCE(amount_paid, 0)) as amount,
      jsonb_agg(jsonb_build_object(
        'type', 'invoice',
        'party', p.name,
        'amount', total - COALESCE(amount_paid, 0),
        'invoice_number', i.invoice_no
      )) as sources
    FROM invoices i
    LEFT JOIN parties p ON p.id = i.party_id
    WHERE i.business_id = p_business_id
    AND i.status IN ('posted', 'partial', 'issued')
    AND COALESCE(i.due_date, i.created_at::date + 30)
        BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days
    GROUP BY flow_date
  ),
  -- Expected outflows from purchase orders pending payment
  po_outflows AS (
    SELECT
      COALESCE(expected_date, created_at::date + 14) as flow_date,
      SUM(total - COALESCE(amount_paid, 0)) as amount,
      jsonb_agg(jsonb_build_object(
        'type', 'purchase_order',
        'supplier', par.name,
        'amount', total - COALESCE(amount_paid, 0)
      )) as sources
    FROM purchase_orders po
    LEFT JOIN parties par ON par.id = po.supplier_id
    WHERE po.business_id = p_business_id
    AND po.status IN ('ordered', 'partial', 'received')
    AND COALESCE(po.expected_date, po.created_at::date + 14)
        BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days
    GROUP BY flow_date
  ),
  -- Expected payroll outflows
  payroll_outflows AS (
    SELECT
      (date_trunc('month', CURRENT_DATE) +
       interval '1 month' - interval '1 day')::date as flow_date,
      SUM(COALESCE(k.monthly_salary, k.daily_rate * 26, 0)) as amount,
      jsonb_build_array(jsonb_build_object(
        'type', 'payroll',
        'workers', COUNT(*)::text,
        'amount', SUM(COALESCE(k.monthly_salary, k.daily_rate * 26, 0))
      )) as sources
    FROM karigars k
    WHERE k.business_id = p_business_id
    AND k.status = 'active'
    AND k.wage_type IN ('monthly_salary', 'daily_wage')
    GROUP BY flow_date
  )
  SELECT
    d.forecast_date,
    COALESCE(ii.amount, 0) as expected_inflows,
    COALESCE(po.amount, 0) +
    COALESCE(pay.amount, 0) as expected_outflows,
    COALESCE(ii.amount, 0) -
    (COALESCE(po.amount, 0) + COALESCE(pay.amount, 0))
      as net_position,
    current_cash + SUM(
      COALESCE(ii.amount, 0) -
      (COALESCE(po.amount, 0) + COALESCE(pay.amount, 0))
    ) OVER (ORDER BY d.forecast_date) as cumulative_position,
    COALESCE(ii.sources, '[]'::jsonb) as inflow_sources,
    COALESCE(po.sources, '[]'::jsonb) ||
    COALESCE(pay.sources, '[]'::jsonb) as outflow_sources,
    CASE
      WHEN current_cash + SUM(
        COALESCE(ii.amount, 0) -
        (COALESCE(po.amount, 0) + COALESCE(pay.amount, 0))
      ) OVER (ORDER BY d.forecast_date) < 0
        THEN 'critical'
      WHEN current_cash + SUM(
        COALESCE(ii.amount, 0) -
        (COALESCE(po.amount, 0) + COALESCE(pay.amount, 0))
      ) OVER (ORDER BY d.forecast_date) <
        COALESCE((SELECT SUM(COALESCE(k2.monthly_salary, k2.daily_rate * 26, 0))
         FROM karigars k2
         WHERE k2.business_id = p_business_id
         AND k2.status = 'active'), 0)
        THEN 'warning'
      ELSE 'healthy'
    END as risk_level
  FROM date_series d
  LEFT JOIN invoice_inflows ii ON ii.flow_date = d.forecast_date
  LEFT JOIN po_outflows po ON po.flow_date = d.forecast_date
  LEFT JOIN payroll_outflows pay ON pay.flow_date = d.forecast_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add expected_date to purchase_orders if missing
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS expected_date date;
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS amount_paid numeric(18,4) default 0;
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS amount_paid numeric(18,4) default 0;

-- Update terminology for all industry personas
UPDATE industry_personas
SET terminology = terminology || '{
  "nav_cashflow": "Cash Flow",
  "cashflow.title": "Cash Flow Forecast",
  "cashflow.shortfall": "Cash shortfall projected",
  "cashflow.healthy": "Cash position healthy",
  "cashflow.current_balance": "Cash & Bank Balance",
  "cashflow.net_30": "Net 30-Day Position"
}'::jsonb;

-- Add cashflow to nav_items if missing
UPDATE industry_personas
SET nav_items = nav_items || '["cashflow"]'::jsonb
WHERE NOT (nav_items ? 'cashflow');

-- supabase/migrations/024_payroll_and_reporting_functions.sql

-- 1. Profit & Loss Function
CREATE OR REPLACE FUNCTION get_profit_loss(
  p_business_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS TABLE (
  revenue NUMERIC,
  cost_of_goods NUMERIC,
  gross_profit NUMERIC,
  expenses NUMERIC,
  net_profit NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revenue NUMERIC;
  v_cogs NUMERIC;
  v_expenses NUMERIC;
BEGIN
  -- Revenue (Revenue accounts)
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_revenue
  FROM ledger_entries le
  JOIN accounts a ON le.account_id = a.id
  WHERE le.business_id = p_business_id
    AND a.type = 'revenue'
    AND le.posted_at::DATE BETWEEN p_from AND p_to
    AND le.status = 'posted';

  -- COGS (Expense accounts marked as COGS or specific logic)
  -- For now, let's assume any expense account with 'COGS' in name or a specific range
  SELECT COALESCE(SUM(amount), 0) INTO v_cogs
  FROM ledger_entries le
  JOIN accounts a ON le.account_id = a.id
  WHERE le.business_id = p_business_id
    AND a.type = 'expense'
    AND (a.name ILIKE '%COGS%' OR a.name ILIKE '%Cost of Goods%')
    AND le.posted_at::DATE BETWEEN p_from AND p_to
    AND le.status = 'posted';

  -- Operating Expenses (Other expenses)
  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM ledger_entries le
  JOIN accounts a ON le.account_id = a.id
  WHERE le.business_id = p_business_id
    AND a.type = 'expense'
    AND NOT (a.name ILIKE '%COGS%' OR a.name ILIKE '%Cost of Goods%')
    AND le.posted_at::DATE BETWEEN p_from AND p_to
    AND le.status = 'posted';

  RETURN QUERY SELECT 
    v_revenue, 
    v_cogs, 
    v_revenue - v_cogs, 
    v_expenses, 
    v_revenue - v_cogs - v_expenses;
END;
$$;

-- 2. Karigar Production Summary
CREATE OR REPLACE FUNCTION get_karigar_production_summary(
  p_karigar_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS TABLE (
  total_qty NUMERIC,
  total_earning NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(effective_qty), 0),
    COALESCE(SUM(effective_earning), 0)
  FROM karigar_production_logs
  WHERE karigar_id = p_karigar_id
    AND log_date BETWEEN p_from AND p_to;
END;
$$;

-- 3. Inventory Velocity (Optional but useful for reports)
CREATE OR REPLACE FUNCTION get_inventory_velocity(
  p_business_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  sku_id UUID,
  sku_name TEXT,
  units_sold NUMERIC,
  velocity NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    COALESCE(SUM(ii.qty), 0) as units_sold,
    COALESCE(SUM(ii.qty), 0) / p_days as velocity
  FROM skus s
  LEFT JOIN invoice_items ii ON s.id = ii.sku_id
  LEFT JOIN invoices i ON ii.invoice_id = i.id
  WHERE s.business_id = p_business_id
    AND i.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND i.status = 'paid'
  GROUP BY s.id, s.name;
END;
$$;

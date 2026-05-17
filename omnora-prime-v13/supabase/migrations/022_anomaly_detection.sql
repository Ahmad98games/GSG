-- Noxis v13.0 — Phase 22: Anomaly Detection
-- Implementation of inventory desync and ledger imbalance checks

-- 0. Schema Hardening
ALTER TABLE transfer_logs ADD COLUMN IF NOT EXISTS operation_type text;

-- 1. INVENTORY DESYNC DETECTION
-- Finds SKUs where qty_on_hand doesn't match 
-- the sum of all stock movements
CREATE OR REPLACE FUNCTION detect_inventory_desync(
  p_business_id uuid
) RETURNS TABLE(
  sku_id uuid,
  sku_code text,
  recorded_qty numeric,
  calculated_qty numeric,
  variance numeric,
  severity text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.sku_code,
    s.qty_on_hand,
    COALESCE(movements.net_qty, 0) as calculated,
    s.qty_on_hand - COALESCE(movements.net_qty, 0) as variance,
    CASE 
      WHEN ABS(s.qty_on_hand - COALESCE(movements.net_qty,0)) > 100 
        THEN 'critical'
      WHEN ABS(s.qty_on_hand - COALESCE(movements.net_qty,0)) > 10 
        THEN 'warning'
      ELSE 'info'
    END as severity
  FROM skus s
  LEFT JOIN (
    SELECT 
      sku_id,
      SUM(CASE WHEN operation_type IN ('purchase','return_in','adjustment_add') 
               THEN qty ELSE -qty END) as net_qty
    FROM transfer_logs
    WHERE business_id = p_business_id
    GROUP BY sku_id
  ) movements ON movements.sku_id = s.id
  WHERE s.business_id = p_business_id
  AND ABS(s.qty_on_hand - COALESCE(movements.net_qty, 0)) > 0
  ORDER BY ABS(variance) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. LEDGER IMBALANCE DETECTION
-- Trial balance check: debits must equal credits
CREATE OR REPLACE FUNCTION detect_ledger_imbalance(
  p_business_id uuid
) RETURNS TABLE(
  account_id uuid,
  account_name text,
  total_debits numeric,
  total_credits numeric,
  imbalance numeric,
  severity text
) AS $$
BEGIN
  RETURN QUERY
  WITH account_totals AS (
    SELECT
      le.account_id,
      a.name as account_name,
      SUM(CASE WHEN le.entry_type = 'debit' 
               THEN le.amount ELSE 0 END) as total_debits,
      SUM(CASE WHEN le.entry_type = 'credit' 
               THEN le.amount ELSE 0 END) as total_credits
    FROM ledger_entries le
    JOIN accounts a ON a.id = le.account_id
    WHERE le.business_id = p_business_id
    AND le.status = 'posted'
    GROUP BY le.account_id, a.name
  )
  SELECT 
    account_id,
    account_name,
    total_debits,
    total_credits,
    ABS(total_debits - total_credits) as imbalance,
    CASE 
      WHEN ABS(total_debits - total_credits) > 10000 THEN 'critical'
      WHEN ABS(total_debits - total_credits) > 1000 THEN 'warning'
      ELSE 'info'
    END as severity
  FROM account_totals
  WHERE ABS(total_debits - total_credits) > 0.001
  ORDER BY imbalance DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ANOMALY ALERTS TABLE
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id),
  alert_type text not null,
  severity text not null check (severity in ('info','warning','critical')),
  payload jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_isolation" ON anomaly_alerts;
CREATE POLICY "business_isolation" ON anomaly_alerts
  FOR ALL USING (business_id = current_user_business_id());

CREATE INDEX IF NOT EXISTS idx_anomaly_unresolved 
  ON anomaly_alerts(business_id, resolved, severity)
  WHERE resolved = false;

-- 4. MILLION-ROW PERFORMANCE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  idx_ledger_business_status_posted
  ON ledger_entries(business_id, status, posted_at DESC)
  WHERE status = 'posted';

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_ledger_account_type
  ON ledger_entries(account_id, entry_type, amount)
  WHERE status = 'posted';

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_skus_business_active
  ON skus(business_id, is_active, qty_on_hand)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_transfer_logs_sku
  ON transfer_logs(sku_id, operation_type, qty);

-- supabase/migrations/007_financial_statements.sql

-- Chart of Accounts seeding
CREATE OR REPLACE FUNCTION seed_default_accounts(p_business_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO accounts (business_id, account_code, name, type, is_system) VALUES
  -- ASSETS
  (p_business_id, '1001', 'Cash in Hand',           'asset',   true),
  (p_business_id, '1002', 'Cash at Bank',            'asset',   true),
  (p_business_id, '1100', 'Accounts Receivable',     'asset',   true),
  (p_business_id, '1200', 'Inventory / Stock',       'asset',   true),
  (p_business_id, '1300', 'Karigar Advances',        'asset',   true),
  (p_business_id, '1500', 'Fixed Assets',            'asset',   true),
  (p_business_id, '1510', 'Accumulated Depreciation','asset',   true),
  -- LIABILITIES
  (p_business_id, '2001', 'Accounts Payable',        'liability',true),
  (p_business_id, '2100', 'Tax Payable (Output)',    'liability',true),
  (p_business_id, '2101', 'Tax Receivable (Input)',  'asset',   true),
  (p_business_id, '2200', 'Salaries Payable',        'liability',true),
  (p_business_id, '2300', 'EOBI Payable',            'liability',true),
  (p_business_id, '2900', 'Owner Loan / Capital',    'liability',true),
  -- EQUITY
  (p_business_id, '3001', 'Owner Capital',           'equity',  true),
  (p_business_id, '3100', 'Retained Earnings',       'equity',  true),
  (p_business_id, '3200', 'Current Year Profit/Loss','equity',  true),
  -- REVENUE
  (p_business_id, '4001', 'Sales Revenue',           'revenue', true),
  (p_business_id, '4002', 'Other Income',            'revenue', true),
  (p_business_id, '4100', 'Sales Returns',           'revenue', true),
  -- EXPENSES
  (p_business_id, '5001', 'Cost of Goods Sold',      'expense', true),
  (p_business_id, '5100', 'Salaries & Wages',        'expense', true),
  (p_business_id, '5200', 'Rent',                    'expense', true),
  (p_business_id, '5300', 'Utilities (WAPDA/Gas)',   'expense', true),
  (p_business_id, '5400', 'Depreciation',            'expense', true),
  (p_business_id, '5500', 'Freight & Carriage',      'expense', true),
  (p_business_id, '5600', 'Repairs & Maintenance',   'expense', true),
  (p_business_id, '5700', 'Printing & Stationery',   'expense', true),
  (p_business_id, '5800', 'Miscellaneous Expense',   'expense', true)
  ON CONFLICT (business_id, account_code) DO NOTHING;
END;
$$;

-- Trigger: auto-seed accounts on new business profile creation
CREATE OR REPLACE FUNCTION on_business_created()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM seed_default_accounts(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_accounts ON business_profiles;
CREATE TRIGGER trg_seed_accounts AFTER INSERT ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION on_business_created();

-- 1. Base Balance Retrieval Function
CREATE OR REPLACE FUNCTION get_account_balances(
  p_business_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  account_id       UUID,
  account_code     TEXT,
  account_name     TEXT,
  account_type     account_type,
  parent_id        UUID,
  total_debits     NUMERIC(15,2),
  total_credits    NUMERIC(15,2),
  balance          NUMERIC(15,2)
) LANGUAGE SQL STABLE AS $$
  SELECT
    a.id,
    a.account_code,
    a.name,
    a.type,
    a.parent_id,
    COALESCE(SUM(CASE WHEN le.entry_type = 'debit'  THEN le.amount ELSE 0 END), 0) AS total_debits,
    COALESCE(SUM(CASE WHEN le.entry_type = 'credit' THEN le.amount ELSE 0 END), 0) AS total_credits,
    CASE
      WHEN a.type IN ('asset','expense') THEN
        COALESCE(SUM(CASE WHEN le.entry_type='debit'  THEN le.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN le.entry_type='credit' THEN le.amount ELSE 0 END), 0)
      ELSE
        COALESCE(SUM(CASE WHEN le.entry_type='credit' THEN le.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN le.entry_type='debit'  THEN le.amount ELSE 0 END), 0)
    END AS balance
  FROM accounts a
  LEFT JOIN ledger_entries le ON le.account_id = a.id
    AND le.status = 'posted'
    AND le.business_id = p_business_id
    AND le.posted_at::DATE >= p_date_from
    AND le.posted_at::DATE <= p_date_to
  WHERE a.business_id = p_business_id
    AND a.is_active = true
  GROUP BY a.id, a.account_code, a.name, a.type, a.parent_id
  ORDER BY a.account_code;
$$;

-- 2. Trial Balance
CREATE OR REPLACE FUNCTION get_trial_balance(
  p_business_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  account_code   TEXT,
  account_name   TEXT,
  account_type   account_type,
  debit_balance  NUMERIC(15,2),
  credit_balance NUMERIC(15,2)
) LANGUAGE SQL STABLE AS $$
  SELECT
    account_code,
    account_name,
    account_type,
    CASE WHEN balance >= 0 AND account_type IN ('asset','expense') THEN balance ELSE 0 END AS debit_balance,
    CASE WHEN balance >= 0 AND account_type IN ('liability','equity','revenue') THEN balance ELSE 0 END AS credit_balance
  FROM get_account_balances(p_business_id, p_date_from, p_date_to)
  WHERE total_debits > 0 OR total_credits > 0
  ORDER BY account_code;
$$;

-- Integrity Check
CREATE OR REPLACE FUNCTION check_trial_balance_integrity(
  p_business_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  total_debits   NUMERIC(15,2),
  total_credits  NUMERIC(15,2),
  is_balanced    BOOLEAN,
  variance       NUMERIC(15,2)
) LANGUAGE SQL STABLE AS $$
  SELECT
    SUM(debit_balance),
    SUM(credit_balance),
    SUM(debit_balance) = SUM(credit_balance),
    ABS(SUM(debit_balance) - SUM(credit_balance))
  FROM get_trial_balance(p_business_id, p_date_from, p_date_to);
$$;

-- 3. Profit & Loss
CREATE OR REPLACE FUNCTION get_profit_loss(
  p_business_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  section        TEXT,
  account_code   TEXT,
  account_name   TEXT,
  amount         NUMERIC(15,2),
  is_subtotal    BOOLEAN
) LANGUAGE SQL STABLE AS $$
  WITH balances AS (
    SELECT * FROM get_account_balances(p_business_id, p_date_from, p_date_to)
  )
  SELECT 'revenue', account_code, account_name, balance, false
  FROM balances WHERE account_type = 'revenue' AND balance <> 0
  UNION ALL
  SELECT 'revenue', NULL, 'Total Revenue',
    SUM(CASE WHEN account_type='revenue' THEN balance ELSE 0 END), true
  FROM balances
  UNION ALL
  SELECT 'cogs', account_code, account_name, balance, false
  FROM balances WHERE account_code = '5001' AND balance <> 0
  UNION ALL
  SELECT 'cogs', NULL, 'Gross Profit',
    SUM(CASE WHEN account_type='revenue' THEN balance ELSE 0 END) -
    SUM(CASE WHEN account_code='5001' THEN balance ELSE 0 END), true
  FROM balances
  UNION ALL
  SELECT 'operating_expense', account_code, account_name, balance, false
  FROM balances WHERE account_type = 'expense' AND account_code != '5001' AND balance <> 0
  UNION ALL
  SELECT 'operating_expense', NULL, 'Total Operating Expenses',
    SUM(CASE WHEN account_type='expense' AND account_code != '5001' THEN balance ELSE 0 END), true
  FROM balances
  UNION ALL
  SELECT 'net_profit', NULL,
    CASE WHEN
      SUM(CASE WHEN account_type='revenue' THEN balance ELSE 0 END) -
      SUM(CASE WHEN account_type='expense' THEN balance ELSE 0 END) >= 0
    THEN 'Net Profit' ELSE 'Net Loss' END,
    ABS(
      SUM(CASE WHEN account_type='revenue' THEN balance ELSE 0 END) -
      SUM(CASE WHEN account_type='expense' THEN balance ELSE 0 END)
    ), true
  FROM balances;
$$;

-- 4. Balance Sheet
CREATE OR REPLACE FUNCTION get_balance_sheet(
  p_business_id UUID,
  p_as_at_date DATE
)
RETURNS TABLE (
  section        TEXT,
  account_code   TEXT,
  account_name   TEXT,
  amount         NUMERIC(15,2),
  is_subtotal    BOOLEAN
) LANGUAGE SQL STABLE AS $$
  WITH balances AS (
    SELECT * FROM get_account_balances(p_business_id, '2000-01-01'::DATE, p_as_at_date)
  ),
  ytd_profit AS (
    SELECT
      SUM(CASE WHEN account_type='revenue' THEN balance ELSE 0 END) -
      SUM(CASE WHEN account_type='expense' THEN balance ELSE 0 END) AS net_profit
    FROM get_account_balances(p_business_id, DATE_TRUNC('year', p_as_at_date)::DATE, p_as_at_date)
  )
  SELECT 'current_asset', account_code, account_name, balance, false
  FROM balances WHERE account_type='asset' AND account_code < '1500' AND balance <> 0
  UNION ALL SELECT 'current_asset', NULL, 'Total Current Assets',
    SUM(CASE WHEN account_type='asset' AND account_code < '1500' THEN balance ELSE 0 END), true
  FROM balances
  UNION ALL
  SELECT 'fixed_asset', account_code, account_name, balance, false
  FROM balances WHERE account_type='asset' AND account_code >= '1500' AND balance <> 0
  UNION ALL SELECT 'fixed_asset', NULL, 'Total Fixed Assets',
    SUM(CASE WHEN account_type='asset' AND account_code >= '1500' THEN balance ELSE 0 END), true
  FROM balances
  UNION ALL SELECT 'total_assets', NULL, 'TOTAL ASSETS',
    SUM(CASE WHEN account_type='asset' THEN balance ELSE 0 END), true
  FROM balances
  UNION ALL
  SELECT 'current_liability', account_code, account_name, balance, false
  FROM balances WHERE account_type='liability' AND balance <> 0
  UNION ALL SELECT 'current_liability', NULL, 'Total Liabilities',
    SUM(CASE WHEN account_type='liability' THEN balance ELSE 0 END), true
  FROM balances
  UNION ALL
  SELECT 'equity', account_code, account_name, balance, false
  FROM balances WHERE account_type='equity' AND account_code != '3200' AND balance <> 0
  UNION ALL
  SELECT 'equity', '3200', 'Current Year Profit / Loss', (SELECT net_profit FROM ytd_profit), false
  UNION ALL SELECT 'equity', NULL, 'Total Equity',
    SUM(CASE WHEN account_type='equity' THEN balance ELSE 0 END) + (SELECT net_profit FROM ytd_profit), true
  FROM balances
  UNION ALL SELECT 'total_le', NULL, 'TOTAL LIABILITIES & EQUITY',
    SUM(CASE WHEN account_type IN ('liability','equity') THEN balance ELSE 0 END) + (SELECT net_profit FROM ytd_profit), true
  FROM balances;
$$;

-- 5. Tax Return
CREATE OR REPLACE FUNCTION get_tax_return(
  p_business_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  section          TEXT,
  description      TEXT,
  taxable_amount   NUMERIC(15,2),
  tax_rate_pct     NUMERIC(5,2),
  tax_amount       NUMERIC(15,2)
) LANGUAGE SQL STABLE AS $$
  SELECT
    'output_tax' AS section,
    'Sales (Standard Rate)' AS description,
    SUM(i.subtotal - i.discount_amount) AS taxable_amount,
    MAX(i.tax_pct) AS tax_rate_pct,
    SUM(i.tax_amount) AS tax_amount
  FROM invoices i
  WHERE i.business_id = p_business_id
    AND i.status NOT IN ('draft','cancelled')
    AND i.issue_date >= p_date_from
    AND i.issue_date <= p_date_to
    AND i.tax_pct > 0
  GROUP BY i.tax_pct
  UNION ALL
  SELECT 'output_tax', 'Sales (Zero-Rated / Exempt)', SUM(i.subtotal - i.discount_amount), 0, 0
  FROM invoices i
  WHERE i.business_id = p_business_id
    AND i.status NOT IN ('draft','cancelled')
    AND i.issue_date BETWEEN p_date_from AND p_date_to
    AND i.tax_pct = 0
  UNION ALL
  SELECT 'output_total', 'Total Output Tax', NULL, NULL, COALESCE(SUM(i.tax_amount), 0)
  FROM invoices i
  WHERE i.business_id = p_business_id
    AND i.status NOT IN ('draft','cancelled')
    AND i.issue_date BETWEEN p_date_from AND p_date_to
  UNION ALL
  SELECT 'input_tax', 'Purchases (Input Tax Claimable)', SUM(po.subtotal), MAX(po.tax_pct), SUM(po.tax_amount)
  FROM purchase_orders po
  WHERE po.business_id = p_business_id
    AND po.status NOT IN ('draft','cancelled')
    AND po.order_date BETWEEN p_date_from AND p_date_to
    AND po.tax_pct > 0
  UNION ALL
  SELECT 'input_total', 'Total Input Tax (Claimable)', NULL, NULL, COALESCE(SUM(po.tax_amount), 0)
  FROM purchase_orders po
  WHERE po.business_id = p_business_id
    AND po.status != 'cancelled'
    AND po.order_date BETWEEN p_date_from AND p_date_to
  UNION ALL
  SELECT 'net_payable', 'Net Tax Payable (Output – Input)', NULL, NULL,
    (SELECT COALESCE(SUM(tax_amount),0) FROM invoices WHERE business_id=p_business_id AND status NOT IN('draft','cancelled') AND issue_date BETWEEN p_date_from AND p_date_to) -
    (SELECT COALESCE(SUM(tax_amount),0) FROM purchase_orders WHERE business_id=p_business_id AND status!='cancelled' AND order_date BETWEEN p_date_from AND p_date_to);
$$;

-- 6. Tax Filings Table
CREATE TABLE IF NOT EXISTS tax_return_filings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  period_label    TEXT NOT NULL,
  period_from     DATE NOT NULL,
  period_to       DATE NOT NULL,
  tax_label       TEXT NOT NULL,
  output_tax      NUMERIC(15,2) NOT NULL,
  input_tax       NUMERIC(15,2) NOT NULL,
  net_payable     NUMERIC(15,2) NOT NULL,
  filed_at        TIMESTAMPTZ DEFAULT now(),
  filed_by        UUID REFERENCES auth.users(id),
  filing_ref      TEXT,
  pdf_url         TEXT,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','filed','amended'))
);

ALTER TABLE tax_return_filings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_tax_filings" ON tax_return_filings;
CREATE POLICY "business_tax_filings" ON tax_return_filings
  FOR ALL USING (business_id = current_user_business_id());


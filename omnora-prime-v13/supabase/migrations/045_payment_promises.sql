CREATE TABLE IF NOT EXISTS payment_promises (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references business_profiles(id),
  party_id uuid not null
    references parties(id),
  
  -- The promise details
  promised_amount numeric(18,4) not null,
  promise_date date not null,
  notes text,
  
  -- What triggered it (optional link)
  invoice_id uuid references invoices(id),
  
  -- Status lifecycle
  status text not null default 'pending'
    check (status in (
      'pending',    -- Promise not yet due
      'due_today',  -- Today is the day
      'overdue',    -- Past the date, not paid
      'fulfilled',  -- They paid
      'broken'      -- Marked as broken/cancelled
    )),
  
  -- Tracking
  reminded_count integer default 0,
  last_reminded_at timestamptz,
  fulfilled_at timestamptz,
  fulfilled_amount numeric(18,4),
  
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX idx_promises_date
  ON payment_promises(promise_date, status);
CREATE INDEX idx_promises_business
  ON payment_promises(business_id, status);

ALTER TABLE payment_promises
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_isolation"
  ON payment_promises FOR ALL
  USING (business_id = current_user_business_id());

-- Function: get promises due today or overdue
CREATE OR REPLACE FUNCTION get_due_promises(
  p_business_id uuid
) RETURNS TABLE(
  id uuid,
  party_name text,
  party_phone text,
  party_id uuid,
  promised_amount numeric,
  promise_date date,
  days_overdue integer,
  notes text,
  status text,
  invoice_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.id,
    pa.name as party_name,
    pa.phone as party_phone,
    pa.id as party_id,
    pp.promised_amount,
    pp.promise_date,
    (CURRENT_DATE - pp.promise_date)::integer
      as days_overdue,
    pp.notes,
    pp.status,
    pp.invoice_id
  FROM payment_promises pp
  JOIN parties pa ON pa.id = pp.party_id
  WHERE pp.business_id = p_business_id
  AND pp.promise_date <= CURRENT_DATE
  AND pp.status IN ('pending', 'due_today', 'overdue')
  ORDER BY pp.promise_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily cron: update promise statuses
CREATE OR REPLACE FUNCTION update_promise_statuses() RETURNS void AS $$
BEGIN
  -- Mark due today
  UPDATE payment_promises
  SET status = 'due_today',
      updated_at = now()
  WHERE promise_date = CURRENT_DATE
  AND status = 'pending';
  
  -- Mark overdue (past due date, still unpaid)
  UPDATE payment_promises
  SET status = 'overdue',
      updated_at = now()
  WHERE promise_date < CURRENT_DATE
  AND status IN ('pending', 'due_today');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

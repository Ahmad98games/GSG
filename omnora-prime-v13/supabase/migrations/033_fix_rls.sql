-- Drop and recreate RLS on party_commitments
ALTER TABLE party_commitments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_isolation"
  ON party_commitments;

CREATE POLICY "business_isolation"
  ON party_commitments
  FOR ALL
  USING (business_id = current_user_business_id());

-- Also verify partner_drawings table
ALTER TABLE IF EXISTS partner_drawings
  ENABLE ROW LEVEL SECURITY;

-- Verify exchange_rates RLS
ALTER TABLE IF EXISTS exchange_rates
  ENABLE ROW LEVEL SECURITY;

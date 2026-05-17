-- 028_mandi.sql
CREATE TABLE mandi_rates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references business_profiles(id),
  commodity text not null,
  market_name text not null,
  rate_per_unit numeric(18,4) not null,
  unit text not null,
  rate_date date not null default CURRENT_DATE,
  notes text,
  created_at timestamptz not null default now()
);

ALTER TABLE mandi_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_isolation" ON mandi_rates
  FOR ALL USING (business_id = (SELECT current_user_business_id()));

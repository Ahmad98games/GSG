-- 028_samples.sql
CREATE TABLE samples (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references business_profiles(id),
  sample_number text not null,
  party_id uuid references parties(id),
  sent_date date not null default CURRENT_DATE,
  return_expected date,
  return_actual date,
  status text not null default 'sent'
    check (status in
      ('sent','returned','order_placed',
       'rejected','lost')),
  notes text,
  created_at timestamptz not null default now()
);

ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_isolation" ON samples
  FOR ALL USING (business_id = (SELECT current_user_business_id()));

CREATE TABLE sample_items (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references samples(id) ON DELETE CASCADE,
  sku_id uuid references skus(id),
  qty numeric(18,4) not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

ALTER TABLE sample_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_isolation_items" ON sample_items
  FOR ALL USING (
    sample_id IN (SELECT id FROM samples WHERE business_id = (SELECT current_user_business_id()))
  );

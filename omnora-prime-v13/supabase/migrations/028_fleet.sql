-- 028_fleet.sql
CREATE TABLE vehicles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references business_profiles(id),
  registration text not null,
  make text,
  model text,
  year integer,
  type text check (type in
    ('truck','van','motorcycle','car','other')),
  status text not null default 'active'
    check (status in
      ('active','maintenance','retired')),
  driver_name text,
  driver_phone text,
  last_service_date date,
  next_service_date date,
  notes text,
  created_at timestamptz not null default now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_isolation" ON vehicles
  FOR ALL USING (business_id = (SELECT current_user_business_id()));

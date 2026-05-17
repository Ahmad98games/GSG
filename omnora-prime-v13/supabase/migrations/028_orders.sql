-- 028_orders.sql
CREATE TABLE orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references business_profiles(id),
  order_number text not null,
  party_id uuid references parties(id),
  order_date date not null default CURRENT_DATE,
  expected_date date,
  status text not null default 'pending'
    check (status in ('pending','confirmed',
      'in_production','ready','invoiced','cancelled')),
  notes text,
  total_amount numeric(18,4) default 0,
  created_at timestamptz not null default now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_isolation" ON orders
  FOR ALL USING (business_id = (SELECT current_user_business_id()));

CREATE TABLE order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) ON DELETE CASCADE,
  sku_id uuid references skus(id),
  description text,
  qty numeric(18,4) not null,
  unit text,
  rate numeric(18,4) not null,
  total numeric(18,4) not null,
  created_at timestamptz not null default now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_isolation_items" ON order_items
  FOR ALL USING (
    order_id IN (SELECT id FROM orders WHERE business_id = (SELECT current_user_business_id()))
  );

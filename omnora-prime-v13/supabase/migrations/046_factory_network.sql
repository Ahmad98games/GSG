-- Factory network profiles (public listing)
CREATE TABLE IF NOT EXISTS network_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique
    references business_profiles(id),
  
  -- What they show publicly
  display_name text not null,
  industry text,
  city text,
  country_code text default 'PK',
  
  -- What they make / need
  produces jsonb default '[]'::jsonb,
  needs jsonb default '[]'::jsonb,
  
  -- Network status
  is_visible boolean default false,
  joined_network_at timestamptz,
  
  -- Trust signals (built over time)
  verified_business boolean default false,
  months_on_noxis integer default 0,
  invoice_count integer default 0,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Supply listings (what factories offer)
CREATE TABLE IF NOT EXISTS supply_listings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references business_profiles(id),
  network_profile_id uuid
    references network_profiles(id),
  
  -- The item
  item_name text not null,
  category text,
  unit text not null,
  
  -- Pricing
  price_per_unit numeric,
  currency text default 'PKR',
  price_negotiable boolean default true,
  
  -- Quantity
  qty_available numeric,
  min_order_qty numeric,
  
  -- Visibility
  is_active boolean default true,
  
  created_at timestamptz default now()
);

-- Connection requests between factories
CREATE TABLE IF NOT EXISTS factory_connections (
  id uuid primary key default gen_random_uuid(),
  from_business_id uuid not null
    references business_profiles(id),
  to_business_id uuid not null
    references business_profiles(id),
  
  -- What they want
  message text,
  items_interested jsonb default '[]'::jsonb,
  
  status text default 'pending'
    check (status in (
      'pending', 'accepted',
      'declined', 'completed'
    )),
  
  created_at timestamptz default now(),
  responded_at timestamptz,
  
  UNIQUE(from_business_id, to_business_id)
);

-- Anonymous usage signals
-- (never stores private data — only patterns)
CREATE TABLE IF NOT EXISTS industry_signals (
  id uuid primary key default gen_random_uuid(),
  
  -- What happened (anonymized)
  signal_type text not null,
  -- 'sku_price_change', 'stock_low',
  -- 'invoice_volume', 'wage_rate',
  -- 'production_output'
  
  industry text,
  city text,
  country_code text,
  
  -- The signal value (no business names)
  metric_name text,
  metric_value numeric,
  metric_unit text,
  
  -- Time bucket (week, not exact time)
  week_bucket date,
  
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_signals_industry_week
  ON industry_signals(industry, week_bucket);

CREATE INDEX IF NOT EXISTS idx_listings_category
  ON supply_listings(category, is_active);

-- RLS
ALTER TABLE network_profiles
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_listings
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_connections
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_signals
  ENABLE ROW LEVEL SECURITY;

-- Network profiles: public can read visible ones
CREATE POLICY "public_visible_profiles"
  ON network_profiles FOR SELECT
  USING (is_visible = true);

CREATE POLICY "own_profile_all"
  ON network_profiles FOR ALL
  USING (business_id = current_user_business_id());

-- Supply listings: public can read active ones
CREATE POLICY "public_active_listings"
  ON supply_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "own_listings_all"
  ON supply_listings FOR ALL
  USING (business_id = current_user_business_id());

-- Connections: parties involved can see
CREATE POLICY "connection_parties"
  ON factory_connections FOR ALL
  USING (
    from_business_id = current_user_business_id()
    OR to_business_id = current_user_business_id()
  );

-- Signals: anyone can read (anonymous)
CREATE POLICY "signals_public_read"
  ON industry_signals FOR SELECT
  USING (true);

CREATE POLICY "signals_insert"
  ON industry_signals FOR INSERT
  WITH CHECK (true);

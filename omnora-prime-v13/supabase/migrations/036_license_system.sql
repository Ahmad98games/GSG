-- Migration: Create licenses table for Noxis Hub

CREATE TABLE IF NOT EXISTS licenses (
  id uuid primary key default gen_random_uuid(),
  
  -- The key the customer enters
  license_key text not null unique,
  
  -- Tier
  tier text not null default 'lite'
    check (tier in ('lite','pro','elite')),
  
  -- Limits enforced by software
  max_devices integer not null default 15,
  
  -- Business linked after activation
  business_id uuid references business_profiles(id),
  
  -- Customer info
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  
  -- Validity
  activated_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  
  -- Payment reference (manual)
  payment_method text,
  payment_reference text,
  amount_paid numeric(10,2),
  currency text default 'PKR',
  
  -- Internal notes
  notes text,
  created_at timestamptz not null default now()
);

-- Note: RLS is disabled for this table as it should only be accessed via service role keys
ALTER TABLE licenses DISABLE ROW LEVEL SECURITY;

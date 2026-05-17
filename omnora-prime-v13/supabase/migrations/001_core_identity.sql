-- supabase/migrations/001_core_identity.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE TABLE IF NOT EXISTS business_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('manufacturer','wholesaler','retailer')),
  industry_type   TEXT NOT NULL CHECK (industry_type IN ('textile','medical','auto','general')),
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  country         TEXT DEFAULT 'PK',
  currency        TEXT DEFAULT 'PKR',
  tax_number      TEXT,       -- NTN / GSTIN / VAT number
  logo_url        TEXT,
  role_pin_hash   TEXT,       -- bcrypt hash of 4-digit PIN for role-switch protection
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS sidebar_preferences (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  collapsed   BOOLEAN DEFAULT false,
  pinned_tabs TEXT[] DEFAULT '{}',  -- user-pinned nav items
  last_route  TEXT,                 -- resume where they left off
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS: enable on ALL tables
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidebar_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "users_own_profile" ON business_profiles;
CREATE POLICY "users_own_profile" ON business_profiles
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_sidebar" ON sidebar_preferences;
CREATE POLICY "users_own_sidebar" ON sidebar_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Helper function used by ALL future phase tables for RLS
CREATE OR REPLACE FUNCTION current_user_business_id()
RETURNS UUID LANGUAGE SQL STABLE AS $$
  SELECT id FROM business_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Trigger: auto-update updated_at on business_profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_business_profiles_updated ON business_profiles;
CREATE TRIGGER trg_business_profiles_updated
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


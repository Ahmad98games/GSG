-- Add license and trial tracking to business_profiles
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS license_key TEXT,
ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW();

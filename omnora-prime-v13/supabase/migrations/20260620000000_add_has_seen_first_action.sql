-- supabase/migrations/20260620000000_add_has_seen_first_action.sql
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_seen_first_action boolean DEFAULT false;

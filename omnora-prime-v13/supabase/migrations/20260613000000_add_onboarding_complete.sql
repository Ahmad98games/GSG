-- supabase/migrations/20260613000000_add_onboarding_complete.sql
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

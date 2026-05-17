-- Add owner_name to business_profiles
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS owner_name TEXT;

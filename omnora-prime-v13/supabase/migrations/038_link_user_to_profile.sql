-- Link business profiles to Supabase Auth users
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Migration logic for existing profiles
UPDATE business_profiles
SET user_id = (
  SELECT id FROM auth.users LIMIT 1
)
WHERE user_id IS NULL;

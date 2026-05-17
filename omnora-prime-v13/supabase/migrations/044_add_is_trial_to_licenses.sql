-- Add is_trial column to licenses table
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS is_trial boolean DEFAULT false;

-- Allow expires_at to be NULL for activation-based countdown
ALTER TABLE licenses ALTER COLUMN expires_at DROP NOT NULL;

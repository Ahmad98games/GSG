-- Migration to add customer_whatsapp, payment_method, amount_paid, currency, notes, and months columns to licenses table
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS customer_whatsapp text;

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS amount_paid numeric;

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'PKR';

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS months integer DEFAULT 1;

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS is_deactivated boolean DEFAULT false;

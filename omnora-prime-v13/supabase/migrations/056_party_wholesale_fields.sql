-- Migration: 056_party_wholesale_fields.sql
-- Add wholesale textile ERP fields to parties table

ALTER TABLE parties ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15,2) DEFAULT 0;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS balance_nature TEXT DEFAULT 'receivable';
ALTER TABLE parties ADD COLUMN IF NOT EXISTS preferred_transport TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS cnic_or_ntn TEXT;

CREATE INDEX IF NOT EXISTS idx_parties_city ON parties(city);
CREATE INDEX IF NOT EXISTS idx_parties_secondary_phone ON parties(secondary_phone);

-- Add voided to invoice_status enum if not exists
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'voided';

-- Add voided_at column if missing
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS
    voided_at timestamptz;

-- Add currency and USD-equivalent columns to industry_signals table
ALTER TABLE industry_signals
ADD COLUMN IF NOT EXISTS currency text
  DEFAULT 'PKR';

ALTER TABLE industry_signals
ADD COLUMN IF NOT EXISTS metric_value_usd
  numeric;

-- supabase/migrations/20260614000000_add_created_at_to_production_batches.sql
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

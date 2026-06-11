-- Migration: Add missing columns to audit_sessions table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE audit_sessions
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS scope         text DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS scope_details jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS started_at    timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by    uuid REFERENCES auth.users(id);

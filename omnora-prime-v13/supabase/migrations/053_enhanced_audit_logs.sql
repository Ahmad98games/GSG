-- Migration: 053_enhanced_audit_logs.sql
-- Add missing columns to audit_logs table and create details view

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS branch_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Create a view for the admin panel that joins user and branch names
CREATE OR REPLACE VIEW audit_log_details AS
SELECT
  al.*,
  bp.business_name,
  su.name as sub_user_display_name,
  b.name as branch_name
FROM audit_logs al
LEFT JOIN business_profiles bp
  ON bp.id = al.business_id
LEFT JOIN sub_users su
  ON su.id::text = al.user_id::text
LEFT JOIN branches b
  ON b.id = al.branch_id;

-- Enable RLS on the view
ALTER VIEW audit_log_details
  SET (security_invoker = true);

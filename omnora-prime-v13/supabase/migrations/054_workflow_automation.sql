-- Migration: 054_workflow_automation.sql
-- Create workflows and workflow_runs tables with RLS policies

CREATE TABLE IF NOT EXISTS workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,

  -- Trigger definition
  trigger_type text NOT NULL,
  trigger_config jsonb DEFAULT '{}',
  condition_config jsonb DEFAULT '{}',
  actions jsonb DEFAULT '[]',

  -- Execution tracking
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  business_id uuid NOT NULL,
  triggered_at timestamptz DEFAULT now(),
  trigger_data jsonb,
  actions_executed jsonb,
  status text DEFAULT 'completed',
  error text
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_manages_workflows" ON workflows;
CREATE POLICY "business_manages_workflows"
ON workflows FOR ALL
USING (
  business_id IN (
    SELECT id FROM business_profiles
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "business_sees_runs" ON workflow_runs;
CREATE POLICY "business_sees_runs"
ON workflow_runs FOR SELECT
USING (
  business_id IN (
    SELECT id FROM business_profiles
    WHERE user_id = auth.uid()
  )
);

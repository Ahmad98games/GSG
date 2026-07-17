-- Migration: 055_noxis_foresight.sql
-- Create business_patterns and foresight_predictions tables

CREATE TABLE IF NOT EXISTS business_patterns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  pattern_type text NOT NULL,
  entity_id text,
  entity_label text,
  pattern_data jsonb NOT NULL,
  confidence_score float DEFAULT 0.0,
  last_calculated_at timestamptz DEFAULT now(),
  next_recalculate_at timestamptz,
  data_points_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, pattern_type, entity_id)
);

CREATE TABLE IF NOT EXISTS foresight_predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL,
  prediction_type text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL,
  predicted_date date,
  confidence float DEFAULT 0.0,
  impact text DEFAULT 'medium',
  status text DEFAULT 'active',
  action_taken boolean DEFAULT false,
  entity_type text,
  entity_id text,
  entity_label text,
  supporting_data jsonb,
  draft_action jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_predictions_business
  ON foresight_predictions(business_id, status, predicted_date);

ALTER TABLE business_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE foresight_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_owns_patterns" ON business_patterns;
CREATE POLICY "business_owns_patterns"
ON business_patterns FOR ALL
USING (
  business_id IN (
    SELECT id FROM business_profiles
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "business_owns_predictions" ON foresight_predictions;
CREATE POLICY "business_owns_predictions"
ON foresight_predictions FOR ALL
USING (
  business_id IN (
    SELECT id FROM business_profiles
    WHERE user_id = auth.uid()
  )
);

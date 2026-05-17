-- Noxis v13.0 — Noxis Lens Migration

CREATE TABLE IF NOT EXISTS lens_scans_incoming (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references business_profiles(id),
  image_data bytea,
  source_node_id text,
  received_at timestamptz default now(),
  processed boolean default false,
  extracted_data jsonb
);

-- RLS
ALTER TABLE lens_scans_incoming ENABLE ROW LEVEL SECURITY;

-- Policy (assuming current_user_business_id() exists as per system pattern)
CREATE POLICY "business_isolation"
  ON lens_scans_incoming FOR ALL
  USING (business_id = (select business_id from profiles where id = auth.uid()));

-- Storage Bucket for Lens Scans
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lens-scans', 'lens-scans', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage
CREATE POLICY "business_storage_isolation"
ON storage.objects FOR ALL
USING (bucket_id = 'lens-scans' AND (storage.foldername(name))[1] = (select business_id::text from profiles where id = auth.uid()));

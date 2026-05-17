-- PART A — Vector Clock on ledger_entries
ALTER TABLE ledger_entries 
ADD COLUMN vector_clock jsonb not null default '{}'::jsonb,
ADD COLUMN device_id text not null default '',
ADD COLUMN local_seq bigint not null default 0;

-- PART B — Conflict detection function
CREATE OR REPLACE FUNCTION detect_sync_conflict(
  p_entry_id uuid,
  p_device_id text,
  p_local_seq bigint,
  p_client_vector_clock jsonb
) RETURNS jsonb AS $$
DECLARE
  existing_seq bigint;
  existing_clock jsonb;
  conflict_type text;
BEGIN
  SELECT local_seq, vector_clock 
  INTO existing_seq, existing_clock
  FROM ledger_entries WHERE id = p_entry_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('conflict', false);
  END IF;
  
  -- Same device, higher seq = safe update
  IF existing_clock->p_device_id = to_jsonb(p_local_seq - 1) THEN
    RETURN jsonb_build_object('conflict', false);
  END IF;
  
  -- Different device concurrent write = conflict
  RETURN jsonb_build_object(
    'conflict', true,
    'conflict_type', 'concurrent_write',
    'server_seq', existing_seq,
    'client_seq', p_local_seq,
    'resolution', 'last_write_wins',
    'winner', CASE WHEN p_local_seq > existing_seq 
                   THEN 'client' ELSE 'server' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART C — Sync audit table
CREATE TABLE sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id),
  table_name text not null,
  record_id uuid not null,
  device_id_a text not null,
  device_id_b text not null,
  seq_a bigint not null,
  seq_b bigint not null,
  resolution text not null,
  winner_device text not null,
  conflict_payload jsonb,
  resolved_at timestamptz not null default now()
);

ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_isolation" ON sync_conflicts
  FOR ALL USING (business_id = current_user_business_id());

CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references business_profiles(id),
  
  -- What changed
  table_name text not null,
  record_id uuid not null,
  action text not null  -- INSERT/UPDATE/DELETE
    check (action in ('INSERT','UPDATE','DELETE')),
  
  -- The change itself
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  
  -- Who and when
  performed_by uuid references auth.users(id),
  performed_by_name text,
  performed_at timestamptz not null default now(),
  
  -- Context
  ip_address text,
  user_agent text,
  notes text
);

CREATE INDEX idx_audit_business_time
  ON audit_trail(business_id, performed_at DESC);
CREATE INDEX idx_audit_record
  ON audit_trail(table_name, record_id);

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_isolation"
  ON audit_trail FOR SELECT
  USING (business_id = (SELECT business_id FROM users WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION log_audit_change()
RETURNS trigger AS $$
DECLARE
  business_id_val uuid;
  changed_fields_arr text[];
BEGIN
  -- Get business_id from the record
  business_id_val := COALESCE(
    NEW.business_id, OLD.business_id
  );
  
  -- Calculate changed fields
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key) INTO changed_fields_arr
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW)->>key !=
      to_jsonb(OLD)->>key;
  END IF;
  
  INSERT INTO audit_trail(
    business_id, table_name, record_id,
    action, old_values, new_values,
    changed_fields, performed_at
  ) VALUES (
    business_id_val,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT'
      THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE'
      THEN to_jsonb(NEW) ELSE NULL END,
    changed_fields_arr,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to critical tables:
DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

DROP TRIGGER IF EXISTS audit_ledger ON ledger_entries;
CREATE TRIGGER audit_ledger
  AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

DROP TRIGGER IF EXISTS audit_skus ON skus;
CREATE TRIGGER audit_skus
  AFTER UPDATE ON skus
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

DROP TRIGGER IF EXISTS audit_karigars ON karigars;
CREATE TRIGGER audit_karigars
  AFTER UPDATE ON karigars
  FOR EACH ROW EXECUTE FUNCTION log_audit_change();

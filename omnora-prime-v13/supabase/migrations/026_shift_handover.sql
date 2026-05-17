-- supabase/migrations/026_shift_handover.sql

CREATE TABLE IF NOT EXISTS shift_handovers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id),
  branch_id uuid references branches(id),
  shift_date date not null default CURRENT_DATE,
  shift_type text not null
    check (shift_type in ('morning','evening','night')),
  supervisor_name text not null,
  submitted_by uuid references auth.users(id),
  
  -- Production summary
  total_units_produced integer not null default 0,
  batches_completed text[],
  batches_in_progress text[],
  
  -- Issues and notes
  issues_encountered text,
  machines_down text,
  materials_shortage text,
  quality_rejections integer default 0,
  
  -- Handover items
  pending_work text,
  materials_needed text,
  next_shift_instructions text,
  
  -- Attendance
  workers_present integer default 0,
  workers_absent integer default 0,
  overtime_workers integer default 0,
  
  status text not null default 'submitted'
    check (status in ('submitted','acknowledged')),
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

ALTER TABLE shift_handovers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_isolation" ON shift_handovers;
CREATE POLICY "business_isolation" ON shift_handovers
  FOR ALL USING (business_id = current_user_business_id());

CREATE INDEX IF NOT EXISTS idx_handover_date_shift
  ON shift_handovers(business_id, shift_date DESC, shift_type);

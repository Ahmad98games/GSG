const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.zgxmvwxzjmpmesqliwxl',
  password: 'noxis2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Fix 2 database table
CREATE TABLE IF NOT EXISTS dispatch_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business_profiles(id),
  invoice_id uuid REFERENCES invoices(id),
  party_id uuid REFERENCES parties(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'packed', 'out_for_delivery', 'delivered', 'returned', 'cancelled'
  )),
  driver_name text,
  vehicle_number text,
  tracking_notes text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dispatch_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_dispatch" ON dispatch_orders;
CREATE POLICY "own_dispatch" ON dispatch_orders FOR ALL USING (business_id = current_user_business_id());

-- Fix 4 database updates
DROP POLICY IF EXISTS "anyone_can_submit" ON testimonials;
CREATE POLICY "anyone_can_submit" ON testimonials FOR INSERT WITH CHECK (true);

ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_status_check;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'private'));

-- Fix 6 database table
CREATE TABLE IF NOT EXISTS karigar_production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business_profiles(id),
  karigar_id uuid NOT NULL REFERENCES karigars(id),
  units_produced numeric NOT NULL DEFAULT 0,
  grade text DEFAULT 'A' CHECK (grade IN ('A','B','C','Rejected')),
  earnings numeric DEFAULT 0,
  wage_type text DEFAULT 'piece_rate',
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE karigar_production_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_production_logs" ON karigar_production_logs;
CREATE POLICY "own_production_logs" ON karigar_production_logs FOR ALL USING (business_id = current_user_business_id());
`;

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected! Executing migration SQL...');
    await client.query(sql);
    console.log('Migration SQL executed successfully!');
    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();

-- Create dispatch_orders table
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

-- Enable Row Level Security (RLS)
ALTER TABLE dispatch_orders ENABLE ROW LEVEL SECURITY;

-- Create own_dispatch RLS policy
DROP POLICY IF EXISTS "own_dispatch" ON dispatch_orders;
CREATE POLICY "own_dispatch" ON dispatch_orders FOR ALL USING (business_id = current_user_business_id());

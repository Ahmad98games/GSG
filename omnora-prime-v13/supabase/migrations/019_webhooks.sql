-- supabase/migrations/019_webhooks.sql

-- Webhook Endpoints
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  secret_hash  TEXT NOT NULL,    -- Argon2 or similar hash of the secret
  events       TEXT[] NOT NULL,  -- e.g., ['invoice.created', 'payment.received']
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Webhook Delivery Log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint_id     UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  response_status INTEGER,
  response_body   TEXT,
  delivered_at    TIMESTAMPTZ DEFAULT now(),
  success         BOOLEAN
);

-- RLS
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_manage_webhooks" ON webhook_endpoints
  FOR ALL USING (business_id = current_user_business_id());

CREATE POLICY "hub_view_webhook_deliveries" ON webhook_deliveries
  FOR SELECT USING (endpoint_id IN (SELECT id FROM webhook_endpoints WHERE business_id = current_user_business_id()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_business ON webhook_endpoints(business_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(delivered_at DESC);


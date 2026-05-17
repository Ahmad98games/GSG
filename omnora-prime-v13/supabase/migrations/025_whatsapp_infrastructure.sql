-- supabase/migrations/025_whatsapp_infrastructure.sql

-- Add WhatsApp configuration to business profiles
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS whatsapp_config jsonb DEFAULT '{
  "daily_summary_enabled": false,
  "owner_phone": null,
  "language": "english",
  "karigar_payslips_enabled": false,
  "sections": {
    "revenue": true,
    "invoices": true,
    "production": true,
    "attendance": true,
    "alerts": true
  }
}'::jsonb;

-- WhatsApp Message Logs
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business_profiles(id),
  recipient_phone text not null,
  message_type text not null,
  message_body text,
  status text not null, -- sent, failed, delivered
  error_message text,
  meta_message_id text,
  created_at timestamptz default now()
);

-- RLS
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_isolation" ON whatsapp_logs;
CREATE POLICY "business_isolation" ON whatsapp_logs
FOR ALL USING (business_id = current_user_business_id());

-- Index for cron performance
CREATE INDEX IF NOT EXISTS idx_business_whatsapp_enabled ON business_profiles ((whatsapp_config->>'daily_summary_enabled')) WHERE (whatsapp_config->>'daily_summary_enabled' = 'true');

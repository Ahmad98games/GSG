-- Store all messages
CREATE TABLE IF NOT EXISTS hub_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,

  -- Who sent it
  sender_type TEXT NOT NULL, -- 'hub' (PC) or 'device' (mobile)
  sender_device_id TEXT,    -- null if sent from PC Hub
  sender_name TEXT NOT NULL, -- "PC Hub" or device label

  -- Who receives it
  recipient_type TEXT NOT NULL, -- 'all' = broadcast to all devices, 'device' = specific device, 'role' = all devices with this role, 'hub' = back to PC Hub
  recipient_device_id TEXT,    -- filled when recipient_type = 'device'
  recipient_role TEXT,         -- filled when recipient_type = 'role'

  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'alert', 'task', 'ack'

  -- Status per recipient
  read_by TEXT[] DEFAULT '{}',

  -- Metadata
  priority TEXT DEFAULT 'normal', -- 'normal', 'urgent'
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Device registry with custom names
ALTER TABLE authorized_devices
  ADD COLUMN IF NOT EXISTS device_label TEXT DEFAULT 'Mobile Device',
  ADD COLUMN IF NOT EXISTS device_role TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Message retention by tier
CREATE OR REPLACE FUNCTION cleanup_old_messages(
  p_business_id UUID,
  p_retention_days INTEGER
)
RETURNS VOID
LANGUAGE SQL
AS $$
  DELETE FROM hub_messages
  WHERE business_id = p_business_id
  AND created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
$$;

-- RLS
ALTER TABLE hub_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "business_owns_messages"
  ON hub_messages FOR ALL
  USING (
    business_id IN (
      SELECT id FROM business_profiles
      WHERE user_id = auth.uid()
    )
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

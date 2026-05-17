-- supabase/migrations/016_payments.sql

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_gateway') THEN
        CREATE TYPE payment_gateway AS ENUM ('jazzcash','easypaisa','bank_transfer','paddle','manual');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_attempt_status') THEN
        CREATE TYPE payment_attempt_status AS ENUM ('initiated','pending','completed','failed','refunded','expired');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS license_payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id        UUID REFERENCES licenses(id),
  gateway           payment_gateway NOT NULL,
  gateway_txn_id    TEXT,              -- JazzCash/EasyPaisa/Paddle transaction reference
  amount_pkr        NUMERIC(12,2),     -- for JazzCash/EasyPaisa
  amount_usd        NUMERIC(10,2),     -- for Paddle
  currency          TEXT NOT NULL DEFAULT 'PKR',
  status            payment_attempt_status NOT NULL DEFAULT 'initiated',
  buyer_phone       TEXT,              -- for JazzCash/EasyPaisa (masked after completion)
  buyer_email       TEXT,
  plan              TEXT NOT NULL CHECK (plan IN ('lite','pro','elite')),
  billing_cycle     TEXT NOT NULL CHECK (billing_cycle IN ('monthly','annual')),
  initiated_at      TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  webhook_payload   JSONB,             -- raw webhook from gateway (for forensics)
  refund_reason     TEXT
);

ALTER TABLE license_payments ENABLE ROW LEVEL SECURITY;
-- No RLS needed for payments — this is admin-only, accessed via service key in Edge Functions

CREATE TABLE IF NOT EXISTS manual_payment_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_name     TEXT NOT NULL,
  buyer_phone    TEXT NOT NULL,
  buyer_email    TEXT NOT NULL,
  plan           TEXT NOT NULL,
  billing_cycle  TEXT NOT NULL,
  amount_pkr     NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,         -- "HBL Transfer", "MCB Transfer", "Cash" etc.
  bank_ref       TEXT,                  -- deposit slip or transaction reference
  screenshot_url TEXT,                  -- Supabase Storage: proof of payment
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  verified_by    TEXT,                  -- admin who verified
  verified_at    TIMESTAMPTZ,
  license_key    TEXT,                  -- generated after verification
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE manual_payment_requests ENABLE ROW LEVEL SECURITY;
-- Admin will access via service role or specific admin policies


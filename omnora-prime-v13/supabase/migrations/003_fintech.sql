-- supabase/migrations/003_fintech.sql

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('asset','liability','equity','revenue','expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_mode') THEN
        CREATE TYPE payment_mode AS ENUM ('cash','bank_transfer','cheque','digital_wallet','credit');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_type') THEN
        CREATE TYPE entry_type AS ENUM ('debit','credit');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM ('draft','issued','partially_paid','paid','cancelled','overdue');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_status') THEN
        CREATE TYPE tx_status AS ENUM ('posted','reversed','pending');
    END IF;
END $$;

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  account_code  TEXT NOT NULL,
  name          TEXT NOT NULL,
  type          account_type NOT NULL,
  parent_id     UUID REFERENCES accounts(id),
  is_system     BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, account_code)
);

-- Parties
CREATE TABLE IF NOT EXISTS parties (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  name          TEXT NOT NULL,
  party_type    TEXT NOT NULL CHECK (party_type IN ('customer','supplier','both')),
  phone         TEXT,
  address       TEXT,
  credit_limit  NUMERIC(15,2) DEFAULT 0,
  credit_days   INTEGER DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  is_blocked    BOOLEAN DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Ledger entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES business_profiles(id),
  tx_ref         TEXT NOT NULL,
  entry_type     entry_type NOT NULL,
  account_id     UUID NOT NULL REFERENCES accounts(id),
  party_id       UUID REFERENCES parties(id),
  amount         NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description    TEXT NOT NULL,
  posted_at      TIMESTAMPTZ DEFAULT now(),
  status         tx_status DEFAULT 'posted',
  reversal_of    UUID REFERENCES ledger_entries(id),
  posted_by      UUID REFERENCES auth.users(id),
  invoice_id     UUID,
  sku_id         UUID REFERENCES skus(id),
  metadata       JSONB
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  invoice_no      TEXT NOT NULL,
  party_id        UUID NOT NULL REFERENCES parties(id),
  status          invoice_status NOT NULL DEFAULT 'draft',
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_pct    NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_pct         NUMERIC(5,2) DEFAULT 0,
  tax_amount      NUMERIC(15,2) DEFAULT 0,
  total           NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount     NUMERIC(15,2) DEFAULT 0,
  balance_due     NUMERIC(15,2) GENERATED ALWAYS AS (total - paid_amount) STORED,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, invoice_no)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sku_id        UUID REFERENCES skus(id),
  description   TEXT NOT NULL,
  qty           NUMERIC(15,4) NOT NULL,
  unit          TEXT NOT NULL,
  unit_price    NUMERIC(15,2) NOT NULL,
  line_total    NUMERIC(15,2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES business_profiles(id),
  invoice_id    UUID REFERENCES invoices(id),
  party_id      UUID NOT NULL REFERENCES parties(id),
  total_amount  NUMERIC(15,2) NOT NULL,
  payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by   UUID REFERENCES auth.users(id),
  notes         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_splits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id  UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  mode        payment_mode NOT NULL,
  amount      NUMERIC(15,2) NOT NULL,
  reference   TEXT
);

-- Production
CREATE TABLE IF NOT EXISTS production_batches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES business_profiles(id),
  batch_no        TEXT NOT NULL,
  output_sku_id   UUID NOT NULL REFERENCES skus(id),
  planned_qty     NUMERIC(15,4) NOT NULL,
  actual_qty      NUMERIC(15,4),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  UNIQUE(business_id, batch_no)
);

CREATE TABLE IF NOT EXISTS batch_cost_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id    UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  cost_type   TEXT NOT NULL CHECK (cost_type IN ('raw_material','labor','overhead','other')),
  description TEXT NOT NULL,
  qty         NUMERIC(15,4),
  unit_cost   NUMERIC(15,2),
  total_cost  NUMERIC(15,2) NOT NULL,
  sku_id      UUID REFERENCES skus(id)
);

-- RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_cost_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_owns_accounts" ON accounts;
CREATE POLICY "business_owns_accounts" ON accounts FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_parties" ON parties;
CREATE POLICY "business_owns_parties" ON parties FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_ledger" ON ledger_entries;
CREATE POLICY "business_owns_ledger" ON ledger_entries FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_invoices" ON invoices;
CREATE POLICY "business_owns_invoices" ON invoices FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_payments" ON payments;
CREATE POLICY "business_owns_payments" ON payments FOR ALL USING (business_id = current_user_business_id());

DROP POLICY IF EXISTS "business_owns_batches" ON production_batches;
CREATE POLICY "business_owns_batches" ON production_batches FOR ALL USING (business_id = current_user_business_id());

-- IMMUTABLE LEDGER GUARD
CREATE OR REPLACE RULE no_update_ledger AS ON UPDATE TO ledger_entries
  WHERE OLD.status = 'posted' DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_ledger AS ON DELETE TO ledger_entries
  WHERE OLD.status = 'posted' DO INSTEAD NOTHING;

-- Auto-update party balance
CREATE OR REPLACE FUNCTION update_party_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.party_id IS NOT NULL THEN
    UPDATE parties SET current_balance = (
      SELECT COALESCE(SUM(CASE WHEN entry_type='debit' THEN amount ELSE -amount END), 0)
      FROM ledger_entries
      WHERE party_id = NEW.party_id AND status = 'posted'
    ) WHERE id = NEW.party_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_party_balance ON ledger_entries;
CREATE TRIGGER trg_party_balance AFTER INSERT ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION update_party_balance();

-- Auto-block party
CREATE OR REPLACE FUNCTION check_credit_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_balance > NEW.credit_limit AND NEW.credit_limit > 0 THEN
    NEW.is_blocked = true;
  ELSE
    NEW.is_blocked = false;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_credit_block ON parties;
CREATE TRIGGER trg_credit_block BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION check_credit_limit();

-- Aging buckets view
CREATE OR REPLACE VIEW receivables_aging AS
SELECT
  p.id AS party_id, p.name, p.current_balance,
  SUM(CASE WHEN i.due_date >= CURRENT_DATE THEN i.balance_due ELSE 0 END) AS current_due,
  SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.due_date >= CURRENT_DATE - 30 THEN i.balance_due ELSE 0 END) AS overdue_30,
  SUM(CASE WHEN i.due_date < CURRENT_DATE - 30 AND i.due_date >= CURRENT_DATE - 60 THEN i.balance_due ELSE 0 END) AS overdue_60,
  SUM(CASE WHEN i.due_date < CURRENT_DATE - 60 THEN i.balance_due ELSE 0 END) AS overdue_60_plus,
  p.business_id
FROM parties p
LEFT JOIN invoices i ON i.party_id = p.id AND i.status NOT IN ('paid','cancelled')
WHERE p.party_type IN ('customer','both')
GROUP BY p.id, p.name, p.current_balance, p.business_id;


-- Noxis v13.0 — Phase 15: Performance Indexing (Resilient)

-- Migration 001 — business_profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'business_profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_bp_region_industry ON business_profiles(region, industry_type);
  END IF;
END $$;

-- Migration 002 — skus, transfer_logs, audit_counts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'skus') THEN
    CREATE INDEX IF NOT EXISTS idx_skus_barcode ON skus(business_id, barcode) WHERE barcode IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_skus_category ON skus(business_id, category) WHERE is_active=true;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transfer_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_transfer_logs_status ON transfer_logs(business_id, status) WHERE status='pending';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_counts') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_counts_variance ON audit_counts(session_id) WHERE physical_qty IS NOT NULL;
  END IF;
END $$;

-- Migration 003 — ledger_entries, invoices, parties, payments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ledger_entries') THEN
    CREATE INDEX IF NOT EXISTS idx_ledger_posted_at ON ledger_entries(business_id, posted_at DESC) WHERE status='posted';
    CREATE INDEX IF NOT EXISTS idx_ledger_account_type ON ledger_entries(account_id, posted_at DESC) WHERE status='posted';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoices') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(business_id, due_date) WHERE status NOT IN ('paid','cancelled');
    CREATE INDEX IF NOT EXISTS idx_invoices_party ON invoices(party_id, issue_date DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'parties') THEN
    CREATE INDEX IF NOT EXISTS idx_parties_balance ON parties(business_id, current_balance DESC) WHERE is_blocked=false;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payments') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_party ON payments(party_id, payment_date DESC);
  END IF;
END $$;

-- Migration 004 — cctv_telemetry, security_audit
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cctv_telemetry') THEN
    CREATE INDEX IF NOT EXISTS idx_telemetry_fault ON cctv_telemetry(node_id, recorded_at DESC) WHERE fault_type IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'security_audit') THEN
    CREATE INDEX IF NOT EXISTS idx_security_audit_unack ON security_audit(business_id, severity)
      WHERE state='active' AND severity='critical';
  END IF;
END $$;

-- Migration 005 — karigar_production_logs, payroll_slips
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'karigar_production_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_prod_logs_date_biz ON karigar_production_logs(business_id, log_date DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payroll_slips') THEN
    CREATE INDEX IF NOT EXISTS idx_slips_status ON payroll_slips(period_id, is_finalized);
  END IF;
END $$;

-- Migration 006c — purchase_orders, grn_line_items
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'purchase_orders') THEN
    CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id, order_date DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'goods_received_notes') THEN
    CREATE INDEX IF NOT EXISTS idx_grn_status ON goods_received_notes(business_id, status) WHERE status='pending';
  END IF;
END $$;

-- Migration 008 — pos_sales, pos_sessions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pos_sales') THEN
    CREATE INDEX IF NOT EXISTS idx_pos_sales_date ON pos_sales(business_id, completed_at DESC) WHERE status='completed';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pos_sessions') THEN
    CREATE INDEX IF NOT EXISTS idx_pos_session_date ON pos_sessions(business_id, opened_at DESC);
  END IF;
END $$;

-- Migration 009 — ai_detection_events
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_detection_events') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_events_recent ON ai_detection_events(business_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_person ON ai_detection_events(node_id, detected_class, created_at DESC)
      WHERE detected_class='person';
  END IF;
END $$;

-- Migration 010 — authorized_devices
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'authorized_devices') THEN
    CREATE INDEX IF NOT EXISTS idx_auth_devices_active ON authorized_devices(license_id) WHERE is_active=true;
  END IF;
END $$;


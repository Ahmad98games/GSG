-- ============================================================================
-- MIGRATION: Optimize Synchronization Engine & Protect Disk IO Budget
-- File: supabase/migrations/20261026000000_optimize_sync_and_disk_io.sql
-- ============================================================================
-- Purpose:
-- Dynamically and safely creates composite B-tree indexes for all sync queries.
-- Uses conditional checks on information_schema.columns to guarantee zero 42703
-- errors regardless of column naming variations (e.g. issue_date vs invoice_date).
-- ============================================================================

DO $$
BEGIN

  -- ── 1. INVOICES ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_invoices_biz_created_sync ON invoices(business_id, created_at ASC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'issue_date') THEN
      CREATE INDEX IF NOT EXISTS idx_invoices_biz_issue_date ON invoices(business_id, issue_date DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_date') THEN
      CREATE INDEX IF NOT EXISTS idx_invoices_biz_invoice_date ON invoices(business_id, invoice_date DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_invoices_biz_status ON invoices(business_id, status);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'updated_at') THEN
      CREATE INDEX IF NOT EXISTS idx_invoices_biz_updated ON invoices(business_id, updated_at DESC);
    END IF;
  END IF;

  -- ── 2. INVOICE ITEMS ─────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'invoice_id') THEN
      CREATE INDEX IF NOT EXISTS idx_invoice_items_inv_id ON invoice_items(invoice_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'business_id') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_invoice_items_biz_created ON invoice_items(business_id, created_at ASC);
      END IF;
    END IF;
  END IF;

  -- ── 3. ATTENDANCE LOGS ───────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_logs' AND column_name = 'log_date') THEN
      CREATE INDEX IF NOT EXISTS idx_attendance_biz_date ON attendance_logs(business_id, log_date ASC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_logs' AND column_name = 'attendance_date') THEN
      CREATE INDEX IF NOT EXISTS idx_attendance_biz_att_date ON attendance_logs(business_id, attendance_date ASC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_logs' AND column_name = 'posted_at') THEN
      CREATE INDEX IF NOT EXISTS idx_attendance_biz_posted ON attendance_logs(business_id, posted_at ASC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_logs' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_attendance_biz_created ON attendance_logs(business_id, created_at ASC);
    END IF;
  END IF;

  -- ── 4. PRODUCTION LOGS ───────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'karigar_production_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karigar_production_logs' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_prod_logs_biz_created_sync ON karigar_production_logs(business_id, created_at ASC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karigar_production_logs' AND column_name = 'log_date') THEN
      CREATE INDEX IF NOT EXISTS idx_prod_logs_biz_date_sync ON karigar_production_logs(business_id, log_date DESC);
    END IF;
  END IF;

  -- ── 5. ADVANCES & PESHGI ─────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'karigar_advances') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karigar_advances' AND column_name = 'advance_date') THEN
      CREATE INDEX IF NOT EXISTS idx_advances_biz_date_sync ON karigar_advances(business_id, advance_date ASC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karigar_advances' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_advances_biz_created_sync ON karigar_advances(business_id, created_at ASC);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'peshgi_transactions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'peshgi_transactions' AND column_name = 'given_date') THEN
      CREATE INDEX IF NOT EXISTS idx_peshgi_biz_given_sync ON peshgi_transactions(business_id, given_date ASC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'peshgi_transactions' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_peshgi_biz_created_sync ON peshgi_transactions(business_id, created_at ASC);
    END IF;
  END IF;

  -- ── 6. PAYMENTS ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_date') THEN
      CREATE INDEX IF NOT EXISTS idx_payments_biz_date_sync ON payments(business_id, payment_date ASC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_payments_biz_created_sync ON payments(business_id, created_at ASC);
    END IF;
  END IF;

  -- ── 7. LEDGER ENTRIES ────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ledger_entries') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_entries' AND column_name = 'posted_at') THEN
      CREATE INDEX IF NOT EXISTS idx_ledger_biz_posted_sync ON ledger_entries(business_id, posted_at DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_entries' AND column_name = 'entry_date') THEN
      CREATE INDEX IF NOT EXISTS idx_ledger_biz_entry_sync ON ledger_entries(business_id, entry_date DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_entries' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_ledger_biz_created_sync ON ledger_entries(business_id, created_at DESC);
    END IF;
  END IF;

  -- ── 8. PARTIES ───────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parties') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parties' AND column_name = 'updated_at') THEN
      CREATE INDEX IF NOT EXISTS idx_parties_biz_updated_sync ON parties(business_id, updated_at DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parties' AND column_name = 'is_blocked') THEN
      CREATE INDEX IF NOT EXISTS idx_parties_biz_blocked_sync ON parties(business_id, is_blocked);
    END IF;
  END IF;

  -- ── 9. INVENTORY (SKUs) ──────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'skus') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'skus' AND column_name = 'updated_at') THEN
      CREATE INDEX IF NOT EXISTS idx_skus_biz_updated_sync ON skus(business_id, updated_at DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'skus' AND column_name = 'qty_on_hand') THEN
      CREATE INDEX IF NOT EXISTS idx_skus_biz_stock_sync ON skus(business_id, qty_on_hand);
    END IF;
  END IF;

  -- ── 10. SCAN HISTORY & HUB SYNC LOG ──────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_history') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scan_history' AND column_name = 'scanned_at') THEN
      CREATE INDEX IF NOT EXISTS idx_scan_history_biz_scanned_sync ON scan_history(business_id, scanned_at ASC);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hub_sync_log') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hub_sync_log' AND column_name = 'last_sync_at') THEN
      CREATE INDEX IF NOT EXISTS idx_hub_sync_log_biz_last_sync ON hub_sync_log(business_id, last_sync_at DESC);
    END IF;
  END IF;

END $$;

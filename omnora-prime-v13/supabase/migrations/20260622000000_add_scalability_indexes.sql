-- Every table query filters by business_id first — these indexes
-- make those queries instant even with millions of rows.

CREATE INDEX IF NOT EXISTS idx_invoices_business_id
  ON invoices(business_id);

CREATE INDEX IF NOT EXISTS idx_invoices_business_created
  ON invoices(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id
  ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_karigars_business_id
  ON karigars(business_id);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_business_date
  ON attendance_logs(business_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_production_logs_business_id
  ON karigar_production_logs(business_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_business_id
  ON ledger_entries(business_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_parties_business_id
  ON parties(business_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_orders_business_id
  ON dispatch_orders(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_skus_business_id
  ON skus(business_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_business_id
  ON purchase_orders(business_id, created_at DESC);

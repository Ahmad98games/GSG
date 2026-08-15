"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOXIS_SCHEMA = void 0;
exports.NOXIS_SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -65536;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;
PRAGMA foreign_keys = ON;

-- CORE BUSINESS
CREATE TABLE IF NOT EXISTS business_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  industry TEXT DEFAULT 'general',
  base_currency TEXT DEFAULT 'PKR',
  tax_system TEXT DEFAULT 'GST',
  tax_rate REAL DEFAULT 17.0,
  country_code TEXT DEFAULT 'PK',
  ntn_number TEXT,
  strn_number TEXT,
  trn_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  logo_url TEXT,
  stamp_image TEXT,
  signature_image TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_title TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_counter INTEGER DEFAULT 1,
  po_prefix TEXT DEFAULT 'PO',
  po_counter INTEGER DEFAULT 1,
  dc_prefix TEXT DEFAULT 'DC',
  dc_counter INTEGER DEFAULT 1,
  language TEXT DEFAULT 'en',
  opening_balances_entered INTEGER DEFAULT 0,
  fiscal_year_start TEXT DEFAULT '01-01',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- PARTIES
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  party_type TEXT DEFAULT 'customer',
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  opening_balance REAL DEFAULT 0,
  balance_nature TEXT DEFAULT 'receivable',
  current_balance REAL DEFAULT 0,
  credit_limit REAL DEFAULT 0,
  credit_terms_days INTEGER DEFAULT 0,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_parties_business ON parties(business_id);
CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(business_id, party_type);

-- KARIGARS
CREATE TABLE IF NOT EXISTS karigars (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  karigar_code TEXT,
  phone TEXT,
  cnic TEXT,
  address TEXT,
  department TEXT,
  designation TEXT DEFAULT 'Karigar',
  wage_type TEXT DEFAULT 'piece_rate',
  piece_rate REAL DEFAULT 0,
  daily_wage REAL DEFAULT 0,
  monthly_salary REAL DEFAULT 0,
  joining_date TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  eobi_number TEXT,
  blood_group TEXT,
  emergency_contact TEXT,
  peshgi_balance REAL DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_karigars_business ON karigars(business_id);
CREATE INDEX IF NOT EXISTS idx_karigars_status ON karigars(business_id, status);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  karigar_id TEXT NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
  attendance_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('present','absent','half')),
  check_in_time TEXT,
  check_out_time TEXT,
  marked_by TEXT,
  device_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(karigar_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_business_date ON attendance_logs(business_id, attendance_date);

-- PRODUCTION
CREATE TABLE IF NOT EXISTS karigar_production_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  karigar_id TEXT NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  units_produced REAL DEFAULT 0,
  grade TEXT DEFAULT 'A' CHECK(grade IN ('A','B','C','Rejected')),
  earnings REAL DEFAULT 0,
  bom_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_production_business_date ON karigar_production_logs(business_id, log_date);

-- PESHGI (ADVANCE)
CREATE TABLE IF NOT EXISTS peshgi_transactions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  karigar_id TEXT NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('advance','deduction','adjustment')),
  amount REAL NOT NULL,
  transaction_date TEXT NOT NULL,
  description TEXT,
  reference TEXT,
  running_balance REAL DEFAULT 0,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_peshgi_karigar ON peshgi_transactions(karigar_id);

-- SKUs / INVENTORY
CREATE TABLE IF NOT EXISTS skus (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku_code TEXT,
  barcode TEXT,
  category TEXT,
  unit TEXT DEFAULT 'Piece',
  cost_price REAL DEFAULT 0,
  sale_price REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  qty_on_hand REAL DEFAULT 0,
  reorder_level REAL DEFAULT 0,
  expiry_date TEXT,
  batch_number TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_skus_business ON skus(business_id);
CREATE INDEX IF NOT EXISTS idx_skus_barcode ON skus(business_id, barcode) WHERE barcode IS NOT NULL;

-- STOCK ADJUSTMENTS
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK(adjustment_type IN ('increase','decrease','write_off','correction','found')),
  quantity REAL NOT NULL,
  reason TEXT,
  reference TEXT,
  adjusted_by TEXT,
  adjustment_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT DEFAULT 'invoice' CHECK(invoice_type IN ('invoice','proforma','return','credit_note','recurring')),
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  party_name TEXT,
  party_phone TEXT,
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','posted','paid','partial','overdue','void')),
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  amount_paid REAL DEFAULT 0,
  balance_due REAL DEFAULT 0,
  invoice_currency TEXT DEFAULT 'PKR',
  exchange_rate REAL DEFAULT 1.0,
  notes TEXT,
  footer_message TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(business_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_party ON invoices(business_id, party_id);

-- INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  sku_id TEXT REFERENCES skus(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'Piece',
  unit_price REAL NOT NULL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_price REAL NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  payment_type TEXT DEFAULT 'received' CHECK(payment_type IN ('received','made','refund')),
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash','bank','jazzcash','easypaisa','cheque','other')),
  reference TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_party ON payments(business_id, party_id);

-- LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  account_code TEXT,
  entry_type TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  description TEXT,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  reference TEXT,
  source_table TEXT,
  source_id TEXT,
  created_by TEXT,
  created_by_role TEXT,
  device_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ledger_business ON ledger_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_ledger_party ON ledger_entries(business_id, party_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_entries(business_id, entry_date);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  expense_date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  reference TEXT,
  receipt_url TEXT,
  is_recurring INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_business_date ON expenses(business_id, expense_date);

-- PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  supplier_name TEXT,
  order_date TEXT NOT NULL,
  expected_date TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','partial','complete','cancelled')),
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  received_amount REAL DEFAULT 0,
  balance_amount REAL DEFAULT 0,
  supplier_invoice_number TEXT,
  supplier_invoice_date TEXT,
  three_way_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  sku_id TEXT REFERENCES skus(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  ordered_qty REAL NOT NULL DEFAULT 0,
  received_qty REAL DEFAULT 0,
  unit TEXT DEFAULT 'Piece',
  unit_price REAL DEFAULT 0,
  total_price REAL DEFAULT 0
);

-- GRN (GOODS RECEIVED NOTES)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  po_id TEXT REFERENCES purchase_orders(id) ON DELETE SET NULL,
  grn_number TEXT NOT NULL,
  received_date TEXT NOT NULL,
  supplier_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT DEFAULT 'complete',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS grn_items (
  id TEXT PRIMARY KEY,
  grn_id TEXT NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
  po_item_id TEXT REFERENCES purchase_order_items(id) ON DELETE SET NULL,
  sku_id TEXT REFERENCES skus(id) ON DELETE SET NULL,
  description TEXT,
  received_qty REAL NOT NULL DEFAULT 0,
  accepted_qty REAL DEFAULT 0,
  rejected_qty REAL DEFAULT 0,
  unit TEXT DEFAULT 'Piece',
  unit_price REAL DEFAULT 0,
  total_price REAL DEFAULT 0
);

-- DISPATCH
CREATE TABLE IF NOT EXISTS dispatch_orders (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  dispatch_number TEXT NOT NULL,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  party_name TEXT,
  delivery_address TEXT,
  vehicle_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  dispatch_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','dispatched','in_transit','delivered','returned')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dispatch_items (
  id TEXT PRIMARY KEY,
  dispatch_id TEXT NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
  sku_id TEXT REFERENCES skus(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'Piece'
);

-- BILL OF MATERIALS
CREATE TABLE IF NOT EXISTS bills_of_materials (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  finished_good_sku_id TEXT NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
  name TEXT,
  version INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bom_components (
  id TEXT PRIMARY KEY,
  bom_id TEXT NOT NULL REFERENCES bills_of_materials(id) ON DELETE CASCADE,
  component_sku_id TEXT NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
  quantity REAL NOT NULL,
  unit TEXT,
  wastage_percent REAL DEFAULT 0,
  notes TEXT
);

-- PAYROLL
CREATE TABLE IF NOT EXISTS payroll_runs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  total_wages REAL DEFAULT 0,
  total_peshgi_deductions REAL DEFAULT 0,
  total_other_deductions REAL DEFAULT 0,
  total_eobi REAL DEFAULT 0,
  net_payable REAL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','posted')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payroll_run_items (
  id TEXT PRIMARY KEY,
  payroll_run_id TEXT NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  karigar_id TEXT NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
  present_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  half_days INTEGER DEFAULT 0,
  units_produced REAL DEFAULT 0,
  gross_wages REAL DEFAULT 0,
  overtime_amount REAL DEFAULT 0,
  peshgi_deduction REAL DEFAULT 0,
  loan_deduction REAL DEFAULT 0,
  absent_deduction REAL DEFAULT 0,
  eobi_deduction REAL DEFAULT 0,
  net_payable REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending'
);

-- CCTV
CREATE TABLE IF NOT EXISTS cctv_cameras (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  port INTEGER DEFAULT 554,
  username TEXT,
  password TEXT,
  stream_path TEXT,
  protocol TEXT DEFAULT 'rtsp',
  is_active INTEGER DEFAULT 1,
  location TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cctv_events (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  camera_id TEXT NOT NULL REFERENCES cctv_cameras(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_timestamp TEXT NOT NULL,
  clip_path TEXT,
  thumbnail_path TEXT,
  acknowledged INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- MESSAGING
CREATE TABLE IF NOT EXISTS hub_messages (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('hub','device')),
  sender_device_id TEXT,
  sender_name TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK(recipient_type IN ('all','device','role','hub')),
  recipient_device_id TEXT,
  recipient_role TEXT,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('normal','urgent')),
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_business ON hub_messages(business_id, created_at DESC);

-- AUTHORIZED DEVICES
CREATE TABLE IF NOT EXISTS authorized_devices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_label TEXT DEFAULT 'Mobile Device',
  device_role TEXT DEFAULT 'general',
  platform TEXT,
  last_seen TEXT,
  is_active INTEGER DEFAULT 1,
  paired_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_id, device_id)
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values TEXT,
  new_values TEXT,
  user_id TEXT,
  user_role TEXT,
  device_id TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_business ON audit_logs(business_id, created_at DESC);

-- OPENING BALANCES
CREATE TABLE IF NOT EXISTS opening_balances (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  balance_date TEXT NOT NULL,
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  party_balance_type TEXT,
  party_amount REAL DEFAULT 0,
  cash_in_hand REAL DEFAULT 0,
  bank_balance REAL DEFAULT 0,
  bank_name TEXT,
  stock_value REAL DEFAULT 0,
  fixed_assets REAL DEFAULT 0,
  loans_payable REAL DEFAULT 0,
  posted INTEGER DEFAULT 0,
  posted_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- WORKFLOWS
CREATE TABLE IF NOT EXISTS workflow_rules (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_conditions TEXT,
  action_type TEXT NOT NULL,
  action_config TEXT,
  is_active INTEGER DEFAULT 1,
  last_triggered TEXT,
  trigger_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- FORESIGHT PREDICTIONS
CREATE TABLE IF NOT EXISTS foresight_predictions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence REAL DEFAULT 0,
  predicted_value REAL,
  impact TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  action_route TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- CRM / SALES PIPELINE
CREATE TABLE IF NOT EXISTS crm_leads (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  stage TEXT DEFAULT 'prospect' CHECK(stage IN ('prospect','contacted','qualified','proposal','negotiation','won','lost')),
  deal_value REAL DEFAULT 0,
  expected_close_date TEXT,
  notes TEXT,
  converted_party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  assigned_to TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- BANK RECONCILIATION
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  bank_account TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  statement_closing_balance REAL,
  ledger_closing_balance REAL,
  difference REAL,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','closed')),
  closed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bank_statement_items (
  id TEXT PRIMARY KEY,
  reconciliation_id TEXT NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
  transaction_date TEXT NOT NULL,
  description TEXT,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  matched_ledger_entry_id TEXT,
  is_matched INTEGER DEFAULT 0
);

-- PORTAL SESSIONS
CREATE TABLE IF NOT EXISTS portal_sessions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed TEXT,
  is_revoked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- RECURRING INVOICES
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  template_invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK(frequency IN ('weekly','monthly','quarterly','annually')),
  day_of_month INTEGER,
  next_run_date TEXT NOT NULL,
  last_run_date TEXT,
  total_runs INTEGER DEFAULT 0,
  max_runs INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','completed')),
  auto_post INTEGER DEFAULT 0,
  auto_send_whatsapp INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- HUB SYNC LOG
CREATE TABLE IF NOT EXISTS hub_sync_log (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  device_id TEXT,
  last_sync_at TEXT DEFAULT (datetime('now')),
  rows_pulled INTEGER DEFAULT 0,
  sync_duration_ms INTEGER DEFAULT 0
);

-- WEIGHT ENTRIES (Rice Mill)
CREATE TABLE IF NOT EXISTS weight_entries (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK(entry_type IN ('intake','output')),
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  sku_id TEXT REFERENCES skus(id) ON DELETE SET NULL,
  tare_weight REAL DEFAULT 0,
  gross_weight REAL DEFAULT 0,
  net_weight REAL DEFAULT 0,
  weight_unit TEXT DEFAULT 'kg',
  moisture_content REAL,
  vehicle_number TEXT,
  entry_date TEXT NOT NULL,
  linked_invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- MESSAGING SENT LOG (WhatsApp)
CREATE TABLE IF NOT EXISTS whatsapp_sent_log (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  recipient_phone TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message_text TEXT,
  sent_at TEXT DEFAULT (datetime('now')),
  reference_id TEXT,
  reference_type TEXT
);
`;

-- Extend business_profiles (Phase 1) with persona fields
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'south_asian'
    CHECK (region IN ('south_asian','international')),
  ADD COLUMN IF NOT EXISTS country_code CHAR(2) DEFAULT 'PK',  -- ISO 3166-1 alpha-2
  ADD COLUMN IF NOT EXISTS tax_label TEXT DEFAULT 'GST',       -- GST / VAT / Sales Tax
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 17.00,
  ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 7, -- month number (7 = July for PK)
  ADD COLUMN IF NOT EXISTS gdpr_mode BOOLEAN DEFAULT false,     -- true for EU/UK
  ADD COLUMN IF NOT EXISTS worker_term TEXT DEFAULT 'Karigar',  -- how this business calls workers
  ADD COLUMN IF NOT EXISTS stock_unit_primary TEXT DEFAULT 'meter',
  ADD COLUMN IF NOT EXISTS persona_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS industry_key TEXT; -- reference to industry_personas.industry_key

-- Industry persona configurations (one row per industry, shared reference data)
CREATE TABLE IF NOT EXISTS industry_personas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_key        TEXT UNIQUE NOT NULL,  -- 'textile_sa','medical_intl','auto_sa' etc.
  region              TEXT NOT NULL CHECK (region IN ('south_asian','international')),
  industry_type       TEXT NOT NULL,
  display_name_sa     TEXT NOT NULL,   -- South Asian display name (e.g., "Kapra — Textile")
  display_name_intl   TEXT NOT NULL,   -- International display name (e.g., "Textile Manufacturing")
  worker_term_sa      TEXT NOT NULL,   -- "Karigar"
  worker_term_intl    TEXT NOT NULL,   -- "Operative"
  stock_primary_unit  TEXT NOT NULL,   -- "meter","kg","unit","sqft","carton"
  currency_hint       TEXT NOT NULL,   -- "PKR","USD","GBP","AED","EUR"
  tax_label           TEXT NOT NULL,   -- "GST","VAT","Sales Tax"
  default_tax_rate    NUMERIC(5,2),
  dashboard_widgets   TEXT[] NOT NULL, -- ordered list of widget keys
  nav_items           TEXT[] NOT NULL, -- ordered list of nav keys
  hidden_features     TEXT[] NOT NULL, -- features to completely hide
  terminology         JSONB NOT NULL,  -- all label overrides as key:value pairs
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on industry_personas
ALTER TABLE industry_personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_can_read_personas" ON industry_personas;
CREATE POLICY "anyone_can_read_personas" ON industry_personas FOR SELECT USING (true);

-- Pre-populate all personas

-- SOUTH ASIAN PERSONAS

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'textile_sa', 'south_asian', 'textile',
  'Kapra — Textile',
  'Textile Manufacturing',
  'Karigar', 'Operative',
  'meter', 'PKR', 'GST', 17.00,
  ARRAY['today_production','stock_value','outstanding_khata','karigar_count','low_stock','pending_transfers'],
  ARRAY['dashboard','stock','khata','production','karigars','dispatch','reports','settings'],
  ARRAY['gdpr_export','edi_integration','upc_barcode'],
  '{
    "worker": "Karigar", "workers": "Karigars", "stock_unit": "Meter",
    "ledger": "Khata", "party": "Party", "supplier": "Supplier",
    "customer": "Customer", "production_order": "Order", "batch": "Lot",
    "warehouse": "Godown", "dispatch": "Dispatch", "invoice": "Bill",
    "payment": "Payment", "advance": "Peshgi", "salary": "Takhwah",
    "attendance": "Hazri", "quality": "Quality", "reject": "Fail",
    "shift": "Shift", "overtime": "Extra Time", "nav_dashboard": "Dashboard",
    "nav_stock": "Stock", "nav_ledger": "Khata", "nav_production": "Production",
    "nav_workers": "Karigars", "nav_dispatch": "Dispatch", "nav_reports": "Reports", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'leather_sa', 'south_asian', 'leather',
  'Chamra — Leather Tannery',
  'Leather Manufacturing',
  'Karigar', 'Operative',
  'sqft', 'PKR', 'GST', 17.00,
  ARRAY['today_production','raw_hide_stock','export_orders','karigar_count','chemical_stock','quality_rejects'],
  ARRAY['dashboard','stock','khata','production','karigars','export','reports','settings'],
  ARRAY['gdpr_export','edi_integration'],
  '{
    "worker": "Karigar", "stock_unit": "Square Feet", "ledger": "Khata",
    "batch": "Hide Batch", "warehouse": "Godown", "invoice": "Bill",
    "raw_material": "Raw Hide", "production_order": "Tanning Order",
    "quality": "Hide Grade", "reject": "Defective Hide",
    "nav_dashboard": "Dashboard", "nav_stock": "Stock", "nav_ledger": "Khata",
    "nav_production": "Production", "nav_workers": "Karigars", "nav_export": "Export",
    "nav_reports": "Reports", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'medical_sa', 'south_asian', 'medical',
  'Medical — Dawa Pharma',
  'Pharmaceutical Distribution',
  'Staff', 'Staff',
  'unit', 'PKR', 'GST', 0.00,
  ARRAY['expiry_alerts','stock_value','today_sales','pending_orders','low_stock','batch_recalls'],
  ARRAY['dashboard','stock','khata','sales','expiry','reports','settings'],
  ARRAY['karigar_payroll','production_batches','loom_tracking'],
  '{
    "worker": "Staff", "stock_unit": "Unit", "ledger": "Khata",
    "batch": "Batch No", "invoice": "Invoice", "warehouse": "Store",
    "product": "Medicine", "expiry": "Expiry Date", "supplier": "Supplier",
    "customer": "Retailer", "dispatch": "Dispatch",
    "nav_dashboard": "Dashboard", "nav_stock": "Stock", "nav_ledger": "Khata",
    "nav_sales": "Sales", "nav_expiry": "Expiry", "nav_reports": "Reports", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'auto_sa', 'south_asian', 'auto',
  'Auto Parts — Manufacturing',
  'Auto Parts Manufacturing',
  'Karigar', 'Operative',
  'unit', 'PKR', 'GST', 17.00,
  ARRAY['today_production','parts_stock','dealer_outstanding','karigar_count','assembly_orders','quality_rejects'],
  ARRAY['dashboard','stock','khata','production','karigars','dealers','reports','settings'],
  ARRAY['gdpr_export','edi_integration'],
  '{
    "worker": "Karigar", "stock_unit": "Unit", "ledger": "Khata",
    "batch": "Assembly Batch", "warehouse": "Parts Store",
    "product": "Part", "customer": "Dealer", "invoice": "Bill",
    "production_order": "Assembly Order", "quality": "QC Check",
    "nav_dashboard": "Dashboard", "nav_stock": "Stock", "nav_ledger": "Khata",
    "nav_production": "Production", "nav_workers": "Karigars", "nav_dealers": "Dealers",
    "nav_reports": "Reports", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'rice_sa', 'south_asian', 'rice_mill',
  'Chawal — Rice Mill',
  'Rice Processing Mill',
  'Karigar', 'Worker',
  'kg', 'PKR', 'GST', 0.00,
  ARRAY['paddy_intake','milled_stock','daily_output','mandi_rate','karigar_count','bag_inventory'],
  ARRAY['dashboard','stock','khata','production','karigars','mandi','reports','settings'],
  ARRAY['gdpr_export','edi_integration','loom_tracking'],
  '{
    "worker": "Karigar", "stock_unit": "KG", "ledger": "Khata",
    "raw_material": "Paddy", "product": "Rice", "batch": "Mill Run",
    "warehouse": "Godown", "customer": "Buyer", "supplier": "Farmer",
    "invoice": "Bill", "production_order": "Milling Order",
    "nav_dashboard": "Dashboard", "nav_stock": "Stock", "nav_ledger": "Khata",
    "nav_production": "Production", "nav_workers": "Karigars", "nav_mandi": "Mandi",
    "nav_reports": "Reports", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'kiryana_sa', 'south_asian', 'wholesale',
  'Kiryana — Wholesale',
  'Wholesale Distribution',
  'Staff', 'Staff',
  'carton', 'PKR', 'GST', 17.00,
  ARRAY['today_sales','credit_outstanding','stock_value','low_stock','pending_deliveries','cash_balance'],
  ARRAY['dashboard','stock','khata','sales','purchase','reports','settings'],
  ARRAY['karigar_payroll','production_batches','loom_tracking'],
  '{
    "worker": "Staff", "stock_unit": "Carton", "ledger": "Khata",
    "customer": "Retailer", "supplier": "Company", "invoice": "Bill",
    "warehouse": "Godown", "credit": "Udhaar", "payment": "Payment",
    "nav_dashboard": "Dashboard", "nav_stock": "Stock", "nav_ledger": "Khata",
    "nav_sales": "Sales", "nav_purchase": "Purchase", "nav_reports": "Reports", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'marble_sa', 'south_asian', 'marble',
  'Marble — Stone Factory',
  'Marble & Stone Processing',
  'Karigar', 'Operative',
  'sqft', 'PKR', 'GST', 17.00,
  ARRAY['today_production','slab_inventory','export_orders','karigar_count','machine_status','quality_grades'],
  ARRAY['dashboard','stock','khata','production','karigars','export','reports','settings'],
  ARRAY['gdpr_export','edi_integration'],
  '{
    "worker": "Karigar", "stock_unit": "Square Feet", "ledger": "Khata",
    "batch": "Slab Batch", "product": "Slab", "warehouse": "Yard",
    "raw_material": "Block", "customer": "Buyer", "invoice": "Bill",
    "nav_dashboard": "Dashboard", "nav_stock": "Stock", "nav_ledger": "Khata",
    "nav_production": "Production", "nav_workers": "Karigars", "nav_export": "Export",
    "nav_reports": "Reports", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

-- INTERNATIONAL PERSONAS

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'warehouse_intl', 'international', 'smart_warehouse',
  'Smart Warehousing',
  'Smart Warehousing',
  'Operative', 'Operative',
  'unit', 'USD', 'Sales Tax', 8.00,
  ARRAY['fulfillment_rate','inventory_accuracy','orders_today','workforce_count','slippage_rate','throughput'],
  ARRAY['dashboard','inventory','ledger','fulfillment','workforce','analytics','compliance','settings'],
  ARRAY['karigar_payroll','khata_ledger','peshgi_system','roman_urdu'],
  '{
    "worker": "Operative", "workers": "Operatives", "stock_unit": "Unit",
    "ledger": "Ledger", "party": "Account", "supplier": "Vendor",
    "customer": "Client", "production_order": "Work Order", "batch": "Batch",
    "warehouse": "Warehouse", "dispatch": "Shipment", "invoice": "Invoice",
    "payment": "Payment", "advance": "Advance", "salary": "Salary",
    "attendance": "Attendance", "quality": "QC", "reject": "Non-Conformance",
    "nav_dashboard": "Dashboard", "nav_inventory": "Inventory", "nav_ledger": "Ledger",
    "nav_fulfillment": "Fulfillment", "nav_workforce": "Workforce", "nav_analytics": "Analytics",
    "nav_compliance": "Compliance", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'pharma_intl', 'international', 'pharma',
  'Pharmaceutical Lab',
  'Pharmaceutical Lab',
  'Staff', 'Staff',
  'unit', 'USD', 'Sales Tax', 0.00,
  ARRAY['expiry_alerts','batch_compliance','today_dispatch','cold_chain_status','recall_risk','fda_pending'],
  ARRAY['dashboard','inventory','ledger','compliance','batches','cold_chain','audit','settings'],
  ARRAY['karigar_payroll','khata_ledger','peshgi_system','roman_urdu','loom_tracking'],
  '{
    "worker": "Staff", "stock_unit": "Unit", "ledger": "Ledger",
    "batch": "Batch Number", "product": "Drug / Device",
    "warehouse": "Controlled Store", "customer": "Distributor",
    "supplier": "API Supplier", "invoice": "Invoice",
    "quality": "GMP Check", "reject": "Non-Conforming Unit",
    "nav_dashboard": "Dashboard", "nav_inventory": "Inventory", "nav_ledger": "Ledger",
    "nav_compliance": "Compliance", "nav_batches": "Batches", "nav_cold_chain": "Cold Chain",
    "nav_audit": "Audit", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'logistics_intl', 'international', 'logistics',
  '3PL Logistics',
  '3PL Logistics Provider',
  'Handler', 'Handler',
  'unit', 'USD', 'VAT', 20.00,
  ARRAY['shipments_today','sla_compliance','revenue_today','workforce_count','exceptions','fleet_status'],
  ARRAY['dashboard','inventory','ledger','shipments','workforce','fleet','analytics','settings'],
  ARRAY['karigar_payroll','khata_ledger','peshgi_system','roman_urdu'],
  '{
    "worker": "Handler", "stock_unit": "Package",
    "ledger": "Ledger", "customer": "Client", "supplier": "Carrier",
    "invoice": "Invoice", "batch": "Shipment", "warehouse": "Depot",
    "dispatch": "Dispatch", "production_order": "Freight Order",
    "nav_dashboard": "Dashboard", "nav_inventory": "Inventory", "nav_ledger": "Ledger",
    "nav_shipments": "Shipments", "nav_workforce": "Workforce", "nav_fleet": "Fleet",
    "nav_analytics": "Analytics", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'fashion_intl', 'international', 'fashion',
  'Boutique Fashion House',
  'Boutique Fashion House',
  'Artisan', 'Artisan',
  'unit', 'GBP', 'VAT', 20.00,
  ARRAY['season_orders','fabric_stock','production_status','designer_workload','quality_pass_rate','sample_pipeline'],
  ARRAY['dashboard','inventory','ledger','production','artisans','samples','analytics','settings'],
  ARRAY['karigar_payroll','roman_urdu','peshgi_system'],
  '{
    "worker": "Artisan", "stock_unit": "Piece", "ledger": "Ledger",
    "batch": "Season Run", "product": "Garment", "warehouse": "Studio Store",
    "customer": "Buyer", "supplier": "Fabric Supplier", "invoice": "Invoice",
    "nav_dashboard": "Dashboard", "nav_inventory": "Inventory", "nav_ledger": "Ledger",
    "nav_production": "Production", "nav_artisans": "Artisans", "nav_samples": "Samples",
    "nav_analytics": "Analytics", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;

INSERT INTO industry_personas (industry_key, region, industry_type, display_name_sa, display_name_intl, worker_term_sa, worker_term_intl, stock_primary_unit, currency_hint, tax_label, default_tax_rate, dashboard_widgets, nav_items, hidden_features, terminology)
VALUES (
  'cloud_kitchen_intl', 'international', 'cloud_kitchen',
  'Cloud Kitchen Chain',
  'Cloud Kitchen Chain',
  'Staff', 'Staff',
  'portion', 'USD', 'Sales Tax', 8.875,
  ARRAY['orders_live','revenue_today','food_cost_pct','waste_rate','delivery_sla','location_performance'],
  ARRAY['dashboard','inventory','ledger','menu','orders','workforce','analytics','settings'],
  ARRAY['karigar_payroll','loom_tracking','peshgi_system','roman_urdu'],
  '{
    "worker": "Staff", "stock_unit": "Portion / KG", "ledger": "Ledger",
    "batch": "Recipe Batch", "product": "Menu Item",
    "warehouse": "Kitchen Store", "customer": "Customer",
    "supplier": "Food Vendor", "invoice": "Invoice",
    "nav_dashboard": "Dashboard", "nav_inventory": "Inventory", "nav_ledger": "Ledger",
    "nav_menu": "Menu", "nav_orders": "Orders", "nav_workforce": "Workforce",
    "nav_analytics": "Analytics", "nav_settings": "Settings"
  }'::JSONB
) ON CONFLICT (industry_key) DO NOTHING;


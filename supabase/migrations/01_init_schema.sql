-- 1. Parties & Financials
CREATE TYPE party_type AS ENUM ('supplier', 'customer', 'karigar', 'internal');

CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type party_type NOT NULL,
    phone TEXT,
    address TEXT,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type ENUM('debit', 'credit') NOT NULL,
    category TEXT NOT NULL, -- e.g., 'invoice', 'payment', 'advance'
    reference_id UUID, -- Link to invoices or payments
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sourcing & Inventory
CREATE TABLE raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'fabric', 'thread', 'accessory'
    uom TEXT NOT NULL, -- 'meters', 'kg', 'units'
    current_stock DECIMAL(15, 3) DEFAULT 0.000,
    min_threshold DECIMAL(15, 3) DEFAULT 0.000,
    avg_cost DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Manufacturing Engine
CREATE TABLE designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    base_cost DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consumption_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
    quantity_per_unit DECIMAL(15, 4) NOT NULL,
    wastage_percent DECIMAL(5, 2) DEFAULT 0.00,
    UNIQUE(design_id, material_id)
);

CREATE TABLE job_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID REFERENCES designs(id),
    total_quantity INTEGER NOT NULL,
    finished_quantity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'ongoing', 'completed', 'cancelled'
    priority TEXT DEFAULT 'normal',
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE karigar_chalans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_order_id UUID REFERENCES job_orders(id) ON DELETE CASCADE,
    karigar_id UUID REFERENCES parties(id),
    chalan_type TEXT NOT NULL, -- 'issue_raw', 'receive_finished', 'return_raw'
    status TEXT DEFAULT 'open', -- 'open', 'finalized'
    metadata JSONB, -- For batch-specific data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chalan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chalan_id UUID REFERENCES karigar_chalans(id) ON DELETE CASCADE,
    material_id UUID REFERENCES raw_materials(id),
    quantity DECIMAL(15, 3) NOT NULL
);

-- 4. Batches
CREATE TABLE production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_order_id UUID REFERENCES job_orders(id),
    batch_name TEXT NOT NULL,
    sku_code TEXT UNIQUE,
    current_location TEXT, -- 'karigar', 'warehouse', 'shop'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Billing Engine
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES parties(id),
    invoice_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'sales', 'purchase'
    total_amount DECIMAL(15, 2) NOT NULL,
    discount DECIMAL(15, 2) DEFAULT 0.00,
    tax DECIMAL(15, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'unpaid',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Support Tables
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT UNIQUE NOT NULL -- 'S', 'M', 'L', 'XL', 'Free'
);

CREATE TABLE colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    hex_code TEXT
);

-- 7. Database Triggers & Functions
-- Trigger: Update Party Balance on Ledger Change
CREATE OR REPLACE FUNCTION update_party_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.transaction_type = 'credit' THEN
            UPDATE parties SET balance = balance + NEW.amount WHERE id = NEW.party_id;
        ELSE
            UPDATE parties SET balance = balance - NEW.amount WHERE id = NEW.party_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.transaction_type = 'credit' THEN
            UPDATE parties SET balance = balance - OLD.amount WHERE id = OLD.party_id;
        ELSE
            UPDATE parties SET balance = balance + OLD.amount WHERE id = OLD.party_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_party_balance
AFTER INSERT OR DELETE ON ledger
FOR EACH ROW EXECUTE FUNCTION update_party_balance();

-- Trigger: Calculate Job Order Totals
-- This assumes we want to track the total finished cost on the job order
CREATE OR REPLACE FUNCTION calculate_job_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update job order status based on finished quantity
    UPDATE job_orders 
    SET status = CASE 
        WHEN finished_quantity >= total_quantity THEN 'completed'
        WHEN finished_quantity > 0 THEN 'ongoing'
        ELSE 'pending'
    END,
    updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_job_order_totals
AFTER UPDATE OF finished_quantity ON job_orders
FOR EACH ROW EXECUTE FUNCTION calculate_job_order_totals();

-- Stock Management Function
CREATE OR REPLACE FUNCTION adjust_stock(mat_id UUID, qty DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE raw_materials SET current_stock = current_stock + qty WHERE id = mat_id;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS business_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
    partner_name TEXT NOT NULL,
    partner_industry TEXT,
    relationship_type TEXT CHECK (relationship_type IN ('vendor', 'client', 'logistics', 'agent', 'contractor')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'terminated')),
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    pairing_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE business_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business partners" ON business_partners
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM business_profiles WHERE id = business_id
    ));

CREATE POLICY "Users can manage their business partners" ON business_partners
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM business_profiles WHERE id = business_id
    ));

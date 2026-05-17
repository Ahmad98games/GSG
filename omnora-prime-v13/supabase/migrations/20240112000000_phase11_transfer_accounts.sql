-- supabase/migrations/20240112000000_phase11_transfer_accounts.sql

-- 1. Ensure system accounts exist for all businesses
DO $$
DECLARE
    biz_rec RECORD;
BEGIN
    FOR biz_rec IN SELECT id FROM business_profiles LOOP
        -- Inventory Account (1200)
        INSERT INTO accounts (business_id, account_code, name, type, is_system)
        VALUES (biz_rec.id, '1200', 'Inventory', 'asset', true)
        ON CONFLICT (business_id, account_code) DO NOTHING;

        -- Inter-Branch Transit Asset (1210)
        INSERT INTO accounts (business_id, account_code, name, type, is_system)
        VALUES (biz_rec.id, '1210', 'Inter-Branch Transit Asset', 'asset', true)
        ON CONFLICT (business_id, account_code) DO NOTHING;
    END LOOP;
END $$;


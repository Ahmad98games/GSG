-- Noxis v13.0 — Phase 21: Storage Setup
-- Final Deployment Preparation

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('invoices', 'invoices', false, 5242880, '{"application/pdf"}'), -- 5MB PDF only
  ('sku-images', 'sku-images', true, 2097152, '{"image/png", "image/jpeg", "image/webp"}'), -- 2MB images
  ('karigar-photos', 'karigar-photos', false, 2097152, '{"image/png", "image/jpeg", "image/webp"}') -- 2MB images
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Storage.objects

-- 2.1 Invoices (Private - Business Owner & Customers via signed URLs)
-- Note: Signed URLs are handled by Supabase storage-api, but RLS still applies for direct access.
DROP POLICY IF EXISTS "business_owner_manage_invoices" ON storage.objects;
CREATE POLICY "business_owner_manage_invoices" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = current_user_business_id()::text)
  WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = current_user_business_id()::text);

-- 2.2 SKU Images (Public Read, Business Owner Write)
DROP POLICY IF EXISTS "sku_images_public_read" ON storage.objects;
CREATE POLICY "sku_images_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'sku-images');

DROP POLICY IF EXISTS "business_owner_manage_sku_images" ON storage.objects;
CREATE POLICY "business_owner_manage_sku_images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'sku-images' AND (storage.foldername(name))[1] = current_user_business_id()::text)
  WITH CHECK (bucket_id = 'sku-images' AND (storage.foldername(name))[1] = current_user_business_id()::text);

-- 2.3 Karigar Photos (Private - Business Owner Only)
DROP POLICY IF EXISTS "business_owner_manage_karigar_photos" ON storage.objects;
CREATE POLICY "business_owner_manage_karigar_photos" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'karigar-photos' AND (storage.foldername(name))[1] = current_user_business_id()::text)
  WITH CHECK (bucket_id = 'karigar-photos' AND (storage.foldername(name))[1] = current_user_business_id()::text);

-- Ensure RLS is enabled on storage tables (Supabase defaults this, but we ensure)
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


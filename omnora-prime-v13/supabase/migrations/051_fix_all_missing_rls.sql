-- ═══════════════════════════════════════
-- BUG 1 — RLS Policies for Missing Tables
-- ═══════════════════════════════════════

-- 1. invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "select_own_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "update_own_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "delete_own_invoice_items" ON invoice_items;

CREATE POLICY "insert_own_invoice_items" ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM invoices i JOIN business_profiles bp ON bp.id = i.business_id WHERE i.id = invoice_items.invoice_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_invoice_items" ON invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices i JOIN business_profiles bp ON bp.id = i.business_id WHERE i.id = invoice_items.invoice_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_invoice_items" ON invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM invoices i JOIN business_profiles bp ON bp.id = i.business_id WHERE i.id = invoice_items.invoice_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_invoice_items" ON invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM invoices i JOIN business_profiles bp ON bp.id = i.business_id WHERE i.id = invoice_items.invoice_id AND bp.user_id = auth.uid())
);

-- 2. batch_cost_items
ALTER TABLE batch_cost_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_batch_cost_items" ON batch_cost_items;
DROP POLICY IF EXISTS "select_own_batch_cost_items" ON batch_cost_items;
DROP POLICY IF EXISTS "update_own_batch_cost_items" ON batch_cost_items;
DROP POLICY IF EXISTS "delete_own_batch_cost_items" ON batch_cost_items;

CREATE POLICY "insert_own_batch_cost_items" ON batch_cost_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM production_batches pb JOIN business_profiles bp ON bp.id = pb.business_id WHERE pb.id = batch_cost_items.batch_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_batch_cost_items" ON batch_cost_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM production_batches pb JOIN business_profiles bp ON bp.id = pb.business_id WHERE pb.id = batch_cost_items.batch_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_batch_cost_items" ON batch_cost_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM production_batches pb JOIN business_profiles bp ON bp.id = pb.business_id WHERE pb.id = batch_cost_items.batch_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_batch_cost_items" ON batch_cost_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM production_batches pb JOIN business_profiles bp ON bp.id = pb.business_id WHERE pb.id = batch_cost_items.batch_id AND bp.user_id = auth.uid())
);

-- 3. payment_splits
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_payment_splits" ON payment_splits;
DROP POLICY IF EXISTS "select_own_payment_splits" ON payment_splits;
DROP POLICY IF EXISTS "update_own_payment_splits" ON payment_splits;
DROP POLICY IF EXISTS "delete_own_payment_splits" ON payment_splits;

CREATE POLICY "insert_own_payment_splits" ON payment_splits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM payments p JOIN business_profiles bp ON bp.id = p.business_id WHERE p.id = payment_splits.payment_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_payment_splits" ON payment_splits FOR SELECT USING (
  EXISTS (SELECT 1 FROM payments p JOIN business_profiles bp ON bp.id = p.business_id WHERE p.id = payment_splits.payment_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_payment_splits" ON payment_splits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM payments p JOIN business_profiles bp ON bp.id = p.business_id WHERE p.id = payment_splits.payment_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_payment_splits" ON payment_splits FOR DELETE USING (
  EXISTS (SELECT 1 FROM payments p JOIN business_profiles bp ON bp.id = p.business_id WHERE p.id = payment_splits.payment_id AND bp.user_id = auth.uid())
);

-- 4. karigar_grades
ALTER TABLE karigar_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_karigar_grades" ON karigar_grades;
DROP POLICY IF EXISTS "select_own_karigar_grades" ON karigar_grades;
DROP POLICY IF EXISTS "update_own_karigar_grades" ON karigar_grades;
DROP POLICY IF EXISTS "delete_own_karigar_grades" ON karigar_grades;

CREATE POLICY "insert_own_karigar_grades" ON karigar_grades FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = karigar_grades.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_karigar_grades" ON karigar_grades FOR SELECT USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = karigar_grades.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_karigar_grades" ON karigar_grades FOR UPDATE USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = karigar_grades.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_karigar_grades" ON karigar_grades FOR DELETE USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = karigar_grades.business_id AND bp.user_id = auth.uid())
);

-- 5. portal_payment_intents
ALTER TABLE portal_payment_intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_portal_payment_intents" ON portal_payment_intents;
DROP POLICY IF EXISTS "select_own_portal_payment_intents" ON portal_payment_intents;
DROP POLICY IF EXISTS "update_own_portal_payment_intents" ON portal_payment_intents;
DROP POLICY IF EXISTS "delete_own_portal_payment_intents" ON portal_payment_intents;

CREATE POLICY "insert_own_portal_payment_intents" ON portal_payment_intents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = portal_payment_intents.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_portal_payment_intents" ON portal_payment_intents FOR SELECT USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = portal_payment_intents.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_portal_payment_intents" ON portal_payment_intents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = portal_payment_intents.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_portal_payment_intents" ON portal_payment_intents FOR DELETE USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = portal_payment_intents.business_id AND bp.user_id = auth.uid())
);

-- 6. portal_payments
ALTER TABLE portal_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_portal_payments" ON portal_payments;
DROP POLICY IF EXISTS "select_own_portal_payments" ON portal_payments;
DROP POLICY IF EXISTS "update_own_portal_payments" ON portal_payments;
DROP POLICY IF EXISTS "delete_own_portal_payments" ON portal_payments;

CREATE POLICY "insert_own_portal_payments" ON portal_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM invoices i JOIN business_profiles bp ON bp.id = i.business_id WHERE i.id = portal_payments.invoice_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_portal_payments" ON portal_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices i JOIN business_profiles bp ON bp.id = i.business_id WHERE i.id = portal_payments.invoice_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_portal_payments" ON portal_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM invoices i JOIN business_profiles bp ON bp.id = i.business_id WHERE i.id = portal_payments.invoice_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_portal_payments" ON portal_payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM invoices i JOIN business_profiles bp ON bp.id = i.business_id WHERE i.id = portal_payments.invoice_id AND bp.user_id = auth.uid())
);

-- 7. portal_sessions
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_portal_sessions" ON portal_sessions;
DROP POLICY IF EXISTS "select_own_portal_sessions" ON portal_sessions;
DROP POLICY IF EXISTS "update_own_portal_sessions" ON portal_sessions;
DROP POLICY IF EXISTS "delete_own_portal_sessions" ON portal_sessions;

CREATE POLICY "insert_own_portal_sessions" ON portal_sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM client_portals cp JOIN business_profiles bp ON bp.id = cp.business_id WHERE cp.id = portal_sessions.portal_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_portal_sessions" ON portal_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM client_portals cp JOIN business_profiles bp ON bp.id = cp.business_id WHERE cp.id = portal_sessions.portal_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_portal_sessions" ON portal_sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM client_portals cp JOIN business_profiles bp ON bp.id = cp.business_id WHERE cp.id = portal_sessions.portal_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_portal_sessions" ON portal_sessions FOR DELETE USING (
  EXISTS (SELECT 1 FROM client_portals cp JOIN business_profiles bp ON bp.id = cp.business_id WHERE cp.id = portal_sessions.portal_id AND bp.user_id = auth.uid())
);

-- 8. webhook_deliveries
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_webhook_deliveries" ON webhook_deliveries;
DROP POLICY IF EXISTS "select_own_webhook_deliveries" ON webhook_deliveries;
DROP POLICY IF EXISTS "update_own_webhook_deliveries" ON webhook_deliveries;
DROP POLICY IF EXISTS "delete_own_webhook_deliveries" ON webhook_deliveries;

CREATE POLICY "insert_own_webhook_deliveries" ON webhook_deliveries FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM webhook_endpoints we JOIN business_profiles bp ON bp.id = we.business_id WHERE we.id = webhook_deliveries.endpoint_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_webhook_deliveries" ON webhook_deliveries FOR SELECT USING (
  EXISTS (SELECT 1 FROM webhook_endpoints we JOIN business_profiles bp ON bp.id = we.business_id WHERE we.id = webhook_deliveries.endpoint_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_webhook_deliveries" ON webhook_deliveries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM webhook_endpoints we JOIN business_profiles bp ON bp.id = we.business_id WHERE we.id = webhook_deliveries.endpoint_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_webhook_deliveries" ON webhook_deliveries FOR DELETE USING (
  EXISTS (SELECT 1 FROM webhook_endpoints we JOIN business_profiles bp ON bp.id = we.business_id WHERE we.id = webhook_deliveries.endpoint_id AND bp.user_id = auth.uid())
);

-- 9. partner_drawings
ALTER TABLE partner_drawings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_partner_drawings" ON partner_drawings;
DROP POLICY IF EXISTS "select_own_partner_drawings" ON partner_drawings;
DROP POLICY IF EXISTS "update_own_partner_drawings" ON partner_drawings;
DROP POLICY IF EXISTS "delete_own_partner_drawings" ON partner_drawings;

CREATE POLICY "insert_own_partner_drawings" ON partner_drawings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = partner_drawings.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_partner_drawings" ON partner_drawings FOR SELECT USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = partner_drawings.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_partner_drawings" ON partner_drawings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = partner_drawings.business_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_partner_drawings" ON partner_drawings FOR DELETE USING (
  EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.id = partner_drawings.business_id AND bp.user_id = auth.uid())
);

-- 10. license_payments
ALTER TABLE license_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_license_payments" ON license_payments;
DROP POLICY IF EXISTS "select_own_license_payments" ON license_payments;
DROP POLICY IF EXISTS "update_own_license_payments" ON license_payments;
DROP POLICY IF EXISTS "delete_own_license_payments" ON license_payments;

CREATE POLICY "insert_own_license_payments" ON license_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM licenses l JOIN business_profiles bp ON bp.id = l.business_id WHERE l.id = license_payments.license_id AND bp.user_id = auth.uid())
);
CREATE POLICY "select_own_license_payments" ON license_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM licenses l JOIN business_profiles bp ON bp.id = l.business_id WHERE l.id = license_payments.license_id AND bp.user_id = auth.uid())
);
CREATE POLICY "update_own_license_payments" ON license_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM licenses l JOIN business_profiles bp ON bp.id = l.business_id WHERE l.id = license_payments.license_id AND bp.user_id = auth.uid())
);
CREATE POLICY "delete_own_license_payments" ON license_payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM licenses l JOIN business_profiles bp ON bp.id = l.business_id WHERE l.id = license_payments.license_id AND bp.user_id = auth.uid())
);

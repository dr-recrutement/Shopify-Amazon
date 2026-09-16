/*
# Super admin read access to orders

## Summary
tenants already has `super_admin_select_all_tenants` (see
20260821090000_tenant_settings_blob.sql), but orders never got the
equivalent — every orders policy was owner-only. That blocked a real
platform-wide "Statistiques globales" admin page (GMV, order volume
trend, AOV) from ever working: a super admin querying orders would
always get zero rows back under RLS, the same silent-failure shape as
the tenants/super_admins bug documented in
20260822100000_sync_super_admins_table.sql.
*/

DROP POLICY IF EXISTS "super_admin_select_all_orders" ON orders;
CREATE POLICY "super_admin_select_all_orders" ON orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

/*
# CRITICAL security fixes — multi-tenant isolation + super admin

Found during a full RLS audit requested to verify tenant isolation:

1. super_admins had `INSERT ... WITH CHECK (true)` and
   `UPDATE ... USING (true) WITH CHECK (true)` for ANY authenticated user
   — literally any signed-up merchant could run
   `insert into super_admins (user_id, status) values (auth.uid(), 'active')`
   from the browser console and grant themselves full platform admin
   access. This is a privilege-escalation vulnerability, fixed by
   removing public write access entirely — only the trigger (SECURITY
   DEFINER, below) and the service role can write to this table now.

2. The previous super-admin-sync migration inserted into super_admins
   without the `email` column, which is NOT NULL with no default — every
   insert was silently failing. This is almost certainly why the super
   admin console stayed empty even when logging in with a listed email.
   Fixed by including email in both the trigger and the backfill.

3. theme_configs / cms_pages had `FOR SELECT TO anon USING (true)` — read
   access to ANY tenant's data, including ones that never published
   (no slug set). A competing merchant's still-unpublished draft theme
   and CMS pages were fully readable by anyone, logged in or not. Fixed
   to only allow reading a tenant's theme/pages once they've actually
   published (slug IS NOT NULL) — matching the existing
   public_select_published_tenants policy on the tenants table itself.

4. audit_logs had `SELECT ... USING (true)` for any authenticated user —
   any merchant could read every tenant's audit trail. Restricted to
   super admins only.

5. platform_themes allowed any authenticated user to INSERT/UPDATE/DELETE
   the platform's shared theme catalog. Restricted writes to super admins;
   read access (anon + authenticated) is unchanged since that's meant to
   be public.
*/

-- ---------------------------------------------------------------------
-- 1 & 2. super_admins: close the privilege-escalation hole, fix the
-- missing `email` column that broke every insert.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "insert_super_admins" ON super_admins;
DROP POLICY IF EXISTS "update_super_admins" ON super_admins;
-- No replacement INSERT/UPDATE policy for `authenticated` — writes now
-- only happen via the SECURITY DEFINER trigger below or the service role
-- (Cloudflare Functions), never directly from a logged-in user's browser.

DROP POLICY IF EXISTS "read_super_admins" ON super_admins;
CREATE POLICY "read_super_admins" ON super_admins
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid() AND sa.status = 'active'));

CREATE OR REPLACE FUNCTION sync_super_admin_from_email()
RETURNS trigger AS $$
BEGIN
  -- ⚠️ Keep this list in sync with SUPER_ADMIN_EMAILS in
  -- src/lib/constants.ts — this is the SQL-side mirror of that list.
  IF lower(NEW.email) IN ('webdxb1@gmail.com', 'vincentnogue@yahoo.com', 'vincentnogue2@gmail.com') THEN
    INSERT INTO super_admins (user_id, email, status)
    VALUES (NEW.id, lower(NEW.email), 'active')
    ON CONFLICT (user_id) DO UPDATE SET status = 'active', email = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_super_admin ON auth.users;
CREATE TRIGGER trg_sync_super_admin
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_super_admin_from_email();

-- Re-run the backfill with email included this time (the previous
-- migration's version, missing email, would have failed silently on
-- every row).
INSERT INTO super_admins (user_id, email, status)
SELECT id, lower(email), 'active' FROM auth.users
WHERE lower(email) IN ('webdxb1@gmail.com', 'vincentnogue@yahoo.com', 'vincentnogue2@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET status = 'active', email = EXCLUDED.email;

-- ---------------------------------------------------------------------
-- 3. theme_configs / cms_pages: only expose published tenants to anon.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "public_select_theme_configs" ON theme_configs;
CREATE POLICY "public_select_theme_configs" ON theme_configs
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.slug IS NOT NULL));

DROP POLICY IF EXISTS "public_select_cms_pages" ON cms_pages;
CREATE POLICY "public_select_cms_pages" ON cms_pages
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = cms_pages.tenant_id AND tenants.slug IS NOT NULL));

-- ---------------------------------------------------------------------
-- 4. audit_logs: super admins only.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "select_audit_logs" ON audit_logs;
CREATE POLICY "select_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

-- Also close identity spoofing: a user could previously insert an audit
-- row with any actor_id, not just their own.
DROP POLICY IF EXISTS "insert_audit_logs" ON audit_logs;
CREATE POLICY "insert_audit_logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. platform_themes: writes restricted to super admins.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "insert_platform_themes" ON platform_themes;
CREATE POLICY "insert_platform_themes" ON platform_themes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

DROP POLICY IF EXISTS "update_platform_themes" ON platform_themes;
CREATE POLICY "update_platform_themes" ON platform_themes
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

DROP POLICY IF EXISTS "delete_platform_themes" ON platform_themes;
CREATE POLICY "delete_platform_themes" ON platform_themes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

/*
# Public storefront resolution — the critical missing piece

## Summary
Until now, the public storefront (StorefrontPage.tsx) read the theme,
catalog, and shop profile from the VISITOR's own browser localStorage —
not the merchant's. A real customer on their own phone could not see a
merchant's actual store. This migration adds what's needed to fix that at
the data layer:

- `tenants.slug`: a stable, unique, public identifier
  (`maboutique.os.liafrik.com` → slug `maboutique`), resolvable by anyone
  without authentication.
- Anonymous SELECT on `tenants`, restricted to tenants that have a slug
  set (i.e. have gone through onboarding) — exposes only what a visitor
  already effectively sees on the storefront (shop name, currency, plan
  tier), not owner identity beyond the internal auth uuid.
- `theme_configs` / `cms_pages`: one JSON blob per tenant, mirroring the
  exact shape already used in localStorage (src/lib/app-state.ts
  getShopTheme/saveShopTheme, src/lib/cms.ts) — no relational redesign,
  minimal risk of behavior drift from what merchants already built.
  Both are anonymously readable (the storefront needs to render them for
  any visitor) but only the owning tenant can write.
*/

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Public checkout: an anonymous storefront visitor must be able to place
-- an order. Restricted to status='pending' only — a client can never
-- insert an order that's already 'paid', preventing a visitor from
-- forging revenue in a merchant's dashboard. Payment confirmation still
-- needs a server-side step (same gap as the rest of checkout today; not
-- introduced by this policy).
DROP POLICY IF EXISTS "public_insert_pending_orders" ON orders;
CREATE POLICY "public_insert_pending_orders" ON orders
  FOR INSERT TO anon
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "public_select_published_tenants" ON tenants;
CREATE POLICY "public_select_published_tenants" ON tenants
  FOR SELECT TO anon
  USING (slug IS NOT NULL);

CREATE TABLE IF NOT EXISTS theme_configs (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE theme_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_theme_configs" ON theme_configs;
CREATE POLICY "public_select_theme_configs" ON theme_configs FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "select_own_theme_configs" ON theme_configs;
CREATE POLICY "select_own_theme_configs" ON theme_configs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "upsert_own_theme_configs" ON theme_configs;
CREATE POLICY "upsert_own_theme_configs" ON theme_configs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_theme_configs" ON theme_configs;
CREATE POLICY "update_own_theme_configs" ON theme_configs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS cms_pages (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_cms_pages" ON cms_pages;
CREATE POLICY "public_select_cms_pages" ON cms_pages FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "select_own_cms_pages" ON cms_pages;
CREATE POLICY "select_own_cms_pages" ON cms_pages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = cms_pages.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "upsert_own_cms_pages" ON cms_pages;
CREATE POLICY "upsert_own_cms_pages" ON cms_pages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = cms_pages.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_cms_pages" ON cms_pages;
CREATE POLICY "update_own_cms_pages" ON cms_pages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = cms_pages.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = cms_pages.tenant_id AND tenants.owner_id = auth.uid()));

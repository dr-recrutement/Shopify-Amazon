/*
# Real draft/publish separation for theme_configs

## Summary
The "Brouillon"/"Publier" buttons in the Online Store editor
(OnlineStore.tsx) only ever flipped a cosmetic `isPublished` boolean
inside the theme JSON — nothing anywhere ever read that flag. The
editor's own autosave (every ~800ms on any change) wrote straight into
`theme_configs.config`, and the public storefront (fetchPublicTheme)
read that exact same column. So every keystroke went live on the real
store instantly, regardless of which button a merchant clicked — a
"draft" was never actually private, and clicking "Publier" did nothing
a plain edit hadn't already done.

## Fix
Add `published_config` as a second column: the editor keeps
continuously autosaving the merchant's in-progress work into `config`
(safe — never lost, never exposed to shoppers), and only an explicit
"Publier" action (see src/lib/tenant-sync.ts publishCloudTheme) copies
`config` into `published_config`. The storefront now reads
`published_config`.

Backfill: every tenant that already has a `config` row gets
`published_config` initialized to the same value, so no existing live
storefront goes blank because of this migration.
*/

-- Defensive: create the table here too (matching
-- 20260820180000_public_storefront_resolution.sql's definition exactly)
-- in case this migration is ever run before that one, or against a
-- database where theme_configs was provisioned some other way and is
-- missing columns this repo's migration history assumes exist.
CREATE TABLE IF NOT EXISTS theme_configs (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE theme_configs ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE theme_configs ADD COLUMN IF NOT EXISTS published_config jsonb;
ALTER TABLE theme_configs ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Defensive: (re)apply RLS + the essential policies too, in case this
-- table's earlier setup (20260820180000_public_storefront_resolution.sql)
-- never actually ran against this database — all idempotent, safe to
-- run whether or not that migration already succeeded here.
ALTER TABLE theme_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_theme_configs" ON theme_configs;
CREATE POLICY "select_own_theme_configs" ON theme_configs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));

DROP POLICY IF EXISTS "upsert_own_theme_configs" ON theme_configs;
CREATE POLICY "upsert_own_theme_configs" ON theme_configs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_theme_configs" ON theme_configs;
CREATE POLICY "update_own_theme_configs" ON theme_configs
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));

-- Public (anon) read — but only for tenants that are actually published
-- (have a slug), matching the tightened policy from
-- 20260822130000_critical_rls_isolation_fixes.sql, not the original
-- looser "true" version.
DROP POLICY IF EXISTS "public_select_theme_configs" ON theme_configs;
CREATE POLICY "public_select_theme_configs" ON theme_configs
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.slug IS NOT NULL));

UPDATE theme_configs SET published_config = config, published_at = updated_at WHERE published_config IS NULL;

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

ALTER TABLE theme_configs ADD COLUMN IF NOT EXISTS published_config jsonb;
ALTER TABLE theme_configs ADD COLUMN IF NOT EXISTS published_at timestamptz;

UPDATE theme_configs SET published_config = config, published_at = updated_at WHERE published_config IS NULL;

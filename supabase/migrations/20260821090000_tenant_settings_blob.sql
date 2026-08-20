/*
# Generic tenant settings blob

## Summary
Adds a single `settings jsonb` column on `tenants` to back the several
small, low-cardinality Settings sections (checkout preferences, customer
account mode, tax rate, privacy/data policy text, notification toggles,
language) that don't warrant their own table each. Same pattern already
used successfully for theme_configs/cms_pages: one JSON blob per tenant,
authenticated read/write, RLS-scoped to the owner.
*/

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

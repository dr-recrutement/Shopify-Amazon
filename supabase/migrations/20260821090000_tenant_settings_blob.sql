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

-- Needed for upsert(..., { onConflict: 'tenant_id,gateway' }) in
-- src/lib/tenant-sync.ts pushCloudGateway — one row per gateway per tenant.
-- Postgres has no "ADD CONSTRAINT IF NOT EXISTS", hence the DO block.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendor_payment_gateways_tenant_gateway_key'
  ) THEN
    ALTER TABLE vendor_payment_gateways
      ADD CONSTRAINT vendor_payment_gateways_tenant_gateway_key UNIQUE (tenant_id, gateway);
  END IF;
END $$;

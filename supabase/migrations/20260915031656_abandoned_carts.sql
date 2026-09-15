/*
# Abandoned carts — real destination for the 'abandoned_cart' automation trigger

## Summary
Automations.tsx lets a merchant create a rule with trigger
'abandoned_cart', but nothing anywhere tracked which storefront visitor
carts were ever abandoned — the trigger existed only as a select-box
option with no real data behind it, so it could never fire. This table
is the missing data: the public storefront (anonymous visitors) upserts
a snapshot of their cart here as it changes, and marks it 'recovered'
once they complete checkout. The merchant's automations engine
(src/lib/automations-engine.ts) reads 'open' carts inactive for a while
and runs the merchant's configured action for real.

Same anon-insert/update, owner-only-select pattern already used for
newsletter_subscribers and contact_messages.
*/

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  customer_email text,
  customer_name text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'recovered', 'ignored')),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, session_id)
);
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_abandoned_carts" ON abandoned_carts;
CREATE POLICY "select_own_abandoned_carts" ON abandoned_carts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = abandoned_carts.tenant_id AND tenants.owner_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_abandoned_carts" ON abandoned_carts;
CREATE POLICY "update_own_abandoned_carts" ON abandoned_carts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = abandoned_carts.tenant_id AND tenants.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = abandoned_carts.tenant_id AND tenants.owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_abandoned_carts" ON abandoned_carts;
CREATE POLICY "delete_own_abandoned_carts" ON abandoned_carts
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = abandoned_carts.tenant_id AND tenants.owner_id = auth.uid()));

-- Public storefront visitors (anonymous) need to upsert their own cart
-- snapshot as it changes, and mark it recovered on checkout — both
-- without a session.
DROP POLICY IF EXISTS "public_insert_abandoned_carts" ON abandoned_carts;
CREATE POLICY "public_insert_abandoned_carts" ON abandoned_carts
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_abandoned_carts" ON abandoned_carts;
CREATE POLICY "public_update_abandoned_carts" ON abandoned_carts
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "insert_own_abandoned_carts" ON abandoned_carts;
CREATE POLICY "insert_own_abandoned_carts" ON abandoned_carts
  FOR INSERT TO authenticated WITH CHECK (true);

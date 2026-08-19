/*
# Domain connect + platform subscriptions backend support

## Summary
Adds the columns/tables the new Cloudflare Functions backend needs:
- `domains`: tracks the Cloudflare Pages custom-domain object id and the
  last error, so the connect/status endpoints can report real state.
- `subscription_events`: append-only log of every Flutterwave webhook
  event processed, keyed by transaction id, so webhook retries are
  idempotent (a duplicate delivery is a no-op instead of double-crediting
  a subscription).

## Security
RLS is enabled on subscription_events; only the service role (used
exclusively by the Cloudflare Functions webhook, never shipped to the
browser) can read or write it. No policy grants anon/authenticated access.
*/

ALTER TABLE domains ADD COLUMN IF NOT EXISTS cloudflare_domain_id text;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_renews_at timestamptz;

CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  flutterwave_tx_id text NOT NULL UNIQUE,
  flutterwave_tx_ref text,
  plan text,
  billing_cycle text,
  amount numeric,
  currency text,
  status text NOT NULL,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role key (server-side webhook only) can
-- access this table. Intentional — this is a payment audit trail.

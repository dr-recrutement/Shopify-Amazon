/*
# Live visitor presence tracking

## Summary
Analytics had no visitor-presence data at all — only order-derived
metrics. This adds a real "who's on your site right now" signal: the
public storefront pings a lightweight endpoint every ~25s while a
visitor has the page open (functions/api/analytics/ping.ts), which
upserts one row per visitor session using the *real* country Cloudflare
already resolves per-request (request.cf.country — no third-party
geolocation API needed, no IP ever stored). The merchant's Analytics
page reads rows with last_seen in the last ~2 minutes as "currently
online" — an honest recency window, not a persistent visitor log (rows
past their usefulness are just left to go stale; nothing scans/joins
them after that).
*/

CREATE TABLE IF NOT EXISTS live_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  country text,
  path text,
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, session_id)
);
ALTER TABLE live_visitors ENABLE ROW LEVEL SECURITY;

-- Written only by functions/api/analytics/ping.ts using the service role
-- (no client-side insert/update policy needed — a policy for anon here
-- would let anyone spoof another tenant's visitor counts).
DROP POLICY IF EXISTS "select_own_live_visitors" ON live_visitors;
CREATE POLICY "select_own_live_visitors" ON live_visitors
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = live_visitors.tenant_id AND tenants.owner_id = auth.uid()));

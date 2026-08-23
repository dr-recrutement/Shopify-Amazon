/*
# Newsletter subscribers — real destination for storefront signup forms

## Summary
The storefront's newsletter/email-signup sections showed a "Merci pour
votre inscription !" success message to real end customers without
saving the email anywhere — a genuine deception risk for a merchant's
actual visitors (not internal dashboard fakery this time, real people
being told they signed up when nothing was recorded).
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  source text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, email)
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "select_own_newsletter_subscribers" ON newsletter_subscribers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = newsletter_subscribers.tenant_id AND tenants.owner_id = auth.uid()));

-- Public storefront visitors (anonymous) need to be able to subscribe.
DROP POLICY IF EXISTS "public_insert_newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "public_insert_newsletter_subscribers" ON newsletter_subscribers
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "insert_own_newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "insert_own_newsletter_subscribers" ON newsletter_subscribers
  FOR INSERT TO authenticated WITH CHECK (true);

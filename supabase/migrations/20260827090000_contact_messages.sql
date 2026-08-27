/*
# Contact messages — real destination for CMS "contact-form" sections

## Summary
Same gap as newsletter_subscribers before it: the "Formulaire de
contact" section in the theme editor renders a name/email/message
form on the storefront canvas preview, but the public CmsPageView
renderer never gave it a real submit handler — a visitor filling
it in on a live store had their message go nowhere. This is the
missing destination table, following the exact same anon-insert /
owner-only-select pattern already used for newsletter_subscribers.
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  source text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_contact_messages" ON contact_messages;
CREATE POLICY "select_own_contact_messages" ON contact_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = contact_messages.tenant_id AND tenants.owner_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_contact_messages" ON contact_messages;
CREATE POLICY "update_own_contact_messages" ON contact_messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = contact_messages.tenant_id AND tenants.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = contact_messages.tenant_id AND tenants.owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_contact_messages" ON contact_messages;
CREATE POLICY "delete_own_contact_messages" ON contact_messages
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = contact_messages.tenant_id AND tenants.owner_id = auth.uid()));

-- Public storefront visitors (anonymous) need to be able to submit the
-- contact form without a session.
DROP POLICY IF EXISTS "public_insert_contact_messages" ON contact_messages;
CREATE POLICY "public_insert_contact_messages" ON contact_messages
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "insert_own_contact_messages" ON contact_messages;
CREATE POLICY "insert_own_contact_messages" ON contact_messages
  FOR INSERT TO authenticated WITH CHECK (true);

/*
# Platform-wide configuration (Configuration admin page)

## Summary
"Configuration" was the last AdminGeneric "not built yet" stub, and
unlike Statistiques/Modération it had no existing data to wire — no
table anywhere held platform-wide settings. This adds a real, minimal
one: maintenance mode (gates the merchant dashboard, not the public
storefront — shoppers can keep buying while merchant-side work happens)
and a platform-wide announcement banner shown to every merchant.
Scoped to what's safely wireable without touching every route; broader
config (integrations, per-country payment defaults) can extend this
table later rather than needing a new one.

Singleton row (id fixed to a known UUID) rather than a key-value table —
simpler to read/write for a handful of fields that always exist together.
*/

CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text NOT NULL DEFAULT 'La plateforme est en maintenance. Nous serons de retour très bientôt.',
  announcement_active boolean NOT NULL DEFAULT false,
  announcement_message text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO platform_settings (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Readable by anyone (including anonymous) — the merchant dashboard and
-- storefront both need to check maintenance_mode/announcement before a
-- session necessarily exists.
DROP POLICY IF EXISTS "public_select_platform_settings" ON platform_settings;
CREATE POLICY "public_select_platform_settings" ON platform_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "super_admin_update_platform_settings" ON platform_settings;
CREATE POLICY "super_admin_update_platform_settings" ON platform_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

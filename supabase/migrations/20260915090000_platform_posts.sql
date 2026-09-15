/*
# Platform posts — real "CMS Plateforme" content (blog / académie)

## Summary
The super-admin "CMS Plateforme" section was a shared placeholder
("cette section n'est pas encore construite") because no institutional
content model existed. Deliberately scoped to blog/academy articles
only — NOT the legal pages (Terms/Privacy/Cookies/Refund/Mentions
légales), which stay as reviewed, version-controlled React components
in LegalPageContent.tsx rather than becoming casually editable rows;
legal text shouldn't be one accidental admin edit away from changing
without review.

Public (anon) can read published posts only, for the /blog storefront
pages. Only active super admins can create/edit/delete, or read drafts.
*/

CREATE TABLE IF NOT EXISTS platform_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'blog' CHECK (category IN ('blog', 'academy')),
  title text NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE platform_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_published_platform_posts" ON platform_posts;
CREATE POLICY "public_select_published_platform_posts" ON platform_posts
  FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "super_admin_select_platform_posts" ON platform_posts;
CREATE POLICY "super_admin_select_platform_posts" ON platform_posts
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active')
  );

DROP POLICY IF EXISTS "super_admin_insert_platform_posts" ON platform_posts;
CREATE POLICY "super_admin_insert_platform_posts" ON platform_posts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

DROP POLICY IF EXISTS "super_admin_update_platform_posts" ON platform_posts;
CREATE POLICY "super_admin_update_platform_posts" ON platform_posts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

DROP POLICY IF EXISTS "super_admin_delete_platform_posts" ON platform_posts;
CREATE POLICY "super_admin_delete_platform_posts" ON platform_posts
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.status = 'active'));

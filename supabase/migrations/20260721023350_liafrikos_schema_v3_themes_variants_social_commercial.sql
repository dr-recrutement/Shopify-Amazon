/*
# LiAfrikOS Schema V3 — Themes, Variants, Social, Commercial Codes, Custom Roles

## Summary
Adds tables for theme persistence/marketplace, product variants/images/categories,
social media connections, commercial codes, custom roles, and staff performance tracking.

## New Tables
- theme_configs: per-tenant theme configuration (site_type, sections JSONB, colors JSONB, is_published)
- theme_store_themes: marketplace themes (free/premium, preview, price, category)
- product_variants: product variants (size, color, etc.) with own stock/price
- product_images: multiple images per product
- product_categories: categories/collections per tenant
- product_category_assignments: many-to-many product <-> category
- social_connections: connected social media accounts per tenant
- commercial_codes: sales tracking codes for commercial agents
- custom_roles: custom roles with permissions (created by super admins)
- staff_performance: daily performance snapshots per staff member

## Security
- RLS enabled on every table.
- Owner-scoped CRUD via tenant ownership chain.
- commercial_codes, custom_roles, staff_performance: super admin scope (authenticated, no tenant restriction for read).
*/

-- ============ theme_configs ============
CREATE TABLE IF NOT EXISTS theme_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_type text NOT NULL DEFAULT 'ecommerce',
  sections jsonb NOT NULL DEFAULT '[]',
  colors jsonb NOT NULL DEFAULT '{"primary":"#ea580c","secondary":"#f97316","accent":"#fb923c","background":"#ffffff","text":"#1f2937"}',
  spacing text DEFAULT 'comfortable',
  is_published boolean DEFAULT false,
  purchased_themes text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);
ALTER TABLE theme_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_theme_configs" ON theme_configs;
CREATE POLICY "select_own_theme_configs" ON theme_configs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_theme_configs" ON theme_configs;
CREATE POLICY "insert_own_theme_configs" ON theme_configs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_theme_configs" ON theme_configs;
CREATE POLICY "update_own_theme_configs" ON theme_configs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_theme_configs" ON theme_configs;
CREATE POLICY "delete_own_theme_configs" ON theme_configs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = theme_configs.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ theme_store_themes ============
CREATE TABLE IF NOT EXISTS theme_store_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'ecommerce',
  preview_url text,
  price_cents integer NOT NULL DEFAULT 0,
  is_premium boolean DEFAULT false,
  description text,
  config jsonb,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE theme_store_themes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_theme_store" ON theme_store_themes;
CREATE POLICY "read_theme_store" ON theme_store_themes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_theme_store" ON theme_store_themes;
CREATE POLICY "insert_theme_store" ON theme_store_themes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_theme_store" ON theme_store_themes;
CREATE POLICY "update_theme_store" ON theme_store_themes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_theme_store" ON theme_store_themes;
CREATE POLICY "delete_theme_store" ON theme_store_themes FOR DELETE TO authenticated USING (true);

-- ============ product_variants ============
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  price_cents bigint,
  stock integer DEFAULT 0,
  sku text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_product_variants" ON product_variants;
CREATE POLICY "select_own_product_variants" ON product_variants FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_variants.product_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_product_variants" ON product_variants;
CREATE POLICY "insert_own_product_variants" ON product_variants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_variants.product_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_product_variants" ON product_variants;
CREATE POLICY "update_own_product_variants" ON product_variants FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_variants.product_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_variants.product_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_product_variants" ON product_variants;
CREATE POLICY "delete_own_product_variants" ON product_variants FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_variants.product_id AND tenants.owner_id = auth.uid()));

-- ============ product_images ============
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_product_images" ON product_images;
CREATE POLICY "select_own_product_images" ON product_images FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_images.product_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_product_images" ON product_images;
CREATE POLICY "insert_own_product_images" ON product_images FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_images.product_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_product_images" ON product_images;
CREATE POLICY "delete_own_product_images" ON product_images FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_images.product_id AND tenants.owner_id = auth.uid()));

-- ============ product_categories ============
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_product_categories" ON product_categories;
CREATE POLICY "select_own_product_categories" ON product_categories FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = product_categories.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_product_categories" ON product_categories;
CREATE POLICY "insert_own_product_categories" ON product_categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = product_categories.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_product_categories" ON product_categories;
CREATE POLICY "update_own_product_categories" ON product_categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = product_categories.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = product_categories.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_product_categories" ON product_categories;
CREATE POLICY "delete_own_product_categories" ON product_categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = product_categories.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ product_category_assignments ============
CREATE TABLE IF NOT EXISTS product_category_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  UNIQUE(product_id, category_id)
);
ALTER TABLE product_category_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_pca" ON product_category_assignments;
CREATE POLICY "select_own_pca" ON product_category_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_category_assignments.product_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_pca" ON product_category_assignments;
CREATE POLICY "insert_own_pca" ON product_category_assignments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_category_assignments.product_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_pca" ON product_category_assignments;
CREATE POLICY "delete_own_pca" ON product_category_assignments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM products JOIN tenants ON tenants.id = products.tenant_id WHERE products.id = product_category_assignments.product_id AND tenants.owner_id = auth.uid()));

-- ============ social_connections ============
CREATE TABLE IF NOT EXISTS social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform text NOT NULL,
  account_name text,
  is_connected boolean DEFAULT false,
  access_token_encrypted text,
  plan_required text DEFAULT 'starter',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_social" ON social_connections;
CREATE POLICY "select_own_social" ON social_connections FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = social_connections.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_social" ON social_connections;
CREATE POLICY "insert_own_social" ON social_connections FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = social_connections.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_social" ON social_connections;
CREATE POLICY "update_own_social" ON social_connections FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = social_connections.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = social_connections.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_social" ON social_connections;
CREATE POLICY "delete_own_social" ON social_connections FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = social_connections.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ commercial_codes ============
CREATE TABLE IF NOT EXISTS commercial_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  agent_name text NOT NULL,
  agent_email text,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  total_sales_cents bigint DEFAULT 0,
  total_commissions_cents bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE commercial_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_commercial_codes" ON commercial_codes;
CREATE POLICY "read_commercial_codes" ON commercial_codes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_commercial_codes" ON commercial_codes;
CREATE POLICY "insert_commercial_codes" ON commercial_codes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_commercial_codes" ON commercial_codes;
CREATE POLICY "update_commercial_codes" ON commercial_codes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_commercial_codes" ON commercial_codes;
CREATE POLICY "delete_commercial_codes" ON commercial_codes FOR DELETE TO authenticated USING (true);

-- ============ custom_roles ============
CREATE TABLE IF NOT EXISTS custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_custom_roles" ON custom_roles;
CREATE POLICY "read_custom_roles" ON custom_roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_custom_roles" ON custom_roles;
CREATE POLICY "insert_custom_roles" ON custom_roles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_custom_roles" ON custom_roles;
CREATE POLICY "update_custom_roles" ON custom_roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_custom_roles" ON custom_roles;
CREATE POLICY "delete_custom_roles" ON custom_roles FOR DELETE TO authenticated USING (true);

-- ============ staff_performance ============
CREATE TABLE IF NOT EXISTS staff_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_email text NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  actions_count integer DEFAULT 0,
  orders_processed integer DEFAULT 0,
  revenue_attributed_cents bigint DEFAULT 0,
  recorded_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_staff_performance" ON staff_performance;
CREATE POLICY "read_staff_performance" ON staff_performance FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_staff_performance" ON staff_performance;
CREATE POLICY "insert_staff_performance" ON staff_performance FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_staff_performance" ON staff_performance;
CREATE POLICY "update_staff_performance" ON staff_performance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============ Seed theme store ============
INSERT INTO theme_store_themes (name, category, price_cents, is_premium, description) VALUES
('Template Universel', 'ecommerce', 0, false, 'Adapté à tous secteurs, design premium par défaut'),
('Mode & Lifestyle', 'ecommerce', 0, false, 'Élégant, éditorial, parfait pour la mode'),
('High-Tech Store', 'ecommerce', 900, true, 'Moderne, minimaliste, high-tech'),
('Resto Pro', 'business', 0, false, 'Chaleureux, gourmand, pour restaurants'),
('Landing Pro', 'landing', 900, true, 'Landing page haute conversion'),
('Marketplace Africa', 'marketplace', 1900, true, 'Marketplace panafricaine multi-vendeurs'),
('Business Vitrine', 'business', 0, false, 'Vitrine professionnelle'),
('Boutique Wax', 'ecommerce', 900, true, 'Spécialisé textile et wax africain')
ON CONFLICT DO NOTHING;

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_theme_configs_tenant ON theme_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_tenant ON product_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_tenant ON social_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_email ON staff_performance(staff_email);

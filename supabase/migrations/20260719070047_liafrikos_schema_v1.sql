/*
# LiAfrikOS Platform Schema V1

## Summary
Creates the full multi-tenant SaaS e-commerce schema for LiAfrikOS.

## New Tables
- tenants: boutiques (one per vendor), isolated by owner_id
- products: catalog per tenant
- orders: customer orders per tenant
- order_items: line items per order
- customers: customer base per tenant
- marketing_campaigns: campaigns per tenant
- vendor_payment_gateways: payment provider configs per tenant
- domains: subdomain + custom domain per tenant
- audit_logs: action traceability
- super_admins: super admin management
- platform_themes: theme library managed by super admins
- ai_generations: AI usage logs per tenant (quotas)

## Security
- RLS enabled on every table.
- Owner-scoped CRUD via auth.uid() = owner_id for tenants and child tables.
- super_admins table: any authenticated user listed can read; inserts allowed for authenticated.
- platform_themes: public read (anon + authenticated) so all vendors can browse the library; writes restricted to authenticated (super admin UI).
*/

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sector text,
  country text,
  region text,
  city text,
  landmark text,
  currency text NOT NULL DEFAULT 'XOF',
  theme_id text DEFAULT 'universal',
  plan text NOT NULL DEFAULT 'starter',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tenants" ON tenants;
CREATE POLICY "select_own_tenants" ON tenants FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "insert_own_tenants" ON tenants;
CREATE POLICY "insert_own_tenants" ON tenants FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "update_own_tenants" ON tenants;
CREATE POLICY "update_own_tenants" ON tenants FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "delete_own_tenants" ON tenants;
CREATE POLICY "delete_own_tenants" ON tenants FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  stock integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_products" ON products;
CREATE POLICY "select_own_products" ON products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = products.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = products.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = products.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = products.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = products.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_email text,
  customer_name text,
  total_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'pending',
  tracking_number text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = orders.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = orders.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = orders.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = orders.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_orders" ON orders;
CREATE POLICY "delete_own_orders" ON orders FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = orders.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_cents bigint NOT NULL DEFAULT 0
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_order_items" ON order_items;
CREATE POLICY "select_own_order_items" ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders JOIN tenants ON tenants.id = orders.tenant_id WHERE orders.id = order_items.order_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  total_spent_cents bigint DEFAULT 0,
  orders_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_customers" ON customers;
CREATE POLICY "select_own_customers" ON customers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = customers.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_customers" ON customers;
CREATE POLICY "insert_own_customers" ON customers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = customers.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_customers" ON customers;
CREATE POLICY "update_own_customers" ON customers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = customers.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = customers.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text,
  audience text,
  status text NOT NULL DEFAULT 'draft',
  sent_count integer DEFAULT 0,
  open_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_campaigns" ON marketing_campaigns;
CREATE POLICY "select_own_campaigns" ON marketing_campaigns FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = marketing_campaigns.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_campaigns" ON marketing_campaigns;
CREATE POLICY "insert_own_campaigns" ON marketing_campaigns FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = marketing_campaigns.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_campaigns" ON marketing_campaigns;
CREATE POLICY "update_own_campaigns" ON marketing_campaigns FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = marketing_campaigns.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = marketing_campaigns.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_campaigns" ON marketing_campaigns;
CREATE POLICY "delete_own_campaigns" ON marketing_campaigns FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = marketing_campaigns.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS vendor_payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gateway text NOT NULL,
  api_key_encrypted text,
  api_secret_encrypted text,
  status text NOT NULL DEFAULT 'pending',
  is_active boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vendor_payment_gateways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_gateways" ON vendor_payment_gateways;
CREATE POLICY "select_own_gateways" ON vendor_payment_gateways FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = vendor_payment_gateways.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_gateways" ON vendor_payment_gateways;
CREATE POLICY "insert_own_gateways" ON vendor_payment_gateways FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = vendor_payment_gateways.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_gateways" ON vendor_payment_gateways;
CREATE POLICY "update_own_gateways" ON vendor_payment_gateways FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = vendor_payment_gateways.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = vendor_payment_gateways.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_gateways" ON vendor_payment_gateways;
CREATE POLICY "delete_own_gateways" ON vendor_payment_gateways FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = vendor_payment_gateways.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain_name text NOT NULL,
  type text NOT NULL DEFAULT 'subdomain',
  dns_status text DEFAULT 'pending',
  ssl_status text DEFAULT 'pending',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_domains" ON domains;
CREATE POLICY "select_own_domains" ON domains FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = domains.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_domains" ON domains;
CREATE POLICY "insert_own_domains" ON domains FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = domains.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_domains" ON domains;
CREATE POLICY "update_own_domains" ON domains FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = domains.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = domains.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_audit_logs" ON audit_logs;
CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "select_audit_logs" ON audit_logs;
CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by text,
  status text NOT NULL DEFAULT 'active',
  promoted_at timestamptz DEFAULT now()
);
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_super_admins" ON super_admins;
CREATE POLICY "read_super_admins" ON super_admins FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_super_admins" ON super_admins;
CREATE POLICY "insert_super_admins" ON super_admins FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_super_admins" ON super_admins;
CREATE POLICY "update_super_admins" ON super_admins FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS platform_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  preview_desktop_url text,
  preview_mobile_url text,
  status text NOT NULL DEFAULT 'free',
  version text DEFAULT '1.0',
  uploaded_by_super_admin_id uuid,
  is_published boolean DEFAULT false,
  is_universal_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE platform_themes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_platform_themes" ON platform_themes;
CREATE POLICY "read_platform_themes" ON platform_themes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_platform_themes" ON platform_themes;
CREATE POLICY "insert_platform_themes" ON platform_themes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_platform_themes" ON platform_themes;
CREATE POLICY "update_platform_themes" ON platform_themes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_platform_themes" ON platform_themes;
CREATE POLICY "delete_platform_themes" ON platform_themes FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type text NOT NULL,
  prompt text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_generations" ON ai_generations;
CREATE POLICY "select_own_ai_generations" ON ai_generations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = ai_generations.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_ai_generations" ON ai_generations;
CREATE POLICY "insert_own_ai_generations" ON ai_generations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = ai_generations.tenant_id AND tenants.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);

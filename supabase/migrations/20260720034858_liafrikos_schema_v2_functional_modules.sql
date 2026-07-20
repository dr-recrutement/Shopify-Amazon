/*
# LiAfrikOS Schema V2 — Functional Module Tables

## Summary
Adds tables required to make dashboard modules fully operational with real CRUD.
All tables are multi-tenant (scoped by tenant_id) with RLS ownership checks.

## New Tables
- shipping_zones: delivery zones per tenant (country/region, rate type, rate amount, free shipping threshold)
- metafields: custom fields on products/orders/customers (name, type, entity_type, value)
- team_members: staff invited by vendor (email, role, status)
- discount_codes: promotional codes (code, type, value, conditions, validity)
- content_pages: CMS pages for vendor storefront (title, slug, body, status)
- markets: activated markets per tenant (country, currency, language, active)
- sales_channels: channel config per tenant (channel name, active, plan_required)

## Modified Tables
- products: added columns for images, variants, sku, compare_at_price, metafields JSONB
- orders: added columns for shipping_address, shipping_zone_id, discount_code, shipping_cost_cents

## Security
- RLS enabled on every new table.
- Owner-scoped CRUD via tenant ownership chain (auth.uid() = tenants.owner_id).
- 4 policies per table (SELECT/INSERT/UPDATE/DELETE).
*/

-- ============ shipping_zones ============
CREATE TABLE IF NOT EXISTS shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  country text,
  region text,
  rate_type text NOT NULL DEFAULT 'fixed',
  rate_amount_cents bigint NOT NULL DEFAULT 0,
  free_shipping_threshold_cents bigint,
  estimated_days integer DEFAULT 3,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_shipping_zones" ON shipping_zones;
CREATE POLICY "select_own_shipping_zones" ON shipping_zones FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = shipping_zones.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_shipping_zones" ON shipping_zones;
CREATE POLICY "insert_own_shipping_zones" ON shipping_zones FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = shipping_zones.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_shipping_zones" ON shipping_zones;
CREATE POLICY "update_own_shipping_zones" ON shipping_zones FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = shipping_zones.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = shipping_zones.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_shipping_zones" ON shipping_zones;
CREATE POLICY "delete_own_shipping_zones" ON shipping_zones FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = shipping_zones.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ metafields ============
CREATE TABLE IF NOT EXISTS metafields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  namespace text NOT NULL DEFAULT 'product',
  entity_type text NOT NULL DEFAULT 'product',
  field_type text NOT NULL DEFAULT 'text',
  value text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE metafields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_metafields" ON metafields;
CREATE POLICY "select_own_metafields" ON metafields FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = metafields.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_metafields" ON metafields;
CREATE POLICY "insert_own_metafields" ON metafields FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = metafields.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_metafields" ON metafields;
CREATE POLICY "update_own_metafields" ON metafields FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = metafields.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = metafields.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_metafields" ON metafields;
CREATE POLICY "delete_own_metafields" ON metafields FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = metafields.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ team_members ============
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  status text NOT NULL DEFAULT 'pending',
  invited_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_team_members" ON team_members;
CREATE POLICY "select_own_team_members" ON team_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = team_members.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_team_members" ON team_members;
CREATE POLICY "insert_own_team_members" ON team_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = team_members.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_team_members" ON team_members;
CREATE POLICY "update_own_team_members" ON team_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = team_members.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = team_members.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_team_members" ON team_members;
CREATE POLICY "delete_own_team_members" ON team_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = team_members.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ discount_codes ============
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  value numeric NOT NULL DEFAULT 0,
  min_amount_cents bigint DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_discount_codes" ON discount_codes;
CREATE POLICY "select_own_discount_codes" ON discount_codes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discount_codes.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_discount_codes" ON discount_codes;
CREATE POLICY "insert_own_discount_codes" ON discount_codes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discount_codes.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_discount_codes" ON discount_codes;
CREATE POLICY "update_own_discount_codes" ON discount_codes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discount_codes.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discount_codes.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_discount_codes" ON discount_codes;
CREATE POLICY "delete_own_discount_codes" ON discount_codes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discount_codes.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ content_pages ============
CREATE TABLE IF NOT EXISTS content_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_content_pages" ON content_pages;
CREATE POLICY "select_own_content_pages" ON content_pages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = content_pages.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_content_pages" ON content_pages;
CREATE POLICY "insert_own_content_pages" ON content_pages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = content_pages.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_content_pages" ON content_pages;
CREATE POLICY "update_own_content_pages" ON content_pages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = content_pages.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = content_pages.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_content_pages" ON content_pages;
CREATE POLICY "delete_own_content_pages" ON content_pages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = content_pages.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ markets ============
CREATE TABLE IF NOT EXISTS markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  country text NOT NULL,
  currency text NOT NULL,
  language text NOT NULL DEFAULT 'fr',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_markets" ON markets;
CREATE POLICY "select_own_markets" ON markets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = markets.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_markets" ON markets;
CREATE POLICY "insert_own_markets" ON markets FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = markets.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_markets" ON markets;
CREATE POLICY "update_own_markets" ON markets FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = markets.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = markets.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_markets" ON markets;
CREATE POLICY "delete_own_markets" ON markets FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = markets.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ sales_channels ============
CREATE TABLE IF NOT EXISTS sales_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel text NOT NULL,
  is_active boolean DEFAULT false,
  plan_required text DEFAULT 'starter',
  config jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_sales_channels" ON sales_channels;
CREATE POLICY "select_own_sales_channels" ON sales_channels FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = sales_channels.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_sales_channels" ON sales_channels;
CREATE POLICY "insert_own_sales_channels" ON sales_channels FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = sales_channels.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_sales_channels" ON sales_channels;
CREATE POLICY "update_own_sales_channels" ON sales_channels FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = sales_channels.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = sales_channels.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_sales_channels" ON sales_channels;
CREATE POLICY "delete_own_sales_channels" ON sales_channels FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = sales_channels.tenant_id AND tenants.owner_id = auth.uid()));

-- ============ Alter products table ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'images') THEN
    ALTER TABLE products ADD COLUMN images text[] DEFAULT '{}';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
    ALTER TABLE products ADD COLUMN sku text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'compare_at_price_cents') THEN
    ALTER TABLE products ADD COLUMN compare_at_price_cents bigint;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'variants') THEN
    ALTER TABLE products ADD COLUMN variants jsonb DEFAULT '[]';
  END IF;
END $$;

-- ============ Alter orders table ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_address') THEN
    ALTER TABLE orders ADD COLUMN shipping_address text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_zone_id') THEN
    ALTER TABLE orders ADD COLUMN shipping_zone_id uuid;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_code') THEN
    ALTER TABLE orders ADD COLUMN discount_code text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_cost_cents') THEN
    ALTER TABLE orders ADD COLUMN shipping_cost_cents bigint DEFAULT 0;
  END IF;
END $$;

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_shipping_zones_tenant ON shipping_zones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metafields_tenant ON metafields(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_tenant ON discount_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_pages_tenant ON content_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_markets_tenant ON markets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_channels_tenant ON sales_channels(tenant_id);

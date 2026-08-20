/*
# Customers, Discounts, Staff — dashboard sync

## Summary
- Extends `customers` with the fields the dashboard already collects
  (country, city, segment, tags, notes) that the existing table didn't
  have room for.
- Adds `discounts` and `staff_members` tables — Discounts.tsx and Team.tsx
  had no backend table at all before this, only localStorage.
- `staff_members` also backs the plan's staff-seat limit
  (src/lib/plan-access.ts), same pattern as the products cap.

## Security
Same owner-scoped RLS pattern as every other tenant table: authenticated
users can only read/write rows belonging to a tenant they own.
*/

ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS clicked_count integer DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS revenue_cents bigint DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS currency text DEFAULT 'XOF';

ALTER TABLE customers ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS segment text DEFAULT 'new';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes text;
DROP POLICY IF EXISTS "delete_own_customers" ON customers;
CREATE POLICY "delete_own_customers" ON customers FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = customers.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text,
  type text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  currency text,
  min_order numeric,
  usage_limit integer,
  used_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_discounts" ON discounts;
CREATE POLICY "select_own_discounts" ON discounts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discounts.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_discounts" ON discounts;
CREATE POLICY "insert_own_discounts" ON discounts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discounts.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_discounts" ON discounts;
CREATE POLICY "update_own_discounts" ON discounts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discounts.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discounts.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_discounts" ON discounts;
CREATE POLICY "delete_own_discounts" ON discounts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = discounts.tenant_id AND tenants.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  status text NOT NULL DEFAULT 'invited',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_active timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, email)
);
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_staff" ON staff_members;
CREATE POLICY "select_own_staff" ON staff_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = staff_members.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_staff" ON staff_members;
CREATE POLICY "insert_own_staff" ON staff_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = staff_members.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_staff" ON staff_members;
CREATE POLICY "update_own_staff" ON staff_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = staff_members.tenant_id AND tenants.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = staff_members.tenant_id AND tenants.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_staff" ON staff_members;
CREATE POLICY "delete_own_staff" ON staff_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = staff_members.tenant_id AND tenants.owner_id = auth.uid()));

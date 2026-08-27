/*
# Products & Orders dashboard sync

## Summary
Reconnects the Products and Orders merchant dashboards to real Supabase
data. Adds the columns the frontend already relies on (category,
subcategory, images gallery, human-readable order number, payment method,
denormalized line items) without touching any existing column, so no
existing row or query is broken.

## Security
- Existing owner-scoped RLS policies on products/orders are untouched.
- Adds one new policy: anonymous (public) read access to *active* products
  only, needed so the public storefront can eventually read the catalog
  directly from Supabase. Inactive/out-of-stock products and all other
  tables remain invisible to anon.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "public_select_active_products" ON products;
CREATE POLICY "public_select_active_products" ON products
  FOR SELECT TO anon
  USING (status = 'active');

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;

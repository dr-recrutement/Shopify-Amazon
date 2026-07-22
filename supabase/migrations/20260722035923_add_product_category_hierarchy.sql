-- Add hierarchy + metadata columns to product_categories
ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE;

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Helpful indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_product_categories_parent
  ON product_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_tenant
  ON product_categories(tenant_id);

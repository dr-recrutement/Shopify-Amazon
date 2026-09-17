/*
# Product variants + metafields columns

## Summary
Adding real product variants (Taille/Couleur option groups). Found while
building this that `metafields` was already a real, working feature in
the frontend (StoreProduct.metafields, rendered in the product form) but
had NO column here at all — productToRow()/rowToProduct() in
tenant-sync.ts never included it, so metafield values were silently
dropped on every cloud sync and lost the moment a merchant reloaded on
a different device. Fixing both in one migration since it's the exact
same gap.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS metafields jsonb NOT NULL DEFAULT '{}'::jsonb;

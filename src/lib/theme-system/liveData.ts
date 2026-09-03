// Bridges this theme-system's JSON schema to the store's real data. Preset
// JSON (presets.ts) ships with illustrative sample products so the presets
// are viewable stand-alone, but a live storefront must show the merchant's
// actual catalog — never the sample data — so `withLiveProducts` swaps it in.

import type { StoreProduct } from '../app-state';
import { getProductImage } from '../app-state';
import type { ProductItem, ProductGridContent, Section, ThemeConfig } from './types';

/** Deterministic inline SVG placeholder (no external requests) for products
 *  without an uploaded image, so the grid never shows a broken <img>. */
function placeholderImageDataUri(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const initial = (seed.trim()[0] || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="hsl(${hue},45%,88%)"/><text x="150" y="168" font-family="sans-serif" font-size="96" font-weight="700" fill="hsl(${hue},35%,55%)" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function productToItem(p: StoreProduct): ProductItem {
  const image = getProductImage(p);
  return {
    id: p.id,
    name: p.name,
    imageUrl: image || placeholderImageDataUri(p.name || p.id),
    price: p.price,
    currency: p.currency,
    // No "promo"/"nouveau" signal exists on StoreProduct yet (no discount
    // or creation-date field) — left null rather than faking one.
    badge: null,
  };
}

/** Returns a copy of `config` where every `productGrid` section's
 *  `content.products` is replaced by the tenant's real, active products
 *  (title/subtitle/columns from the preset are kept). A `productGrid`
 *  section is simply omitted from real product data if the store has no
 *  active products yet, rather than falling back to the sample items. */
export function withLiveProducts(config: ThemeConfig, products: StoreProduct[]): ThemeConfig {
  const live = products.filter((p) => p.status === 'active').map(productToItem);
  const sections: Section[] = config.sections.map((section) => {
    if (section.type !== 'productGrid') return section;
    const content: ProductGridContent = { ...section.content, products: live.slice(0, section.content.columns * 3) };
    return { ...section, content };
  });
  return { ...config, sections };
}

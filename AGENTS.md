# LiAfrik "Os" — Shopify-aligned SaaS e-commerce platform

## Stack
- React 18 + TypeScript + Vite + Tailwind CSS
- lucide-react icons, react-router-dom 7
- Backend: Supabase (multi-mode: real or local fallback when not configured)
- State: localStorage via tenant-scoped keys (`getTenantStorageKey`)

## Architecture (Shopify Online Store 2.0 alignment)
The platform mirrors Shopify's theme architecture. Do NOT rename concepts away from Shopify naming.

### Theme engine (`src/lib/theme-engine.tsx`)
- `ThemeConfig`, `ThemeSection`, `SectionType`, `SiteType`, `ThemePreset`
- `SectionType` union includes all Shopify Dawn sections:
  announcement-bar, header, image-banner, slideshow, hero-banner,
  featured-collection, collection-list, multicolumn, image-with-text,
  rich-text, collapsible-content, video, email-signup, contact-form,
  product-grid, category-grid, single-product, countdown, testimonials,
  social-bar, footer, chat-float, etc.
- `SECTION_LIBRARY` groups sections (Structure, Hero/Banner, Products, Content, Commerce, Engagement) with Shopify naming
- `renderSection()` is the router switch — add new section cases here
- `defaultThemeForType(siteType)` returns a Dawn-style ordered section stack per site type
- `THEME_PRESETS`: african, luxury, tech, minimal, food, fashion (legacy preset color sets)

### Online Store editor (`src/pages/dashboard/OnlineStore.tsx`)
- `CUSTOM_PRESETS` = real Shopify Theme Store themes (Dawn, Refresh, Spotlight, Crave,
  Sense, Taste, Craft, Colorblock, Studio, Origin, Publisher, + Dawn African Vibrant).
  All free Shopify themes are Dawn-based; each is just a color/typography preset.
- Panels: themes, sections (add/remove/reorder + section editors), design, pages, domains, inbox
- Preview maps real store products/categories into `featured-collection` and `collection-list`
- Section editor panels exist for every Shopify section type (image-banner, slideshow,
  multicolumn, image-with-text, rich-text, collapsible-content, announcement-bar, video, etc.)

### CMS (`src/lib/cms.ts` + `src/pages/dashboard/Content.tsx`)
- `CmsTemplate`: index, product, collection, list-collections, cart, page, blog, article,
  404, search, password, landing, about, contact, faq, custom (mirrors Shopify JSON templates)
- `CmsBlock` / `CmsSection` / `osSections` model = Shopify sections + blocks + block_order
- `SHOPIFY_TEMPLATES` and `SHOPIFY_BLOCK_TYPES` exported lists drive the editor dropdowns
- `addBlock` / `removeBlock` helpers for OS 2.0 block manipulation
- `defaultOsSections(template)` returns a Shopify-style main section stack per template

### Admin themes (`src/pages/admin/AdminThemes.tsx`)
- Lists the real Shopify Theme Store catalog with industries (Dawn, Refresh, Spotlight, etc.)
- Documents OS 2.0 architecture (JSON templates, sections everywhere, app blocks, metafields)

### Storefront (`src/pages/StorefrontPage.tsx`)
- Public-facing e-commerce page at `/store` or `/s/:slug` (custom domain)
- Renders merchant's live theme sections with REAL catalog products (active only)
- Fully functional e-commerce (not just a landing page):
  - **Cart drawer** (slide-in from right): add to cart, qty +/-, remove, subtotal, persisted via `getCartItems`/`saveCartItems`
  - **Checkout modal**: customer form (name, phone, email, address, city) + 4 payment methods (Orange Money, Wave, MTN MoMo, Carte bancaire) + order summary + confirmation screen
  - **Real order creation** via `saveOrder()` — orders appear in dashboard `/app/orders` list
  - **Functional search**: live product filtering with add-to-cart from search results
  - Cart count badge in header, mobile nav, announcement bar, full footer
- `renderSection(section, theme, { onAddToCart })` — callbacks param wires buy buttons to cart
- ProductGridSection passes `onAddToCart` to all 3 card variants (default, editorial, luxury)

### Data persistence (`src/lib/app-state.ts`)
- Tenant-scoped localStorage layer: products, orders, customers, discounts, staff,
  automations, markets, reports, campaigns, chat threads, cart items, shop profile, theme
- `getActiveCatalogProducts()` returns active products mapped to `CatalogProductCard` shape
- `saveOrder()` / `getOrders()` — orders created from storefront checkout appear in dashboard
- `getCartItems()` / `saveCartItems()` — cart persistence across page reloads
- `getProductImage()` / `getProductImages()` — primary image + full gallery from uploaded base64

## Auth (`src/lib/supabase.ts`)
- `isSupabaseConfigured` = env vars present. When false, local mode auto-activates.
- `setLocalAuthMode(true)` forces local mode (used by "Explorer Démo" on login page).
- Local client persists session in `liafrikos_auth_session` localStorage key.
- Admin routes (`adminOnly`) redirect non-super-admin users to `/app`.

## Commands
- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit -p tsconfig.app.json` (must pass)
- `npm run lint` — eslint
- `npx vitest run` — test suite (`src/lib/*.test.ts`)

## Conventions
- French UI copy (the platform targets Francophone Africa). Keep user-facing strings in French.
- Money formatting via `formatCurrency()` (FCFA / CFA).
- When adding a new section type: extend `SectionType`, add to `SECTION_LIBRARY`, add a
  renderer before `renderSection`, add a case in the switch, add defaults in
  `defaultThemeForType`, and add an editor panel block in `OnlineStore.tsx`.
- Keep backward compat: existing stored theme/CMS data must keep loading. New optional
  fields (e.g. `osSections`, `group`) are additive.
- Do NOT break existing tests in `src/lib/theme-engine.test.ts`.

## Verification done
- typecheck passes (exit 0)
- build passes (3.25s, dist produced)
- vitest passes (12/12)
- Visual QA in browser (2026-08-08):
  - Online Store editor renders Dawn sections, theme picker shows real Shopify themes
  - CMS shows Shopify JSON templates + block types
  - Storefront: add to cart → cart drawer opens, qty +/- works, total updates
  - Storefront: checkout form filled → order confirmed (LA-201663)
  - Dashboard /app/orders: order LA-201663 visible with customer, total, payment method
  - Storefront: search "robe" → returns "Robe wax traditionnelle" product with add-to-cart
  - All colors use Shopify green (#008060), no orange in UI

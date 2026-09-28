// Sellia's own content-marketing hub ("Guides"), distinct from the
// merchant-facing blog CMS at /blog (used by merchants to write posts for
// their own storefront). This is Sellia's public editorial content aimed
// at ranking for buyer-intent, platform-comparison and Africa-e-commerce
// search queries.
//
// Only the language-independent metadata (slug, date) lives here now.
// Title, excerpt and body text come from the i18n locale files
// (pages.guides[index]) so every guide is available in all 7 languages;
// `index` here is the position in that array, kept in the same order.
export const GUIDES = [
  { slug: 'choisir-plateforme-ecommerce-afrique-2026', date: '2026-01-12', index: 0 },
  { slug: 'migrer-boutique-vers-sellia', date: '2026-02-03', index: 1 },
  { slug: 'paiements-mobile-money-guide-ecommerce', date: '2026-02-20', index: 2 },
];

export function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug);
}

// Merges a guide's metadata with its translated text for the current
// language. `t` is react-i18next's translate function.
export function localizeGuide(guide, t) {
  const texts = t('pages.guides', { returnObjects: true });
  const text = texts[guide.index] || {};
  return { ...guide, title: text.title, excerpt: text.excerpt, body: text.body || [] };
}

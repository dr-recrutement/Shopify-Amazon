// Lightweight, dependency-free SEO helper. This is a client-rendered SPA
// (no SSR), so these tags land after first paint - real for crawlers that
// execute JS (Googlebot does), not a substitute for server-rendered meta
// for crawlers that don't. Every storefront page was sharing the single
// static <title>/<meta> from index.html before this - no store, product,
// or blog post had its own SEO identity at all.

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLink(rel, href, extraAttrs = {}) {
  let selector = `link[rel="${rel}"]`;
  if (extraAttrs.hreflang) selector += `[hreflang="${extraAttrs.hreflang}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    Object.entries(extraAttrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// Country -> primary language, for the handful of locales this platform's
// merchants actually operate in. Falls back to French (the app's own UI
// language) rather than guessing wrong for an unlisted country.
const COUNTRY_LANG = {
  SN: 'fr', CI: 'fr', ML: 'fr', BF: 'fr', TG: 'fr', BJ: 'fr', NE: 'fr', GN: 'fr', CD: 'fr', CM: 'fr', GA: 'fr', CG: 'fr', FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr',
  NG: 'en', GH: 'en', KE: 'en', UG: 'en', TZ: 'en', ZA: 'en', US: 'en', GB: 'en', IE: 'en', AU: 'en', IN: 'en', NZ: 'en',
  MA: 'ar', DZ: 'ar', TN: 'ar', EG: 'ar', SA: 'ar', AE: 'ar',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', CL: 'es',
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt',
};

export function langForCountry(countryCode) {
  return COUNTRY_LANG[countryCode] || 'fr';
}

/**
 * Applies a full SEO pass for the current page: title, meta description,
 * canonical, Open Graph + Twitter card, html[lang], and (when the store's
 * country is known) an hreflang alternate for that language pointing at
 * this same page - the actual "international SEO" signal: which
 * language/region this content targets, not a promise of a real
 * translation.
 */
export function applySEO({ title, description, image, url, countryCode, type = 'website', favicon }) {
  if (title) document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:url', url || window.location.href);
  if (image) setMeta('property', 'og:image', image);
  setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);

  const canonicalUrl = url || window.location.href;
  setLink('canonical', canonicalUrl);

  const lang = langForCountry(countryCode);
  document.documentElement.lang = lang;
  setLink('alternate', canonicalUrl, { hreflang: lang });
  setLink('alternate', canonicalUrl, { hreflang: 'x-default' });

  // A merchant's storefront gets its own favicon when they've set one in
  // Theme Editor - otherwise leaves Sellia's own favicon (set in
  // index.html) alone, rather than blanking the tab icon.
  if (favicon) setLink('icon', favicon);
}

export function applyStoreJsonLd({ name, description, url, logo, currency }) {
  setJsonLd('sellia-jsonld-store', {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name,
    description,
    url,
    ...(logo ? { logo, image: logo } : {}),
    ...(currency ? { priceRange: '$$', currenciesAccepted: currency } : {}),
  });
}

export function applyProductListJsonLd(products, storeUrl) {
  if (!products?.length) return;
  setJsonLd('sellia-jsonld-products', {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.title,
        image: p.image || undefined,
        offers: {
          '@type': 'Offer',
          price: p._price,
          priceCurrency: p._currency,
          availability: 'https://schema.org/InStock',
        },
        url: storeUrl,
      },
    })),
  });
}

export function applyArticleJsonLd({ headline, description, datePublished, author, url }) {
  setJsonLd('sellia-jsonld-article', {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    datePublished,
    author: author ? { '@type': 'Person', name: author } : undefined,
    url,
  });
}

// Sellia's official brand entity + social profiles, for Organization schema.
// This is the single signal (alongside identical NAP/social links in the
// footer) that tells Google and AI answer engines "Sellia" and
// "sellia.liafrik.com" refer to the same real company — without it, brand
// and comparison queries have nothing consistent to anchor an entity to.
export const ORG_URL = 'https://sellia.liafrik.com';
export const ORG_SOCIALS = [
  'https://www.linkedin.com/company/liafrik/',
  'https://www.facebook.com/share/1GucXLzGvb/?mibextid=wwXIfr',
  'https://www.instagram.com/liafrik_tech',
  'https://www.tiktok.com/@liafriktech',
];
export const SUPPORT_EMAIL = 'support@liafrik.com';
export const CS_EMAIL = 'cs@liafrik.com';

/**
 * Organization + SoftwareApplication JSON-LD, meant to run once on every
 * page (Landing calls it, and MarketingLayout calls it for every marketing
 * page) so the entity graph is present site-wide, not just on the home
 * page - comparison pages in particular need it since they're the pages
 * most likely to be the first Sellia page a crawler or AI model ever sees.
 */
export function applyOrganizationJsonLd() {
  setJsonLd('sellia-jsonld-org', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sellia',
    alternateName: 'Sellia by Liafrik',
    url: ORG_URL,
    logo: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/d3d2a132c_Sellia.png',
    description: "Sellia est la plateforme e-commerce premium pour créer, gérer et développer une boutique en ligne — une alternative complète à Shopify, BigCommerce, PrestaShop, WooCommerce, Odoo et Wix, pensée pour les marchands du monde entier.",
    sameAs: ORG_SOCIALS,
    email: SUPPORT_EMAIL,
    contactPoint: [
      { '@type': 'ContactPoint', contactType: 'customer support', email: SUPPORT_EMAIL, availableLanguage: ['French', 'English'] },
      { '@type': 'ContactPoint', contactType: 'customer service', email: CS_EMAIL, availableLanguage: ['French', 'English'] },
    ],
  });
  setJsonLd('sellia-jsonld-software', {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Sellia',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: ORG_URL,
    offers: { '@type': 'Offer', price: '7', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '1200' },
  });
}

export function applyFAQJsonLd(id, faqs) {
  if (!faqs?.length) return;
  setJsonLd(id, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });
}

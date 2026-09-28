// Language-independent competitor registry for the "/alternative-a-<slug>"
// comparison pages. Brand names are proper nouns and never translated.
//
// All translated copy (meta title/description, intro, pain points, and the
// comparison table rows) lives in the locale files under
// pages.alternative.brands.<slug>, so each of the six pages is available in
// all 7 languages. Each entry's copy is still written independently
// (rather than templated from a shared paragraph) so the pages don't read
// as duplicate content to search engines.
export const COMPETITORS = {
  shopify: { name: 'Shopify', slug: 'shopify' },
  bigcommerce: { name: 'BigCommerce', slug: 'bigcommerce' },
  prestashop: { name: 'PrestaShop', slug: 'prestashop' },
  woocommerce: { name: 'WooCommerce', slug: 'woocommerce' },
  odoo: { name: 'Odoo', slug: 'odoo' },
  wix: { name: 'Wix', slug: 'wix' },
};

export const COMPETITOR_LIST = Object.values(COMPETITORS);

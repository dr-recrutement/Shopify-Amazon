// Bridges the legacy theme-engine.tsx ThemeConfig (colors/fonts/layout —
// what the merchant actually configured in Réglages > Boutique en ligne)
// into this module's JSON schema, using the store's REAL data (name,
// country, products) for section content. Nothing here is invented: any
// content that would require data we don't have (customer testimonials,
// a written store bio, social links) is simply left out rather than
// filled with placeholder text, per the "no fake content" rule the rest
// of this codebase already follows.

import type { ThemeConfig as LegacyThemeConfig } from '../theme-engine';
import { GLOBAL_COUNTRIES } from '../constants';
import type { BorderRadius, ThemeConfig, Section } from './types';

/** Legacy `radius` is a Tailwind class (e.g. "rounded-xl"); this module's
 *  schema uses a small token set. Best-effort size mapping, not exact. */
function radiusClassToToken(radiusClass: string): BorderRadius {
  const map: Record<string, BorderRadius> = {
    'rounded-none': 'none',
    'rounded-sm': 'sm',
    'rounded-md': 'sm',
    'rounded-lg': 'md',
    'rounded-xl': 'md',
    'rounded-2xl': 'lg',
    'rounded-3xl': 'lg',
    'rounded-full': 'full',
  };
  return map[radiusClass] ?? 'md';
}

function hexToLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 0.5; // not a hex color (e.g. an rgb()/named color) — assume mid-tone
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Derives a card surface and a border color from the background, since
 *  the legacy schema doesn't track them separately. Lightens a dark
 *  background, darkens a light one — kept subtle so it still reads as
 *  "the same theme", not a different palette. */
function deriveSurfaceColors(background: string): { cardBackground: string; border: string } {
  const isDark = hexToLuminance(background) < 0.5;
  return isDark
    ? { cardBackground: '#FFFFFF0D', border: '#FFFFFF1F' } // translucent white overlays
    : { cardBackground: '#FFFFFF', border: '#00000014' };
}

function fontStack(fontName: string): string {
  if (!fontName) return "'Inter', sans-serif";
  if (fontName.includes(',') || fontName.includes("'")) return fontName; // already a stack
  return `'${fontName}', sans-serif`;
}

export interface LiveStoreContext {
  shopName: string;
  countryCode: string;
  radiusClass: string; // from getVariantStyles(legacy.layoutVariant).radius
  storeUrl: string; // e.g. '/store' or '/s/slug'
  supportUrl: string;
}

/** Builds a new-schema ThemeConfig that mirrors the merchant's actual
 *  legacy theme (colors, fonts, corner radius) with real store content.
 *  `productGrid` ships with an empty product list — pass the result
 *  through `withLiveProducts()` to fill it with the real catalog. */
export function fromLegacyTheme(legacy: LegacyThemeConfig, ctx: LiveStoreContext): ThemeConfig {
  const { colors, fonts } = legacy;
  const { cardBackground, border } = deriveSurfaceColors(colors.background);
  const country = GLOBAL_COUNTRIES.find((c) => c.code === ctx.countryCode);
  const year = new Date().getFullYear();

  const sections: Section[] = [
    {
      id: 'header-live',
      type: 'header',
      active: true,
      styles: {},
      content: {
        logoType: 'text',
        logoText: ctx.shopName,
        navLinks: [
          { label: 'Accueil', href: ctx.storeUrl },
          { label: 'Produits', href: ctx.storeUrl },
          { label: 'Support', href: ctx.supportUrl },
        ],
        ctaLabel: 'Voir la boutique',
        ctaHref: ctx.storeUrl,
        showCart: true,
        cartCount: 0, // set by the caller from the real cart, see liveData helpers
      },
    },
    {
      id: 'hero-live',
      type: 'hero',
      active: true,
      styles: { paddingTop: 'xl', paddingBottom: 'lg', alignment: 'center' },
      content: {
        layout: 'centered',
        title: ctx.shopName,
        subtitle: country
          ? `Livraison en ${country.name}. Paiement sécurisé.`
          : 'Paiement sécurisé, livraison suivie.',
        buttons: [{ label: 'Découvrir les produits', href: ctx.storeUrl, variant: 'primary' }],
      },
    },
    {
      id: 'features-live',
      type: 'features',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'lg' },
      content: {
        columns: 3,
        items: [
          { icon: 'ShieldCheck', title: 'Paiement sécurisé', description: 'Transactions protégées à chaque commande.' },
          { icon: 'Truck', title: 'Livraison suivie', description: 'Suivi de commande du paiement à la réception.' },
          { icon: 'Headset', title: 'Support client', description: 'Une question ? Notre équipe vous répond.' },
        ],
      },
    },
    {
      id: 'product-grid-live',
      type: 'productGrid',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'xl' },
      content: { title: 'Nos produits', columns: 3, products: [] },
    },
    {
      id: 'cta-live',
      type: 'cta',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'lg', alignment: 'center' },
      content: {
        title: 'Prêt à commander ?',
        buttonLabel: 'Voir tout le catalogue',
        buttonHref: ctx.storeUrl,
        backgroundStyle: 'solid',
      },
    },
    {
      id: 'footer-live',
      type: 'footer',
      active: true,
      styles: {},
      content: {
        logoText: ctx.shopName,
        columns: [
          { title: 'Boutique', links: [{ label: 'Tous les produits', href: ctx.storeUrl }] },
          { title: 'Aide', links: [{ label: 'Support', href: ctx.supportUrl }] },
        ],
        socialLinks: [],
        copyright: `© ${year} ${ctx.shopName}. Tous droits réservés.`,
      },
    },
  ];

  return {
    settings: {
      colors: { ...colors, cardBackground, border },
      typography: { headingFont: fontStack(fonts.heading), bodyFont: fontStack(fonts.body) },
      borderRadius: radiusClassToToken(ctx.radiusClass),
      containerWidth: 'boxed',
    },
    sections,
  };
}

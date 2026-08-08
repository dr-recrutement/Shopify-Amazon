import { describe, expect, it } from 'vitest';
import { sectionsForVariantPublic, defaultThemeForType, type LayoutVariant } from './theme-engine';

describe('theme variants — distinct templates per Shopify theme', () => {
  const stubNames = [
    'announcementBarSection', 'headerSection', 'imageBannerSection', 'heroSection',
    'imageWithTextSection', 'multicolumnSection', 'richTextSection', 'aboutSection',
    'featuredCollectionSection', 'collectionListSection', 'countdownSection',
    'productDetailSection', 'testimonialsSection', 'collapsibleContentSection',
    'contactFormSection', 'emailSignupSection', 'newsletterSection', 'paymentsSection',
    'footerSection', 'socialBarSection', 'chatFloatSection', 'slideshowSection',
  ];
  const stubs: Record<string, any> = {};
  stubNames.forEach(n => { stubs[n] = { id: n, type: n, blocks: [], block_order: [], settings: {} }; });

  const variants: LayoutVariant[] = ['dawn', 'refresh', 'spotlight', 'crave', 'sense', 'craft', 'colorblock', 'studio', 'publisher', 'taste'];

  it('produces a DISTINCT section arrangement for each of the 10 Shopify themes', () => {
    const fingerprints = variants.map(v => sectionsForVariantPublic(v, stubs).map(s => s.id).join('|'));
    const unique = new Set(fingerprints);
    expect(unique.size).toBe(variants.length);
  });

  it('each variant has a different number of sections or different order', () => {
    const counts = variants.map(v => sectionsForVariantPublic(v, stubs).length);
    // At least 3 different section counts across variants (proves structural diversity)
    const uniqueCounts = new Set(counts);
    expect(uniqueCounts.size).toBeGreaterThanOrEqual(3);
  });

  it('defaultThemeForType returns variant-specific sections', () => {
    const ecommerce = defaultThemeForType('ecommerce');
    const landing = defaultThemeForType('landing');
    // Different site types → different presets → different layout variants → different sections
    expect(ecommerce.layoutVariant).toBe('crave');
    expect(landing.layoutVariant).toBe('studio');
    const ecommerceFingerprint = ecommerce.sections.map(s => s.type).join('|');
    const landingFingerprint = landing.sections.map(s => s.type).join('|');
    expect(ecommerceFingerprint).not.toBe(landingFingerprint);
  });
});

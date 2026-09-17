import { describe, expect, it } from 'vitest';
import { sectionsForVariantPublic, defaultThemeForType, TEMPLATE_PROFILES, type LayoutVariant } from './theme-engine';

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

  const legacyVariants: LayoutVariant[] = ['dawn', 'refresh', 'spotlight', 'crave', 'sense', 'craft', 'colorblock', 'studio', 'publisher', 'taste'];

  it('produces a DISTINCT section arrangement for each of the 10 legacy Shopify themes', () => {
    const fingerprints = legacyVariants.map(v => sectionsForVariantPublic(v, stubs).map(s => s.id).join('|'));
    const unique = new Set(fingerprints);
    expect(unique.size).toBe(legacyVariants.length);
  });

  it('each legacy variant has a different number of sections or different order', () => {
    const counts = legacyVariants.map(v => sectionsForVariantPublic(v, stubs).length);
    const uniqueCounts = new Set(counts);
    expect(uniqueCounts.size).toBeGreaterThanOrEqual(3);
  });

  it('defaultThemeForType returns variant-specific sections', () => {
    const ecommerce = defaultThemeForType('ecommerce');
    const landing = defaultThemeForType('landing');
    expect(ecommerce.layoutVariant).toBe('crave');
    expect(landing.layoutVariant).toBe('studio');
    const ecommerceFingerprint = ecommerce.sections.map(s => s.type).join('|');
    const landingFingerprint = landing.sections.map(s => s.type).join('|');
    expect(ecommerceFingerprint).not.toBe(landingFingerprint);
  });
});

describe('professional templates — distinct use cases', () => {
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

  // Not pinned to a literal count: templates get added over time (see
  // the 'liyah' addition), and what actually matters is that whatever
  // set exists stays fully distinct - no two templates sharing a layout,
  // label, use case, icon, or section arrangement.
  it('exposes at least the 5 original template profiles', () => {
    expect(TEMPLATE_PROFILES.length).toBeGreaterThanOrEqual(5);
  });

  it('each template has a distinct layoutVariant, label, useCase and icon', () => {
    const variants = new Set(TEMPLATE_PROFILES.map(p => p.layoutVariant));
    const labels = new Set(TEMPLATE_PROFILES.map(p => p.label));
    const useCases = new Set(TEMPLATE_PROFILES.map(p => p.useCase));
    const icons = new Set(TEMPLATE_PROFILES.map(p => p.icon));
    const n = TEMPLATE_PROFILES.length;
    expect(variants.size).toBe(n);
    expect(labels.size).toBe(n);
    expect(useCases.size).toBe(n);
    expect(icons.size).toBe(n);
  });

  it('every template produces a DISTINCT section arrangement', () => {
    const fingerprints = TEMPLATE_PROFILES.map(p =>
      sectionsForVariantPublic(p.layoutVariant, stubs).map(s => s.id).join('|')
    );
    const unique = new Set(fingerprints);
    expect(unique.size).toBe(TEMPLATE_PROFILES.length);
  });

  it('templates cover the original 5 required use cases', () => {
    const useCases = TEMPLATE_PROFILES.map(p => p.useCase);
    expect(useCases).toContain('E-commerce');
    expect(useCases).toContain('Site vitrine');
    expect(useCases).toContain('Business / Corporate');
    expect(useCases).toContain('Services');
    expect(useCases).toContain('Créatif / Magazine / Blog');
  });

  it('defaultThemeForType with presetOverride produces the right layoutVariant', () => {
    const ecommerce = defaultThemeForType('ecommerce', 'ecommerce-pro');
    const vitrine = defaultThemeForType('business', 'vitrine');
    const creative = defaultThemeForType('landing', 'creative-magazine');
    expect(ecommerce.layoutVariant).toBe('ecommerce-pro');
    expect(vitrine.layoutVariant).toBe('vitrine');
    expect(creative.layoutVariant).toBe('creative-magazine');
    // Each produces a different section fingerprint
    const fp = [ecommerce, vitrine, creative].map(t => t.sections.map(s => s.type).join('|'));
    expect(new Set(fp).size).toBe(3);
  });

  it('Liyah is a real, distinct, sharp-cornered template', () => {
    const liyah = defaultThemeForType('ecommerce', 'liyah');
    expect(liyah.layoutVariant).toBe('liyah');
    expect(liyah.cornerRadius).toBe('sharp');
    expect(liyah.sections.length).toBeGreaterThan(0);
    // Not the same arrangement as any existing template
    const others = TEMPLATE_PROFILES.filter(p => p.id !== 'liyah').map(p =>
      sectionsForVariantPublic(p.layoutVariant, stubs).map(s => s.id).join('|')
    );
    const liyahFingerprint = sectionsForVariantPublic('liyah', stubs).map(s => s.id).join('|');
    expect(others).not.toContain(liyahFingerprint);
  });
});


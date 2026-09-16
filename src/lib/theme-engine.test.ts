import { describe, expect, it } from 'vitest';
import { defaultThemeForType, renderSection, THEME_PRESETS, getTemplateSections, setTemplateSections, deviceViewportWidth } from './theme-engine';

describe('theme engine', () => {
  it('creates professional presets per site type', () => {
    const ecommerceTheme = defaultThemeForType('ecommerce');
    const landingTheme = defaultThemeForType('landing');

    expect(ecommerceTheme.preset).toBe('african');
    expect(landingTheme.preset).toBe('luxury');
    // Shopify-aligned palette — green #008060 family, no orange
    expect(THEME_PRESETS.luxury.colors.primary).toBe('#1B1B1B');
    expect(THEME_PRESETS.universal.colors.primary).toBe('#008060');
    expect(landingTheme.layoutVariant).toBe('studio');
    expect(ecommerceTheme.layoutVariant).toBe('crave');
  });

  it('renders sections with a theme object', () => {
    const theme = defaultThemeForType('business');
    const output = renderSection(theme.sections[1], theme);

    expect(output).toBeTruthy();
    expect(typeof output).toBe('object');
  });

  // Multi-template editing must not break any already-stored theme: 'home'
  // stays backed by theme.sections, other templates live in theme.templates.
  it('maps the home template to theme.sections and leaves stored themes intact', () => {
    const theme = defaultThemeForType('ecommerce');
    expect(getTemplateSections(theme, 'home')).toBe(theme.sections);

    const edited = setTemplateSections(theme, 'home', theme.sections.slice(0, 1));
    expect(edited.sections).toHaveLength(1);
    expect(edited.templates).toBeUndefined();
  });

  it('stores non-home templates separately without touching sections', () => {
    const theme = defaultThemeForType('ecommerce');
    const originalHome = theme.sections;

    // An untouched template falls back to a sensible default stack.
    const productDefault = getTemplateSections(theme, 'product');
    expect(productDefault.length).toBeGreaterThan(0);

    const edited = setTemplateSections(theme, 'product', productDefault.slice(0, 2));
    expect(edited.sections).toBe(originalHome);
    expect(getTemplateSections(edited, 'product')).toHaveLength(2);
  });

  // Regression guard. The preview renders in an iframe, so these widths ARE
  // the viewport CSS media queries resolve against. A shipped bug had the
  // container shrink-to-fit, collapsing the iframe to its 300px intrinsic
  // default so Desktop rendered as a phone. These assertions pin each mode
  // into a distinct Tailwind breakpoint band so two modes can never again
  // silently render the same layout.
  it('gives each preview device a viewport in a distinct breakpoint band', () => {
    const mobile = deviceViewportWidth('mobile');
    const tablet = deviceViewportWidth('tablet');

    // Desktop means "full available width", not a fixed number.
    expect(deviceViewportWidth('desktop')).toBeNull();

    // Mobile must stay below sm(640) so no sm:/md:/lg: rule activates.
    expect(mobile).not.toBeNull();
    expect(mobile as number).toBeLessThan(640);

    // Tablet must be >= md(768) or md: rules never fire and tablet would
    // render identically to mobile — and < lg(1024) so it isn't desktop.
    expect(tablet).not.toBeNull();
    expect(tablet as number).toBeGreaterThanOrEqual(768);
    expect(tablet as number).toBeLessThan(1024);

    expect(tablet as number).toBeGreaterThan(mobile as number);
  });
});

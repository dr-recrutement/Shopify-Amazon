import { describe, expect, it } from 'vitest';
import { defaultThemeForType, renderSection, THEME_PRESETS } from './theme-engine';

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
});

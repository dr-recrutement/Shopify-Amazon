import { describe, expect, it } from 'vitest';
import { renderSection } from './TemplateRenderer';
import { themePresets, ecommercePreset, saasLandingPreset, businessPreset } from './presets';
import { productToItem, withLiveProducts } from './liveData';
import type { StoreProduct } from '../app-state';
import type { Section } from './types';

describe('theme-system presets', () => {
  it('exposes the three documented presets', () => {
    expect(Object.keys(themePresets).sort()).toEqual(['business', 'ecommerce', 'saasLanding']);
  });

  it.each([
    ['ecommerce', ecommercePreset],
    ['saasLanding', saasLandingPreset],
    ['business', businessPreset],
  ] as const)('renders every section of the %s preset without throwing', (_name, preset) => {
    for (const section of preset.sections) {
      const output = renderSection(section);
      expect(output).toBeTruthy();
    }
  });

  it('every section in every preset has a unique id', () => {
    for (const preset of Object.values(themePresets)) {
      const ids = preset.sections.map((s: Section) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('withLiveProducts', () => {
  const products: StoreProduct[] = [
    { id: 'real-1', name: 'Robe wax', price: 15000, stock: 12, status: 'active', currency: 'XOF', images: ['data:image/png;base64,abc'] },
    { id: 'real-2', name: 'Sac cuir', price: 25000, stock: 5, status: 'active', currency: 'XOF' },
    { id: 'real-3', name: 'Épuisé', price: 8000, stock: 0, status: 'out_of_stock', currency: 'XOF' },
  ];

  it('replaces sample productGrid content with real, active products only', () => {
    const live = withLiveProducts(ecommercePreset, products);
    const grid = live.sections.find((s) => s.type === 'productGrid');
    expect(grid).toBeTruthy();
    if (grid?.type !== 'productGrid') throw new Error('expected productGrid section');
    const ids = grid.content.products.map((p) => p.id);
    expect(ids).toContain('real-1');
    expect(ids).toContain('real-2');
    expect(ids).not.toContain('real-3'); // out of stock, excluded
    // the sample preset's own placeholder product ids must be gone
    const originalGrid = ecommercePreset.sections.find((s) => s.type === 'productGrid');
    if (originalGrid?.type === 'productGrid') {
      const originalIds = originalGrid.content.products.map((p) => p.id);
      expect(ids.some((id) => originalIds.includes(id))).toBe(false);
    }
  });

  it('leaves non-productGrid sections untouched', () => {
    const live = withLiveProducts(ecommercePreset, products);
    const header = live.sections.find((s) => s.type === 'header');
    const originalHeader = ecommercePreset.sections.find((s) => s.type === 'header');
    expect(header).toEqual(originalHeader);
  });
});

describe('productToItem', () => {
  it('uses the product image when present', () => {
    const item = productToItem({ id: 'p1', name: 'Test', price: 1000, stock: 1, status: 'active', currency: 'XOF', images: ['data:image/png;base64,xyz'] });
    expect(item.imageUrl).toBe('data:image/png;base64,xyz');
  });

  it('falls back to a generated placeholder when there is no image', () => {
    const item = productToItem({ id: 'p1', name: 'Test', price: 1000, stock: 1, status: 'active', currency: 'XOF' });
    expect(item.imageUrl.startsWith('data:image/svg+xml')).toBe(true);
  });
});

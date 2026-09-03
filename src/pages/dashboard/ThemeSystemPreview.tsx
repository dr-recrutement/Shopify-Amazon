import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Monitor, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { PageHeader, Card, Button, Badge } from './ui';
import { TemplateRenderer } from '../../lib/theme-system/TemplateRenderer';
import { withLiveProducts } from '../../lib/theme-system/liveData';
import { fromLegacyTheme } from '../../lib/theme-system/fromLegacyTheme';
import { ecommercePreset, saasLandingPreset, businessPreset } from '../../lib/theme-system/presets';
import type { ThemeConfig as NewThemeConfig } from '../../lib/theme-system/types';
import { defaultThemeForType, getVariantStyles, type ThemeConfig as LegacyThemeConfig } from '../../lib/theme-engine';
import { fetchCloudTheme } from '../../lib/tenant-sync';
import {
  getShopProfile, getTenantStorageKey, getProducts, getShopSubdomain,
  getCartItems, saveCartItems, type CartItem, type StoreProduct,
} from '../../lib/app-state';

type SourceMode = 'mine' | 'ecommerce' | 'saasLanding' | 'business';

const SAMPLE_PRESETS: Record<Exclude<SourceMode, 'mine'>, { label: string; config: NewThemeConfig }> = {
  ecommerce: { label: 'E-commerce', config: ecommercePreset },
  saasLanding: { label: 'SaaS Landing', config: saasLandingPreset },
  business: { label: 'Business', config: businessPreset },
};

/** Reads the merchant's current legacy theme the same way OnlineStore.tsx
 *  does: localStorage first (instant), then the authoritative cloud copy
 *  once it resolves. */
function useLegacyTheme(): LegacyThemeConfig {
  const [theme, setTheme] = useState<LegacyThemeConfig>(() => {
    const saved = localStorage.getItem(getTenantStorageKey('liafrikos_theme_config'));
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return defaultThemeForType('ecommerce');
  });

  useEffect(() => {
    fetchCloudTheme<LegacyThemeConfig>().then(cloud => {
      if (cloud) setTheme(cloud);
    });
  }, []);

  return theme;
}

function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export default function ThemeSystemPreview() {
  const legacyTheme = useLegacyTheme();
  const shopProfile = getShopProfile();
  const [products, setProducts] = useState<StoreProduct[]>(() => getProducts());
  const [cart, setCart] = useState<CartItem[]>(() => getCartItems());
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [source, setSource] = useState<SourceMode>('mine');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!addedToast) return;
    const t = setTimeout(() => setAddedToast(null), 1800);
    return () => clearTimeout(t);
  }, [addedToast]);

  const storeUrl = `/store`;

  const myConfig = useMemo<NewThemeConfig>(() => {
    const { radius } = getVariantStyles(legacyTheme.layoutVariant);
    const base = fromLegacyTheme(legacyTheme, {
      shopName: shopProfile.name,
      countryCode: shopProfile.country,
      radiusClass: radius,
      storeUrl,
      supportUrl: '/support',
    });
    return withLiveProducts(base, products);
  }, [legacyTheme, shopProfile.name, shopProfile.country, products, storeUrl]);

  const config: NewThemeConfig = source === 'mine' ? myConfig : SAMPLE_PRESETS[source].config;

  // Real cart badge: the header section's cartCount is baked into the
  // config, so patch it with the live count on every render rather than
  // storing it in the converter (which doesn't know about the cart).
  const configWithCartCount = useMemo<NewThemeConfig>(() => {
    const count = cartCount(cart);
    return {
      ...config,
      sections: config.sections.map(s => s.type === 'header' ? { ...s, content: { ...s.content, cartCount: count } } : s),
    };
  }, [config, cart]);

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === productId);
      const updated: CartItem[] = existing
        ? prev.map(i => i.id === productId ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { id: productId, name: product.name, variant: product.category || '', price: product.price, qty: 1, currency: product.currency }];
      saveCartItems(updated);
      return updated;
    });
    setAddedToast(product.name);
  };

  const frameWidth = device === 'mobile' ? 'max-w-[380px]' : 'max-w-full';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aperçu — Nouveau moteur de thème"
        subtitle="Vos vraies données (nom, produits, couleurs) rendues avec les composants premium du nouveau moteur."
        action={
          <Link to="/app/online-store">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <ArrowLeft size={14} /> Retour à Online Store
            </Button>
          </Link>
        }
      />

      <Card className="p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase mr-1">Source :</span>
            <button
              onClick={() => setSource('mine')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${source === 'mine' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              <Sparkles size={13} /> Ma boutique (données réelles)
            </button>
            {(Object.keys(SAMPLE_PRESETS) as Array<Exclude<SourceMode, 'mine'>>).map(key => (
              <button
                key={key}
                onClick={() => setSource(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${source === key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {SAMPLE_PRESETS[key].label} <span className="opacity-60 font-medium">(exemple)</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded-lg transition-all ${device === 'desktop' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-900'}`}
              title="Bureau"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded-lg transition-all ${device === 'mobile' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-900'}`}
              title="Mobile"
            >
              <Smartphone size={16} />
            </button>
            <button
              onClick={() => { setProducts(getProducts()); setCart(getCartItems()); }}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 transition-all"
              title="Recharger mes données"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {source === 'mine' && products.filter(p => p.status === 'active').length === 0 && (
          <div className="mt-3">
            <Badge color="gray">Aucun produit actif — ajoutez des produits pour les voir apparaître ici.</Badge>
          </div>
        )}
      </Card>

      <Card className="p-3 sm:p-6 border border-gray-100 shadow-sm bg-gray-50">
        <div
          className={`mx-auto bg-white overflow-hidden transition-all duration-300 relative ${frameWidth} ${
            device === 'mobile' ? 'rounded-[2.5rem] border-8 border-gray-900 shadow-2xl' : 'rounded-2xl border-4 border-gray-900 shadow-xl'
          }`}
        >
          {device === 'mobile' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-gray-900 rounded-b-2xl z-10" />
          )}
          <div className={`overflow-y-auto ${device === 'mobile' ? 'max-h-[720px]' : 'max-h-[760px]'}`}>
            <TemplateRenderer
              config={configWithCartCount}
              callbacks={{
                onAddToCart: source === 'mine' ? handleAddToCart : undefined,
                onCartClick: source === 'mine' ? () => window.open(storeUrl, '_blank') : undefined,
              }}
            />
          </div>

          {addedToast && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-20 animate-in fade-in">
              {addedToast} ajouté au panier
            </div>
          )}
        </div>
      </Card>

      {source === 'mine' && (
        <p className="text-[11px] text-gray-400 px-1">
          Cet aperçu lit vos réglages actuels (Online Store → couleurs, police, forme) et votre catalogue produits ({getShopSubdomain()}). Le panier utilisé ici est votre vrai panier — les ajouts sont réels.
        </p>
      )}
    </div>
  );
}

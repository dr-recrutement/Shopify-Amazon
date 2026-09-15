import { MinimalStoreHeader, MinimalStoreFooter } from '../components/MinimalStoreChrome';
import { Card, Button } from '../pages/dashboard/ui';
import { Trash2, ShoppingBag, ArrowRight, Shield, Truck, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCartItems, saveCartItems, getShopTheme, type CartItem } from '../lib/app-state';
import { resolvePublicTenant, fetchPublicTheme, type PublicTenant } from '../lib/tenant-sync';
import type { ThemeConfig } from '../lib/theme-engine';
import { defaultThemeForType } from '../lib/theme-engine';

/** Cart page previously ignored the merchant's theme entirely — generic
 *  gray background, the platform's own default brand-teal buttons/links
 *  instead of the merchant's chosen primary color and fonts. A merchant
 *  who customized their brand in the Theme Editor would see their own
 *  colors on the homepage and product page, then an unbranded page the
 *  moment a customer added something to their cart. Now fetches the real
 *  theme the same way ProductDetailPage.tsx already does. */
export default function CartPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [theme, setTheme] = useState<ThemeConfig>(() => getShopTheme<ThemeConfig>(defaultThemeForType('ecommerce')));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = slug ? await resolvePublicTenant(slug) : null;
      if (cancelled) return;
      setTenant(t);
      setItems(getCartItems(t?.id));
      if (t) {
        const cloudTheme = await fetchPublicTheme<ThemeConfig>(t.id);
        if (!cancelled && cloudTheme) setTheme(cloudTheme);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const updateItems = (nextItems: CartItem[]) => {
    setItems(nextItems);
    saveCartItems(nextItems, tenant?.id);
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = items.length > 0 ? 1000 : 0;
  const checkoutHref = slug ? `/s/${slug}/checkout` : '/checkout';
  const continueShoppingHref = slug ? `/s/${slug}` : '/marketplace';

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: theme.fonts.body }}>
      <MinimalStoreHeader shopName={tenant?.name} storeUrl={continueShoppingHref} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="font-serif-display text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: theme.fonts.heading }}>Panier{tenant ? ` — ${tenant.name}` : ''}</h1>
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag size={32} className="text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900">Votre panier est vide</h3>
            <Link to={continueShoppingHref} className="mt-4 inline-block font-medium" style={{ color: theme.colors.primary }}>
              {slug ? 'Retourner à la boutique' : 'Découvrir la marketplace'}
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map(i => (
                <Card key={i.id} className="p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {i.image && <img src={i.image} alt={i.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{i.name}</h3>
                        <p className="text-sm text-gray-500">{i.variant}</p>
                      </div>
                      <button onClick={() => updateItems(items.filter(x => x.id !== i.id))} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateItems(items.map(x => x.id === i.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="w-7 h-7 rounded border border-gray-200">-</button>
                        <span className="w-8 text-center text-sm">{i.qty}</span>
                        <button onClick={() => updateItems(items.map(x => x.id === i.id ? { ...x, qty: x.qty + 1 } : x))} className="w-7 h-7 rounded border border-gray-200">+</button>
                      </div>
                      <span className="font-semibold" style={{ color: theme.colors.primary }}>{fmt(i.price * i.qty)} {i.currency}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <Card className="p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Sous-total</span><span className="font-medium">{fmt(total)} XOF</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Livraison estimée</span><span className="font-medium">{fmt(shipping)} XOF</span></div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg" style={{ color: theme.colors.primary }}>{fmt(total + shipping)} XOF</span></div>
                </div>
                <Link to={checkoutHref}><Button className="mt-4 w-full" style={{ backgroundColor: theme.colors.primary }}>Finaliser ma commande <ArrowRight size={16} /></Button></Link>
              </Card>
              <Card className="p-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Shield size={14} className="text-green-600" /> Paiement sécurisé</div>
                <div className="flex items-center gap-2"><Truck size={14} className="text-blue-600" /> Suivi en temps réel</div>
                <div className="flex items-center gap-2"><CreditCard size={14} style={{ color: theme.colors.primary }} /> Mobile Money + cartes</div>
              </Card>
            </div>
          </div>
        )}
      </div>
      <MinimalStoreFooter shopName={tenant?.name} />
    </div>
  );
}

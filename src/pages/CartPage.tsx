import { MinimalStoreHeader, MinimalStoreFooter } from '../components/MinimalStoreChrome';
import { Card, Button } from '../pages/dashboard/ui';
import { ShoppingBag, ArrowRight, Shield, Truck, CreditCard, Tag, X, Plus, Minus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCartItems, saveCartItems, getShopTheme, getCartDiscount, saveCartDiscount, type CartItem, type AppliedDiscount } from '../lib/app-state';
import { resolvePublicTenant, fetchPublicTheme, fetchPublicProducts, validateDiscountCode, type PublicTenant } from '../lib/tenant-sync';
import type { ThemeConfig } from '../lib/theme-engine';
import { defaultThemeForType } from '../lib/theme-engine';

/** Cart page previously ignored the merchant's theme entirely — generic
 *  gray background, the platform's own default brand-teal buttons/links
 *  instead of the merchant's chosen primary color and fonts. Now fetches
 *  the real theme the same way ProductDetailPage.tsx already does.
 *
 *  Also adds two real WooCommerce-style cart features that didn't exist
 *  here before: a coupon code field (using the same real, server-side
 *  validateDiscountCode() the checkout page already calls - never a
 *  client-side guess at whether a code is real) and a cross-sell rail of
 *  other real catalog products. Applying the coupon here persists it
 *  (getCartDiscount/saveCartDiscount) so it's already applied when the
 *  customer reaches checkout, instead of having to re-type it - checkout
 *  still re-validates it there against the current total, since the cart
 *  can change in between. */
export default function CartPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [theme, setTheme] = useState<ThemeConfig>(() => getShopTheme<ThemeConfig>(defaultThemeForType('ecommerce')));
  const [catalog, setCatalog] = useState<any[]>([]);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = slug ? await resolvePublicTenant(slug) : null;
      if (cancelled) return;
      setTenant(t);
      setItems(getCartItems(t?.id));
      setDiscount(getCartDiscount(t?.id));
      if (t) {
        const [cloudTheme, products] = await Promise.all([
          fetchPublicTheme<ThemeConfig>(t.id),
          fetchPublicProducts(t.id),
        ]);
        if (cancelled) return;
        if (cloudTheme) setTheme(cloudTheme);
        setCatalog(products || []);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const updateItems = (nextItems: CartItem[]) => {
    setItems(nextItems);
    saveCartItems(nextItems, tenant?.id);
  };

  const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = items.length > 0 ? 1000 : 0;
  const discountAmount = !discount ? 0
    : discount.type === 'percentage' ? Math.round(total * discount.value / 100)
    : discount.type === 'fixed_amount' ? Math.min(discount.value, total)
    : 0;
  const shippingAfterDiscount = discount?.type === 'free_shipping' ? 0 : shipping;
  const grandTotal = Math.max(0, total - discountAmount) + shippingAfterDiscount;
  const checkoutHref = slug ? `/s/${slug}/checkout` : '/checkout';
  const continueShoppingHref = slug ? `/s/${slug}` : '/marketplace';

  const applyCoupon = async () => {
    if (!couponInput.trim() || !tenant) return;
    setApplyingCoupon(true);
    setCouponError(null);
    const result = await validateDiscountCode(tenant.id, couponInput.trim(), total);
    setApplyingCoupon(false);
    if (!result.valid || !result.discount) { setCouponError(result.error || 'Code invalide.'); return; }
    setDiscount(result.discount);
    saveCartDiscount(result.discount, tenant.id);
    setCouponInput('');
  };

  const removeCoupon = () => {
    setDiscount(null);
    saveCartDiscount(null, tenant?.id);
  };

  // Cross-sell rail: other real catalog products not already in the cart -
  // never fabricated recommendations, just the merchant's own products.
  const crossSells = useMemo(() => {
    const cartIds = new Set(items.map(i => i.id));
    return catalog.filter((p: any) => !cartIds.has(p.id)).slice(0, 4);
  }, [catalog, items]);

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
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    <span>Produit</span>
                    <span className="w-28 text-center">Quantité</span>
                    <span className="w-24 text-right">Sous-total</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map(i => (
                      <div key={i.id} className="p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:gap-4 items-center">
                        <div className="flex gap-3 items-center min-w-0">
                          <button onClick={() => updateItems(items.filter(x => x.id !== i.id))} className="text-gray-300 hover:text-red-600 shrink-0" title="Retirer">
                            <X size={16} />
                          </button>
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {i.image && <img src={i.image} alt={i.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm truncate">{i.name}</h3>
                            {i.variant && <p className="text-xs text-gray-500">{i.variant}</p>}
                            <p className="text-xs text-gray-400 sm:hidden mt-0.5">{fmt(i.price)} {i.currency} / unité</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 justify-start sm:justify-center sm:w-28">
                          <button onClick={() => updateItems(items.map(x => x.id === i.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus size={12} /></button>
                          <span className="w-8 text-center text-sm font-medium">{i.qty}</span>
                          <button onClick={() => updateItems(items.map(x => x.id === i.id ? { ...x, qty: x.qty + 1 } : x))} className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus size={12} /></button>
                        </div>
                        <span className="font-semibold sm:w-24 sm:text-right" style={{ color: theme.colors.primary }}>{fmt(i.price * i.qty)} {i.currency}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="mt-4 p-4">
                  {discount ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Tag size={15} style={{ color: theme.colors.primary }} />
                        <span className="font-semibold">{discount.title || discount.code}</span>
                        <span className="text-gray-400">({discount.code})</span>
                      </div>
                      <button onClick={removeCoupon} className="text-xs text-gray-400 hover:text-red-600 font-medium">Retirer</button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={e => setCouponInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                          placeholder="Code promo"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase"
                        />
                        <Button variant="secondary" onClick={applyCoupon} disabled={applyingCoupon || !couponInput.trim()}>
                          {applyingCoupon ? '…' : 'Appliquer'}
                        </Button>
                      </div>
                      {couponError && <p className="text-xs text-red-600 mt-1.5">{couponError}</p>}
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="p-5">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Sous-total</span><span className="font-medium">{fmt(total)} XOF</span></div>
                    {discount && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction ({discount.code})</span>
                        <span className="font-medium">-{fmt(discount.type === 'free_shipping' ? shipping : discountAmount)} XOF</span>
                      </div>
                    )}
                    <div className="flex justify-between"><span className="text-gray-500">Livraison estimée</span><span className="font-medium">{shippingAfterDiscount === 0 && shipping > 0 ? <span className="text-green-600">Gratuite</span> : `${fmt(shippingAfterDiscount)} XOF`}</span></div>
                    <div className="pt-2 border-t border-gray-100 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg" style={{ color: theme.colors.primary }}>{fmt(grandTotal)} XOF</span></div>
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

            {crossSells.length > 0 && (
              <div className="mt-10">
                <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: theme.fonts.heading }}>Vous pourriez aussi aimer</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {crossSells.map((p: any) => (
                    <Link key={p.id} to={`/s/${slug}/products/${p.id}`} className="group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                      </div>
                      <p className="text-xs font-medium text-gray-800 mt-2 truncate">{p.name}</p>
                      <p className="text-xs font-bold" style={{ color: theme.colors.primary }}>{fmt(p.price)} {p.currency}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <MinimalStoreFooter shopName={tenant?.name} />
    </div>
  );
}

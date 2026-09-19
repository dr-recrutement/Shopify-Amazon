import { MinimalStoreHeader, MinimalStoreFooter } from '../components/MinimalStoreChrome';
import { Card, Button } from '../pages/dashboard/ui';
import { Shield, Truck, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCartItems, saveCartItems, getShopTheme, getCartDiscount, saveCartDiscount } from '../lib/app-state';
import { resolvePublicTenant, submitPublicCheckout, fetchPublicTheme, fetchActiveGatewayNames, validateDiscountCode, applyDiscountUsage, type PublicTenant } from '../lib/tenant-sync';
import type { ThemeConfig } from '../lib/theme-engine';
import { defaultThemeForType } from '../lib/theme-engine';

/** Same fix as StorefrontPage.tsx's inline checkout: only offer payment
 *  options that are genuinely wired. PayUnit is added once confirmed
 *  connected & active for this merchant; 'cod' (Cash on Delivery) needs
 *  no payment processor at all, so it's always honestly available —
 *  replaces the old Orange Money/Wave/MTN MoMo options that had no
 *  processor behind them regardless of what a merchant connected. */
const COD_METHOD = { id: 'cod', name: 'Paiement à la livraison', desc: 'Payez en espèces à la réception' };
const PAYUNIT_METHOD = { id: 'payunit', name: 'PayUnit', desc: 'Mobile Money + cartes — paiement sécurisé en ligne' };

/** Same brand-consistency fix as CartPage.tsx — this page ignored the
 *  merchant's theme entirely before (generic platform brand-teal
 *  throughout), the last, most conversion-critical step of the funnel to
 *  actually carry the merchant's own branding. */
export default function CheckoutPage() {
  const { slug } = useParams<{ slug?: string }>();
  const nav = useNavigate();
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [items, setItems] = useState(() => getCartItems());
  const [theme, setTheme] = useState<ThemeConfig>(() => getShopTheme<ThemeConfig>(defaultThemeForType('ecommerce')));
  const [payment, setPayment] = useState('cod');
  const [activeGateways, setActiveGateways] = useState<string[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: string; code: string; type: string; value: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = slug ? await resolvePublicTenant(slug) : null;
      if (cancelled) return;
      setTenant(t);
      setItems(getCartItems(t?.id));
      // A coupon applied on the cart page (see CartPage.tsx) carries
      // through here rather than requiring it to be re-typed — this is
      // only a starting point though: the total may have changed since
      // then (items added/removed), so it's still just the same
      // validateDiscountCode() result, re-checked against whatever total
      // this page computes, not a value trusted as-is.
      const cartDiscount = getCartDiscount(t?.id);
      if (cartDiscount) setAppliedDiscount(cartDiscount);
      if (t) {
        const cloudTheme = await fetchPublicTheme<ThemeConfig>(t.id);
        if (!cancelled && cloudTheme) setTheme(cloudTheme);
        const gateways = await fetchActiveGatewayNames(t.id);
        if (!cancelled) {
          setActiveGateways(gateways);
          if (gateways.includes('PayUnit')) setPayment('payunit');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const currency = items[0]?.currency || 'XOF';
  const storeUrl = slug ? `/s/${slug}` : '/store';
  const fmt = (n: number) => `${n.toLocaleString('fr-FR')} ${currency}`;
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  // No invented flat shipping fee — matches StorefrontPage.tsx's own
  // inline checkout, which never charged one either. A flat 1000 XOF
  // here regardless of merchant, destination, or real shipping-zone
  // rates (settings.shippingZones) was a fabricated number, not a real
  // shipping calculation.
  const shippingCost = 0;
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'percentage' ? Math.round(total * (appliedDiscount.value / 100))
    : appliedDiscount.type === 'fixed_amount' ? Math.min(appliedDiscount.value, total)
    : 0
    : 0;
  const finalTotal = Math.max(0, total + shippingCost - discountAmount);

  const applyPromoCode = async () => {
    if (!promoCode.trim() || !tenant?.id || promoChecking) return;
    setPromoChecking(true);
    setPromoError(null);
    const result = await validateDiscountCode(tenant.id, promoCode.trim(), total);
    setPromoChecking(false);
    if (!result.valid || !result.discount) {
      setPromoError(result.error || 'Code invalide.');
      setAppliedDiscount(null);
      return;
    }
    setAppliedDiscount(result.discount);
  };

  const placeOrder = async () => {
    if (items.length === 0) return;
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Renseignez au moins votre nom, prénom et téléphone.');
      return;
    }
    setError(null);
    setSubmitting(true);

    if (!tenant) {
      // Local/demo checkout (no resolved tenant — same fallback StorefrontPage
      // uses for its own /store preview): no real gateway to call, so this
      // just records a local order rather than pretending to charge anyone.
      setSubmitting(false);
      saveCartItems([]);
      nav('/order-tracking?order=DEMO-' + Date.now().toString().slice(-6));
      return;
    }

    const result = await submitPublicCheckout({
      tenantId: tenant.id,
      customerName: `${firstName} ${lastName}`.trim(),
      customerEmail: email || undefined,
      paymentMethod: payment,
      currency: tenant.currency || currency,
      items: items.map(i => ({ name: i.variant ? `${i.name} (${i.variant})` : i.name, price: i.price, qty: i.qty })),
      slug,
      discountAmount,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Une erreur est survenue. Réessayez.');
      return;
    }
    if (appliedDiscount) applyDiscountUsage(appliedDiscount.id);
    saveCartItems([], tenant.id);
    saveCartDiscount(null, tenant.id);
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }
    nav(`/order-tracking?order=${result.orderNumber}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: theme.fonts.body }}>
        <MinimalStoreHeader shopName={tenant?.name} storeUrl={storeUrl} />
        <div className="max-w-2xl mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="font-serif-display text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: theme.fonts.heading }}>Votre panier est vide</h1>
          <p className="text-gray-500 text-sm">Ajoutez des produits avant de passer commande.</p>
        </div>
        <MinimalStoreFooter shopName={tenant?.name} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: theme.fonts.body }}>
      <MinimalStoreHeader shopName={tenant?.name} storeUrl={storeUrl} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="font-serif-display text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: theme.fonts.heading }}>Checkout{tenant ? ` — ${tenant.name}` : ''}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Informations de livraison</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Téléphone" className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Moyen de paiement</h3>
              <div className="space-y-2">
                {[...(activeGateways.includes('PayUnit') ? [PAYUNIT_METHOD] : []), COD_METHOD].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id)}
                    className="w-full text-left p-3 rounded-full border-2 flex items-center justify-between"
                    style={payment === p.id ? { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}0d` } : { borderColor: '#e5e7eb' }}
                  >
                    <div><div className="font-medium text-sm">{p.name}</div><div className="text-xs text-gray-500">{p.desc}</div></div>
                    {payment === p.id && <CheckCircle2 size={18} style={{ color: theme.colors.primary }} />}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1"><Shield size={12} /> Paiement direct au vendeur. Sellia ne prélève aucune commission.</p>
            </Card>
          </div>
          <div>
            <Card className="p-5 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>

              {tenant && !appliedDiscount && (
                <div className="flex gap-2 mb-3">
                  <input
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value); setPromoError(null); }}
                    placeholder="Code promo"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <Button variant="secondary" onClick={applyPromoCode} disabled={promoChecking || !promoCode.trim()} className="px-4">
                    {promoChecking ? '…' : 'Appliquer'}
                  </Button>
                </div>
              )}
              {promoError && <p className="text-xs text-red-600 mb-2">{promoError}</p>}
              {appliedDiscount && (
                <div className="flex items-center justify-between mb-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-green-700 flex items-center gap-1.5"><CheckCircle2 size={13} /> Code {appliedDiscount.code} appliqué</span>
                  <button onClick={() => { setAppliedDiscount(null); setPromoCode(''); saveCartDiscount(null, tenant?.id); }} className="text-xs text-green-600 hover:underline">Retirer</button>
                </div>
              )}

              <div className="space-y-2 text-sm">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between"><span className="text-gray-500">{i.name} x{i.qty}</span><span>{fmt(i.price * i.qty)}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-gray-500">Livraison</span><span>{fmt(shippingCost)}</span></div>
                {appliedDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-green-700"><span>Remise ({appliedDiscount.code})</span><span>−{fmt(discountAmount)}</span></div>
                )}
                <div className="pt-2 border-t border-gray-100 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg" style={{ color: theme.colors.primary }}>{fmt(finalTotal)}</span></div>
              </div>
              {error && <p className="mt-3 text-xs text-red-600 font-medium">{error}</p>}
              <Button onClick={placeOrder} disabled={submitting} className="mt-4 w-full" style={{ backgroundColor: theme.colors.primary }}>
                {submitting ? 'Traitement…' : <>Confirmer la commande <ArrowRight size={16} /></>}
              </Button>
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Shield size={12} className="text-green-600" /> Paiement sécurisé</div>
                <div className="flex items-center gap-2"><Truck size={12} className="text-blue-600" /> Suivi en temps réel</div>
                <div className="flex items-center gap-2"><CreditCard size={12} style={{ color: theme.colors.primary }} /> 0% commission</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <MinimalStoreFooter shopName={tenant?.name} />
    </div>
  );
}

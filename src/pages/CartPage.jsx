import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, Loader2, AlertCircle, Tag } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme, migrateTheme } from '@/lib/themes';
import { applySEO } from '@/lib/seo';
import { formatMoney } from '@/lib/world/currencies';
import { getCartSessionId, CheckoutModal } from '@/pages/Storefront';

// A real standalone cart page (its own URL, not just a drawer) - same
// abandoned_carts session as Storefront.jsx/ProductDetail.jsx, so items
// added from either place show up here too.
export default function CartPage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [theme, setTheme] = useState(() => cloneTheme(DEFAULT_THEME_ID));
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGateways, setActiveGateways] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [discount, setDiscount] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: tenant, error: tenantError } = await supabase.from('tenants').select('*').eq('slug', slug).maybeSingle();
      if (tenantError) throw tenantError;
      if (!tenant) throw new Error('Cette boutique n\u2019existe pas.');
      setStore({ ...tenant, currency: tenant.currency || 'USD' });

      const [themeRes, gatewaysRes] = await Promise.all([
        supabase.from('theme_configs').select('published_config').eq('tenant_id', tenant.id).maybeSingle(),
        supabase.from('public_active_gateways').select('gateway').eq('tenant_id', tenant.id),
      ]);
      setTheme(isValidTheme(themeRes.data?.published_config) ? migrateTheme(themeRes.data.published_config) : cloneTheme(DEFAULT_THEME_ID));
      setActiveGateways((gatewaysRes.data || []).map((g) => g.gateway));

      const sessionId = getCartSessionId();
      const { data: cartData } = await supabase.from('abandoned_carts').select('*').eq('session_id', sessionId).eq('tenant_id', tenant.id).eq('status', 'open').maybeSingle();
      setCart(cartData || null);
      setError(null);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!store) return;
    applySEO({ title: `Panier — ${store.name}`, description: `Votre panier sur ${store.name}.`, url: window.location.href, countryCode: store.country, favicon: theme.favicon });
  }, [store, theme]);

  const saveCart = async (items) => {
    const subtotal = items.reduce((s, i) => s + i.line_total, 0);
    const { data, error: saveError } = await supabase.from('abandoned_carts').update({ items, total_cents: Math.round(subtotal * 100), last_activity_at: new Date().toISOString() }).eq('id', cart.id).select().single();
    if (saveError) throw saveError;
    return data;
  };

  const updateQty = async (productId, variantId, delta) => {
    if (!cart) return;
    const items = [...(cart.items || [])];
    const item = items.find((i) => i.product_id === productId && (i.variant_id || null) === variantId);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    item.line_total = item.price * item.quantity;
    setCart(await saveCart(items));
  };

  const removeItem = async (productId, variantId) => {
    if (!cart) return;
    const items = (cart.items || []).filter((i) => !(i.product_id === productId && (i.variant_id || null) === variantId));
    setCart(await saveCart(items));
  };

  const applyCoupon = async () => {
    if (!cart || !couponCode.trim()) return;
    setCouponMsg(null);
    try {
      const { data: d } = await supabase.from('discount_codes').select('*').eq('tenant_id', store.id).eq('code', couponCode.trim().toUpperCase()).eq('is_active', true).maybeSingle();
      if (!d) { setCouponMsg({ ok: false, text: 'Code promo invalide.' }); return; }
      if (d.max_uses && d.used_count >= d.max_uses) { setCouponMsg({ ok: false, text: 'Ce code a atteint sa limite d\u2019utilisation.' }); return; }
      if (d.ends_at && new Date(d.ends_at) < new Date()) { setCouponMsg({ ok: false, text: 'Ce code a expir\u00e9.' }); return; }
      const subtotal = (cart.total_cents || 0) / 100;
      if (d.min_amount_cents && subtotal * 100 < d.min_amount_cents) { setCouponMsg({ ok: false, text: `Minimum requis : ${formatMoney(d.min_amount_cents / 100, store.currency)}.` }); return; }
      let amount = 0;
      if (d.discount_type === 'percentage') amount = subtotal * (d.value / 100);
      else if (d.discount_type === 'fixed_amount') amount = d.value;
      amount = Math.min(amount, subtotal);
      setDiscount({ ...d, amount });
      setCouponMsg({ ok: true, text: `Code appliqu\u00e9 : -${formatMoney(amount, store.currency)}` });
    } catch {
      setCouponMsg({ ok: false, text: "Erreur lors de l'application du code." });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#008060]" /></div>;
  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center px-4">
      <AlertCircle className="w-10 h-10 text-[#6D7175] mx-auto mb-3" />
      <h1 className="text-lg font-bold text-[#202223]">{error}</h1>
      <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-4">Retour à la boutique</Link>
    </div>
  );
  if (!store) return null;

  const p = theme.palette;
  const items = cart?.items || [];
  const subtotal = (cart?.total_cents || 0) / 100;
  const discountAmount = discount?.amount || 0;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="min-h-screen" style={{ background: p.bg, color: p.text, fontFamily: theme.fonts?.body }}>
      {theme.customCss && <style>{theme.customCss}</style>}
      <header className="flex items-center px-5 sm:px-8 py-4 border-b" style={{ borderColor: p.border }}>
        <Link to={`/store/${slug}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: p.dark }}>
          <ArrowLeft className="w-4 h-4" /> {store.name}
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5 mb-6" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>
          {theme.cartIcon ? <img src={theme.cartIcon} alt="" className="w-7 h-7 object-contain" /> : <ShoppingCart className="w-7 h-7" />} Votre panier
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: p.surface }}>
            <ShoppingCart className="w-12 h-12 mx-auto mb-4" style={{ color: p.muted }} />
            <p className="font-semibold" style={{ color: p.dark }}>Votre panier est vide</p>
            <p className="text-sm mt-1" style={{ color: p.muted }}>Découvrez nos produits et ajoutez vos favoris.</p>
            <Link to={`/store/${slug}`} className="inline-block mt-5 sellia-btn px-5 py-2.5 text-sm font-semibold" style={{ background: theme.palette.primary, color: p.primaryText }}>Continuer mes achats</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="flex gap-4 p-3 rounded-xl" style={{ border: `1px solid ${p.border}` }}>
                  <Link to={`/store/${slug}/products/${item.product_id}`} className="w-20 h-20 rounded-lg overflow-hidden shrink-0" style={{ background: p.surface }}>
                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/store/${slug}/products/${item.product_id}`} className="text-sm font-semibold hover:underline" style={{ color: p.dark }}>{item.title}</Link>
                    {item.variant_title && <p className="text-xs mt-0.5" style={{ color: p.muted }}>{item.variant_title}</p>}
                    <p className="text-xs mt-0.5" style={{ color: p.muted }}>{formatMoney(item.price, store.currency)} / unité</p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="inline-flex items-center rounded-full overflow-hidden" style={{ border: `1px solid ${p.border}` }}>
                        <button onClick={() => updateQty(item.product_id, item.variant_id || null, -1)} className="w-7 h-7 flex items-center justify-center" style={{ color: p.text }}><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.variant_id || null, 1)} className="w-7 h-7 flex items-center justify-center" style={{ color: p.text }}><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <button onClick={() => removeItem(item.product_id, item.variant_id || null)} className="inline-flex items-center gap-1 text-xs font-medium hover:text-red-500" style={{ color: p.muted }}><Trash2 className="w-3.5 h-3.5" /> Retirer</button>
                    </div>
                  </div>
                  <p className="text-sm font-bold whitespace-nowrap" style={{ color: p.dark }}>{formatMoney(item.line_total, store.currency)}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${p.border}` }}>
                <Tag className="w-4 h-4" style={{ color: p.muted }} />
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Code promo" className="flex-1 outline-none text-sm bg-transparent" style={{ color: p.text }} />
              </div>
              <button onClick={applyCoupon} className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${p.dark}`, color: p.dark }}>Appliquer</button>
            </div>
            {couponMsg && <p className={`text-xs font-medium -mt-4 mb-6 ${couponMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{couponMsg.text}</p>}

            <div className="rounded-2xl p-5" style={{ background: p.surface }}>
              <div className="flex justify-between text-sm mb-2"><span style={{ color: p.muted }}>Sous-total</span><span className="font-semibold" style={{ color: p.dark }}>{formatMoney(subtotal, store.currency)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-2 text-emerald-600"><span className="font-medium">Réduction ({discount?.code})</span><span className="font-semibold">-{formatMoney(discountAmount, store.currency)}</span></div>
              )}
              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: `1px solid ${p.border}` }}>
                <span className="font-bold" style={{ color: p.dark }}>Total</span>
                <span className="font-bold text-lg" style={{ color: p.dark }}>{formatMoney(total, store.currency)}</span>
              </div>
              <button onClick={() => setCheckoutOpen(true)} className="w-full mt-4 sellia-btn py-3.5 text-sm font-semibold" style={{ background: theme.palette.primary, color: p.primaryText }}>
                Passer à la commande
              </button>
              <Link to={`/store/${slug}`} className="block text-center text-xs font-medium mt-3" style={{ color: p.muted }}>Continuer mes achats</Link>
            </div>
          </>
        )}
      </div>

      {checkoutOpen && cart && (
        <CheckoutModal
          store={store}
          cart={cart}
          discount={discount}
          discountAmount={discountAmount}
          activeGateways={activeGateways}
          onClose={() => setCheckoutOpen(false)}
          onDone={() => { localStorage.removeItem('sellia_cart_session'); setCart(null); setDiscount(null); setCouponCode(''); setCheckoutOpen(false); }}
        />
      )}
    </div>
  );
}

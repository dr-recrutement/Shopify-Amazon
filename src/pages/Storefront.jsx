import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, X, Loader2, AlertCircle, Trash2, ArrowRight, ArrowLeft, Check,
  Minus, Plus, Tag, Truck, MapPin, Mail, Phone, ShieldCheck, Lock, CreditCard, Star,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import ThemeRenderer from '@/components/theme/ThemeRenderer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme, migrateTheme } from '@/lib/themes';
import { applySEO, applyStoreJsonLd, applyProductListJsonLd } from '@/lib/seo';
import { formatMoney } from '@/lib/world/currencies';

const CART_KEY = 'sellia_cart_session';

// supabase-js's own error object only carries a generic "Edge Function
// returned a non-2xx status code" - the real message is in the
// function's own JSON error body, same pattern used everywhere else this
// session.
async function functionErrorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message below */ }
  return error.message || 'Erreur inconnue';
}

export function getCartSessionId() {
  let id = localStorage.getItem(CART_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(CART_KEY, id); }
  return id;
}

// Loads a checkout SDK <script> exactly once and resolves once it's ready -
// both gateways expose a global (FlutterwaveCheckout / PaystackPop) once
// their script has loaded. Cached by src so re-opening checkout doesn't
// re-inject the tag.
const scriptPromises = {};
export function loadScript(src) {
  if (scriptPromises[src]) return scriptPromises[src];
  scriptPromises[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { existing.addEventListener('load', () => resolve()); if (existing.dataset.loaded) resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = '1'; resolve(); };
    s.onerror = () => reject(new Error('Impossible de charger le module de paiement.'));
    document.head.appendChild(s);
  });
  return scriptPromises[src];
}

// Stock is now reserved atomically at order creation (create-order Edge
// Function -> reserve_stock, a real conditional UPDATE, not just a
// read-then-compare check a concurrent buyer of the last unit could slip
// past) - no separate decrement-on-payment-success step needed anymore.
// An order that never completes payment has its reservation released
// automatically after 45 minutes (release_expired_pending_orders,
// scheduled).

// Real homepage popup with 3 real design variants, not just one fixed
// shape - a discount-code teaser, a newsletter capture (reuses the same
// real newsletter_subscribers insert as the NewsletterBlock section),
// and a plain announcement with a configurable link. Shown once per
// visitor for 7 days (localStorage), not on every single page load.
function StorePopup({ theme, store }) {
  const cfg = theme.popup;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cfg?.enabled || !store?.id) return;
    const key = `sellia_popup_dismissed_${store.id}`;
    const dismissedAt = localStorage.getItem(key);
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 86400000) return;
    const timer = setTimeout(() => setOpen(true), Math.max(0, (cfg.delaySeconds ?? 3) * 1000));
    return () => clearTimeout(timer);
  }, [cfg?.enabled, cfg?.delaySeconds, store?.id]);

  const dismiss = () => {
    if (store?.id) localStorage.setItem(`sellia_popup_dismissed_${store.id}`, String(Date.now()));
    setOpen(false);
  };

  const submitNewsletter = async (e) => {
    e.preventDefault();
    if (!email.trim() || !store?.id) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ tenant_id: store.id, email: email.trim().toLowerCase(), source: 'homepage_popup' });
      if (error && error.code !== '23505') throw error;
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Still close gracefully - a duplicate email isn't a failure the visitor needs to see.
    } finally { setBusy(false); }
  };

  if (!open || !cfg?.enabled) return null;
  const p = theme.palette;
  const design = cfg.design || 'discount';

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={dismiss}>
      <div className="rounded-2xl max-w-sm w-full p-7 relative text-center" style={{ background: p.bg }} onClick={(e) => e.stopPropagation()}>
        <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5" style={{ color: p.muted }} aria-label="Fermer"><X className="w-4 h-4" /></button>

        <h2 className="text-xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{cfg.title || (design === 'discount' ? 'Profitez de -10%' : design === 'newsletter' ? 'Restez informé' : 'À ne pas manquer')}</h2>
        {cfg.subtitle && <p className="text-sm mt-2" style={{ color: p.muted }}>{cfg.subtitle}</p>}

        {design === 'discount' && (
          <div className="mt-5">
            <div className="border-2 border-dashed rounded-lg py-3 font-mono text-lg font-bold tracking-widest" style={{ borderColor: theme.palette.primary, color: theme.palette.primary }}>
              {cfg.discountCode || 'BIENVENUE10'}
            </div>
            <button onClick={dismiss} className="w-full mt-4 py-3 sellia-btn text-sm font-semibold" style={{ background: theme.palette.primary, color: p.primaryText }}>Copier et magasiner</button>
          </div>
        )}

        {design === 'newsletter' && (
          submitted ? (
            <p className="mt-5 text-sm font-semibold" style={{ color: theme.palette.primary }}>Merci ! Votre inscription est confirmée.</p>
          ) : (
            <form onSubmit={submitNewsletter} className="mt-5 space-y-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre e-mail" className="w-full px-4 py-2.5 rounded-md text-sm border outline-none" style={{ borderColor: p.border, color: p.text }} />
              <button type="submit" disabled={busy} className="w-full py-2.5 sellia-btn text-sm font-semibold disabled:opacity-60" style={{ background: theme.palette.primary, color: p.primaryText }}>{busy ? '…' : (cfg.buttonLabel || "S'inscrire")}</button>
            </form>
          )
        )}

        {design === 'announcement' && (
          <a href={cfg.buttonUrl && cfg.buttonUrl !== '#' ? cfg.buttonUrl : undefined} onClick={dismiss} className="inline-block w-full mt-5 py-3 sellia-btn text-sm font-semibold" style={{ background: theme.palette.primary, color: p.primaryText }}>{cfg.buttonLabel || 'Découvrir'}</a>
        )}
      </div>
    </div>
  );
}

export default function Storefront() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [productRatings, setProductRatings] = useState({});
  const [collections, setCollections] = useState([]);
  const [storeLocations, setStoreLocations] = useState([]);
  const [articles, setArticles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeGateways, setActiveGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => cloneTheme(DEFAULT_THEME_ID));
  const [cart, setCart] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [discount, setDiscount] = useState(null);
  const [payunitReturn, setPayunitReturn] = useState(null); // null | 'checking' | { paid: bool, orderNumber }

  const loadStore = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants').select('*').eq('slug', slug).maybeSingle();
      if (tenantError) throw tenantError;
      if (!tenant) throw new Error("Cette boutique n'existe pas.");
      if (tenant.suspended_at) {
        setError({ suspended: true, reason: tenant.suspended_reason });
        setLoading(false);
        return;
      }
      if (tenant.status === 'trial' && tenant.trial_ends_at && new Date(tenant.trial_ends_at) < new Date()) {
        setError({ trialExpired: true });
        setLoading(false);
        return;
      }
      if (tenant.status !== 'trial' && tenant.subscription_ends_at && new Date(tenant.subscription_ends_at) < new Date()) {
        setError({ subscriptionExpired: true });
        setLoading(false);
        return;
      }
      setStore({ ...tenant, currency: tenant.currency || 'USD' });

      const [themeRes, productsRes, categoriesRes, assignRes, pagesRes, reviewsRes, ratingsRes, gatewaysRes, locationsRes] = await Promise.all([
        supabase.from('theme_configs').select('published_config').eq('tenant_id', tenant.id).maybeSingle(),
        supabase.from('products').select('*').eq('tenant_id', tenant.id).eq('status', 'active').order('created_at', { ascending: false }).limit(200),
        supabase.from('product_categories').select('*').eq('tenant_id', tenant.id),
        supabase.from('product_category_assignments').select('product_id, category_id'),
        supabase.from('content_pages').select('*').eq('tenant_id', tenant.id).eq('status', 'published').order('published_at', { ascending: false }).limit(20),
        supabase.from('product_reviews').select('*, products(name)').eq('tenant_id', tenant.id).eq('is_approved', true).order('created_at', { ascending: false }).limit(30),
        // Every approved rating for every product (not just the 30 most
        // recent reviews above) - real per-product averages need the
        // full set, not a truncated sample.
        supabase.from('product_reviews').select('product_id, rating').eq('tenant_id', tenant.id).eq('is_approved', true),
        supabase.from('public_active_gateways').select('gateway').eq('tenant_id', tenant.id),
        supabase.from('store_locations').select('*').eq('tenant_id', tenant.id).order('position'),
      ]);
      // Some theme_configs rows predate this editor and store an
      // incompatible/empty shape there (see isValidTheme) - falls back to
      // the stock default rather than crashing on the mismatch.
      setTheme(isValidTheme(themeRes.data?.published_config) ? migrateTheme(themeRes.data.published_config) : cloneTheme(DEFAULT_THEME_ID));
      setProducts(productsRes.data || []);
      const ratingAcc = {};
      (ratingsRes.data || []).forEach((r) => {
        const cur = ratingAcc[r.product_id] || { sum: 0, count: 0 };
        cur.sum += r.rating; cur.count += 1;
        ratingAcc[r.product_id] = cur;
      });
      setProductRatings(ratingAcc);
      const counts = {};
      (assignRes.data || []).forEach((a) => { counts[a.category_id] = (counts[a.category_id] || 0) + 1; });
      setCollections((categoriesRes.data || []).map((c) => ({ ...c, product_count: counts[c.id] || 0 })));
      setArticles(pagesRes.data || []);
      setReviews(reviewsRes.data || []);
      setActiveGateways((gatewaysRes.data || []).map((g) => g.gateway));
      setStoreLocations(locationsRes.data || []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Boutique introuvable');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadCart = useCallback(async () => {
    if (!store?.id) return;
    const sessionId = getCartSessionId();
    try {
      const { data } = await supabase.from('abandoned_carts').select('*').eq('session_id', sessionId).eq('tenant_id', store.id).eq('status', 'open').maybeSingle();
      if (data) {
        setCart(data);
        setCartCount((data.items || []).reduce((s, i) => s + i.quantity, 0));
      }
    } catch { /* no cart yet, fine */ }
  }, [store?.id]);

  useEffect(() => { loadStore(); }, [loadStore]);

  // Real return handling for Payunit's redirect-based checkout - the
  // customer lands back here (not inside the now-unmounted checkout
  // modal) after paying on Payunit's own hosted page, so verification and
  // the confirmation experience live at this top level instead.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payunit_return') !== '1') return;
    const orderId = params.get('order') || sessionStorage.getItem('sellia_payunit_pending_order');
    if (!orderId) return;
    setPayunitReturn('checking');
    supabase.functions.invoke('payunit-checkout', { body: { action: 'verify', order_id: orderId } })
      .then(async ({ data, error }) => {
        if (error) throw new Error(await functionErrorMessage(error));
        const paid = data?.status === 'paid';
        if (paid) {
          // Cart recovery only - stock is already reserved atomically at
          // order creation (create-order) now, not decremented again
          // here (was previously missing this path's decrement entirely,
          // then briefly double-decremented after the reservation fix -
          // this is the corrected final state: reserve once, never touch
          // stock again on success).
          const sessionId = getCartSessionId();
          await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('session_id', sessionId).eq('status', 'open');
          localStorage.removeItem(CART_KEY);
          setCart(null);
          setCartCount(0);
        }
        setPayunitReturn({ paid, orderNumber: '#' + orderId.slice(0, 8).toUpperCase() });
        sessionStorage.removeItem('sellia_payunit_pending_order');
      })
      .catch((e) => setPayunitReturn({ paid: false, error: e.message }));
    // Clean the query string so refreshing the page doesn't re-verify.
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  useEffect(() => { if (store) loadCart(); }, [store, loadCart]);

  const storeSections = useMemo(() => {
    const prods = products.map((p) => {
      const r = productRatings[p.id];
      const compareAt = (p.compare_at_price_cents || 0) / 100;
      const price = (p.price_cents || 0) / 100;
      const hasVariants = (p.variants || []).length > 0;
      const totalStock = hasVariants ? (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0) : (p.stock || 0);
      return {
        _id: p.id,
        image: (p.images && p.images[0]) || '',
        title: p.name,
        price: formatMoney(price, store?.currency || p.currency),
        _price: price,
        _hasVariants: hasVariants,
        // Real average from approved product_reviews - not shown at all
        // (no fake placeholder star count) when a product has zero
        // reviews yet, rather than implying a rating that doesn't exist.
        rating: r ? Math.round((r.sum / r.count) * 10) / 10 : undefined,
        reviewCount: r ? r.count : 0,
        // Real badges - computed from actual product data, not a manual
        // toggle a merchant has to remember to flip for every product.
        _badgeSale: compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null,
        _badgeNew: new Date(p.created_at) > new Date(Date.now() - 14 * 86400000),
        _badgeSoldOut: (p.metafields?.track_inventory !== false) && totalStock <= 0,
      };
    });
    const posts = articles.map((a) => ({
      _id: a.id,
      _handle: a.slug,
      image: '',
      title: a.title,
      excerpt: (a.body || '').replace(/<[^>]*>/g, '').slice(0, 120),
      date: a.published_at ? new Date(a.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      author: '',
    }));
    const testimonialItems = reviews.map((r) => ({
      quote: r.comment,
      author: r.customer_name || 'Client Sellia',
      role: r.products?.name || '',
      rating: r.rating,
    }));
    return theme.sections.map((s) => {
      if (s.type === 'productGrid' && prods.length > 0) {
        return { ...s, props: { ...s.props, products: prods.slice(0, s.props?.columns ? s.props.columns * 2 : 8) } };
      }
      if (s.type === 'brandSpotlight' && prods.length > 0) {
        return { ...s, props: { ...s.props, products: prods.slice(0, 6) } };
      }
      if (s.type === 'blogList' && posts.length > 0) {
        return { ...s, props: { ...s.props, posts: posts.slice(0, 3) } };
      }
      if (s.type === 'collectionList' && collections.length > 0) {
        return { ...s, props: { ...s.props, items: collections.map((c) => ({ image: c.image_url || '', title: c.name, count: `${c.product_count} article${c.product_count > 1 ? 's' : ''}`, url: `/collections/${c.id}` })) } };
      }
      if (s.type === 'storeLocations' && storeLocations.length > 0) {
        return { ...s, props: { ...s.props, locations: storeLocations } };
      }
      if (s.type === 'testimonials' && testimonialItems.length > 0) {
        // Real customer reviews replace the theme's example quotes. Many
        // reviews auto-switch to the scrolling banner even if the merchant
        // hadn't set displayMode, since a long static grid of reviews reads
        // worse than a few example cards did.
        const displayMode = s.props?.displayMode || (testimonialItems.length > 6 ? 'scrolling' : 'grid');
        return { ...s, props: { ...s.props, items: testimonialItems.slice(0, 24), displayMode } };
      }
      return s;
    });
  }, [theme, products, productRatings, articles, collections, reviews, store, storeLocations]);

  useEffect(() => {
    if (!store) return;
    const heroSection = theme.sections.find((s) => s.type === 'header');
    const heroBanner = theme.sections.find((s) => s.type === 'hero');
    const description = heroBanner?.props?.subtitle
      || `${store.name} — boutique en ligne${store.sector ? ` de ${store.sector}` : ''}${store.country ? ` basée en ${store.country}` : ''}. Livraison et paiement sécurisé.`;
    const url = `${window.location.origin}/store/${slug}`;
    applySEO({
      title: `${store.name} — Boutique en ligne`,
      description,
      image: heroBanner?.props?.image || heroSection?.props?.logoImage,
      url,
      countryCode: store.country,
      favicon: theme.favicon,
    });
    applyStoreJsonLd({ name: store.name, description, url, logo: heroSection?.props?.logoImage, currency: store.currency });
    if (products.length > 0) {
      applyProductListJsonLd(products.map((p) => ({
        title: p.name, image: p.images?.[0], _price: (p.price_cents || 0) / 100, _currency: store.currency || p.currency,
      })), url);
    }
  }, [store, theme, products, slug]);

  const saveCart = async (items) => {
    const subtotal = items.reduce((s, i) => s + i.line_total, 0);
    const sessionId = getCartSessionId();
    if (cart?.id) {
      const { data, error } = await supabase.from('abandoned_carts').update({ items, total_cents: Math.round(subtotal * 100), last_activity_at: new Date().toISOString() }).eq('id', cart.id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from('abandoned_carts').insert({
      tenant_id: store.id, session_id: sessionId, items, total_cents: Math.round(subtotal * 100), currency: store.currency, status: 'open',
    }).select().single();
    if (error) throw error;
    return data;
  };

  const addToCart = async (product) => {
    try {
      const items = [...(cart?.items || [])];
      const key = `${product._id}::${product._variantId || ''}`;
      const existing = items.find((i) => `${i.product_id}::${i.variant_id || ''}` === key);
      if (existing) {
        existing.quantity += 1;
        existing.line_total = existing.price * existing.quantity;
      } else {
        items.push({ product_id: product._id, variant_id: product._variantId || null, variant_title: product._variantTitle || null, title: product.title, image: product.image, price: product._price, quantity: 1, line_total: product._price });
      }
      const updated = await saveCart(items);
      setCart(updated);
      setCartCount(items.reduce((s, i) => s + i.quantity, 0));
      setCartOpen(true);
    } catch (e) {
      alert(e.message || "Impossible d'ajouter au panier");
    }
  };

  const updateQty = async (productId, delta, variantId = null) => {
    if (!cart) return;
    const items = [...(cart.items || [])];
    const item = items.find((i) => i.product_id === productId && (i.variant_id || null) === variantId);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    item.line_total = item.price * item.quantity;
    const updated = await saveCart(items);
    setCart(updated);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
  };

  const removeFromCart = async (productId, variantId = null) => {
    if (!cart) return;
    const items = (cart.items || []).filter((i) => !(i.product_id === productId && (i.variant_id || null) === variantId));
    const updated = await saveCart(items);
    setCart(updated);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
  };

  const applyCoupon = async () => {
    if (!cart || !couponCode.trim()) return;
    setCouponMsg(null);
    try {
      const { data: d } = await supabase.from('discount_codes').select('*').eq('tenant_id', store.id).eq('code', couponCode.trim().toUpperCase()).eq('is_active', true).maybeSingle();
      if (!d) { setCouponMsg({ ok: false, text: 'Code promo invalide.' }); return; }
      if (d.max_uses && d.used_count >= d.max_uses) { setCouponMsg({ ok: false, text: "Ce code a atteint sa limite d'utilisation." }); return; }
      if (d.ends_at && new Date(d.ends_at) < new Date()) { setCouponMsg({ ok: false, text: 'Ce code a expiré.' }); return; }
      const subtotal = (cart.total_cents || 0) / 100;
      if (d.min_amount_cents && subtotal * 100 < d.min_amount_cents) { setCouponMsg({ ok: false, text: `Minimum requis : ${formatMoney(d.min_amount_cents / 100, store.currency)}.` }); return; }
      let amount = 0;
      if (d.discount_type === 'percentage') amount = subtotal * (d.value / 100);
      else if (d.discount_type === 'fixed_amount') amount = d.value;
      amount = Math.min(amount, subtotal);
      setDiscount({ ...d, amount });
      setCouponMsg({ ok: true, text: `Code appliqué : -${formatMoney(amount, store.currency)}` });
    } catch {
      setCouponMsg({ ok: false, text: "Erreur lors de l'application du code." });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <h1 className="text-lg font-bold text-foreground">{error.suspended ? 'Boutique temporairement indisponible' : error.trialExpired ? "Période d'essai terminée" : error.subscriptionExpired ? 'Abonnement expiré' : 'Boutique introuvable'}</h1>
      <p className="text-sm text-muted-foreground mt-1">{error.suspended ? (error.reason || 'Cette boutique est actuellement suspendue.') : error.trialExpired ? "La période d'essai gratuit du marchand est terminée. La boutique sera de nouveau accessible dès la souscription d'un abonnement." : error.subscriptionExpired ? "L'abonnement du marchand a expiré. La boutique sera de nouveau accessible dès son renouvellement." : error}</p>
      <Link to="/" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-brand/90 mt-4">Retour à l'accueil</Link>
    </div>
  );
  if (!store) return null;

  const discountAmount = discount?.amount || 0;
  const cartSubtotal = (cart?.total_cents || 0) / 100;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  return (
    <div className="min-h-screen bg-white">
      {theme.customCss && <style>{theme.customCss}</style>}
      <button onClick={() => setCartOpen(true)} className={`fixed bottom-5 z-40 bg-foreground text-background rounded-full p-4 shadow-2xl hover:opacity-90 transition flex items-center gap-2 ${theme.cartPosition === 'bottom-left' ? 'left-5' : 'right-5'}`}>
        {theme.cartIcon ? <img src={theme.cartIcon} alt="Panier" className="w-5 h-5 object-contain" /> : <ShoppingCart className="w-5 h-5" />}
        {cartCount > 0 && <span className="absolute -top-1 -right-1 text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: theme.palette.primary, color: theme.palette.primaryText }}>{cartCount}</span>}
      </button>

      {theme.whatsappNumber && (
        <a
          href={`https://wa.me/${theme.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour, j'ai une question sur ${store.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed bottom-5 z-40 bg-[#25D366] text-white rounded-full p-4 shadow-2xl hover:opacity-90 transition flex items-center gap-2 ${theme.cartPosition === 'bottom-left' ? 'right-5' : 'left-5'}`}
          aria-label="Discuter sur WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M17.6 6.3A8.9 8.9 0 0 0 3.1 17l-1 3.9 4-1a9 9 0 0 0 4.3 1.1 8.9 8.9 0 0 0 8.9-8.9 8.8 8.8 0 0 0-2.6-6.3l-.1-.5zm-6.2 13.7a7.4 7.4 0 0 1-3.8-1l-.3-.2-2.4.6.6-2.3-.2-.3a7.4 7.4 0 1 1 6.1 3.2zm4.1-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.2.2-.3.2-.5.1a6 6 0 0 1-1.8-1.1 6.7 6.7 0 0 1-1.2-1.5c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c-.1-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.1 0-.4.1-.6.3a2.7 2.7 0 0 0-.9 2 4.6 4.6 0 0 0 1 2.4 10.6 10.6 0 0 0 4.1 3.6c.6.2 1 .4 1.4.5.6.2 1.1.1 1.5.1.5-.1 1.3-.6 1.5-1.1.2-.5.2-1 .1-1.1l-.4-.2z" /></svg>
        </a>
      )}

      <StorePopup theme={theme} store={store} />

      {payunitReturn && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-7 text-center">
            {payunitReturn === 'checking' ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-[#008060] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#202223]">Vérification de votre paiement…</p>
              </>
            ) : payunitReturn.paid ? (
              <>
                <Check className="w-10 h-10 text-[#008060] mx-auto mb-3" />
                <p className="text-base font-bold text-[#202223]">Paiement confirmé !</p>
                <p className="text-xs text-[#6D7175] mt-1">Commande {payunitReturn.orderNumber}</p>
                <button onClick={() => setPayunitReturn(null)} className="mt-5 w-full bg-[#008060] text-white text-sm font-semibold py-2.5 rounded-full hover:bg-[#00694d]">Continuer</button>
              </>
            ) : (
              <>
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-base font-bold text-[#202223]">Paiement non confirmé</p>
                <p className="text-xs text-[#6D7175] mt-1">{payunitReturn.error || "Le paiement n'a pas pu être vérifié. Contactez le marchand si le montant a été débité."}</p>
                <button onClick={() => setPayunitReturn(null)} className="mt-5 w-full bg-[#202223] text-white text-sm font-semibold py-2.5 rounded-full hover:opacity-90">Fermer</button>
              </>
            )}
          </div>
        </div>
      )}

      <ErrorBoundary>
        <ThemeRenderer theme={theme} sections={storeSections} mode="storefront" onAddToCart={addToCart} storeSlug={slug} tenantId={store.id} />
      </ErrorBoundary>

      {/* Cart drawer — WooCommerce style */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-foreground" />
                <h2 className="font-heading font-bold text-base text-foreground">Mon panier</h2>
                <span className="text-xs font-semibold text-muted-foreground bg-surface px-2 py-0.5 rounded-full">{cartCount}</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-surface text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!cart || (cart.items || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4"><ShoppingCart className="w-8 h-8 text-muted-foreground/40" /></div>
                  <p className="font-semibold text-foreground">Votre panier est vide</p>
                  <p className="text-sm text-muted-foreground mt-1">Découvrez nos produits et ajoutez vos favoris.</p>
                  <button onClick={() => setCartOpen(false)} className="mt-5 bg-foreground text-background font-semibold px-5 py-2.5 rounded-full text-sm hover:opacity-90">Continuer mes achats</button>
                </div>
              ) : (
                <div className="px-4 py-4 space-y-3">
                  {(cart.items || []).map((item) => (
                    <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="flex gap-3 pb-3 border-b border-border/60">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface shrink-0 border border-border">
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{item.title}</p>
                        {item.variant_title && <p className="text-xs text-muted-foreground">{item.variant_title}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">{formatMoney(item.price, store.currency)} / unité</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="inline-flex items-center border border-border rounded-full overflow-hidden">
                            <button onClick={() => updateQty(item.product_id, -1, item.variant_id || null)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-surface"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                            <button onClick={() => updateQty(item.product_id, 1, item.variant_id || null)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-surface"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.product_id, item.variant_id || null)} className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs font-medium"><Trash2 className="w-3.5 h-3.5" /> Retirer</button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-foreground whitespace-nowrap self-start">{formatMoney(item.line_total, store.currency)}</p>
                    </div>
                  ))}

                  {/* Coupon */}
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-border rounded-lg">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Code promo" className="flex-1 outline-none text-sm" />
                      </div>
                      <button onClick={applyCoupon} className="px-4 py-2 rounded-lg text-sm font-semibold border border-foreground text-foreground hover:bg-foreground hover:text-background transition">Appliquer</button>
                    </div>
                    {couponMsg && (
                      <p className={`text-xs font-medium mt-1.5 ${couponMsg.ok ? 'text-emerald-600' : 'text-destructive'}`}>{couponMsg.text}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {cart && (cart.items || []).length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-2.5 bg-surface/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-semibold text-foreground">{formatMoney(cartSubtotal, store.currency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span className="font-medium">Réduction ({discount?.code})</span>
                    <span className="font-semibold">-{formatMoney(discountAmount, store.currency)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5"><Truck className="w-4 h-4" /> Livraison</span>
                  <span className="font-semibold text-emerald-600">Offerte</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="font-heading font-bold text-foreground">Total</span>
                  <span className="font-heading font-bold text-lg text-foreground">{formatMoney(cartTotal, store.currency)}</span>
                </div>
                <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} className="w-full font-semibold py-3.5 rounded-full text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2 mt-1" style={{ background: theme.palette.primary, color: theme.palette.primaryText }}>
                  Passer à la commande <ArrowRight className="w-4 h-4" />
                </button>
                <Link to={`/store/${slug}/cart`} onClick={() => setCartOpen(false)} className="w-full block text-center text-xs font-medium text-foreground hover:underline">Voir le panier complet</Link>
                <button onClick={() => setCartOpen(false)} className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground">Continuer mes achats</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout — Shopify style */}
      {checkoutOpen && (
        <CheckoutModal store={store} cart={cart} discount={discount} discountAmount={discountAmount} activeGateways={activeGateways} theme={theme} onClose={() => setCheckoutOpen(false)} onDone={() => { localStorage.removeItem(CART_KEY); setCart(null); setCartCount(0); setDiscount(null); setCouponCode(''); setCheckoutOpen(false); }} />
      )}
    </div>
  );
}

// Real review submission, right where it actually makes sense: order
// confirmation, the one moment a real order_id (required - these are
// verified-purchase reviews, not open to anyone) is genuinely known.
// Low-friction by design: tap a star to submit immediately, an optional
// comment field appears after rating rather than blocking the rating
// itself behind a longer form.
function ReviewPrompt({ tenantId, order, theme }) {
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [busy, setBusy] = useState(null);

  const submit = async (item) => {
    const key = `${item.product_id}-${item.variant_id || ''}`;
    const rating = ratings[key];
    if (!rating) return;
    setBusy(key);
    try {
      const { error } = await supabase.from('product_reviews').insert({
        tenant_id: tenantId,
        product_id: item.product_id,
        order_id: order.id,
        customer_name: 'Client vérifié',
        rating,
        comment: comments[key]?.trim() || null,
      });
      if (error) throw error;
      setSubmitted((s) => ({ ...s, [key]: true }));
    } catch (e) {
      alert(e.message || "Échec de l'envoi de l'avis");
    } finally { setBusy(null); }
  };

  return (
    <div className="mt-6 pt-5 border-t border-border">
      <p className="text-sm font-semibold text-foreground mb-3">Comment était votre commande ?</p>
      <div className="space-y-3">
        {order.items.map((item) => {
          const key = `${item.product_id}-${item.variant_id || ''}`;
          const rating = ratings[key];
          const isSubmitted = submitted[key];
          return (
            <div key={key} className="flex items-start gap-2.5">
              {item.image && <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                {isSubmitted ? (
                  <p className="text-[11px] text-emerald-600 mt-0.5">Merci pour votre avis !</p>
                ) : (
                  <>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <button key={i} onClick={() => setRatings((r) => ({ ...r, [key]: i + 1 }))} disabled={busy === key}>
                          <Star className={`w-4 h-4 ${rating && i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <div className="flex gap-1.5 mt-1.5">
                        <input
                          value={comments[key] || ''}
                          onChange={(e) => setComments((c) => ({ ...c, [key]: e.target.value }))}
                          placeholder="Un commentaire (optionnel)"
                          className="flex-1 text-xs px-2 py-1.5 border border-border rounded-md outline-none focus:ring-1 focus:ring-brand/40"
                        />
                        <button onClick={() => submit(item)} disabled={busy === key} className="text-xs font-semibold px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50 shrink-0" style={{ background: theme.palette.primary, color: theme.palette.primaryText }}>
                          {busy === key ? '…' : 'Publier'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CheckoutModal({ store, cart, discount, discountAmount, activeGateways, theme, onClose, onDone }) {
  // Falls back to the plain default palette rather than crashing if a
  // caller doesn't pass theme (defensive - every real caller now does).
  const primary = theme?.palette?.primary || '#008060';
  const primaryText = theme?.palette?.primaryText || '#FFFFFF';
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', phone: '', country: '', city: '', address: '', postal_code: '', note: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(activeGateways?.includes('flutterwave') ? 'flutterwave' : activeGateways?.includes('paystack') ? 'paystack' : activeGateways?.includes('stripe') ? 'stripe' : 'cod');
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [error, setError] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [paypalPending, setPaypalPending] = useState(null); // { paypalOrderId, sellionOrderId } while showing the Buttons overlay
  const cardElementRef = useRef(null);
  const paypalButtonsRef = useRef(null);
  const stripeRef = useRef(null);
  const cardRef = useRef(null);

  // Stripe Elements needs its Card field mounted in the DOM before the
  // customer clicks pay (they need to type into it) - only the publishable
  // key is needed for that, no order/PaymentIntent yet.
  useEffect(() => {
    if (paymentMethod !== 'stripe' || !activeGateways?.includes('stripe') || stripeRef.current) return;
    (async () => {
      try {
        await loadScript('https://js.stripe.com/v3/');
        const { data, error: keyError } = await supabase.functions.invoke('stripe-checkout', { body: { action: 'get_public_key', tenant_id: store.id } });
        if (keyError) throw new Error(await functionErrorMessage(keyError));
        if (data?.error) throw new Error(data.error);
        stripeRef.current = window.Stripe(data.publishable_key);
        const elements = stripeRef.current.elements();
        cardRef.current = elements.create('card', { style: { base: { fontSize: '14px' } } });
        if (cardElementRef.current) cardRef.current.mount(cardElementRef.current);
        setStripeReady(true);
      } catch (e) {
        setError(e.message || 'Impossible de charger Stripe.');
      }
    })();
  }, [paymentMethod, activeGateways, store.id]);

  // Renders PayPal's own real Buttons once a PayPal order has actually
  // been created server-side (paypalPending set in placeOrder above) -
  // createOrder just hands back the already-created id, onApprove
  // captures it through paypal-checkout's own server-side verification
  // (never trusts the client-side approval alone, same rule as every
  // other gateway here).
  useEffect(() => {
    if (!paypalPending || !window.paypal || !paypalButtonsRef.current) return;
    paypalButtonsRef.current.innerHTML = '';
    const buttons = window.paypal.Buttons({
      createOrder: () => Promise.resolve(paypalPending.paypalOrderId),
      onApprove: async () => {
        setPlacing(true);
        try {
          const { data: v, error: vErr } = await supabase.functions.invoke('paypal-checkout', { body: { action: 'capture', order_id: paypalPending.sellionOrderId, paypal_order_id: paypalPending.paypalOrderId } });
          if (vErr) throw new Error(await functionErrorMessage(vErr));
          if (v.status !== 'paid') throw new Error('Paiement non confirmé par PayPal.');
          if (cart?.id) await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('id', cart.id);
          setOrderNumber('#' + paypalPending.sellionOrderId.slice(0, 8).toUpperCase());
          setPaypalPending(null);
          setDone(true);
          onDone();
        } catch (e) {
          setError(e.message || 'Paiement non confirmé.');
        } finally {
          setPlacing(false);
        }
      },
      onCancel: () => setPaypalPending(null),
      onError: () => setError('Une erreur PayPal est survenue. Réessayez.'),
    });
    buttons.render(paypalButtonsRef.current);
    return () => { buttons.close?.(); };
  }, [paypalPending]);

  const PAYMENT_METHODS = [
    ...(activeGateways?.includes('flutterwave') ? [{ id: 'flutterwave', label: 'Carte bancaire / Mobile Money', desc: 'Paiement immédiat sécurisé via Flutterwave', icon: CreditCard }] : []),
    ...(activeGateways?.includes('paystack') ? [{ id: 'paystack', label: 'Carte bancaire', desc: 'Paiement immédiat sécurisé via Paystack', icon: CreditCard }] : []),
    ...(activeGateways?.includes('stripe') ? [{ id: 'stripe', label: 'Carte bancaire (Stripe)', desc: 'Visa, Mastercard, Amex', icon: CreditCard }] : []),
    ...(activeGateways?.includes('payunit') ? [{ id: 'payunit', label: 'Mobile Money / Carte (Payunit)', desc: 'Orange Money, MTN MoMo, carte bancaire — paiement immédiat sécurisé', icon: Phone }] : []),
    ...(activeGateways?.includes('paypal') ? [{ id: 'paypal', label: 'PayPal', desc: 'Payez avec votre compte PayPal', icon: CreditCard }] : []),
    // Manual methods now respect the merchant's own real choice
    // (Paramètres > Paiements > Méthodes manuelles) instead of always
    // showing all 3 to every customer regardless of what the merchant
    // actually wants to offer (a merchant selling higher-value goods may
    // not want cash-on-delivery's fraud/logistics risk at all, for
    // example) - defaults to on so nothing changes for a merchant who
    // never touched this setting.
    ...(store.settings?.manualPayments?.cod !== false ? [{ id: 'cod', label: 'Paiement à la livraison', desc: 'Payez en espèces à la réception', icon: Truck }] : []),
    ...(store.settings?.manualPayments?.transfer !== false ? [{ id: 'transfer', label: 'Virement bancaire', desc: 'Virement avant expédition', icon: CreditCard }] : []),
    ...(store.settings?.manualPayments?.mobile !== false ? [{ id: 'mobile', label: 'Mobile Money (manuel)', desc: 'Orange Money, Wave, MTN MoMo', icon: Phone }] : []),
  ];

  const cartSubtotal = (cart?.total_cents || 0) / 100;
  const total = Math.max(0, cartSubtotal - discountAmount);

  const placeOrder = async (e) => {
    e.preventDefault();
    if (theme.checkout?.enableTerms === true && !termsAccepted) {
      setError("Veuillez accepter les conditions pour continuer.");
      return;
    }
    setPlacing(true);
    setError('');
    try {
      // Real order creation now happens entirely server-side
      // (create-order) - the browser never supplies a price for anything,
      // only product_id/variant_id/quantity. The server looks up real
      // current prices and re-validates the discount code itself, so a
      // tampered client-side total can no longer be paid as if it were
      // the real price (a genuine gap found in a deep checkout audit -
      // every gateway's verify step correctly checked payment against
      // orders.total_cents, but nothing had ever confirmed that number
      // matched the real products in the first place).
      const orderItemsForApi = (cart.items || []).map((i) => ({ product_id: i.product_id, variant_id: i.variant_id || null, quantity: i.quantity }));
      const { data: created, error: createError } = await supabase.functions.invoke('create-order', {
        body: {
          tenant_id: store.id,
          items: orderItemsForApi,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          country: form.country,
          city: form.city,
          address: form.address,
          postal_code: form.postal_code,
          discount_code: discount?.code || null,
          payment_method_label: PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label || 'Manuel',
          customer_note: theme.checkout?.enableOrderNote !== false ? form.note : undefined,
        },
      });
      if (createError) throw new Error(await functionErrorMessage(createError));
      if (created.error) throw new Error(created.error);

      const order = { id: created.order_id };
      setCompletedOrder({ id: order.id, items: cart.items || [] });

      // Cart is marked recovered at each real payment-success point below
      // (not here) - marking it immediately after order creation would
      // flag it recovered even if the payment itself then fails (card
      // declined, gateway timeout), wrongly excluding a genuinely
      // abandoned cart from ever getting a real reminder.

      if (paymentMethod === 'stripe') {
        if (!stripeReady || !stripeRef.current || !cardRef.current) throw new Error('Le module de paiement Stripe n’est pas encore prêt.');
        const { data, error: initError } = await supabase.functions.invoke('stripe-checkout', { body: { action: 'create_intent', order_id: order.id } });
        if (initError) throw new Error(await functionErrorMessage(initError));
        if (data.error) throw new Error(data.error);

        const { paymentIntent, error: confirmError } = await stripeRef.current.confirmCardPayment(data.client_secret, {
          payment_method: { card: cardRef.current, billing_details: { name: `${form.first_name} ${form.last_name}`.trim(), email: form.email } },
        });
        if (confirmError) throw new Error(confirmError.message);

        // Same rule as every other gateway here: the client-side
        // confirmation result is not trusted alone - re-fetch the
        // PaymentIntent from Stripe's own API server-side before marking
        // the order paid.
        const { data: v, error: vErr } = await supabase.functions.invoke('stripe-checkout', { body: { action: 'verify', order_id: order.id, payment_intent_id: paymentIntent.id } });
        if (vErr) throw new Error(await functionErrorMessage(vErr));
        if (v.status !== 'paid') throw new Error('Paiement non confirmé par Stripe.');

        if (cart?.id) await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('id', cart.id);
        setOrderNumber('#' + order.id.slice(0, 8).toUpperCase());
        setDone(true);
        onDone();
        return;
      }

      if (paymentMethod === 'flutterwave') {
        const { data, error: initError } = await supabase.functions.invoke('flutterwave-checkout', { body: { action: 'initiate', order_id: order.id } });
        if (initError) throw new Error(await functionErrorMessage(initError));
        if (data.error) throw new Error(data.error);
        await loadScript('https://checkout.flutterwave.com/v3.js');
        setPlacing(false);
        window.FlutterwaveCheckout({
          public_key: data.public_key,
          tx_ref: data.tx_ref,
          amount: data.amount,
          currency: data.currency,
          customer: data.customer,
          customizations: { title: store.name },
          callback: async (response) => {
            // The popup's own response is never trusted as proof of payment -
            // only the server-side verify (Flutterwave's own /verify
            // endpoint, called with the secret key) can confirm it.
            setPlacing(true);
            try {
              const { data: v, error: vErr } = await supabase.functions.invoke('flutterwave-checkout', { body: { action: 'verify', transaction_id: response.transaction_id, tx_ref: response.tx_ref } });
              if (vErr) throw new Error(await functionErrorMessage(vErr));
              if (v.status !== 'paid') throw new Error('Paiement non confirmé par Flutterwave.');
              if (cart?.id) await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('id', cart.id);
              setOrderNumber('#' + order.id.slice(0, 8).toUpperCase());
              setDone(true);
              onDone();
            } catch (vErr2) {
              setError(vErr2.message || 'Paiement non confirmé.');
            } finally {
              setPlacing(false);
            }
          },
          onclose: () => {},
        });
        return;
      }

      if (paymentMethod === 'paystack') {
        const { data, error: initError } = await supabase.functions.invoke('paystack-checkout', { body: { action: 'initiate', order_id: order.id } });
        if (initError) throw new Error(await functionErrorMessage(initError));
        if (data.error) throw new Error(data.error);
        await loadScript('https://js.paystack.co/v1/inline.js');
        setPlacing(false);
        const handler = window.PaystackPop.setup({
          key: data.public_key,
          email: data.email,
          amount: data.amount,
          currency: data.currency,
          ref: data.reference,
          callback: (response) => {
            // Same rule: the popup's callback is never trusted alone.
            setPlacing(true);
            (async () => {
              try {
                const { data: v, error: vErr } = await supabase.functions.invoke('paystack-checkout', { body: { action: 'verify', reference: response.reference } });
                if (vErr) throw new Error(await functionErrorMessage(vErr));
                if (v.status !== 'paid') throw new Error('Paiement non confirmé par Paystack.');
                if (cart?.id) await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('id', cart.id);
                setOrderNumber('#' + order.id.slice(0, 8).toUpperCase());
                setDone(true);
                onDone();
              } catch (vErr2) {
                setError(vErr2.message || 'Paiement non confirmé.');
              } finally {
                setPlacing(false);
              }
            })();
          },
          onClose: () => {},
        });
        handler.openIframe();
        return;
      }

      if (paymentMethod === 'payunit') {
        const { data, error: initError } = await supabase.functions.invoke('payunit-checkout', { body: { action: 'initiate', order_id: order.id } });
        if (initError) throw new Error(await functionErrorMessage(initError));
        if (data.error) throw new Error(data.error);
        // Payunit's own hosted page - a real redirect, not an inline
        // popup like the other 3. Cart is intentionally left untouched
        // (not cleared here) so the return handler below can still find
        // the pending order after the round trip.
        sessionStorage.setItem('sellia_payunit_pending_order', order.id);
        window.location.href = data.transaction_url;
        return;
      }

      if (paymentMethod === 'paypal') {
        const { data: idData, error: idError } = await supabase.functions.invoke('paypal-checkout', { body: { action: 'get_client_id', order_id: order.id } });
        if (idError) throw new Error(await functionErrorMessage(idError));
        if (idData.error) throw new Error(idData.error);
        const { data: created2, error: createError2 } = await supabase.functions.invoke('paypal-checkout', { body: { action: 'create_order', order_id: order.id } });
        if (createError2) throw new Error(await functionErrorMessage(createError2));
        if (created2.error) throw new Error(created2.error);
        await loadScript(`https://www.paypal.com/sdk/js?client-id=${idData.client_id}&currency=${(store.currency || 'USD').toUpperCase()}`);
        setPlacing(false);
        // PayPal renders its own real "Pay" buttons (unlike the popups
        // above, there is no single generic click to trigger) - shown in
        // an overlay rather than replacing this form, so the customer's
        // cart/order context stays visible.
        setPaypalPending({ sellionOrderId: order.id, paypalOrderId: created2.paypal_order_id });
        return;
      }

      if (cart?.id) await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('id', cart.id);
      setOrderNumber('#' + order.id.slice(0, 8).toUpperCase());
      setDone(true);
      onDone();
    } catch (err) {
      setError(err.message || 'Commande impossible');
    } finally {
      setPlacing(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto py-8">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl my-auto">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-600" /></div>
            <h2 className="font-heading font-bold text-lg text-foreground">Commande confirmée !</h2>
            <p className="text-sm text-muted-foreground mt-1.5">Votre commande {orderNumber} a bien été reçue.</p>
          </div>
          {completedOrder && completedOrder.items.length > 0 && (
            <ReviewPrompt tenantId={store.id} order={completedOrder} theme={theme} />
          )}
          <button onClick={onClose} className="mt-6 w-full bg-foreground text-background font-semibold py-3 rounded-full text-sm hover:opacity-90">Continuer mes achats</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAFB] overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 bg-white border-b border-border z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Retour au panier</button>
          <div className="flex items-center gap-2 font-heading font-bold text-foreground">
            <Lock className="w-4 h-4 text-emerald-600" /> <span className="hidden sm:inline">Commande sécurisée</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-10">
        {/* Form column */}
        <form id="checkout-form" onSubmit={placeOrder} className="space-y-6">
          {/* Contact */}
          <section>
            <h2 className="flex items-center gap-2 font-heading font-bold text-base text-foreground mb-3"><span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center">1</span> Contact</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-3 border border-border rounded-lg bg-white">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <input
                  required
                  type="email"
                  placeholder="Adresse e-mail"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={(e) => {
                    // Captured as soon as they type it, not just on final
                    // submit - the abandoned-cart trigger below can only
                    // ever reach someone whose email it actually has, and
                    // most real abandonment happens after this point but
                    // before the order is placed.
                    const email = e.target.value.trim();
                    if (!email || !email.includes('@') || !store?.id) return;
                    supabase.from('abandoned_carts').update({ customer_email: email }).eq('tenant_id', store.id).eq('session_id', getCartSessionId()).eq('status', 'open').then(() => {});
                  }}
                  className="flex-1 outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-3 border border-border rounded-lg bg-white">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <input required placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="flex-1 outline-none text-sm" />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="flex items-center gap-2 font-heading font-bold text-base text-foreground mb-3"><span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center">2</span> Adresse de livraison</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Prénom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="px-3 py-3 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white" />
                <input required placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="px-3 py-3 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white" />
              </div>
              <div className="flex items-center gap-2 px-3 py-3 border border-border rounded-lg bg-white">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <input required placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="flex-1 outline-none text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input required placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-3 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white" />
                <input required placeholder="Pays" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="px-3 py-3 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white" />
                <input placeholder="Code postal" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="px-3 py-3 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white" />
              </div>
            </div>
          </section>

          {theme.checkout?.enableOrderNote !== false && (
            <section>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{theme.checkout?.orderNoteLabel || 'Note de commande (optionnel)'}</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                maxLength={1000}
                placeholder="Instructions de livraison, message cadeau…"
                className="w-full px-3 py-2.5 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white resize-none"
              />
            </section>
          )}

          {/* Payment */}
          <section>
            <h2 className="flex items-center gap-2 font-heading font-bold text-base text-foreground mb-3"><span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center">3</span> Mode de paiement</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => {
                const active = paymentMethod === m.id;
                return (
                  <button type="button" key={m.id} onClick={() => setPaymentMethod(m.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border-2 text-left transition ${active ? 'border-foreground bg-foreground/[0.03]' : 'border-border bg-white hover:border-muted-foreground/40'}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-foreground' : 'border-muted-foreground/40'}`}>
                      {active && <span className="w-2 h-2 rounded-full bg-foreground" />}
                    </span>
                    <m.icon className="w-5 h-5 text-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {paymentMethod === 'stripe' && (
              <div className="mt-3 p-3.5 border border-border rounded-lg bg-white">
                <label className="block text-xs font-semibold text-foreground mb-2">Numéro de carte</label>
                <div ref={cardElementRef} className="px-3 py-3 border border-border rounded-md" />
                {!stripeReady && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Chargement du module de paiement sécurisé…</p>}
              </div>
            )}
            {paymentMethod === 'paypal' && paypalPending && (
              <div className="mt-3 p-3.5 border border-border rounded-lg bg-white">
                <p className="text-xs text-muted-foreground mb-2">Finalisez votre paiement avec PayPal :</p>
                <div ref={paypalButtonsRef} />
              </div>
            )}
          </section>

          {theme.checkout?.enableTerms === true && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 accent-current" style={{ color: primary }} />
              <span>
                {theme.checkout?.termsText || "J'accepte les conditions générales de vente"}
                {theme.checkout?.termsUrl && theme.checkout.termsUrl !== '#' && (
                  <> — <a href={theme.checkout.termsUrl.startsWith('/store/') || theme.checkout.termsUrl.startsWith('http') ? theme.checkout.termsUrl : `/store/${slug}${theme.checkout.termsUrl.startsWith('/') ? theme.checkout.termsUrl : '/' + theme.checkout.termsUrl}`} target="_blank" rel="noreferrer" className="underline" onClick={(e) => e.stopPropagation()}>Lire</a></>
                )}
              </span>
            </label>
          )}

          {error && <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          {/* Pay button (mobile) */}
          {!(paymentMethod === 'paypal' && paypalPending) && (
          <button type="submit" disabled={placing || (theme.checkout?.enableTerms === true && !termsAccepted)} className="lg:hidden w-full font-semibold py-4 rounded-full text-sm hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 sticky bottom-3 shadow-lg" style={{ background: primary, color: primaryText }}>
            {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {placing ? 'Traitement…' : `Payer ${formatMoney(total, store.currency)}`}
          </button>
          )}
        </form>

        {/* Order summary column (Shopify sticky sidebar) */}
        <aside>
          <div className="bg-white rounded-2xl border border-border p-5 lg:sticky lg:top-20">
            <h2 className="flex items-center gap-2 font-heading font-bold text-base text-foreground mb-4"><ShoppingCart className="w-5 h-5" /> Récapitulatif</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(cart?.items || []).map((item) => (
                <div key={item.product_id} className="flex gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface shrink-0 border border-border">
                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                    <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatMoney(item.price, store.currency)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground whitespace-nowrap">{formatMoney(item.line_total, store.currency)}</p>
                </div>
              ))}
              {(!cart || (cart.items || []).length === 0) && <p className="text-sm text-muted-foreground text-center py-6">Panier vide</p>}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span className="font-semibold text-foreground">{formatMoney(cartSubtotal, store.currency)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600"><span className="font-medium">Réduction ({discount?.code})</span><span className="font-semibold">-{formatMoney(discountAmount, store.currency)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground inline-flex items-center gap-1.5"><Truck className="w-4 h-4" /> Livraison</span><span className="font-semibold text-emerald-600">Offerte</span></div>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <span className="font-heading font-bold text-foreground">Total</span>
              <div className="text-right">
                <span className="font-heading font-bold text-xl text-foreground block leading-none">{formatMoney(total, store.currency)}</span>
                <span className="text-[11px] text-muted-foreground">{store.currency}</span>
              </div>
            </div>

            {!(paymentMethod === 'paypal' && paypalPending) ? (
            <button type="submit" form="checkout-form" disabled={placing || (theme.checkout?.enableTerms === true && !termsAccepted)} className="hidden lg:flex w-full font-semibold py-3.5 rounded-full text-sm hover:opacity-90 transition-colors disabled:opacity-50 items-center justify-center gap-2 mt-4" style={{ background: primary, color: primaryText }}>
              {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {placing ? 'Traitement…' : `Payer ${formatMoney(total, store.currency)}`}
            </button>
            ) : (
              <p className="hidden lg:block text-xs text-muted-foreground mt-4">Finalisez votre paiement avec les boutons PayPal ci-dessus.</p>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Paiement chiffré & sécurisé
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

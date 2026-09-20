import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, X, Loader2, AlertCircle, Trash2, ArrowRight, ArrowLeft, Check,
  Minus, Plus, Tag, Truck, MapPin, Mail, Phone, ShieldCheck, Lock, CreditCard,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ThemeRenderer from '@/components/theme/ThemeRenderer';
import { cloneTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { formatMoney } from '@/lib/world/currencies';

const CUSTOM_KEY = 'sellia_theme_custom';
const THEME_KEY = 'sellia_theme';
const CART_KEY = 'sellia_cart_id';

function loadTheme() {
  const custom = localStorage.getItem(CUSTOM_KEY);
  if (custom) { try { return JSON.parse(custom); } catch { /* fall through */ } }
  return cloneTheme(localStorage.getItem(THEME_KEY) || DEFAULT_THEME_ID);
}

export default function Storefront() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(loadTheme);
  const [cart, setCart] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [discount, setDiscount] = useState(null);

  const loadStore = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('publicStore', { slug });
      if (res.data?.error) throw new Error(res.data.error);
      setStore(res.data.store);
      setProducts(res.data.products || []);
      setCollections(res.data.collections || []);
      setArticles(res.data.articles || []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Boutique introuvable');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadCart = useCallback(async () => {
    const cartId = localStorage.getItem(CART_KEY);
    if (!cartId || !store?.id) return;
    try {
      const c = await base44.entities.Cart.get(cartId);
      if (c && c.store_id === store.id) {
        setCart(c);
        setCartCount((c.items || []).reduce((s, i) => s + i.quantity, 0));
      }
    } catch { localStorage.removeItem(CART_KEY); }
  }, [store?.id]);

  useEffect(() => { loadStore(); }, [loadStore]);
  useEffect(() => { if (store) loadCart(); }, [store, loadCart]);

  const storeSections = useMemo(() => {
    const prods = products.map((p) => ({
      _id: p.id,
      image: (p.images && p.images[0]) || 'https://picsum.photos/seed/p' + p.id + '/600',
      title: p.title,
      price: formatMoney(p.price, store?.currency || p.currency),
      _price: p.price,
    }));
    const posts = articles.map((a) => ({
      _id: a.id,
      _handle: a.handle,
      image: a.featured_image || 'https://picsum.photos/seed/art' + a.id + '/700/500',
      title: a.title,
      excerpt: a.excerpt || (a.content || '').replace(/<[^>]*>/g, '').slice(0, 120),
      date: a.published_at ? new Date(a.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      author: a.author || '',
    }));
    return theme.sections.map((s) => {
      if (s.type === 'productGrid' && prods.length > 0) {
        return { ...s, props: { ...s.props, products: prods.slice(0, s.props?.columns ? s.props.columns * 2 : 8) } };
      }
      if (s.type === 'blogList' && posts.length > 0) {
        return { ...s, props: { ...s.props, posts: posts.slice(0, 3) } };
      }
      return s;
    });
  }, [theme, products, articles, store]);

  const addToCart = async (product) => {
    let currentCart = cart;
    if (!currentCart) {
      try {
        currentCart = await base44.entities.Cart.create({
          store_id: store.id,
          currency: store.currency,
          items: [],
          subtotal: 0,
          total: 0,
          status: 'active',
        });
        localStorage.setItem(CART_KEY, currentCart.id);
        setCart(currentCart);
      } catch { return; }
    }
    const items = [...(currentCart.items || [])];
    const existing = items.find((i) => i.product_id === product._id);
    if (existing) {
      existing.quantity += 1;
      existing.line_total = existing.price * existing.quantity;
    } else {
      items.push({
        product_id: product._id,
        title: product.title,
        image: product.image,
        price: product._price,
        quantity: 1,
        line_total: product._price,
      });
    }
    const subtotal = items.reduce((s, i) => s + i.line_total, 0);
    const updated = await base44.entities.Cart.update(currentCart.id, { items, subtotal, total: subtotal });
    setCart(updated);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    setCartOpen(true);
  };

  const updateQty = async (productId, delta) => {
    if (!cart) return;
    const items = [...(cart.items || [])];
    const item = items.find((i) => i.product_id === productId);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    item.line_total = item.price * item.quantity;
    const subtotal = items.reduce((s, i) => s + i.line_total, 0);
    const updated = await base44.entities.Cart.update(cart.id, { items, subtotal, total: subtotal });
    setCart(updated);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
  };

  const removeFromCart = async (productId) => {
    if (!cart) return;
    const items = (cart.items || []).filter((i) => i.product_id !== productId);
    const subtotal = items.reduce((s, i) => s + i.line_total, 0);
    const updated = await base44.entities.Cart.update(cart.id, { items, subtotal, total: subtotal });
    setCart(updated);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
  };

  const applyCoupon = async () => {
    if (!cart || !couponCode.trim()) return;
    setCouponMsg(null);
    try {
      const found = await base44.entities.Discount.filter({ store_id: store.id, code: couponCode.trim(), status: 'active' });
      const d = found[0];
      if (!d) { setCouponMsg({ ok: false, text: 'Code promo invalide.' }); return; }
      if (d.usage_limit && d.used_count >= d.usage_limit) { setCouponMsg({ ok: false, text: 'Ce code a atteint sa limite d\u2019utilisation.' }); return; }
      if (d.ends_at && new Date(d.ends_at) < new Date()) { setCouponMsg({ ok: false, text: 'Ce code a expiré.' }); return; }
      if (d.min_order_amount && (cart.subtotal || 0) < d.min_order_amount) { setCouponMsg({ ok: false, text: `Minimum requis : ${formatMoney(d.min_order_amount, store.currency)}.` }); return; }
      let amount = 0;
      if (d.type === 'percentage') amount = (cart.subtotal || 0) * (d.value / 100);
      else if (d.type === 'fixed_amount') amount = d.value;
      else if (d.type === 'free_shipping') amount = 0;
      amount = Math.min(amount, cart.subtotal || 0);
      setDiscount({ ...d, amount });
      const total = Math.max(0, (cart.subtotal || 0) - amount);
      const updated = await base44.entities.Cart.update(cart.id, { discount_code: d.code, total });
      setCart(updated);
      setCouponMsg({ ok: true, text: `Code appliqué : −${formatMoney(amount, store.currency)}` });
    } catch (e) {
      setCouponMsg({ ok: false, text: 'Erreur lors de l\u2019application du code.' });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <h1 className="text-lg font-bold text-foreground">Boutique introuvable</h1>
      <p className="text-sm text-muted-foreground mt-1">{error}</p>
      <Link to="/" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-brand/90 mt-4">Retour à l'accueil</Link>
    </div>
  );
  if (!store) return null;

  const discountAmount = discount?.amount || 0;
  const cartTotal = Math.max(0, (cart?.subtotal || 0) - discountAmount);

  return (
    <div className="min-h-screen bg-white">
      <button onClick={() => setCartOpen(true)} className="fixed bottom-5 right-5 z-40 bg-foreground text-background rounded-full p-4 shadow-2xl hover:opacity-90 transition flex items-center gap-2">
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-brand text-brand-foreground text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
      </button>

      <ThemeRenderer theme={theme} sections={storeSections} mode="storefront" onAddToCart={addToCart} storeSlug={slug} />

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
                    <div key={item.product_id} className="flex gap-3 pb-3 border-b border-border/60">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface shrink-0 border border-border">
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatMoney(item.price, store.currency)} / unité</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="inline-flex items-center border border-border rounded-full overflow-hidden">
                            <button onClick={() => updateQty(item.product_id, -1)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-surface"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                            <button onClick={() => updateQty(item.product_id, 1)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-surface"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.product_id)} className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs font-medium"><Trash2 className="w-3.5 h-3.5" /> Retirer</button>
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
                  <span className="font-semibold text-foreground">{formatMoney(cart.subtotal || 0, store.currency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span className="font-medium">Réduction ({discount?.code})</span>
                    <span className="font-semibold">−{formatMoney(discountAmount, store.currency)}</span>
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
                <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} className="w-full bg-brand text-brand-foreground font-semibold py-3.5 rounded-full text-sm hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 mt-1">
                  Passer à la commande <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setCartOpen(false)} className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground">Continuer mes achats</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout — Shopify style */}
      {checkoutOpen && (
        <CheckoutModal store={store} cart={cart} discount={discount} discountAmount={discountAmount} onClose={() => setCheckoutOpen(false)} onDone={() => { localStorage.removeItem(CART_KEY); setCart(null); setCartCount(0); setDiscount(null); setCouponCode(''); setCheckoutOpen(false); }} />
      )}
    </div>
  );
}

function CheckoutModal({ store, cart, discount, discountAmount, onClose, onDone }) {
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', phone: '', country: '', city: '', address: '', postal_code: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const PAYMENT_METHODS = [
    { id: 'cod', label: 'Paiement à la livraison', desc: 'Payez en espèces à la réception', icon: Truck },
    { id: 'transfer', label: 'Virement bancaire', desc: 'Virement avant expédition', icon: CreditCard },
    { id: 'mobile', label: 'Mobile Money', desc: 'Orange Money, Wave, MTN MoMo', icon: Phone },
  ];

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const num = '#' + Math.floor(1000 + Math.random() * 9000);
      const total = Math.max(0, (cart.subtotal || 0) - discountAmount);
      const order = await base44.entities.Order.create({
        store_id: store.id,
        order_number: num,
        customer_email: form.email,
        items: (cart.items || []).map((i) => ({
          product_id: i.product_id,
          title: i.title,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
          total: i.line_total,
        })),
        subtotal: cart.subtotal || 0,
        discount_total: discountAmount || 0,
        total,
        currency: store.currency,
        status: 'pending',
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        shipping_address: { country: form.country, city: form.city, address: form.address, postal_code: form.postal_code, phone: form.phone },
        payment_method: PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label || 'Manuel',
        note: `Client: ${form.first_name} ${form.last_name}`,
      });
      await base44.entities.Payment.create({
        store_id: store.id,
        order_id: order.id,
        amount: total,
        currency: store.currency,
        status: 'pending',
        provider: 'manual',
        method: paymentMethod,
        customer_email: form.email,
      });
      if (discount?.id) {
        try { await base44.entities.Discount.update(discount.id, { used_count: (discount.used_count || 0) + 1 }); } catch { /* ignore */ }
      }
      await base44.entities.Customer.filter({ store_id: store.id, email: form.email }).then((existing) => {
        if (existing.length === 0) {
          return base44.entities.Customer.create({ store_id: store.id, first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, orders_count: 1, total_spent: total });
        } else {
          return base44.entities.Customer.update(existing[0].id, { orders_count: (existing[0].orders_count || 0) + 1, total_spent: (existing[0].total_spent || 0) + total });
        }
      });
      await base44.entities.Cart.update(cart.id, { status: 'converted' });
      setOrderNumber(num);
      setDone(true);
      onDone();
    } catch (err) {
      alert('Erreur: ' + (err.message || 'commande impossible'));
    } finally {
      setPlacing(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-600" /></div>
          <h2 className="font-heading font-bold text-lg text-foreground">Commande confirmée !</h2>
          <p className="text-sm text-muted-foreground mt-1.5">Votre commande {orderNumber} a bien été reçue. Un e-mail de confirmation vous a été envoyé.</p>
          <button onClick={onClose} className="mt-6 w-full bg-foreground text-background font-semibold py-3 rounded-full text-sm hover:opacity-90">Continuer mes achats</button>
        </div>
      </div>
    );
  }

  const total = Math.max(0, (cart?.subtotal || 0) - discountAmount);

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
                <input required type="email" placeholder="Adresse e-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="flex-1 outline-none text-sm" />
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
              <div className="grid grid-cols-3 gap-3">
                <input required placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-3 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white" />
                <input required placeholder="Pays" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="px-3 py-3 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white" />
                <input placeholder="Code postal" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="px-3 py-3 border border-border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand/30 bg-white" />
              </div>
            </div>
          </section>

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
          </section>

          {/* Pay button (mobile) */}
          <button type="submit" disabled={placing} className="lg:hidden w-full bg-brand text-brand-foreground font-semibold py-4 rounded-full text-sm hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 sticky bottom-3 shadow-lg">
            {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {placing ? 'Traitement…' : `Payer ${formatMoney(total, store.currency)}`}
          </button>
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
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span className="font-semibold text-foreground">{formatMoney(cart?.subtotal || 0, store.currency)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600"><span className="font-medium">Réduction ({discount?.code})</span><span className="font-semibold">−{formatMoney(discountAmount, store.currency)}</span></div>
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

            <button type="submit" form="checkout-form" disabled={placing} className="hidden lg:flex w-full bg-brand text-brand-foreground font-semibold py-3.5 rounded-full text-sm hover:bg-brand/90 transition-colors disabled:opacity-50 items-center justify-center gap-2 mt-4">
              {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {placing ? 'Traitement…' : `Payer ${formatMoney(total, store.currency)}`}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Paiement chiffré & sécurisé
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
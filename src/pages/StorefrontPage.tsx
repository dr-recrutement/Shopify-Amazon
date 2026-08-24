import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, Plus, Minus, Trash2, Check, ArrowRight, Smartphone, CreditCard, Wallet, Lock } from 'lucide-react';
import {
  defaultThemeForType,
  renderSection,
  type ThemeConfig,
  type ThemeSection,
} from '../lib/theme-engine';
import {
  getShopTheme,
  getActiveCatalogProducts,
  getCatalogCategories,
  getShopProfile,
  getPrimaryDomain,
  getCartItems,
  saveCartItems,
  getProductImage,
  saveOrder,
  type CartItem,
  type StoreProduct,
} from '../lib/app-state';
import { resolvePublicTenant, fetchPublicProducts, fetchPublicTheme, createPublicOrder, fireOrderWebhook, type PublicTenant } from '../lib/tenant-sync';

type CartDrawerItem = CartItem & { image?: string };

/**
 * Public storefront — renders the merchant's live theme + sections with REAL
 * catalog products (active only). This is what a visitor sees at
 * /s/:slug (temporary domain) or a connected custom domain.
 *
 * Resolves the tenant from the URL slug via Supabase (public/anon read) so
 * a visitor sees the CORRECT merchant's store regardless of their own
 * browser's local session — this used to silently read the visitor's own
 * localStorage instead, which meant a real customer on their own device
 * never saw the merchant's actual catalog. Falls back to local storage
 * only when no slug is present or Supabase isn't configured (local/demo
 * preview from within the dashboard).
 *
 * Fully functional e-commerce: add to cart, cart drawer, checkout with
 * Mobile Money / card, and real order creation that appears in the
 * merchant's dashboard Orders list.
 */
export default function StorefrontPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cart, setCart] = useState<CartDrawerItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [resolvedTenant, setResolvedTenant] = useState<PublicTenant | null>(null);
  const [publicProducts, setPublicProducts] = useState<StoreProduct[] | null>(null);

  // Checkout form state
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('payunit');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (slug) {
        const tenant = await resolvePublicTenant(slug);
        if (!cancelled && tenant) {
          setResolvedTenant(tenant);
          const [products, cloudTheme] = await Promise.all([
            fetchPublicProducts(tenant.id),
            fetchPublicTheme<ThemeConfig>(tenant.id),
          ]);
          if (!cancelled) {
            setPublicProducts(products || []);
            setTheme(cloudTheme || defaultThemeForType('ecommerce'));
          }
        } else if (!cancelled) {
          // No slug match in Supabase (unpublished store, or local/demo
          // mode) — fall back to whatever's in this browser's local state,
          // same behavior as before this fix.
          const stored = getShopTheme<ThemeConfig | null>(null);
          setTheme(stored || defaultThemeForType('ecommerce'));
        }
      } else {
        const stored = getShopTheme<ThemeConfig | null>(null);
        setTheme(stored || defaultThemeForType('ecommerce'));
      }
    })();
    setCart(getCartItems());
    return () => { cancelled = true; };
  }, [slug]);

  // Attach product images to cart items once we know which catalog we're
  // rendering against (local preview vs resolved tenant).
  useEffect(() => {
    const catalog = publicProducts ?? getActiveCatalogProducts();
    setCart(prev => prev.map(c => {
      const prod = catalog.find(p => p.id === c.id);
      return { ...c, image: prod?.image || undefined };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicProducts]);

  const domainLabel = useMemo(() => slug ? `${slug}.os.liafrik.com` : getPrimaryDomain(), [slug]);
  const localProfile = useMemo(() => getShopProfile(), []);
  const shopName = resolvedTenant?.name || localProfile?.name || 'Boutique';
  const currency = resolvedTenant?.currency || localProfile?.currency || 'XOF';

  // Real header content is CMS-editable via the theme's 'header' section
  // (logo, nav links, announcement banner, search/cart visibility) —
  // merged into the one functional header instead of a second decorative
  // copy (see sectionsWithCatalog filter above).
  const headerProps = useMemo(() => {
    const headerSection = theme?.sections.find(s => s.type === 'header');
    return {
      logoText: headerSection?.props?.logoText || shopName,
      logoUrl: headerSection?.props?.logoUrl || '',
      nav: (headerSection?.props?.nav as string[] | undefined) || ['Accueil', 'Boutique', 'À propos', 'Contact'],
      showSearch: headerSection?.props?.showSearch !== false,
      showCart: headerSection?.props?.showCart !== false,
      showAnnouncement: !!headerSection?.props?.showAnnouncement,
      announcementText: headerSection?.props?.announcementText || '',
    };
  }, [theme, shopName]);

  const handleAddToCart = useCallback((product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === String(product.id));
      let updated: CartDrawerItem[];
      if (existing) {
        updated = prev.map(i => i.id === String(product.id) ? { ...i, qty: i.qty + 1 } : i);
      } else {
        updated = [...prev, {
          id: String(product.id),
          name: product.name || 'Produit',
          variant: product.subcategory || product.category || '',
          price: product.price || 0,
          qty: 1,
          currency: product.currency || 'XOF',
          image: product.image || getProductImage(product as any),
        }];
      }
      saveCartItems(updated);
      return updated;
    });
    setCartOpen(true);
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0);
      saveCartItems(updated);
      return updated;
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== id);
      saveCartItems(updated);
      return updated;
    });
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const sectionsWithCatalog: ThemeSection[] = useMemo(() => {
    if (!theme) return [];
    const products = publicProducts ?? getActiveCatalogProducts();
    const categories = getCatalogCategories();
    return theme.sections
      // The 'header' section is rendered by the functional <header> above
      // (sourced from this same section's props) — rendering it again here
      // produced two stacked headers: a decorative CMS one with dead
      // buttons, directly above the real one with working cart/search.
      .filter(s => s.type !== 'header')
      .map(s => {
        if (s.type === 'product-grid' || s.type === 'featured-collection') {
          const filtered = categoryFilter ? products.filter(p => p.category === categoryFilter) : products;
          return { ...s, props: { ...s.props, products: filtered } };
        }
        if (s.type === 'category-grid' || s.type === 'collection-list') {
          return { ...s, props: { ...s.props, categories } };
        }
        return s;
      });
  }, [theme, publicProducts, categoryFilter]);

  const handleCategoryClick = (name: string) => {
    setCategoryFilter(prev => (prev === name ? null : name));
    // Real category browsing on a single-page storefront: filter the
    // product grid in place and scroll to it, rather than a dead click
    // that went nowhere (there was no onClick at all before this).
    requestAnimationFrame(() => {
      document.getElementById('storefront-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Search results
  const allProducts = useMemo(() => publicProducts ?? getActiveCatalogProducts(), [publicProducts]);
  const searchResults = searchQuery
    ? allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim() || cart.length === 0) return;
    setCheckoutError(null);
    const orderId = resolvedTenant ? crypto.randomUUID() : `LA-${Date.now().toString().slice(-6)}`;
    const order = {
      id: orderId,
      orderNumber: `LA-${Date.now().toString().slice(-6)}`,
      customer: custName,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      total: cartTotal,
      status: 'pending' as const,
      payment: paymentMethod === 'payunit' ? 'PayUnit' : paymentMethod === 'orange_money' ? 'Orange Money' : paymentMethod === 'wave' ? 'Wave' : paymentMethod === 'mtn' ? 'MTN MoMo' : 'Carte bancaire',
      currency,
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
    };
    // Real customer on a resolved public tenant → write directly to that
    // tenant's Supabase orders (anon insert, status locked to 'pending' by
    // RLS). Local preview (no resolved tenant) keeps the old local-only
    // behavior so the dashboard's "preview my store" still works offline.
    if (resolvedTenant) {
      await createPublicOrder(resolvedTenant.id, order);
      fireOrderWebhook(resolvedTenant.id, order);

      // PayUnit is the only real, redirect-based payment integration
      // wired so far — this sends the buyer to PayUnit's own hosted
      // checkout page, which is real money movement, not a decorative
      // 'pending' order like the other unwired methods below.
      if (paymentMethod === 'payunit') {
        setRedirectingToPayment(true);
        try {
          const res = await fetch('/api/checkout/payunit-initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: resolvedTenant.id,
              orderId,
              amount: cartTotal,
              currency,
              customerEmail: custEmail,
              items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
            }),
          });
          const result = await res.json();
          if (res.ok && result.redirect) {
            window.location.href = result.redirect;
            return;
          }
          setCheckoutError(result.error || "Ce marchand n'a pas encore activé PayUnit. Choisissez un autre mode de paiement.");
        } catch {
          setCheckoutError('Le service de paiement est momentanément indisponible. Réessayez dans un instant.');
        }
        setRedirectingToPayment(false);
        return;
      }
    } else {
      saveOrder(order);
    }
    setOrderConfirmed(order.orderNumber || orderId);
    setCart([]);
    saveCartItems([]);
  };

  const fmtPrice = (amt: number) => `${amt.toLocaleString('fr-FR')} ${currency}`;

  if (!theme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement de la boutique…</p>
        </div>
      </div>
    );
  }

  const visibleSections = sectionsWithCatalog.filter(s => s.visible);

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.fonts.body }}>
      {/* Top utility bar */}
      <div className="border-b" style={{ borderColor: `${theme.colors.text}10` }}>
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between text-xs" style={{ color: theme.colors.text }}>
          <span className="opacity-60 truncate flex items-center gap-1"><Lock size={10} /> {domainLabel}</span>
          <div className="flex items-center gap-4">
            <button className="opacity-70 hover:opacity-100 transition-opacity">FR ▾</button>
            <span className="opacity-60">{currency}</span>
          </div>
        </div>
      </div>

      {/* Announcement bar */}
      {!visibleSections.some(s => s.type === 'announcement-bar') && (
        <div className="text-center text-xs font-medium py-2 px-4" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
          Livraison offerte dès 50 000 {currency} · Paiement mobile money accepté
        </div>
      )}

      {/* Sticky storefront header */}
      {headerProps.showAnnouncement && headerProps.announcementText && (
        <div className="text-center py-1.5 px-4 text-xs font-semibold tracking-wide text-white" style={{ backgroundColor: theme.colors.accent }}>
          {headerProps.announcementText}
        </div>
      )}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b" style={{ borderColor: `${theme.colors.text}10` }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button className="lg:hidden p-1" onClick={() => setMobileNavOpen(v => !v)} aria-label="Menu">
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="#" className="text-xl md:text-2xl font-black tracking-tight flex-shrink-0 flex items-center gap-2" style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>
            {headerProps.logoUrl ? <img src={headerProps.logoUrl} alt={headerProps.logoText} className="h-8 max-w-[140px] object-contain" /> : headerProps.logoText}
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" style={{ color: theme.colors.text }}>
            {headerProps.nav.map(item => (
              <Link key={item} to="#" className="hover:opacity-70 transition-opacity">{item}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {headerProps.showSearch && (
              <button className="p-1.5 hover:opacity-70 transition-opacity" aria-label="Rechercher" onClick={() => setSearchOpen(v => !v)}>
                <Search size={20} />
              </button>
            )}
            {headerProps.showCart && (
              <button className="relative p-1.5 hover:opacity-70 transition-opacity" aria-label="Panier" onClick={() => setCartOpen(true)}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: theme.colors.primary }}>{cartCount}</span>
                )}
              </button>
            )}
          </div>
        </div>
        {mobileNavOpen && (
          <nav className="lg:hidden border-t px-4 py-3 flex flex-col gap-3 text-sm font-medium" style={{ borderColor: `${theme.colors.text}10`, color: theme.colors.text }}>
            {headerProps.nav.map(item => (
              <Link key={item} to="#" onClick={() => setMobileNavOpen(false)}>{item}</Link>
            ))}
          </nav>
        )}
        {/* Search bar */}
        {searchOpen && (
          <div className="border-t px-4 py-3" style={{ borderColor: `${theme.colors.text}10` }}>
            <div className="max-w-6xl mx-auto">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit…"
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: `${theme.colors.text}20`, color: theme.colors.text }}
              />
              {searchQuery && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {searchResults.length === 0 ? (
                    <p className="text-sm opacity-60 col-span-full py-4 text-center">Aucun produit trouvé pour « {searchQuery} »</p>
                  ) : searchResults.map(p => (
                    <button key={p.id} onClick={() => { handleAddToCart(p); setSearchOpen(false); setSearchQuery(''); }} className="text-left border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-gray-100" />
                      )}
                      <div className="p-2">
                        <p className="text-xs font-medium truncate" style={{ color: theme.colors.text }}>{p.name}</p>
                        <p className="text-xs font-bold" style={{ color: theme.colors.primary }}>{fmtPrice(p.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Rendered live theme sections */}
      <main>
        {categoryFilter && (
          <div className="max-w-6xl mx-auto px-4 pt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtré par : <strong>{categoryFilter}</strong></span>
            <button onClick={() => setCategoryFilter(null)} className="text-xs text-brand-600 hover:underline">Retirer le filtre</button>
          </div>
        )}
        {visibleSections.map((section, idx) => {
          const isFirstProductSection = section.type === 'product-grid' && !visibleSections.slice(0, idx).some(s => s.type === 'product-grid');
          return (
            <div key={section.id} id={isFirstProductSection ? 'storefront-products' : undefined}>
              {renderSection(section, theme, { onAddToCart: handleAddToCart, productLinkBase: slug ? `/s/${slug}` : '/store', tenantId: resolvedTenant?.id, onCategoryClick: handleCategoryClick })}
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: `${theme.colors.text}10`, backgroundColor: `${theme.colors.text}05` }}>
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="text-lg font-black mb-3" style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>{shopName}</div>
            <p className="text-xs opacity-60 leading-relaxed" style={{ color: theme.colors.text }}>
              Boutique propulsée par LiAfrik Sellia — la plateforme e-commerce mondiale.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.colors.text }}>Boutique</h4>
            <ul className="space-y-2 text-xs opacity-70" style={{ color: theme.colors.text }}>
              <li><Link to="#" className="hover:underline">Tous les produits</Link></li>
              <li><Link to="#" className="hover:underline">Nouveautés</Link></li>
              <li><Link to="#" className="hover:underline">Meilleures ventes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.colors.text }}>Aide</h4>
            <ul className="space-y-2 text-xs opacity-70" style={{ color: theme.colors.text }}>
              <li><Link to="#" className="hover:underline">Suivi de commande</Link></li>
              <li><Link to="#" className="hover:underline">Livraison</Link></li>
              <li><Link to="#" className="hover:underline">Nous contacter</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.colors.text }}>Légal</h4>
            <ul className="space-y-2 text-xs opacity-70" style={{ color: theme.colors.text }}>
              <li><Link to="#" className="hover:underline">Conditions</Link></li>
              <li><Link to="#" className="hover:underline">Confidentialité</Link></li>
              <li><Link to="#" className="hover:underline">Mentions légales</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs opacity-50" style={{ borderColor: `${theme.colors.text}10`, color: theme.colors.text }}>
          © {new Date().getFullYear()} {shopName} · {domainLabel}
        </div>
      </footer>

      {/* ===== CART DRAWER (slide-in from right) ===== */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()} style={{ color: '#111' }}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} /> Panier ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Votre panier est vide</p>
                <button onClick={() => setCartOpen(false)} className="mt-4 text-sm font-medium text-brand-600 hover:underline">Continuer mes achats</button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 border-b border-gray-100 pb-3">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                        <p className="text-sm font-bold mt-1">{fmtPrice(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus size={12} /></button>
                          <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus size={12} /></button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-bold text-lg">{fmtPrice(cartTotal)}</span>
                  </div>
                  <p className="text-xs text-gray-400">Livraison calculée à l'étape suivante</p>
                  <button
                    onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    Commander <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== CHECKOUT MODAL ===== */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setCheckoutOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ color: '#111' }}>
            {orderConfirmed ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Commande confirmée !</h2>
                <p className="text-sm text-gray-500 mb-1">Votre numéro de commande</p>
                <p className="text-lg font-mono font-bold text-brand-600 mb-4">{orderConfirmed}</p>
                <p className="text-sm text-gray-500 mb-6">Nous vous contacterons au {custPhone} pour confirmer la livraison et le paiement.</p>
                <button
                  onClick={() => { setCheckoutOpen(false); setOrderConfirmed(null); setCustName(''); setCustPhone(''); setCustEmail(''); setCustAddress(''); setCustCity(''); }}
                  className="px-6 py-3 rounded-xl font-bold text-white"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Continuer mes achats
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
                  <h2 className="font-bold text-lg">Commander</h2>
                  <button onClick={() => setCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                </div>
                <form onSubmit={handleCheckout} className="p-6 space-y-6">
                  {/* Contact info */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Informations de contact</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input required placeholder="Nom complet *" value={custName} onChange={e => setCustName(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
                      <input required type="tel" placeholder="Téléphone *" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
                      <input type="email" placeholder="Email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 col-span-2" />
                      <input placeholder="Adresse de livraison" value={custAddress} onChange={e => setCustAddress(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 col-span-2" />
                      <input placeholder="Ville" value={custCity} onChange={e => setCustCity(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 col-span-2" />
                    </div>
                  </div>

                  {/* Payment method */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Mode de paiement</h3>
                    <div className="space-y-2">
                      {[
                        { id: 'payunit', label: 'PayUnit', icon: CreditCard, desc: 'Mobile Money, carte — paiement sécurisé' },
                        { id: 'orange_money', label: 'Orange Money', icon: Smartphone, desc: 'Paiement via USSD' },
                        { id: 'wave', label: 'Wave', icon: Wallet, desc: 'Paiement instantané' },
                        { id: 'mtn', label: 'MTN MoMo', icon: Smartphone, desc: 'Mobile Money' },
                        { id: 'card', label: 'Carte bancaire', icon: CreditCard, desc: 'Visa / Mastercard' },
                      ].map(p => {
                        const Icon = p.icon;
                        return (
                          <label key={p.id} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === p.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="radio" name="payment" value={p.id} checked={paymentMethod === p.id} onChange={e => setPaymentMethod(e.target.value)} className="sr-only" />
                            <Icon size={20} className={paymentMethod === p.id ? 'text-brand-600' : 'text-gray-400'} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{p.label}</div>
                              <div className="text-xs text-gray-400">{p.desc}</div>
                            </div>
                            {paymentMethod === p.id && <Check size={16} className="text-brand-600" />}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order summary */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Récapitulatif</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name} × {item.qty}</span>
                          <span className="font-medium">{fmtPrice(item.price * item.qty)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-lg" style={{ color: theme.colors.primary }}>{fmtPrice(cartTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {checkoutError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{checkoutError}</p>
                  )}
                  <button type="submit" disabled={redirectingToPayment} className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60" style={{ backgroundColor: theme.colors.primary }}>
                    <Lock size={16} /> {redirectingToPayment ? 'Redirection vers le paiement...' : `Confirmer la commande · ${fmtPrice(cartTotal)}`}
                  </button>
                  <p className="text-xs text-gray-400 text-center">Paiement sécurisé · Vos données sont protégées</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

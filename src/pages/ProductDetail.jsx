import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, ShoppingCart, Check, Minus, Plus, Star } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { cartGet, cartSave } from '@/lib/storefrontApi';
import ThemeRenderer from '@/components/theme/ThemeRenderer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme, migrateTheme } from '@/lib/themes';
import { WishlistHeart } from '@/components/theme/ThemeRenderer';

// Real color swatches for a "Couleur/Color" option, not just a text
// button like every other option - matches what a real premium storefront
// shows (a colored circle, not the word "Rouge"). Common French/English
// names mapped to real CSS colors; hex codes and valid CSS keywords
// (merchants who already type "red" or "#FF0000") work automatically.
const COLOR_NAME_MAP = {
  rouge: 'red', bleu: 'blue', 'bleu marine': 'navy', vert: 'green', jaune: 'gold',
  noir: 'black', blanc: 'white', gris: 'gray', rose: 'pink', violet: 'purple',
  orange: 'orange', marron: 'brown', beige: 'beige', doré: 'goldenrod', argenté: 'silver',
  turquoise: 'turquoise', bordeaux: 'maroon', kaki: 'darkkhaki', corail: 'coral',
};
function resolveSwatchColor(value) {
  const v = (value || '').trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
  if (COLOR_NAME_MAP[v]) return COLOR_NAME_MAP[v];
  // Let the browser itself judge whether the raw value is a valid CSS
  // color keyword (covers "red", "blue", etc. typed directly) - if it
  // isn't, the swatch is skipped entirely rather than rendering black.
  const probe = document.createElement('div');
  probe.style.color = '';
  probe.style.color = v;
  return probe.style.color ? v : null;
}
function isColorOption(name) {
  return /^(couleur|color|colou?r)$/i.test((name || '').trim());
}
import { applySEO } from '@/lib/seo';
import { formatMoney } from '@/lib/world/currencies';

const CART_KEY = 'sellia_cart_session';
function getCartSessionId() {
  let id = localStorage.getItem(CART_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(CART_KEY, id); }
  return id;
}

// The piece that was missing for a real "flux Shopify": products with
// variants (size/color...) had no way for a shopper to ever choose one -
// productGrid only ever quick-added the base product with no variant
// info, because there was no page where a variant selector could live.
// Reuses the same cart (abandoned_carts, keyed by the same session id) as
// Storefront.jsx, so items added here show up in the same cart there.
export default function ProductDetail() {
  const { slug, productId } = useParams();
  const [store, setStore] = useState(null);
  const [theme, setTheme] = useState(() => cloneTheme(DEFAULT_THEME_ID));
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = useCallback(async () => {
    if (!store) return;
    const sessionId = getCartSessionId();
    const data = await cartGet(store.id, sessionId).catch(() => null);
    setCartCount((data?.items || []).reduce((s, i) => s + (i.quantity || 0), 0));
  }, [store]);

  useEffect(() => { loadCartCount(); }, [loadCartCount]);
  const [suggestions, setSuggestions] = useState([]);
  const [reviews, setReviews] = useState([]);

  const load = useCallback(async () => {
    if (!slug || !productId) return;
    setLoading(true);
    try {
      const { data: tenant, error: tenantError } = await supabase.from('public_tenants').select('*').eq('slug', slug).maybeSingle();
      if (tenantError) throw tenantError;
      if (!tenant) throw new Error('Cette boutique n’existe pas.');
      setStore(tenant);

      const [themeRes, productRes] = await Promise.all([
        supabase.from('theme_configs').select('published_config').eq('tenant_id', tenant.id).maybeSingle(),
        supabase.from('products').select('*').eq('id', productId).eq('tenant_id', tenant.id).eq('status', 'active').maybeSingle(),
      ]);
      setTheme(isValidTheme(themeRes.data?.published_config) ? migrateTheme(themeRes.data.published_config) : cloneTheme(DEFAULT_THEME_ID));
      if (!productRes.data) throw new Error('Produit introuvable');
      setProduct(productRes.data);

      const { data: reviewsData } = await supabase.from('product_reviews').select('*').eq('product_id', productId).eq('is_approved', true).order('created_at', { ascending: false }).limit(20);
      setReviews(reviewsData || []);

      const options = productRes.data.metafields?.options || [];
      const initial = {};
      options.forEach((o) => { if (o.values?.[0]) initial[o.name] = o.values[0]; });
      setSelectedOptions(initial);
      setError(null);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally { setLoading(false); }
  }, [slug, productId]);

  useEffect(() => { load(); }, [load]);

  // Real "Vous aimerez aussi" suggestions, configured in Theme Editor
  // (title/count/mode). "category" mode uses the real product<->category
  // join table; falls back to random active products when the current
  // product has no category or none share one.
  useEffect(() => {
    if (!store?.id || !product) { setSuggestions([]); return; }
    const cfg = theme.productSuggestions || {};
    if (cfg.enabled === false) { setSuggestions([]); return; }
    const count = cfg.count || 4;
    (async () => {
      try {
        let ids = [];
        if ((cfg.mode || 'category') === 'category') {
          const { data: myCats } = await supabase.from('product_category_assignments').select('category_id').eq('product_id', product.id);
          const categoryIds = (myCats || []).map((c) => c.category_id);
          if (categoryIds.length > 0) {
            const { data: rel } = await supabase.from('product_category_assignments').select('product_id').in('category_id', categoryIds).neq('product_id', product.id);
            ids = [...new Set((rel || []).map((r) => r.product_id))];
          }
        }
        let query = supabase.from('products').select('*').eq('tenant_id', store.id).eq('status', 'active').neq('id', product.id).limit(count);
        query = ids.length > 0 ? query.in('id', ids.slice(0, 50)) : query;
        const { data } = await query;
        let list = data || [];
        if (list.length < count && ids.length === 0) {
          // Random fallback: no category match (or "random" mode) - just
          // pull other active products from the same store.
          const { data: rnd } = await supabase.from('products').select('*').eq('tenant_id', store.id).eq('status', 'active').neq('id', product.id).limit(count * 2);
          list = rnd || [];
        }
        // Simple shuffle so the same handful of products don't always show
        // in the same order every visit.
        setSuggestions(list.sort(() => Math.random() - 0.5).slice(0, count));
      } catch (e) {
        console.error('Failed to load product suggestions:', e);
        setSuggestions([]);
      }
    })();
  }, [store?.id, product, theme.productSuggestions]);

  const options = product?.metafields?.options || [];
  const variants = product?.variants || [];

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return variants.find((v) => {
      return options.every((o, i) => {
        const key = `option${i + 1}`;
        return v[key] === selectedOptions[o.name];
      });
    }) || null;
  }, [variants, options, selectedOptions]);

  const price = selectedVariant ? selectedVariant.price : (product?.price_cents || 0) / 100;
  const compareAt = selectedVariant ? selectedVariant.compare_at_price : (product?.compare_at_price_cents || 0) / 100;
  const trackInventory = product?.metafields?.track_inventory !== false;
  const stock = variants.length > 0 ? (selectedVariant?.stock ?? 0) : (product?.stock ?? 0);
  const inStock = variants.length > 0 ? !!selectedVariant && (!trackInventory || stock > 0) : (!trackInventory || stock > 0);

  useEffect(() => {
    if (!store || !product) return;
    const seo = product.metafields?.seo;
    const plainDesc = (product.description || '').replace(/<[^>]*>/g, '').slice(0, 160) || `${product.name} — ${store.name}`;
    applySEO({
      title: seo?.title || `${product.name} — ${store.name}`,
      description: seo?.description || plainDesc,
      image: product.images?.[0],
      url: `${window.location.origin}/store/${slug}/products/${productId}`,
      countryCode: store.country,
      type: 'product',
      favicon: theme.favicon,
    });
  }, [store, product, slug, productId, theme]);

  const addToCart = async () => {
    if (!inStock || !store) return;
    setAdding(true);
    try {
      const sessionId = getCartSessionId();
      const existingCart = await cartGet(store.id, sessionId);
      const items = [...(existingCart?.items || [])];
      const variantId = selectedVariant?.id || null;
      const variantTitle = selectedVariant?.title || null;
      const key = `${product.id}::${variantId || ''}`;
      const existingItem = items.find((i) => `${i.product_id}::${i.variant_id || ''}` === key);
      if (existingItem) {
        existingItem.quantity += qty;
        existingItem.line_total = existingItem.price * existingItem.quantity;
      } else {
        items.push({ product_id: product.id, variant_id: variantId, variant_title: variantTitle, title: product.name, image: product.images?.[0] || '', price, quantity: qty, line_total: price * qty });
      }
      const subtotal = items.reduce((s, i) => s + i.line_total, 0);
      await cartSave(store.id, sessionId, items, subtotal, store.currency);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      setCartCount((c) => c + qty);
    } catch (e) {
      alert(e.message || "Impossible d'ajouter au panier");
    } finally { setAdding(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#008060]" /></div>;
  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center px-4">
      <AlertCircle className="w-10 h-10 text-[#6D7175] mx-auto mb-3" />
      <h1 className="text-lg font-bold text-[#202223]">{error}</h1>
      <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-4">Retour à la boutique</Link>
    </div>
  );
  if (!store || !product) return null;

  const p = theme.palette;
  const images = product.images?.length ? product.images : [''];

  return (
    <div className="min-h-screen" style={{ background: p.bg, color: p.text, fontFamily: theme.fonts?.body }}>
      {theme.customCss && <style>{theme.customCss}</style>}
      <Link
        to={`/store/${slug}/cart`}
        className={`fixed bottom-5 z-40 rounded-full p-4 shadow-2xl hover:opacity-90 transition flex items-center gap-2 ${theme.cartPosition === 'bottom-left' ? 'left-5' : 'right-5'}`}
        style={{ background: p.dark, color: p.bg }}
        aria-label="Voir le panier"
      >
        {theme.cartIcon ? <img src={theme.cartIcon} alt="Panier" className="w-5 h-5 object-contain" /> : <ShoppingCart className="w-5 h-5" />}
        {cartCount > 0 && <span className="absolute -top-1 -right-1 text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: theme.palette.primary, color: theme.palette.primaryText }}>{cartCount}</span>}
      </Link>
      <ErrorBoundary fallback={
        <header className="flex items-center px-5 sm:px-8 py-4 border-b" style={{ borderColor: p.border }}>
          <Link to={`/store/${slug}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: p.dark }}>
            <ArrowLeft className="w-4 h-4" /> {store.name}
          </Link>
        </header>
      }>
        <ThemeRenderer theme={theme} sections={theme.sections.filter((s) => s.type === 'header')} mode="storefront" storeSlug={slug} tenantId={store.id} />
      </ErrorBoundary>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden mb-3" style={{ background: p.surface }}>
            {images[activeImage] && <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />}
            <WishlistHeart tenantId={store.id} productId={product.id} />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className="w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0" style={{ borderColor: i === activeImage ? theme.palette.primary : p.border }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{product.name}</h1>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-3.5 h-3.5" style={{ color: theme.palette.primary }} fill={i < Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) ? theme.palette.primary : 'none'} />
                ))}
              </div>
              <span className="text-xs" style={{ color: p.muted }}>{(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} ({reviews.length} avis)</span>
            </div>
          )}
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-xl font-bold" style={{ color: theme.palette.primary }}>{formatMoney(price, store.currency)}</span>
            {compareAt > price && <span className="text-sm line-through" style={{ color: p.muted }}>{formatMoney(compareAt, store.currency)}</span>}
          </div>

          {options.length > 0 && (
            <div className="mt-6 space-y-4">
              {options.map((o) => (
                <div key={o.name}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: p.dark }}>{o.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {(o.values || []).filter(Boolean).map((v) => {
                      const swatch = isColorOption(o.name) ? resolveSwatchColor(v) : null;
                      return (
                        <button
                          key={v}
                          onClick={() => setSelectedOptions((s) => ({ ...s, [o.name]: v }))}
                          className={`rounded-lg text-sm font-medium border-2 transition ${swatch ? 'w-9 h-9 p-0 flex items-center justify-center' : 'px-3.5 py-2'}`}
                          style={selectedOptions[o.name] === v ? { borderColor: theme.palette.primary, background: swatch ? undefined : theme.palette.primary + '10', color: p.dark } : { borderColor: p.border, color: p.text }}
                          title={v}
                        >
                          {swatch ? <span className="w-6 h-6 rounded-full border border-black/10" style={{ background: swatch }} /> : v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5">
            {inStock ? (
              <p className="text-xs font-medium" style={{ color: '#16a34a' }}>{trackInventory ? `En stock${stock <= 5 ? ` — plus que ${stock}` : ''}` : 'En stock'}</p>
            ) : (
              <p className="text-xs font-medium text-red-500">{variants.length > 0 && !selectedVariant ? 'Sélectionnez une option disponible' : 'Rupture de stock'}</p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="inline-flex items-center border rounded-full overflow-hidden" style={{ borderColor: p.border }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center" style={{ color: p.text }}><Minus className="w-4 h-4" /></button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => trackInventory ? Math.min(stock || 1, q + 1) : q + 1)} className="w-9 h-9 flex items-center justify-center" style={{ color: p.text }}><Plus className="w-4 h-4" /></button>
            </div>
            <button
              onClick={addToCart}
              disabled={!inStock || adding}
              className="flex-1 sellia-btn flex items-center justify-center gap-2 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: theme.palette.primary, color: p.primaryText }}
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? 'Ajouté !' : adding ? 'Ajout…' : 'Ajouter au panier'}
            </button>
          </div>

          {product.description && (
            <div className="mt-8 pt-6 border-t text-sm leading-relaxed" style={{ borderColor: p.border, color: p.muted }} dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          {reviews.length > 0 && (
            <div className="mt-8 pt-6 border-t" style={{ borderColor: p.border }}>
              <h2 className="text-sm font-bold mb-4" style={{ color: p.dark }}>Avis clients ({reviews.length})</h2>
              <div className="space-y-4">
                {reviews.slice(0, 8).map((r) => (
                  <div key={r.id} className="pb-4 border-b last:border-b-0" style={{ borderColor: p.border }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold" style={{ color: p.dark }}>{r.customer_name || 'Client vérifié'}</span>
                      <span className="text-[11px]" style={{ color: p.muted }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="w-3 h-3" style={{ color: theme.palette.primary }} fill={i < r.rating ? theme.palette.primary : 'none'} />
                      ))}
                    </div>
                    {r.comment && <p className="text-sm" style={{ color: p.muted }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-12 pt-4 border-t" style={{ borderColor: p.border }}>
          <h2 className="text-lg sm:text-xl font-bold mt-8 mb-5" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{theme.productSuggestions?.title || 'Vous aimerez aussi'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {suggestions.map((sp) => (
              <Link key={sp.id} to={`/store/${slug}/products/${sp.id}`} className="group rounded-xl overflow-hidden transition hover:shadow-lg" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
                <div className="aspect-square overflow-hidden" style={{ background: p.surface }}>
                  {sp.images?.[0] && <img src={sp.images[0]} alt={sp.name} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold truncate" style={{ color: p.text }}>{sp.name}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: theme.palette.primary }}>{formatMoney((sp.price_cents || 0) / 100, store.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

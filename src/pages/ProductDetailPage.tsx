import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Minus, Plus, Package, ShieldCheck, Truck, ZoomIn } from 'lucide-react';
import {
  getShopTheme, getProducts, getShopProfile, getCartItems, saveCartItems,
  getProductImages, type CartItem, type StoreProduct,
} from '../lib/app-state';
import { resolvePublicTenant, fetchPublicProducts, fetchPublicTheme, type PublicTenant } from '../lib/tenant-sync';
import type { ThemeConfig } from '../lib/theme-engine';
import { defaultThemeForType } from '../lib/theme-engine';
import { useSeo, useJsonLd } from '../lib/seo';
import { ImageLightbox } from '../components/ImageLightbox';

/**
 * Real individual product page (Shopify calls this the PDP — product
 * detail page). Before this, the storefront only showed a grid where you
 * could "add to cart" directly — there was no way for a customer to see
 * a full description, browse multiple product photos, or view a product
 * on its own page/URL before buying. Same tenant-resolution pattern as
 * StorefrontPage.tsx: resolves the real merchant via :slug when present,
 * falls back to local preview data otherwise.
 */
export default function ProductDetailPage() {
  const { slug, productId } = useParams<{ slug?: string; productId: string }>();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [resolvedTenant, setResolvedTenant] = useState<PublicTenant | null>(null);
  const [products, setProducts] = useState<StoreProduct[] | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (slug) {
        const tenant = await resolvePublicTenant(slug);
        if (!cancelled && tenant) {
          setResolvedTenant(tenant);
          const [publicProducts, cloudTheme] = await Promise.all([fetchPublicProducts(tenant.id), fetchPublicTheme<ThemeConfig>(tenant.id)]);
          if (!cancelled) {
            setProducts(publicProducts || []);
            setTheme(cloudTheme || defaultThemeForType('ecommerce'));
          }
          return;
        }
      }
      if (!cancelled) {
        setProducts(getProducts().filter(p => p.status === 'active'));
        setTheme(getShopTheme<ThemeConfig | null>(null) || defaultThemeForType('ecommerce'));
      }
    })();
    setCart(getCartItems());
    return () => { cancelled = true; };
  }, [slug]);

  // Re-read once we know which real tenant's store this is — same reasoning
  // as StorefrontPage.tsx: a shared browser must not mix carts across
  // different Sellia-hosted stores.
  useEffect(() => {
    setCart(getCartItems(resolvedTenant?.id));
  }, [resolvedTenant?.id]);

  const product = useMemo(() => products?.find(p => p.id === productId), [products, productId]);
  const related = useMemo(() => (products || []).filter(p => p.id !== productId && p.category === product?.category).slice(0, 4), [products, productId, product]);
  const localProfile = useMemo(() => getShopProfile(), []);
  const shopName = resolvedTenant?.name || localProfile?.name || 'Boutique';
  const currency = resolvedTenant?.currency || localProfile?.currency || 'XOF';
  const backLink = slug ? `/s/${slug}` : '/store';

  const images = product ? getProductImages(product) : [];

  useSeo({
    title: product ? `${product.name} — ${shopName}` : shopName,
    description: product?.description
      ? product.description.slice(0, 155)
      : product ? `${product.name} disponible sur ${shopName}. ${product.price.toLocaleString('fr-FR')} ${currency}.` : undefined,
    image: images[0],
    type: 'product',
  });

  useJsonLd(product ? {
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} disponible sur ${shopName}.`,
    image: images.length ? images : undefined,
    sku: product.id,
    brand: { '@type': 'Brand', name: shopName },
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: currency,
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  } : null);

  const handleAddToCart = () => {
    if (!product) return;
    // Real variant selection (e.g. Taille: M, Couleur: Rouge) instead of
    // always defaulting to the category/subcategory as a stand-in "variant"
    // label, which told the customer nothing about what they actually chose.
    const variantLabel = product.variants?.length
      ? product.variants.map(v => `${v.name}: ${selectedOptions[v.name] || v.options[0]}`).join(', ')
      : (product.subcategory || product.category || '');
    const lineId = product.variants?.length ? `${product.id}::${variantLabel}` : product.id;
    setCart(prev => {
      const existing = prev.find(i => i.id === lineId);
      const next = existing
        ? prev.map(i => i.id === lineId ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { id: lineId, name: product.name, variant: variantLabel, price: product.price, qty, currency: product.currency, image: images[0] }];
      saveCartItems(next, resolvedTenant?.id);
      return next;
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (products === null || !theme) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Package size={40} className="text-gray-300" />
        <p className="text-gray-500">Ce produit n'existe pas ou n'est plus disponible.</p>
        <Link to={backLink} className="text-brand-600 font-medium hover:underline">Retour à la boutique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={backLink} className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70">
            <ChevronLeft size={18} /> {shopName}
          </Link>
          <Link to={backLink} className="relative p-1.5" aria-label="Panier">
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: theme.colors.primary }}>
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative group">
            {images[activeImage] ? (
              <button type="button" onClick={() => setZoomOpen(true)} className="w-full h-full block cursor-zoom-in" aria-label="Agrandir l'image">
                <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={12} /> Zoomer
                </span>
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={48} /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 ${activeImage === i ? '' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={activeImage === i ? { borderColor: theme.colors.primary } : undefined}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">{product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}</p>}
          <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: theme.fonts.heading }}>{product.name}</h1>
          <p className="mt-3 text-2xl font-bold" style={{ color: theme.colors.primary }}>{product.price.toLocaleString('fr-FR')} {currency}</p>

          <p className="mt-2 text-sm">
            {product.status === 'out_of_stock' || product.stock === 0 ? (
              <span className="text-red-600 font-medium">Rupture de stock</span>
            ) : product.stock <= 5 ? (
              <span className="text-amber-600 font-medium">Plus que {product.stock} en stock</span>
            ) : (
              <span className="text-green-600 font-medium">En stock</span>
            )}
          </p>

          {product.description && (
            <p className="mt-5 text-sm leading-relaxed text-gray-600 whitespace-pre-line">{product.description}</p>
          )}

          {/* Real variant selection — previously the cart line's "variant"
              label was always just the product's category/subcategory,
              never something the customer actually chose. */}
          {product.variants?.map(v => (
            <div key={v.name} className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{v.name}</p>
              <div className="flex flex-wrap gap-2">
                {v.options.map(opt => {
                  const active = (selectedOptions[v.name] || v.options[0]) === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [v.name]: opt }))}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors"
                      style={active ? { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10`, color: theme.colors.primary } : { borderColor: '#e5e7eb', color: '#374151' }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2.5 hover:bg-gray-50" aria-label="Diminuer"><Minus size={14} /></button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="p-2.5 hover:bg-gray-50" aria-label="Augmenter"><Plus size={14} /></button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.status === 'out_of_stock' || product.stock === 0}
              className="flex-1 py-3 rounded-full font-bold text-white text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {added ? 'Ajouté ✓' : 'Ajouter au panier'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2"><Truck size={16} className="text-gray-400" /> Livraison rapide</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-gray-400" /> Paiement sécurisé</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: theme.fonts.heading }}>Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => (
              <Link key={p.id} to={`${backLink}/products/${p.id}`} className="group">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  {getProductImages(p)[0] ? (
                    <img src={getProductImages(p)[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={24} /></div>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium line-clamp-1">{p.name}</p>
                <p className="text-sm font-bold" style={{ color: theme.colors.primary }}>{p.price.toLocaleString('fr-FR')} {currency}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
      <ImageLightbox src={images[activeImage] || ''} alt={product.name} open={zoomOpen} onClose={() => setZoomOpen(false)} />
    </div>
  );
}

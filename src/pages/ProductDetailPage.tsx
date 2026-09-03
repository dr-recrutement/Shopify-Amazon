import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Minus, Plus, Package, ShieldCheck, Truck } from 'lucide-react';
import {
  getShopTheme, getProducts, getShopProfile, getCartItems, saveCartItems,
  getProductImages, type CartItem, type StoreProduct,
} from '../lib/app-state';
import { resolvePublicTenant, fetchPublicProducts, fetchPublicTheme, type PublicTenant } from '../lib/tenant-sync';
import type { ThemeConfig } from '../lib/theme-engine';
import { defaultThemeForType } from '../lib/theme-engine';
import { useSeo } from '../lib/seo';

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
  const [activeImage, setActiveImage] = useState(0);
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

  const handleAddToCart = () => {
    if (!product) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      const next = existing
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { id: product.id, name: product.name, variant: product.subcategory || product.category || '', price: product.price, qty, currency: product.currency }];
      saveCartItems(next);
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
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
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
    </div>
  );
}

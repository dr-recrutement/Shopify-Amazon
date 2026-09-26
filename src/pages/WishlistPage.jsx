import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Heart } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme, migrateTheme } from '@/lib/themes';
import { getWishlistSessionId } from '@/components/theme/ThemeRenderer';
import { applySEO } from '@/lib/seo';
import { formatMoney } from '@/lib/world/currencies';

// Real wishlist page - shows whatever this browser's session has saved
// via the heart icon on product cards, matching the same guest-session
// identity as the cart (no customer accounts on this storefront).
export default function WishlistPage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [theme, setTheme] = useState(() => cloneTheme(DEFAULT_THEME_ID));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: tenant, error: tenantError } = await supabase.from('tenants').select('*').eq('slug', slug).maybeSingle();
      if (tenantError) throw tenantError;
      if (!tenant) throw new Error('Cette boutique n’existe pas.');
      setStore(tenant);

      const { data: themeRes } = await supabase.from('theme_configs').select('published_config').eq('tenant_id', tenant.id).maybeSingle();
      setTheme(isValidTheme(themeRes?.published_config) ? migrateTheme(themeRes.published_config) : cloneTheme(DEFAULT_THEME_ID));

      const sessionId = getWishlistSessionId();
      const { data: saved } = await supabase.from('wishlists').select('product_id').eq('tenant_id', tenant.id).eq('session_id', sessionId);
      const productIds = (saved || []).map((w) => w.product_id);
      if (productIds.length > 0) {
        const { data: prods } = await supabase.from('products').select('*').in('id', productIds).eq('status', 'active');
        setProducts(prods || []);
      } else {
        setProducts([]);
      }
      setError(null);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!store) return;
    applySEO({ title: `Mes favoris — ${store.name}`, description: `Vos produits favoris sur ${store.name}.`, url: window.location.href, countryCode: store.country, favicon: theme.favicon });
  }, [store, theme]);

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

  return (
    <div className="min-h-screen" style={{ background: p.bg, color: p.text, fontFamily: theme.fonts?.body }}>
      {theme.customCss && <style>{theme.customCss}</style>}
      <header className="flex items-center px-5 sm:px-8 py-4 border-b" style={{ borderColor: p.border }}>
        <Link to={`/store/${slug}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: p.dark }}>
          <ArrowLeft className="w-4 h-4" /> {store.name}
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}><Heart className="w-6 h-6 fill-red-500 text-red-500" /> Mes favoris</h1>
        <p className="text-xs mt-1" style={{ color: p.muted }}>{products.length} produit{products.length > 1 ? 's' : ''}</p>

        {products.length === 0 ? (
          <div className="text-center py-16 rounded-2xl mt-6" style={{ background: p.surface }}>
            <Heart className="w-10 h-10 mx-auto mb-3" style={{ color: p.muted }} />
            <p className="text-sm" style={{ color: p.muted }}>Aucun favori pour le moment. Cliquez sur le cœur d'un produit pour l'ajouter ici.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {products.map((prod) => (
              <Link key={prod.id} to={`/store/${slug}/products/${prod.id}`} className="group rounded-xl overflow-hidden transition hover:shadow-lg" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
                <div className="aspect-square overflow-hidden" style={{ background: p.surface }}>
                  {prod.images?.[0] && <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold truncate" style={{ color: p.text }}>{prod.name}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: theme.palette.primary }}>{formatMoney((prod.price_cents || 0) / 100, store.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

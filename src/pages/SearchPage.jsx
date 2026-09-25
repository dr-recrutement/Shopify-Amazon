import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Search as SearchIcon, Package } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme, migrateTheme } from '@/lib/themes';
import { applySEO } from '@/lib/seo';
import { formatMoney } from '@/lib/world/currencies';

// The other real gap found auditing the storefront: no search existed at
// all, anywhere - no input, no results page, nothing a customer could type
// a product name into. /store/:slug/search?q=...
export default function SearchPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(q);
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
      if (!tenant) throw new Error('Cette boutique n\u2019existe pas.');
      setStore(tenant);

      const { data: themeRes } = await supabase.from('theme_configs').select('published_config').eq('tenant_id', tenant.id).maybeSingle();
      setTheme(isValidTheme(themeRes?.published_config) ? migrateTheme(themeRes.published_config) : cloneTheme(DEFAULT_THEME_ID));

      if (q.trim()) {
        const { data: prods } = await supabase.from('products').select('*').eq('tenant_id', tenant.id).eq('status', 'active').ilike('name', `%${q.trim()}%`).limit(60);
        setProducts(prods || []);
      } else {
        setProducts([]);
      }
      setError(null);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally { setLoading(false); }
  }, [slug, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setInputValue(q); }, [q]);

  useEffect(() => {
    if (!store) return;
    applySEO({ title: `Recherche${q ? ` : ${q}` : ''} — ${store.name}`, description: `Résultats de recherche sur ${store.name}.`, url: window.location.href, countryCode: store.country, favicon: theme.favicon });
  }, [store, q, theme]);

  const onSubmit = (e) => {
    e.preventDefault();
    setSearchParams(inputValue.trim() ? { q: inputValue.trim() } : {});
  };

  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center px-4">
      <AlertCircle className="w-10 h-10 text-[#6D7175] mx-auto mb-3" />
      <h1 className="text-lg font-bold text-[#202223]">{error}</h1>
      <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-4">Retour à la boutique</Link>
    </div>
  );
  if (!store) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#008060]" /></div>;

  const p = theme.palette;

  return (
    <div className="min-h-screen" style={{ background: p.bg, color: p.text, fontFamily: theme.fonts?.body }}>
      <header className="flex items-center px-5 sm:px-8 py-4 border-b" style={{ borderColor: p.border }}>
        <Link to={`/store/${slug}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: p.dark }}>
          <ArrowLeft className="w-4 h-4" /> {store.name}
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <form onSubmit={onSubmit} className="flex items-center gap-2 mb-6 max-w-lg">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-full" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
            <SearchIcon className="w-4 h-4" style={{ color: p.muted }} />
            <input autoFocus value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Rechercher un produit…" className="flex-1 bg-transparent outline-none text-sm" style={{ color: p.text }} />
          </div>
          <button type="submit" className="sellia-btn px-5 py-3 text-sm font-semibold" style={{ background: theme.palette.primary, color: p.primaryText }}>Rechercher</button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.palette.primary }} /></div>
        ) : !q.trim() ? (
          <p className="text-sm" style={{ color: p.muted }}>Tapez un mot-clé pour rechercher un produit.</p>
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: p.muted }}>{products.length} résultat{products.length > 1 ? 's' : ''} pour « {q} »</p>
            {products.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: p.surface }}>
                <Package className="w-10 h-10 mx-auto mb-3" style={{ color: p.muted }} />
                <p className="text-sm" style={{ color: p.muted }}>Aucun produit ne correspond à votre recherche.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
          </>
        )}
      </div>
    </div>
  );
}

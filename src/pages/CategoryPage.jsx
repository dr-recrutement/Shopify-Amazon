import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Package } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import ThemeRenderer from '@/components/theme/ThemeRenderer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme, migrateTheme } from '@/lib/themes';
import { applySEO } from '@/lib/seo';
import { formatMoney } from '@/lib/world/currencies';

// The real gap found while building the Theme Editor's link picker: menus
// and buttons could only ever be pointed at '#' because no public category
// page existed to link to at all - only the admin's own collection
// management view. This is that missing page: /store/:slug/collections/:idOrSlug.
export default function CategoryPage() {
  const { slug, categoryId } = useParams();
  const [store, setStore] = useState(null);
  const [theme, setTheme] = useState(() => cloneTheme(DEFAULT_THEME_ID));
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!slug || !categoryId) return;
    setLoading(true);
    try {
      const { data: tenant, error: tenantError } = await supabase.from('tenants').select('*').eq('slug', slug).maybeSingle();
      if (tenantError) throw tenantError;
      if (!tenant) throw new Error('Cette boutique n’existe pas.');
      setStore(tenant);

      const { data: themeRes } = await supabase.from('theme_configs').select('published_config').eq('tenant_id', tenant.id).maybeSingle();
      setTheme(isValidTheme(themeRes?.published_config) ? migrateTheme(themeRes.published_config) : cloneTheme(DEFAULT_THEME_ID));

      // categoryId in a link can be a real slug or a raw id, depending on
      // whether the category had a slug set when the link was chosen -
      // both are tried so an older link never silently breaks.
      const { data: cat } = await supabase.from('product_categories').select('*').eq('tenant_id', tenant.id).or(`slug.eq.${categoryId},id.eq.${categoryId}`).maybeSingle();
      if (!cat) throw new Error('Cette catégorie est introuvable.');
      setCategory(cat);

      const { data: assignments } = await supabase.from('product_category_assignments').select('product_id').eq('category_id', cat.id);
      const productIds = (assignments || []).map((a) => a.product_id);
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
  }, [slug, categoryId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!store || !category) return;
    applySEO({
      title: `${category.name} — ${store.name}`,
      description: category.description || `Découvrez notre sélection ${category.name} sur ${store.name}.`,
      image: category.image_url,
      url: window.location.href,
      countryCode: store.country,
      favicon: theme.favicon,
    });
  }, [store, category, theme]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#008060]" /></div>;
  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center px-4">
      <AlertCircle className="w-10 h-10 text-[#6D7175] mx-auto mb-3" />
      <h1 className="text-lg font-bold text-[#202223]">{error}</h1>
      <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-4">Retour à la boutique</Link>
    </div>
  );
  if (!store || !category) return null;

  const p = theme.palette;

  return (
    <div className="min-h-screen" style={{ background: p.bg, color: p.text, fontFamily: theme.fonts?.body }}>
      {theme.customCss && <style>{theme.customCss}</style>}
      <ErrorBoundary fallback={
        <header className="flex items-center px-5 sm:px-8 py-4 border-b" style={{ borderColor: p.border }}>
          <Link to={`/store/${slug}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: p.dark }}>
            <ArrowLeft className="w-4 h-4" /> {store.name}
          </Link>
        </header>
      }>
        <ThemeRenderer theme={theme} sections={theme.sections.filter((s) => s.type === 'header')} mode="storefront" storeSlug={slug} tenantId={store.id} />
      </ErrorBoundary>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        {category.image_url && (
          <div className="rounded-2xl overflow-hidden mb-6 aspect-[3/1]" style={{ background: p.surface }}>
            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{category.name}</h1>
        {category.description && <p className="text-sm mt-2 max-w-2xl" style={{ color: p.muted }}>{category.description}</p>}
        <p className="text-xs mt-1" style={{ color: p.muted }}>{products.length} produit{products.length > 1 ? 's' : ''}</p>

        {products.length === 0 ? (
          <div className="text-center py-16 rounded-2xl mt-6" style={{ background: p.surface }}>
            <Package className="w-10 h-10 mx-auto mb-3" style={{ color: p.muted }} />
            <p className="text-sm" style={{ color: p.muted }}>Aucun produit dans cette catégorie pour le moment.</p>
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { renderSection, googleFontsHref } from '../lib/theme-engine';
import type { ThemeSection } from '../lib/theme-engine';
import { useCart } from '../lib/cart';

interface StoreProduct {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  thumbnail: string | null;
}

interface StoreCategory {
  id: string;
  name: string;
  count: number;
  imageUrl?: string | null;
}

// Sections qui doivent recevoir les vrais produits (pas seulement product-grid,
// sinon filters-list et product-detail continuent d'afficher les produits d'exemple
// aux vrais visiteurs).
const PRODUCT_AWARE_SECTIONS = new Set(['product-grid', 'filters-list', 'product-detail']);

interface StorefrontProps {
  // Fournir SOIT slug (boutique sur sous-domaine liafrik.com) SOIT tenantId
  // (boutique résolue via un domaine personnalisé, cf. domains table).
  slug?: string;
  tenantId?: string;
}

export default function Storefront({ slug, tenantId }: StorefrontProps) {
  const { addItem, totalItems } = useCart();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [theme, setTheme] = useState<any>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<StoreCategory[]>([]);

  useEffect(() => {
    if (!slug && !tenantId) { setNotFound(true); setLoading(false); return; }
    (async () => {
      setLoading(true);
      setNotFound(false);

      const tenantQuery = supabase.from('tenants').select('*');
      const { data: t } = tenantId
        ? await tenantQuery.eq('id', tenantId).maybeSingle()
        : await tenantQuery.eq('slug', slug).maybeSingle();

      if (!t) { setNotFound(true); setLoading(false); return; }

      const { data: cfg } = await supabase.from('theme_configs').select('*').eq('tenant_id', t.id).maybeSingle();
      if (!cfg || !cfg.is_published) { setNotFound(true); setLoading(false); return; }
      setTheme(cfg);

      // Charge dynamiquement la police choisie par le marchand pour ses clients.
      const f = cfg.fonts || { heading: 'Montserrat', body: 'Montserrat' };
      const linkId = 'liafrik-storefront-fonts';
      let link = document.getElementById(linkId) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = googleFontsHref(f);

      const { data: prods } = await supabase
        .from('products')
        .select('id,name,price_cents,currency,product_images(url,position)')
        .eq('tenant_id', t.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const list: StoreProduct[] = (prods || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price_cents: p.price_cents,
        currency: p.currency,
        thumbnail: (p.product_images || []).sort((a: any, b: any) => a.position - b.position)[0]?.url || null,
      }));
      setProducts(list);

      // Vraies catégories de la boutique (comptage produits actifs par catégorie).
      const { data: cats } = await supabase.from('product_categories').select('id,name,image_url').eq('tenant_id', t.id);
      const { data: assignments } = await supabase
        .from('product_category_assignments')
        .select('category_id, products!inner(status, tenant_id)')
        .eq('products.tenant_id', t.id)
        .eq('products.status', 'active');
      const countByCategory: Record<string, number> = {};
      (assignments || []).forEach((a: any) => { countByCategory[a.category_id] = (countByCategory[a.category_id] || 0) + 1; });
      setCategories((cats || []).map((c: any) => ({ id: c.id, name: c.name, count: countByCategory[c.id] || 0, imageUrl: c.image_url })));

      setLoading(false);
    })();
  }, [slug, tenantId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement…</div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center text-gray-400">Boutique introuvable ou non publiée.</div>;

  const colors = theme.colors || { primary: '#F2632C', secondary: '#16a34a', accent: '#F2632C', background: '#FFFFFF', text: '#111114' };
  const fonts = theme.fonts || { heading: 'Montserrat', body: 'Montserrat' };
  const sections: ThemeSection[] = theme.sections || [];

  const filteredProducts = searchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : products;

  return (
    <div style={{ background: colors.background, fontFamily: fonts.body }}>
      {products.length > 0 && (
        <div className="sticky top-0 z-30 px-4 py-2" style={{ background: colors.background, borderBottom: `1px solid rgba(0,0,0,0.06)` }}>
          <div className="max-w-lg mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full pl-9 pr-3 py-2 rounded-full text-sm border focus:outline-none"
              style={{ borderColor: `${colors.text}22`, color: colors.text, background: `${colors.text}08` }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50">🔍</span>
          </div>
          {searchQuery.trim() && (
            <p className="max-w-lg mx-auto text-xs mt-1" style={{ color: `${colors.text}88` }}>
              {filteredProducts.length} résultat{filteredProducts.length !== 1 ? 's' : ''} pour "{searchQuery}"
            </p>
          )}
        </div>
      )}
      {sections.filter(s => s.visible).map(s => (
        <div key={s.id}>
          {renderSection(
            s,
            colors,
            PRODUCT_AWARE_SECTIONS.has(s.type) ? filteredProducts : undefined,
            theme.radius || 'soft',
            theme.shadow || 'subtle',
            s.type === 'category-grid' ? categories : undefined,
            addItem,
            totalItems
          )}
        </div>
      ))}
      {totalItems > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-semibold shadow-lg"
          style={{ background: colors.primary }}
        >
          🛒 Panier ({totalItems})
        </Link>
      )}
    </div>
  );
}

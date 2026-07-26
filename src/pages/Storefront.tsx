import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { renderSection } from '../lib/theme-engine';
import type { ThemeSection } from '../lib/theme-engine';

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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [theme, setTheme] = useState<any>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
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
      const { data: cats } = await supabase.from('product_categories').select('id,name').eq('tenant_id', t.id);
      const { data: assignments } = await supabase
        .from('product_category_assignments')
        .select('category_id, products!inner(status, tenant_id)')
        .eq('products.tenant_id', t.id)
        .eq('products.status', 'active');
      const countByCategory: Record<string, number> = {};
      (assignments || []).forEach((a: any) => { countByCategory[a.category_id] = (countByCategory[a.category_id] || 0) + 1; });
      setCategories((cats || []).map((c: any) => ({ id: c.id, name: c.name, count: countByCategory[c.id] || 0 })));

      setLoading(false);
    })();
  }, [slug, tenantId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement…</div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center text-gray-400">Boutique introuvable ou non publiée.</div>;

  const colors = theme.colors || { primary: '#F2632C', secondary: '#16a34a', accent: '#F2632C', background: '#FFFFFF', text: '#111114' };
  const sections: ThemeSection[] = theme.sections || [];

  return (
    <div style={{ background: colors.background }}>
      {sections.filter(s => s.visible).map(s => (
        <div key={s.id}>{renderSection(s, colors, PRODUCT_AWARE_SECTIONS.has(s.type) ? products : undefined, theme.radius || 'soft', theme.shadow || 'subtle', s.type === 'category-grid' ? categories : undefined)}</div>
      ))}
    </div>
  );
}

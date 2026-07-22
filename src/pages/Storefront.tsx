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

export default function Storefront({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [theme, setTheme] = useState<any>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from('tenants').select('*').eq('slug', slug).maybeSingle();
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
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement…</div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center text-gray-400">Boutique introuvable ou non publiée.</div>;

  const colors = theme.colors || { primary: '#F2632C', secondary: '#16a34a', accent: '#F2632C', background: '#FFFFFF', text: '#111114' };
  const sections: ThemeSection[] = theme.sections || [];

  return (
    <div style={{ background: colors.background }}>
      {sections.filter(s => s.visible).map(s => (
        <div key={s.id}>{renderSection(s, colors, s.type === 'product-grid' ? products : undefined)}</div>
      ))}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Package } from 'lucide-react';
import { getShopTheme, getShopProfile, getCartItems, getProductImages, type StoreProduct } from '../lib/app-state';
import { getCmsPages, type CmsPage, type CmsBlock } from '../lib/cms';
import { resolvePublicTenant, fetchPublicProducts, fetchPublicTheme, fetchPublicCmsPages, type PublicTenant } from '../lib/tenant-sync';
import type { ThemeConfig } from '../lib/theme-engine';
import { defaultThemeForType } from '../lib/theme-engine';

/**
 * Renders a merchant's custom CMS page (built with the visual page editor
 * in Content.tsx) for real visitors. Before this, CMS pages had a full
 * editor — drag-and-drop blocks, save, "publish" — but were never
 * rendered ANYWHERE on the public storefront. A merchant could spend
 * hours building an About/FAQ/Story page and a real customer would never
 * see it; there was no route, no renderer, nothing. This is that missing
 * piece. Draft pages are never shown to a public visitor, only to the
 * merchant previewing locally.
 */
export default function CmsPageView() {
  const { slug, pageSlug } = useParams<{ slug?: string; pageSlug: string }>();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [resolvedTenant, setResolvedTenant] = useState<PublicTenant | null>(null);
  const [pages, setPages] = useState<CmsPage[] | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (slug) {
        const tenant = await resolvePublicTenant(slug);
        if (!cancelled && tenant) {
          setResolvedTenant(tenant);
          const [cmsPages, cloudTheme, publicProducts] = await Promise.all([
            fetchPublicCmsPages<CmsPage>(tenant.id),
            fetchPublicTheme<ThemeConfig>(tenant.id),
            fetchPublicProducts(tenant.id),
          ]);
          if (!cancelled) {
            setPages(cmsPages || []);
            setTheme(cloudTheme || defaultThemeForType('ecommerce'));
            setProducts(publicProducts || []);
          }
          return;
        }
      }
      if (!cancelled) {
        setPages(getCmsPages());
        setTheme(getShopTheme<ThemeConfig | null>(null) || defaultThemeForType('ecommerce'));
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const page = useMemo(() => {
    const found = pages?.find(p => p.slug === pageSlug);
    // Never show a draft to a real, resolved-tenant visitor — only the
    // merchant's own local preview (no resolvedTenant) can see drafts.
    if (found && resolvedTenant && found.status !== 'published') return undefined;
    return found;
  }, [pages, pageSlug, resolvedTenant]);

  useEffect(() => {
    if (!page) return;
    document.title = page.seoTitle || page.title;
    let meta = document.querySelector('meta[name="description"]');
    if (page.seoDescription) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', page.seoDescription);
    }
  }, [page]);

  const localProfile = useMemo(() => getShopProfile(), []);
  const shopName = resolvedTenant?.name || localProfile?.name || 'Boutique';
  const currency = resolvedTenant?.currency || localProfile?.currency || 'XOF';
  const backLink = slug ? `/s/${slug}` : '/store';
  const cartCount = useMemo(() => getCartItems().reduce((s, i) => s + i.qty, 0), []);

  if (pages === null || !theme) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Package size={40} className="text-gray-300" />
        <p className="text-gray-500">Cette page n'existe pas ou n'est pas encore publiée.</p>
        <Link to={backLink} className="text-brand-600 font-medium hover:underline">Retour à la boutique</Link>
      </div>
    );
  }

  const sections = page.osSections && page.osSections.length > 0
    ? page.osSections
    // Legacy flat pages built before the OS 2.0 section stack — render as
    // a single rich-text block each so old pages don't just disappear.
    : page.sections.map(s => ({ id: s.id, type: 'legacy', blocks: [{ id: s.id, type: 'rich-text' as const, settings: { content: s.content } }], block_order: [s.id], settings: {} }));

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={backLink} className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70">
            <ChevronLeft size={18} /> {shopName}
          </Link>
          <Link to={backLink} className="relative p-1.5" aria-label="Panier">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: theme.colors.primary }}>{cartCount}</span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: theme.fonts.heading }}>{page.title}</h1>
        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.id} className="space-y-4">
              {section.blocks.map(block => (
                <CmsBlockView key={block.id} block={block} theme={theme} products={products} currency={currency} backLink={backLink} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CmsBlockView({ block, theme, products, currency, backLink }: { block: CmsBlock; theme: ThemeConfig; products: StoreProduct[]; currency: string; backLink: string }) {
  const s = block.settings || {};
  switch (block.type) {
    case 'heading':
      return <h2 className="text-xl font-bold" style={{ fontFamily: theme.fonts.heading }}>{s.text || 'Titre'}</h2>;
    case 'text':
    case 'rich-text':
      return <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{s.content || s.text || ''}</p>;
    case 'image':
      return s.url ? <img src={s.url} alt={s.alt || ''} className="w-full rounded-xl object-cover" /> : null;
    case 'image-with-text':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {s.image && <img src={s.image} alt="" className="w-full rounded-xl object-cover aspect-video" />}
          <div>
            {s.heading && <h3 className="font-bold mb-2" style={{ fontFamily: theme.fonts.heading }}>{s.heading}</h3>}
            <p className="text-sm text-gray-600 leading-relaxed">{s.text || ''}</p>
          </div>
        </div>
      );
    case 'button':
    case 'cta':
      return (
        <a href={s.url || backLink} className="inline-block px-6 py-3 rounded-lg font-bold text-white text-sm" style={{ backgroundColor: theme.colors.primary }}>
          {s.text || s.label || 'En savoir plus'}
        </a>
      );
    case 'quote':
      return <blockquote className="border-l-4 pl-4 text-gray-600" style={{ borderColor: theme.colors.primary }}>{s.text || ''}</blockquote>;
    case 'video':
      return s.url ? <video src={s.url} controls className="w-full rounded-xl" /> : null;
    case 'hero':
      return (
        <div className="rounded-2xl p-10 text-center text-white" style={{ backgroundColor: theme.colors.primary }}>
          <h2 className="text-2xl font-bold mb-2">{s.title || ''}</h2>
          {s.subtitle && <p className="text-sm opacity-90">{s.subtitle}</p>}
        </div>
      );
    case 'spacer':
      return <div style={{ height: s.height || 24 }} />;
    case 'collection': {
      const category = s.category;
      const matches = category ? products.filter(p => p.category === category) : products.slice(0, 4);
      if (matches.length === 0) return null;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {matches.map(p => (
            <Link key={p.id} to={`${backLink}/products/${p.id}`} className="group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                {getProductImages(p)[0] && <img src={getProductImages(p)[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
              </div>
              <p className="mt-2 text-xs font-medium line-clamp-1">{p.name}</p>
              <p className="text-xs font-bold" style={{ color: theme.colors.primary }}>{p.price.toLocaleString('fr-FR')} {currency}</p>
            </Link>
          ))}
        </div>
      );
    }
    case 'product': {
      const product = products.find(p => p.id === s.productId);
      if (!product) return null;
      return (
        <Link to={`${backLink}/products/${product.id}`} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
          {getProductImages(product)[0] && <img src={getProductImages(product)[0]} alt={product.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
          <div>
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-sm font-bold" style={{ color: theme.colors.primary }}>{product.price.toLocaleString('fr-FR')} {currency}</p>
          </div>
        </Link>
      );
    }
    default:
      // 'custom-liquid' and '@app' blocks: no Liquid templating engine or
      // app-block runtime exists — silently skipped rather than eval'd
      // (which would be a real security risk) or shown broken.
      return null;
  }
}

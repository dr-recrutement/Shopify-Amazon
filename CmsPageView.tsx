import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Package } from 'lucide-react';
import { getShopTheme, getShopProfile, getCartItems, getProductImages, type StoreProduct } from '../lib/app-state';
import { getCmsPages, type CmsPage, type CmsBlock } from '../lib/cms';
import { resolvePublicTenant, fetchPublicProducts, fetchPublicTheme, fetchPublicCmsPages, subscribeToNewsletter, type PublicTenant } from '../lib/tenant-sync';
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
              {/* Section-level settings (heading/subtext/image/cta) configured
                  in the theme editor's right-hand panel — previously only
                  visible in the editor's canvas preview and never rendered
                  here, so a merchant's banner/rich-text/image-with-text
                  sections were saved but invisible to real visitors. */}
              <CmsSectionView section={section} theme={theme} tenantId={resolvedTenant?.id} backLink={backLink} />
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

/** Renders a section's own settings (heading/subtext/image/cta) — the
 *  fields a merchant fills in via "Add section" in the editor, distinct
 *  from the section's child blocks (rendered separately by CmsBlockView).
 *  Mirrors CanvasSection's editor preview so what the merchant sees while
 *  editing matches what a real visitor sees. */
function CmsSectionView({ section, theme, tenantId, backLink }: { section: { type: string; settings: Record<string, any> }; theme: ThemeConfig; tenantId?: string; backLink: string }) {
  const s = section.settings || {};
  const heading = s.heading || s.title;
  const subtext = s.subtext;
  const image = s.image;
  const cta = s.cta;
  const ctaUrl = s.ctaUrl;
  const hasContent = heading || subtext || image || cta;
  if (!hasContent && section.type !== 'email-signup') return null;

  switch (section.type) {
    case 'image-banner':
    case 'slideshow':
      return (
        <div
          className="rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center text-white p-10 min-h-[220px]"
          style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: theme.colors.primary }}
        >
          {heading && <h2 className="text-2xl font-bold drop-shadow" style={{ fontFamily: theme.fonts.heading }}>{heading}</h2>}
          {subtext && <p className="mt-2 text-sm opacity-90 max-w-md drop-shadow">{subtext}</p>}
          {cta && (
            <a href={ctaUrl || backLink} className="mt-5 inline-block px-6 py-3 rounded-lg font-bold text-sm bg-white" style={{ color: theme.colors.primary }}>
              {cta}
            </a>
          )}
        </div>
      );
    case 'image-with-text':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {image && <img src={image} alt={heading || ''} className="w-full rounded-xl object-cover aspect-video" />}
          <div>
            {heading && <h3 className="text-xl font-bold mb-2" style={{ fontFamily: theme.fonts.heading }}>{heading}</h3>}
            {subtext && <p className="text-sm text-gray-600 leading-relaxed">{subtext}</p>}
            {cta && (
              <a href={ctaUrl || backLink} className="mt-4 inline-block px-5 py-2.5 rounded-lg font-bold text-white text-sm" style={{ backgroundColor: theme.colors.primary }}>
                {cta}
              </a>
            )}
          </div>
        </div>
      );
    case 'rich-text':
      return (
        <div className="text-center py-6">
          {heading && <h2 className="text-xl font-bold" style={{ fontFamily: theme.fonts.heading }}>{heading}</h2>}
          {subtext && <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">{subtext}</p>}
          {cta && (
            <a href={ctaUrl || backLink} className="mt-4 inline-block px-5 py-2.5 rounded-lg font-bold text-white text-sm" style={{ backgroundColor: theme.colors.primary }}>
              {cta}
            </a>
          )}
        </div>
      );
    case 'email-signup':
      return <EmailSignupSection heading={heading} subtext={subtext} tenantId={tenantId} theme={theme} />;
    default:
      // Sections with no meaningful section-level fields (product/collection
      // grids, contact-form, video, spacer, etc.) rely entirely on their
      // blocks or on live product data, already rendered separately.
      if (!heading && !subtext) return null;
      return (
        <div className="py-4">
          {heading && <h2 className="text-xl font-bold" style={{ fontFamily: theme.fonts.heading }}>{heading}</h2>}
          {subtext && <p className="mt-2 text-sm text-gray-600 leading-relaxed">{subtext}</p>}
        </div>
      );
  }
}

/** Real email capture — previously any "email-signup" section was purely
 *  decorative on the editor canvas and had nothing behind it on the live
 *  storefront. Uses the newsletter_subscribers table that already backs
 *  the rest of the platform (see subscribeToNewsletter in tenant-sync). */
function EmailSignupSection({ heading, subtext, tenantId, theme }: { heading?: string; subtext?: string; tenantId?: string; theme: ThemeConfig }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !email.trim()) return;
    setStatus('sending');
    const ok = await subscribeToNewsletter(tenantId, email.trim(), 'cms-page');
    setStatus(ok ? 'done' : 'error');
    if (ok) setEmail('');
  };

  return (
    <div className="text-center py-8 px-4 rounded-2xl" style={{ backgroundColor: `${theme.colors.primary}10` }}>
      {heading && <h2 className="text-xl font-bold" style={{ fontFamily: theme.fonts.heading }}>{heading}</h2>}
      {subtext && <p className="mt-2 text-sm text-gray-600">{subtext}</p>}
      {status === 'done' ? (
        <p className="mt-4 text-sm font-medium" style={{ color: theme.colors.primary }}>Merci ! Vous êtes inscrit(e).</p>
      ) : (
        <form onSubmit={submit} className="flex gap-2 mt-4 max-w-sm mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as any]: theme.colors.primary }}
          />
          <button
            type="submit"
            disabled={status === 'sending' || !tenantId}
            className="px-5 py-2.5 rounded-lg font-bold text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {status === 'sending' ? '...' : 'S\'inscrire'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="mt-2 text-xs text-red-500">Une erreur est survenue, réessayez.</p>}
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
      return <blockquote className="border-l-4 pl-4 italic text-gray-600" style={{ borderColor: theme.colors.primary }}>{s.text || ''}</blockquote>;
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

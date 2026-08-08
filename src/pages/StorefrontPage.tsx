import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, ChevronRight } from 'lucide-react';
import {
  defaultThemeForType,
  renderSection,
  type ThemeConfig,
  type ThemeSection,
} from '../lib/theme-engine';
import {
  getShopTheme,
  getActiveCatalogProducts,
  getCatalogCategories,
  getShopProfile,
  getShopSubdomain,
  getPrimaryDomain,
} from '../lib/app-state';

/**
 * Public storefront — renders the merchant's live theme + sections with REAL
 * catalog products (active only). This is what a visitor sees at
 * /s/:slug (temporary domain) or a connected custom domain.
 *
 * Design goals (Shopify parity):
 *  - A product added and marked "active" appears here automatically.
 *  - The merchant's chosen template + colors + fonts drive the rendering.
 *  - Sticky header with cart, search, navigation.
 *  - Product grid pulls from the real catalog (uploaded images, prices).
 */
export default function StorefrontPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const stored = getShopTheme<ThemeConfig | null>(null);
    setTheme(stored || defaultThemeForType('ecommerce'));
  }, []);

  // Resolve which domain label to show (custom > temporary platform domain).
  const domainLabel = useMemo(() => slug ? `${slug}.os.liafrik.com` : getPrimaryDomain(), [slug]);
  const profile = useMemo(() => getShopProfile(), []);
  const shopName = profile?.name || 'Boutique';

  // Inject real catalog data into product / category sections before render.
  const sectionsWithCatalog: ThemeSection[] = useMemo(() => {
    if (!theme) return [];
    const products = getActiveCatalogProducts();
    const categories = getCatalogCategories();
    return theme.sections.map(s => {
      if (s.type === 'product-grid' || s.type === 'featured-collection') {
        return { ...s, props: { ...s.props, products } };
      }
      if (s.type === 'category-grid' || s.type === 'collection-list') {
        return { ...s, props: { ...s.props, categories } };
      }
      return s;
    });
  }, [theme]);

  if (!theme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement de la boutique…</p>
        </div>
      </div>
    );
  }

  const visibleSections = sectionsWithCatalog.filter(s => s.visible);
  const hasProducts = getActiveCatalogProducts().length > 0;

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.fonts.body }}>
      {/* Top utility bar — domain + cart */}
      <div className="border-b" style={{ borderColor: `${theme.colors.text}10` }}>
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between text-xs" style={{ color: theme.colors.text }}>
          <span className="opacity-60 truncate">🔒 {domainLabel}</span>
          <div className="flex items-center gap-4">
            <button className="opacity-70 hover:opacity-100 transition-opacity">FR ▾</button>
            <span className="opacity-60">{profile?.currency || 'XOF'}</span>
          </div>
        </div>
      </div>

      {/* Announcement bar (if present as a section, otherwise default) */}
      {!visibleSections.some(s => s.type === 'announcement-bar') && (
        <div className="text-center text-xs font-medium py-2 px-4" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
          Livraison offerte dès 50 000 {profile?.currency || 'XOF'} · Paiement mobile money accepté
        </div>
      )}

      {/* Sticky storefront header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b" style={{ borderColor: `${theme.colors.text}10` }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button className="lg:hidden p-1" onClick={() => setMobileNavOpen(v => !v)} aria-label="Menu">
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="#" className="text-xl md:text-2xl font-black tracking-tight flex-shrink-0" style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>
            {shopName}
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" style={{ color: theme.colors.text }}>
            <Link to="#" className="hover:opacity-70 transition-opacity">Accueil</Link>
            <Link to="#" className="hover:opacity-70 transition-opacity">Boutique</Link>
            {hasProducts && <Link to="#" className="hover:opacity-70 transition-opacity">Nouveautés</Link>}
            <Link to="#" className="hover:opacity-70 transition-opacity">À propos</Link>
            <Link to="#" className="hover:opacity-70 transition-opacity">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button className="p-1.5 hover:opacity-70 transition-opacity" aria-label="Rechercher">
              <Search size={20} />
            </button>
            <button className="relative p-1.5 hover:opacity-70 transition-opacity" aria-label="Panier">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: theme.colors.primary }}>0</span>
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <nav className="lg:hidden border-t px-4 py-3 flex flex-col gap-3 text-sm font-medium" style={{ borderColor: `${theme.colors.text}10`, color: theme.colors.text }}>
            <Link to="#" onClick={() => setMobileNavOpen(false)}>Accueil</Link>
            <Link to="#" onClick={() => setMobileNavOpen(false)}>Boutique</Link>
            {hasProducts && <Link to="#" onClick={() => setMobileNavOpen(false)}>Nouveautés</Link>}
            <Link to="#" onClick={() => setMobileNavOpen(false)}>À propos</Link>
            <Link to="#" onClick={() => setMobileNavOpen(false)}>Contact</Link>
          </nav>
        )}
      </header>

      {/* Rendered live theme sections */}
      <main>
        {visibleSections.map(section => (
          <div key={section.id}>{renderSection(section, theme)}</div>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: `${theme.colors.text}10`, backgroundColor: `${theme.colors.text}05` }}>
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="text-lg font-black mb-3" style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>{shopName}</div>
            <p className="text-xs opacity-60 leading-relaxed" style={{ color: theme.colors.text }}>
              Boutique propulsée par LiAfrik Os — la plateforme e-commerce africaine.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.colors.text }}>Boutique</h4>
            <ul className="space-y-2 text-xs opacity-70" style={{ color: theme.colors.text }}>
              <li><Link to="#" className="hover:underline">Tous les produits</Link></li>
              <li><Link to="#" className="hover:underline">Nouveautés</Link></li>
              <li><Link to="#" className="hover:underline">Meilleures ventes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.colors.text }}>Aide</h4>
            <ul className="space-y-2 text-xs opacity-70" style={{ color: theme.colors.text }}>
              <li><Link to="#" className="hover:underline">Suivi de commande</Link></li>
              <li><Link to="#" className="hover:underline">Livraison</Link></li>
              <li><Link to="#" className="hover:underline">Nous contacter</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.colors.text }}>Légal</h4>
            <ul className="space-y-2 text-xs opacity-70" style={{ color: theme.colors.text }}>
              <li><Link to="#" className="hover:underline">Conditions</Link></li>
              <li><Link to="#" className="hover:underline">Confidentialité</Link></li>
              <li><Link to="#" className="hover:underline">Mentions légales</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs opacity-50" style={{ borderColor: `${theme.colors.text}10`, color: theme.colors.text }}>
          © {new Date().getFullYear()} {shopName} · {domainLabel}
        </div>
      </footer>
    </div>
  );
}

export type SiteType = 'landing' | 'ecommerce' | 'business' | 'marketplace';

export interface ThemeSection {
  id: string;
  type: 'header' | 'hero' | 'product-grid' | 'category-grid' | 'countdown' | 'filters-list' | 'product-detail' | 'payments' | 'testimonials' | 'about' | 'footer' | 'social-bar' | 'chat-float' | 'newsletter' | 'faq';
  visible: boolean;
  props: Record<string, any>;
}

export interface ThemeConfig {
  siteType: SiteType;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: { heading: string; body: string };
  spacing: 'compact' | 'comfortable' | 'spacious';
  sections: ThemeSection[];
  isPublished: boolean;
}

export const SITE_TYPES: { id: SiteType; label: string; desc: string }[] = [
  { id: 'landing', label: 'Landing page', desc: 'Page de présentation produit/service unique, sans catalogue complet' },
  { id: 'ecommerce', label: 'E-commerce complet', desc: 'Catalogue multi-produits, panier, checkout, filtres, fiches produit' },
  { id: 'business', label: 'Site vitrine', desc: 'À propos + services + contact, vente limitée ou aucune' },
  { id: 'marketplace', label: 'Marketplace basique', desc: 'Plusieurs vendeurs/catégories sur une même boutique' },
];

export const SECTION_LIBRARY: { type: ThemeSection['type']; label: string; icon: string }[] = [
  { type: 'header', label: 'Header', icon: '☰' },
  { type: 'hero', label: 'Hero', icon: '✦' },
  { type: 'product-grid', label: 'Grille produits', icon: '▦' },
  { type: 'category-grid', label: 'Catégories', icon: '▤' },
  { type: 'countdown', label: 'Compte à rebours', icon: '⏱' },
  { type: 'filters-list', label: 'Filtres + liste', icon: '⇕' },
  { type: 'product-detail', label: 'Fiche produit', icon: '⬚' },
  { type: 'payments', label: 'Paiements compatibles', icon: '💳' },
  { type: 'testimonials', label: 'Témoignages', icon: '★' },
  { type: 'about', label: 'À propos', icon: 'ℹ' },
  { type: 'newsletter', label: 'Newsletter', icon: '✉' },
  { type: 'faq', label: 'FAQ', icon: '?' },
  { type: 'footer', label: 'Footer', icon: '▭' },
  { type: 'social-bar', label: 'Barre sociale', icon: '◎' },
  { type: 'chat-float', label: 'Chat flottant', icon: '💬' },
];

export function defaultThemeForType(siteType: SiteType): ThemeConfig {
  const baseColors = {
    primary: '#F2632C',
    secondary: '#16a34a',
    accent: '#F2632C',
    background: '#FFFFFF',
    text: '#111114',
  };
  const baseFonts = { heading: 'Montserrat', body: 'Montserrat' };

  if (siteType === 'landing') {
    return {
      siteType, colors: baseColors, fonts: baseFonts, spacing: 'comfortable', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Produit', 'Contact'] } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Mon produit phare', subtitle: 'Une description percutante', cta: 'Acheter maintenant', image: '' } },
        { id: 's3', type: 'countdown', visible: true, props: { title: 'Offre de lancement', endDate: '2026-12-31' } },
        { id: 's4', type: 'testimonials', visible: true, props: {} },
        { id: 's5', type: 'payments', visible: true, props: {} },
        { id: 's6', type: 'newsletter', visible: true, props: {} },
        { id: 's7', type: 'footer', visible: true, props: {} },
      ],
    };
  }
  if (siteType === 'ecommerce') {
    return {
      siteType, colors: baseColors, fonts: baseFonts, spacing: 'comfortable', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Boutique', 'Best Seller', 'À propos', 'Contact'], megaMenu: true } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Bienvenue', subtitle: 'Découvrez nos produits', cta: 'Shop Now', image: '' } },
        { id: 's3', type: 'category-grid', visible: true, props: {} },
        { id: 's4', type: 'countdown', visible: true, props: { title: 'Promo flash', endDate: '2026-12-31' } },
        { id: 's5', type: 'filters-list', visible: true, props: { filters: ['Marque', 'Prix', 'Couleur', 'Taille'] } },
        { id: 's6', type: 'product-grid', visible: true, props: { columns: 4 } },
        { id: 's7', type: 'product-detail', visible: true, props: {} },
        { id: 's8', type: 'testimonials', visible: true, props: {} },
        { id: 's9', type: 'payments', visible: true, props: {} },
        { id: 's10', type: 'footer', visible: true, props: {} },
        { id: 's11', type: 'social-bar', visible: true, props: {} },
        { id: 's12', type: 'chat-float', visible: true, props: {} },
      ],
    };
  }
  if (siteType === 'business') {
    return {
      siteType, colors: baseColors, fonts: baseFonts, spacing: 'spacious', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Services', 'À propos', 'Contact'] } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Notre entreprise', subtitle: 'Au service de votre réussite', cta: 'Nous contacter', image: '' } },
        { id: 's3', type: 'about', visible: true, props: {} },
        { id: 's4', type: 'testimonials', visible: true, props: {} },
        { id: 's5', type: 'newsletter', visible: true, props: {} },
        { id: 's6', type: 'footer', visible: true, props: {} },
      ],
    };
  }
  return {
    siteType: 'marketplace', colors: baseColors, fonts: baseFonts, spacing: 'comfortable', isPublished: false,
    sections: [
      { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Shop', 'Best Seller', 'À propos', 'Contact'], megaMenu: true, browseCategories: true } },
      { id: 's2', type: 'hero', visible: true, props: { title: 'Tout l\'Afrique, une marketplace', subtitle: 'Des milliers de produits', cta: 'Parcourir', image: '' } },
      { id: 's3', type: 'category-grid', visible: true, props: { title: 'Browse Categories' } },
      { id: 's4', type: 'countdown', visible: true, props: { title: 'Offres du jour', endDate: '2026-12-31' } },
      { id: 's5', type: 'product-grid', visible: true, props: { columns: 4 } },
      { id: 's6', type: 'testimonials', visible: true, props: {} },
      { id: 's7', type: 'payments', visible: true, props: {} },
      { id: 's8', type: 'footer', visible: true, props: {} },
      { id: 's9', type: 'social-bar', visible: true, props: {} },
      { id: 's10', type: 'chat-float', visible: true, props: {} },
    ],
  };
}

export function renderSection(section: ThemeSection, colors: ThemeConfig['colors']): React.ReactNode {
  const primary = colors.primary;
  switch (section.type) {
    case 'header':
      return (
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#eee' }}>
          <div className="font-bold text-sm" style={{ color: colors.text }}>Ma Boutique</div>
          <div className="hidden md:flex gap-4 text-xs" style={{ color: colors.text }}>
            {(section.props.nav || []).map((n: string) => <span key={n}>{n}</span>)}
          </div>
          {section.props.megaMenu && <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: primary, color: 'white' }}>Browse Categories ▾</span>}
        </div>
      );
    case 'hero':
      return (
        <div className="px-6 py-12 text-center">
          <h2 className="text-2xl font-extrabold" style={{ color: colors.text }}>{section.props.title || 'Hero'}</h2>
          <p className="mt-2 text-sm" style={{ color: '#666' }}>{section.props.subtitle || ''}</p>
          <div className="mt-4 inline-block px-4 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: primary }}>{section.props.cta || 'Découvrir'}</div>
        </div>
      );
    case 'product-grid':
      return (
        <div className="px-6 py-8">
          <div className={`grid grid-cols-2 md:grid-cols-${section.props.columns || 4} gap-3`}>
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-lg" />)}
          </div>
        </div>
      );
    case 'category-grid':
      return (
        <div className="px-6 py-8">
          <h3 className="font-bold text-sm mb-3" style={{ color: colors.text }}>{section.props.title || 'Catégories'}</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-lg" />)}
          </div>
        </div>
      );
    case 'countdown':
      return (
        <div className="px-6 py-6 text-center" style={{ backgroundColor: primary, color: 'white' }}>
          <h3 className="font-bold text-sm">{section.props.title || 'Promo'}</h3>
          <div className="mt-2 flex justify-center gap-2">
            {['J', 'H', 'M', 'S'].map(u => <div key={u} className="bg-white/20 rounded px-2 py-1 text-xs font-mono">00 {u}</div>)}
          </div>
        </div>
      );
    case 'filters-list':
      return (
        <div className="px-6 py-6 flex gap-4">
          <div className="w-1/4 space-y-2">
            {(section.props.filters || []).map((f: string) => (
              <div key={f} className="p-2 bg-gray-50 rounded text-xs" style={{ color: colors.text }}>{f}</div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-lg" />)}
          </div>
        </div>
      );
    case 'product-detail':
      return (
        <div className="px-6 py-8 flex gap-4">
          <div className="w-1/2 aspect-square bg-gray-100 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="inline-block px-3 py-1 rounded text-white text-xs" style={{ backgroundColor: primary }}>Add to Cart</div>
          </div>
        </div>
      );
    case 'payments':
      return (
        <div className="px-6 py-6 text-center border-y" style={{ borderColor: '#eee' }}>
          <p className="text-xs font-semibold uppercase text-gray-500 mb-3">Paiements compatibles</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Flutterwave', 'Paystack', 'Orange Money', 'MTN MoMo', 'CinetPay', 'Stripe', 'PayPal'].map(p => (
              <span key={p} className="text-xs px-2 py-1 bg-gray-100 rounded" style={{ color: colors.text }}>{p}</span>
            ))}
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="px-6 py-8 grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => <div key={i} className="p-3 bg-gray-50 rounded text-xs" style={{ color: colors.text }}>★★★★★ Témoignage {i}</div>)}
        </div>
      );
    case 'about':
      return <div className="px-6 py-8 text-sm" style={{ color: colors.text }}>Section À propos — racontez votre histoire.</div>;
    case 'newsletter':
      return (
        <div className="px-6 py-6 text-center">
          <p className="text-sm font-semibold" style={{ color: colors.text }}>Newsletter</p>
          <div className="mt-2 flex justify-center gap-2">
            <div className="px-2 py-1 bg-gray-100 rounded text-xs w-40" />
            <div className="px-3 py-1 rounded text-white text-xs" style={{ backgroundColor: primary }}>S'inscrire</div>
          </div>
        </div>
      );
    case 'faq':
      return <div className="px-6 py-8 space-y-2">{['Question 1', 'Question 2'].map(q => <div key={q} className="p-2 bg-gray-50 rounded text-xs" style={{ color: colors.text }}>{q}</div>)}</div>;
    case 'footer':
      return <div className="px-6 py-6 bg-gray-900 text-white text-xs flex justify-between"><span>Ma Boutique</span><span>© 2026</span></div>;
    case 'social-bar':
      return <div className="fixed right-4 top-1/2 -translate-y-1/2 space-y-1"><div className="w-8 h-8 bg-gray-800 rounded-full" /></div>;
    case 'chat-float':
      return <div className="fixed bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg" style={{ backgroundColor: primary }}>💬</div>;
    default:
      return null;
  }
}

export type SiteType = 'landing' | 'ecommerce' | 'business' | 'marketplace';

export interface ThemeSection {
  id: string;
  type: 'header' | 'hero' | 'product-grid' | 'category-grid' | 'countdown' | 'filters-list' | 'product-detail' | 'payments' | 'testimonials' | 'about' | 'footer' | 'social-bar' | 'chat-float' | 'newsletter' | 'faq';
  visible: boolean;
  props: Record<string, any>;
}

export interface ThemeConfig {
  siteType: SiteType;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  fonts: { heading: string; body: string };
  spacing: 'compact' | 'comfortable' | 'spacious';
  sections: ThemeSection[];
  isPublished: boolean;
}

export const SITE_TYPES: { id: SiteType; label: string; desc: string }[] = [
  { id: 'landing', label: 'Landing page', desc: 'Page de présentation produit/service unique' },
  { id: 'ecommerce', label: 'E-commerce complet', desc: 'Catalogue, panier, checkout, filtres' },
  { id: 'business', label: 'Site vitrine', desc: 'À propos + services + contact' },
  { id: 'marketplace', label: 'Marketplace', desc: 'Multi-vendeurs, multi-catégories' },
];

export const SECTION_LIBRARY: { type: ThemeSection['type']; label: string; icon: string }[] = [
  { type: 'header', label: 'Header', icon: '☰' },
  { type: 'hero', label: 'Hero', icon: '✦' },
  { type: 'product-grid', label: 'Grille produits', icon: '▦' },
  { type: 'category-grid', label: 'Catégories', icon: '▤' },
  { type: 'countdown', label: 'Compte à rebours', icon: '⏱' },
  { type: 'filters-list', label: 'Filtres + liste', icon: '⇕' },
  { type: 'product-detail', label: 'Fiche produit', icon: '⬚' },
  { type: 'payments', label: 'Paiements', icon: '💳' },
  { type: 'testimonials', label: 'Témoignages', icon: '★' },
  { type: 'about', label: 'À propos', icon: 'ℹ' },
  { type: 'newsletter', label: 'Newsletter', icon: '✉' },
  { type: 'faq', label: 'FAQ', icon: '?' },
  { type: 'footer', label: 'Footer', icon: '▭' },
  { type: 'social-bar', label: 'Barre sociale', icon: '◎' },
  { type: 'chat-float', label: 'Chat flottant', icon: '💬' },
];

export const EDITABLE_PROPS: Record<string, { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'date' }[]> = {
  hero: [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'subtitle', label: 'Sous-titre', type: 'textarea' },
    { key: 'cta', label: 'Bouton (CTA)', type: 'text' },
    { key: 'image', label: 'Image URL', type: 'text' },
  ],
  'product-grid': [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'columns', label: 'Colonnes (2-4)', type: 'number' },
  ],
  'category-grid': [{ key: 'title', label: 'Titre', type: 'text' }],
  countdown: [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'endDate', label: 'Date de fin', type: 'date' },
  ],
  'filters-list': [{ key: 'filters', label: 'Filtres (séparés par virgules)', type: 'text' }],
  'product-detail': [
    { key: 'title', label: 'Nom du produit', type: 'text' },
    { key: 'price', label: 'Prix', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  about: [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'text', label: 'Texte', type: 'textarea' },
  ],
  newsletter: [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
  ],
};

export function getSectionDefaults(type: ThemeSection['type']): Record<string, any> {
  const d: Record<string, Record<string, any>> = {
    header: { logo: true, nav: ['Accueil', 'Boutique', 'Contact'], megaMenu: false },
    hero: { title: 'Nouveau titre', subtitle: 'Sous-titre descriptif', cta: 'Découvrir', image: '' },
    'product-grid': { columns: 4, title: 'Nos produits' },
    'category-grid': { title: 'Catégories' },
    countdown: { title: 'Offre limitée', endDate: '2026-12-31' },
    'filters-list': { filters: ['Marque', 'Prix', 'Couleur', 'Taille'] },
    'product-detail': { title: 'Nom du produit', price: '25 000 XOF', description: 'Description du produit' },
    payments: {},
    testimonials: {},
    about: { title: 'À propos de nous', text: 'Notre histoire, notre mission.' },
    newsletter: { title: 'Restez connecté', placeholder: 'Votre email' },
    faq: {},
    footer: {},
    'social-bar': {},
    'chat-float': {},
  };
  return d[type] || {};
}

export function defaultThemeForType(siteType: SiteType): ThemeConfig {
  const baseColors = { primary: '#F2632C', secondary: '#16a34a', accent: '#F2632C', background: '#FFFFFF', text: '#111114' };
  const baseFonts = { heading: 'Montserrat', body: 'Montserrat' };

  if (siteType === 'landing') {
    return {
      siteType, colors: baseColors, fonts: baseFonts, spacing: 'comfortable', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Produit', 'Contact'] } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Mon produit phare', subtitle: 'Une description percutante qui captive vos visiteurs', cta: 'Acheter maintenant', image: '' } },
        { id: 's3', type: 'countdown', visible: true, props: { title: 'Offre de lancement', endDate: '2026-12-31' } },
        { id: 's4', type: 'testimonials', visible: true, props: {} },
        { id: 's5', type: 'payments', visible: true, props: {} },
        { id: 's6', type: 'newsletter', visible: true, props: { title: 'Restez connecté', placeholder: 'Votre email' } },
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
        { id: 's3', type: 'category-grid', visible: true, props: { title: 'Catégories' } },
        { id: 's4', type: 'countdown', visible: true, props: { title: 'Promo flash', endDate: '2026-12-31' } },
        { id: 's5', type: 'filters-list', visible: true, props: { filters: ['Marque', 'Prix', 'Couleur', 'Taille'] } },
        { id: 's6', type: 'product-grid', visible: true, props: { columns: 4, title: 'Nos produits' } },
        { id: 's7', type: 'product-detail', visible: true, props: { title: 'Nom du produit', price: '25 000 XOF', description: 'Description du produit' } },
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
        { id: 's3', type: 'about', visible: true, props: { title: 'À propos de nous', text: 'Notre histoire, notre mission, nos valeurs.' } },
        { id: 's4', type: 'testimonials', visible: true, props: {} },
        { id: 's5', type: 'newsletter', visible: true, props: { title: 'Restez connecté', placeholder: 'Votre email' } },
        { id: 's6', type: 'footer', visible: true, props: {} },
      ],
    };
  }
  return {
    siteType: 'marketplace', colors: baseColors, fonts: baseFonts, spacing: 'comfortable', isPublished: false,
    sections: [
      { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Shop', 'Best Seller', 'À propos', 'Contact'], megaMenu: true } },
      { id: 's2', type: 'hero', visible: true, props: { title: "Tout l'Afrique, une marketplace", subtitle: 'Des milliers de produits', cta: 'Parcourir', image: '' } },
      { id: 's3', type: 'category-grid', visible: true, props: { title: 'Browse Categories' } },
      { id: 's4', type: 'countdown', visible: true, props: { title: 'Offres du jour', endDate: '2026-12-31' } },
      { id: 's5', type: 'product-grid', visible: true, props: { columns: 4, title: 'Produits populaires' } },
      { id: 's6', type: 'testimonials', visible: true, props: {} },
      { id: 's7', type: 'payments', visible: true, props: {} },
      { id: 's8', type: 'footer', visible: true, props: {} },
      { id: 's9', type: 'social-bar', visible: true, props: {} },
      { id: 's10', type: 'chat-float', visible: true, props: {} },
    ],
  };
}

// ============ Modern section renderers ============

const sampleProducts = [
  { name: 'Robe Wax Premium', price: '25 000', img: 'https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&w=400', tag: 'Nouveau' },
  { name: 'Sac cuir artisanal', price: '45 000', img: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&w=400', tag: '' },
  { name: 'Montre classique', price: '60 000', img: 'https://images.pexels.com/photos/9978722/pexels-photo-9978722.jpeg?auto=compress&w=400', tag: 'Best' },
  { name: 'Chaussures stylish', price: '35 000', img: 'https://images.pexels.com/photos/2589653/pexels-photo-2589653.jpeg?auto=compress&w=400', tag: '' },
  { name: 'Lunettes soleil', price: '15 000', img: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&w=400', tag: 'Promo' },
  { name: 'Parfum élégance', price: '30 000', img: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&w=400', tag: '' },
  { name: 'Casque audio Pro', price: '50 000', img: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&w=400', tag: 'Nouveau' },
  { name: 'Montre connectée', price: '75 000', img: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&w=400', tag: '' },
];

const sampleCategories = [
  { name: 'Mode', icon: '👗', count: 248 },
  { name: 'Électronique', icon: '📱', count: 156 },
  { name: 'Maison', icon: '🏠', count: 89 },
  { name: 'Beauté', icon: '💄', count: 134 },
  { name: 'Sport', icon: '⚽', count: 67 },
  { name: 'Accessoires', icon: '⌚', count: 192 },
];

const sampleTestimonials = [
  { name: 'Awa K.', text: 'Service impeccable, livraison rapide à Abidjan!', rating: 5, role: 'Cliente' },
  { name: 'Mamadou S.', text: 'Produits de qualité, je recommande vivement.', rating: 5, role: 'Client' },
  { name: 'Fatou D.', text: 'Boutique sérieuse, paiement Mobile Money facile.', rating: 4, role: 'Cliente' },
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function renderSection(section: ThemeSection, colors: ThemeConfig['colors']): React.ReactNode {
  const primary = colors.primary;
  const secondary = colors.secondary;
  const bg = colors.background;
  const txt = colors.text;
  const subtleBg = hexToRgba(primary, 0.04);
  const cardShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';

  switch (section.type) {
    case 'header':
      return (
        <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: `2px solid ${hexToRgba(primary, 0.1)}`, background: bg }}>
          <div className="flex items-center gap-2">
            {section.props.logo !== false && (
              <span className="font-bold text-base" style={{ color: primary, letterSpacing: '-0.02em' }}>Ma Boutique</span>
            )}
          </div>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium" style={{ color: txt }}>
            {(section.props.nav || []).map((n: string) => (
              <span key={n} className="hover:opacity-60 transition-opacity cursor-pointer">{n}</span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {section.props.megaMenu && (
              <span className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-transform hover:scale-105" style={{ background: primary }}>Catégories ▾</span>
            )}
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: subtleBg }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
          </div>
        </div>
      );

    case 'hero': {
      const img = section.props.image;
      return (
        <div className="relative overflow-hidden" style={{ background: img ? `url(${img}) center/cover` : `linear-gradient(135deg, ${hexToRgba(primary, 0.1)}, ${hexToRgba(secondary, 0.06)})` }}>
          <div className="px-8 py-16 text-center relative z-10">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: hexToRgba(primary, 0.1), color: primary }}>
              ✨ Nouvelle collection 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: txt, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {section.props.title || 'Hero'}
            </h1>
            <p className="text-lg mb-6 max-w-xl mx-auto" style={{ color: hexToRgba(txt, 0.6) }}>
              {section.props.subtitle || ''}
            </p>
            <div className="flex gap-3 justify-center">
              <div className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold transition-transform hover:scale-105 active:scale-95" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 4px 14px ${hexToRgba(primary, 0.35)}` }}>
                {section.props.cta || 'Découvrir'}
              </div>
              <div className="inline-block px-6 py-3 rounded-xl text-sm font-semibold transition-colors" style={{ border: `1.5px solid ${hexToRgba(txt, 0.15)}`, color: txt }}>
                En savoir plus
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: `linear-gradient(to top, ${bg}, transparent)` }} />
        </div>
      );
    }

    case 'product-grid': {
      const cols = section.props.columns || 4;
      const gridCols = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4';
      return (
        <div className="px-6 py-8" style={{ background: bg }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ color: txt, letterSpacing: '-0.02em' }}>{section.props.title || 'Nos produits'}</h3>
            <span className="text-sm font-medium cursor-pointer" style={{ color: primary }}>Voir tout →</span>
          </div>
          <div className={`grid ${gridCols} gap-4`}>
            {sampleProducts.slice(0, cols * 2).map((p, i) => (
              <div key={i} className="group rounded-2xl overflow-hidden transition-all hover:-translate-y-1" style={{ boxShadow: cardShadow, background: bg, border: `1px solid ${hexToRgba(txt, 0.06)}` }}>
                <div className="relative aspect-square overflow-hidden" style={{ background: hexToRgba(primary, 0.03) }}>
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                  {p.tag && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold text-white" style={{ background: p.tag === 'Promo' ? '#ef4444' : primary }}>{p.tag}</span>}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold truncate" style={{ color: txt }}>{p.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-bold" style={{ color: primary }}>{p.price} XOF</p>
                    <div className="flex items-center gap-0.5 text-xs" style={{ color: '#f59e0b' }}>★ 4.8</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'category-grid':
      return (
        <div className="px-6 py-8" style={{ background: bg }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: txt, letterSpacing: '-0.02em' }}>{section.props.title || 'Catégories'}</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {sampleCategories.map((c, i) => (
              <div key={i} className="group flex flex-col items-center justify-center p-4 rounded-2xl transition-all hover:-translate-y-1 cursor-pointer" style={{ background: subtleBg, border: `1px solid ${hexToRgba(primary, 0.08)}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2 transition-transform group-hover:scale-110" style={{ background: 'white', boxShadow: cardShadow }}>{c.icon}</div>
                <p className="text-sm font-semibold" style={{ color: txt }}>{c.name}</p>
                <p className="text-xs" style={{ color: hexToRgba(txt, 0.4) }}>{c.count} articles</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'countdown': {
      const units = [{ label: 'Jours', value: '07' }, { label: 'Heures', value: '14' }, { label: 'Minutes', value: '32' }, { label: 'Secondes', value: '45' }];
      return (
        <div className="px-6 py-8 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-1">{section.props.title || 'Promo'}</h3>
            <p className="text-white/70 text-sm mb-4">Profitez de -30% avant la fin!</p>
            <div className="flex justify-center gap-3">
              {units.map(u => (
                <div key={u.label} className="text-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold font-mono text-white" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>{u.value}</div>
                  <p className="text-xs text-white/60 mt-1">{u.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'filters-list':
      return (
        <div className="px-6 py-6 flex gap-6" style={{ background: bg }}>
          <div className="w-56 shrink-0 space-y-3">
            <div className="p-3 rounded-xl" style={{ background: subtleBg }}>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: hexToRgba(txt, 0.4) }}>Filtres</p>
              {(section.props.filters || []).map((f: string) => (
                <div key={f} className="mb-2">
                  <p className="text-sm font-medium mb-1" style={{ color: txt }}>{f}</p>
                  <div className="flex flex-wrap gap-1">
                    {['Tous', 'A', 'B', 'C'].map((v, i) => (
                      <span key={v} className="text-xs px-2 py-0.5 rounded-md cursor-pointer transition-colors" style={i === 0 ? { background: primary, color: 'white' } : { background: hexToRgba(txt, 0.04), color: txt }}>{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
            {sampleProducts.slice(0, 6).map((p, i) => (
              <div key={i} className="group rounded-xl overflow-hidden transition-all hover:shadow-lg" style={{ boxShadow: cardShadow, border: `1px solid ${hexToRgba(txt, 0.06)}` }}>
                <div className="relative aspect-square overflow-hidden" style={{ background: hexToRgba(primary, 0.03) }}>
                  <img src={p.img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold truncate" style={{ color: txt }}>{p.name}</p>
                  <p className="text-xs font-bold" style={{ color: primary }}>{p.price} XOF</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'product-detail':
      return (
        <div className="px-6 py-8" style={{ background: bg }}>
          <div className="flex gap-6 max-w-4xl mx-auto">
            <div className="w-1/2 aspect-square rounded-2xl overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.12)', background: hexToRgba(primary, 0.03) }}>
              <img src={sampleProducts[0].img} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-md font-bold text-white" style={{ background: '#16a34a' }}>En stock</span>
                <div className="flex items-center gap-0.5 text-xs" style={{ color: '#f59e0b' }}>★★★★★ <span className="text-gray-400 ml-1">(124 avis)</span></div>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: txt, letterSpacing: '-0.02em' }}>{section.props.title || 'Nom du produit'}</h2>
              <p className="text-3xl font-bold mb-3" style={{ color: primary }}>{section.props.price || '25 000 XOF'}</p>
              <p className="text-sm mb-4" style={{ color: hexToRgba(txt, 0.6) }}>{section.props.description || 'Description du produit'}</p>
              <div className="flex gap-3 mb-4">
                {['S', 'M', 'L', 'XL'].map((s, i) => (
                  <div key={s} className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-all" style={i === 1 ? { background: primary, color: 'white' } : { border: `1.5px solid ${hexToRgba(txt, 0.15)}`, color: txt }}>{s}</div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 px-5 py-3 rounded-xl text-white text-sm font-semibold text-center transition-transform hover:scale-105" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 4px 14px ${hexToRgba(primary, 0.35)}` }}>Ajouter au panier</div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'payments':
      return (
        <div className="px-6 py-6 text-center" style={{ background: bg, borderTop: `1px solid ${hexToRgba(txt, 0.06)}`, borderBottom: `1px solid ${hexToRgba(txt, 0.06)}` }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: hexToRgba(txt, 0.4) }}>Paiements compatibles</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Flutterwave', 'Paystack', 'Orange Money', 'MTN MoMo', 'CinetPay', 'Stripe', 'PayPal', 'Wave'].map(p => (
              <span key={p} className="text-sm px-4 py-2 rounded-xl font-medium transition-all hover:scale-105" style={{ background: subtleBg, color: txt, border: `1px solid ${hexToRgba(primary, 0.08)}` }}>{p}</span>
            ))}
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className="px-6 py-10" style={{ background: bg }}>
          <h3 className="text-xl font-bold text-center mb-6" style={{ color: txt, letterSpacing: '-0.02em' }}>Ils nous font confiance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {sampleTestimonials.map((t, i) => (
              <div key={i} className="p-5 rounded-2xl transition-all hover:shadow-lg" style={{ background: subtleBg, border: `1px solid ${hexToRgba(primary, 0.08)}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: txt }}>{t.name}</p>
                    <p className="text-xs" style={{ color: hexToRgba(txt, 0.4) }}>{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2 text-sm" style={{ color: '#f59e0b' }}>{'★'.repeat(t.rating)}<span style={{ color: hexToRgba(txt, 0.15) }}>{'★'.repeat(5 - t.rating)}</span></div>
                <p className="text-sm" style={{ color: hexToRgba(txt, 0.7) }}>"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'about':
      return (
        <div className="px-6 py-10" style={{ background: bg }}>
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-3" style={{ color: txt, letterSpacing: '-0.02em' }}>{section.props.title || 'À propos de nous'}</h3>
            <p className="text-base" style={{ color: hexToRgba(txt, 0.6) }}>{section.props.text || 'Notre histoire, notre mission, nos valeurs.'}</p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[{ n: '10K+', l: 'Clients' }, { n: '500+', l: 'Produits' }, { n: '15', l: 'Pays' }].map(s => (
                <div key={s.l}><p className="text-2xl font-bold" style={{ color: primary }}>{s.n}</p><p className="text-xs" style={{ color: hexToRgba(txt, 0.4) }}>{s.l}</p></div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'newsletter':
      return (
        <div className="px-6 py-10 text-center" style={{ background: `linear-gradient(135deg, ${hexToRgba(primary, 0.06)}, ${hexToRgba(secondary, 0.04)})` }}>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-1" style={{ color: txt }}>{section.props.title || 'Restez connecté'}</h3>
            <p className="text-sm mb-4" style={{ color: hexToRgba(txt, 0.5) }}>Recevez nos offres exclusives et nouveautés</p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input type="email" placeholder={section.props.placeholder || 'Votre email'} className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ border: `1.5px solid ${hexToRgba(txt, 0.1)}`, background: bg, color: txt }} />
              <div className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-transform hover:scale-105" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>S'inscrire</div>
            </div>
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="px-6 py-10" style={{ background: bg }}>
          <h3 className="text-xl font-bold text-center mb-6" style={{ color: txt }}>Questions fréquentes</h3>
          <div className="max-w-2xl mx-auto space-y-3">
            {[
              { q: 'Quels sont les délais de livraison?', a: 'Livraison sous 24-72h selon votre région.' },
              { q: 'Comment payer?', a: 'Mobile Money, carte bancaire, ou paiement à la livraison.' },
              { q: 'Puis-je retourner un produit?', a: 'Oui, sous 14 jours après réception.' },
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-xl transition-all" style={{ background: subtleBg, border: `1px solid ${hexToRgba(primary, 0.08)}` }}>
                <p className="text-sm font-semibold mb-1" style={{ color: txt }}>{f.q}</p>
                <p className="text-sm" style={{ color: hexToRgba(txt, 0.6) }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="px-6 py-8" style={{ background: '#0f1623', color: 'rgba(255,255,255,0.7)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div>
              <span className="font-bold text-white text-sm">Ma Boutique</span>
              <p className="text-xs text-white/40 mt-2">Votre boutique de confiance en Afrique.</p>
            </div>
            {[
              { title: 'Boutique', links: ['Nouveautés', 'Best Sellers', 'Promotions'] },
              { title: 'Aide', links: ['Contact', 'Livraison', 'Retours'] },
              { title: 'Légal', links: ['CGV', 'Confidentialité', 'Mentions légales'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-xs font-bold uppercase text-white/40 mb-2">{col.title}</p>
                {col.links.map(l => <p key={l} className="text-xs text-white/60 hover:text-white cursor-pointer transition-colors mb-1">{l}</p>)}
              </div>
            ))}
          </div>
          <div className="max-w-4xl mx-auto mt-6 pt-4 flex justify-between items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-white/30">© 2026 Ma Boutique. Tous droits réservés.</p>
            <div className="flex gap-2">{['f', 'ig', 'tw', 'yt'].map(s => <div key={s} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs text-white/40 cursor-pointer hover:bg-white/10 transition-colors">{s}</div>)}</div>
          </div>
        </div>
      );

    case 'social-bar':
      return (
        <div className="fixed right-3 top-1/2 -translate-y-1/2 space-y-2 z-30">
          {[
            { bg: '#1877F2', icon: 'f' }, { bg: '#E4405F', icon: 'ig' },
            { bg: '#1DA1F2', icon: 'tw' }, { bg: '#FF0000', icon: 'yt' },
          ].map(s => (
            <div key={s.icon} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-all hover:scale-110" style={{ background: s.bg, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{s.icon}</div>
          ))}
        </div>
      );

    case 'chat-float':
      return (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl cursor-pointer transition-all hover:scale-110" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 4px 20px ${hexToRgba(primary, 0.4)}` }}>
            💬
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-xs text-white font-bold">2</div>
        </div>
      );

    default:
      return null;
  }
}

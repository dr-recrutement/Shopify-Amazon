import React from 'react';

export type SiteType = 'landing' | 'ecommerce' | 'business' | 'marketplace';
export type ThemePreset = 'universal' | 'luxury' | 'african' | 'editorial' | 'lagos_beauty' | 'art_wax' | 'coral_peach' | 'ocean_blue';

export interface ThemeSection {
  id: string;
  type: 'header' | 'hero' | 'product-grid' | 'category-grid' | 'countdown' | 'filters-list' | 'product-detail' | 'payments' | 'testimonials' | 'about' | 'footer' | 'social-bar' | 'chat-float' | 'newsletter' | 'faq';
  visible: boolean;
  props: Record<string, any>;
}

export interface ThemeConfig {
  siteType: SiteType;
  preset: ThemePreset;
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
  { type: 'hero', label: 'Hero Banner', icon: '✦' },
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

export const THEME_PRESETS: Record<ThemePreset, { label: string; desc: string; colors: ThemeConfig['colors']; fonts: ThemeConfig['fonts'] }> = {
  universal: {
    label: 'Universel', desc: 'Design moderne et polyvalent', colors: { primary: '#F2632C', secondary: '#16a34a', accent: '#F59E0B', background: '#FFFFFF', text: '#111114' }, fonts: { heading: 'Montserrat', body: 'Inter' },
  },
  luxury: {
    label: 'Luxury', desc: 'Élégant, premium, haut de gamme', colors: { primary: '#B07C2D', secondary: '#111827', accent: '#D4AF37', background: '#FCF7ED', text: '#111827' }, fonts: { heading: 'Cormorant Garamond', body: 'Inter' },
  },
  african: {
    label: 'African', desc: 'Couleurs vibrantes et orientées commerce pan-africain', colors: { primary: '#EF6B2A', secondary: '#0F766E', accent: '#F59E0B', background: '#FFF9F2', text: '#14213D' }, fonts: { heading: 'Montserrat', body: 'Inter' },
  },
  editorial: {
    label: 'Editorial', desc: 'Style magazine, très propre et premium', colors: { primary: '#1F2937', secondary: '#A16207', accent: '#D97706', background: '#F8FAFC', text: '#111827' }, fonts: { heading: 'Playfair Display', body: 'Inter' },
  },
  lagos_beauty: {
    label: 'Lagos Beauty', desc: 'Chic, cosmétique et mode tendance rose gold & rose', colors: { primary: '#DB2777', secondary: '#F472B6', accent: '#FBCFE8', background: '#FFF5F7', text: '#1F2937' }, fonts: { heading: 'Playfair Display', body: 'Inter' },
  },
  art_wax: {
    label: 'Art & Wax', desc: 'Vibrant, artistique, riche en culture africaine', colors: { primary: '#D97706', secondary: '#047857', accent: '#B45309', background: '#FFFBEB', text: '#1E293B' }, fonts: { heading: 'Montserrat', body: 'Poppins' },
  },
  coral_peach: {
    label: 'Coral & Peach', desc: 'Frais, chaleureux et minimaliste moderne', colors: { primary: '#FF6B35', secondary: '#FF9F1C', accent: '#2EC4B6', background: '#FFF9F5', text: '#011627' }, fonts: { heading: 'Poppins', body: 'Inter' },
  },
  ocean_blue: {
    label: 'Ocean Blue', desc: 'Design corporate, technologique et épuré', colors: { primary: '#0369A1', secondary: '#0284C7', accent: '#38BDF8', background: '#F8FAFC', text: '#0F172A' }, fonts: { heading: 'Manrope', body: 'Inter' },
  },
};

export const FONT_OPTIONS = ['Inter', 'Montserrat', 'Playfair Display', 'Cormorant Garamond', 'Poppins', 'Manrope'];

export function getPresetColors(preset: ThemePreset): ThemeConfig['colors'] {
  return THEME_PRESETS[preset]?.colors || THEME_PRESETS.universal.colors;
}

function getSpacingClass(spacing: ThemeConfig['spacing']) {
  if (spacing === 'compact') return 'px-4 py-4';
  if (spacing === 'spacious') return 'px-8 py-10';
  return 'px-6 py-8';
}

export function defaultThemeForType(siteType: SiteType): ThemeConfig {
  const preset: ThemePreset = siteType === 'landing' ? 'luxury' : siteType === 'ecommerce' ? 'african' : siteType === 'business' ? 'editorial' : 'universal';
  const presetConfig = THEME_PRESETS[preset];
  const baseColors = presetConfig.colors;
  const baseFonts = presetConfig.fonts;

  if (siteType === 'landing') {
    return {
      siteType, preset, colors: baseColors, fonts: baseFonts, spacing: 'comfortable', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logoText: 'Mon Produit Phare', logoImage: '', nav: ['Accueil', 'Produit', 'Contact'], alignment: 'center' } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Le produit révolutionnaire', subtitle: 'Conçu avec passion en Afrique pour le monde entier.', cta: 'Acheter maintenant', alignment: 'center', image: '' } },
        { id: 's3', type: 'countdown', visible: true, props: { title: 'Offre exclusive de lancement', endDate: '2026-12-31' } },
        { id: 's4', type: 'testimonials', visible: true, props: { title: 'Ce que pensent nos clients', items: 'Excellent produit ! - Amina;Un service incroyable - Koffi;Je recommande vivement - Sékou' } },
        { id: 's5', type: 'payments', visible: true, props: { title: 'Paiements ultra sécurisés et rapides' } },
        { id: 's6', type: 'newsletter', visible: true, props: { title: 'Rejoignez la newsletter', subtitle: 'Ne ratez aucun lancement exclusif.', buttonText: 'S\'inscrire' } },
        { id: 's7', type: 'footer', visible: true, props: { copyright: '© 2026 Mon Produit Phare. Tous droits réservés.', showSocials: true } },
      ],
    };
  }
  if (siteType === 'ecommerce') {
    return {
      siteType, preset, colors: baseColors, fonts: baseFonts, spacing: 'comfortable', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logoText: 'Ma Superbe Boutique', logoImage: '', nav: ['Accueil', 'Boutique', 'Meilleures Ventes', 'À Propos', 'Contact'], megaMenu: true, alignment: 'between' } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Nouvelle Collection d\'Exception', subtitle: 'Des créations authentiques et modernes sélectionnées à la main.', cta: 'Découvrir la Collection', alignment: 'left', image: '' } },
        { id: 's3', type: 'category-grid', visible: true, props: { title: 'Nos Catégories Populaires' } },
        { id: 's4', type: 'countdown', visible: true, props: { title: 'Ventes Privées de la Semaine', endDate: '2026-12-31' } },
        { id: 's5', type: 'filters-list', visible: true, props: { filters: ['Marque', 'Prix', 'Couleur', 'Taille'] } },
        { id: 's6', type: 'product-grid', visible: true, props: { title: 'Produits Phares', columns: 4, showPrice: true } },
        { id: 's7', type: 'product-detail', visible: true, props: { title: 'Produit Vedette' } },
        { id: 's8', type: 'testimonials', visible: true, props: { title: 'Vos retours nous font chaud au cœur', items: 'Qualité au top et livraison super rapide ! - Fatou;Les tissus sont magnifiques, merci ! - Jean;Service client incroyable, réactif. - Mary' } },
        { id: 's9', type: 'payments', visible: true, props: { title: 'Paiements locaux et internationaux acceptés' } },
        { id: 's10', type: 'footer', visible: true, props: { copyright: '© 2026 Ma Superbe Boutique. Réalisé avec Os.', showSocials: true } },
        { id: 's11', type: 'social-bar', visible: true, props: { facebook: '#', instagram: '#', twitter: '#' } },
        { id: 's12', type: 'chat-float', visible: true, props: { message: 'Une question ? Discutez avec nous !' } },
      ],
    };
  }
  if (siteType === 'business') {
    return {
      siteType, preset, colors: baseColors, fonts: baseFonts, spacing: 'spacious', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logoText: 'Cabinet Vitrine Pro', logoImage: '', nav: ['Accueil', 'Services', 'Notre Histoire', 'Contact'], alignment: 'between' } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Accélérez votre croissance', subtitle: 'Nous accompagnons les entrepreneurs ambitieux à travers l\'Afrique.', cta: 'Prendre un RDV', alignment: 'center', image: '' } },
        { id: 's3', type: 'about', visible: true, props: { title: 'Qui sommes-nous ?', content: 'Une équipe de professionnels passionnés engagés pour votre succès, avec plus de 10 ans d\'expérience.' } },
        { id: 's4', type: 'testimonials', visible: true, props: { title: 'Ce que disent nos partenaires', items: 'Un partenaire de confiance au quotidien. - Amadou;Leur expertise a tout changé pour nous. - Chantal' } },
        { id: 's5', type: 'newsletter', visible: true, props: { title: 'Abonnez-vous à notre newsletter stratégique', subtitle: 'Recevez nos analyses chaque lundi matin.', buttonText: 'S\'abonner' } },
        { id: 's6', type: 'footer', visible: true, props: { copyright: '© 2026 Cabinet Vitrine Pro. Tous droits réservés.', showSocials: false } },
      ],
    };
  }
  return {
    siteType: 'marketplace', preset, colors: baseColors, fonts: baseFonts, spacing: 'comfortable', isPublished: false,
    sections: [
      { id: 's1', type: 'header', visible: true, props: { logoText: 'Grand Marché Africain', logoImage: '', nav: ['Marchands', 'Acheter', 'FAQ', 'Rejoindre'], megaMenu: true, browseCategories: true, alignment: 'between' } },
      { id: 's2', type: 'hero', visible: true, props: { title: 'La plus grande place de marché panafricaine', subtitle: 'Trouvez et achetez directement auprès de milliers de créateurs africains.', cta: 'Parcourir les Échoppes', alignment: 'left', image: '' } },
      { id: 's3', type: 'category-grid', visible: true, props: { title: 'Catégories Populaires' } },
      { id: 's4', type: 'countdown', visible: true, props: { title: 'Vente flash du Grand Marché', endDate: '2026-12-31' } },
      { id: 's5', type: 'product-grid', visible: true, props: { title: 'Nouveautés des Boutiques', columns: 4, showPrice: true } },
      { id: 's6', type: 'testimonials', visible: true, props: { title: 'Avis de notre communauté', items: 'Une marketplace sûre et fiable. - Salim;Trouvaille géniale pour les produits locaux ! - Marie' } },
      { id: 's7', type: 'payments', visible: true, props: { title: 'Paiement mobile sécurisé par Wave, MTN, Orange' } },
      { id: 's8', type: 'footer', visible: true, props: { copyright: '© 2026 Grand Marché Africain. Propulsé par Os.', showSocials: true } },
      { id: 's9', type: 'social-bar', visible: true, props: { facebook: '#', instagram: '#' } },
      { id: 's10', type: 'chat-float', visible: true, props: { message: 'Besoin d\'aide sur le marché ?' } },
    ],
  };
}

export function renderSection(section: ThemeSection, theme: ThemeConfig): React.ReactNode {
  const primary = theme.colors.primary;
  const secondary = theme.colors.secondary;
  const accent = theme.colors.accent;
  const bg = theme.colors.background;
  const text = theme.colors.text;
  const spacingClass = getSpacingClass(theme.spacing);
  const headingStyle = { fontFamily: theme.fonts.heading, color: text };
  const bodyStyle = { fontFamily: theme.fonts.body, color: text };

  // Helper safely pulling props with standard default fallbacks
  const getProp = (key: string, def: any) => {
    return (section.props && section.props[key] !== undefined) ? section.props[key] : def;
  };

  switch (section.type) {
    case 'header': {
      const logoText = getProp('logoText', 'Ma Boutique');
      const logoImage = getProp('logoImage', '');
      const nav = getProp('nav', ['Accueil', 'Boutique', 'Contact']);
      const megaMenu = getProp('megaMenu', false);

      return (
        <div
          className={`flex items-center justify-between shadow-sm border-b transition-all ${
            theme.spacing === 'compact' ? 'px-4 py-2.5' : theme.spacing === 'spacious' ? 'px-8 py-5' : 'px-6 py-3.5'
          }`}
          style={{ borderColor: 'rgba(0,0,0,0.06)', background: `linear-gradient(95deg, ${primary}, ${accent})`, color: '#ffffff' }}
        >
          <div className="flex items-center gap-2">
            {logoImage ? (
              <img src={logoImage} alt="Logo" className="h-7 w-auto object-contain rounded-md" />
            ) : (
              <span className="font-extrabold text-base tracking-tight" style={{ fontFamily: theme.fonts.heading }}>
                {logoText}
              </span>
            )}
            {megaMenu && (
              <span className="hidden md:inline-flex items-center text-[10px] ml-4 bg-white/20 px-2 py-0.5 rounded-full font-medium">
                Menu ▾
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-5 text-xs font-medium opacity-90">
            {nav.map((n: string) => (
              <span key={n} className="hover:opacity-100 cursor-pointer hover:underline transition-all">
                {n}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white text-gray-900 font-bold shadow-sm">
              Panier (0)
            </span>
          </div>
        </div>
      );
    }

    case 'hero': {
      const title = getProp('title', 'Bienvenue');
      const subtitle = getProp('subtitle', 'Découvrez nos produits');
      const cta = getProp('cta', 'Découvrir');
      const image = getProp('image', '');
      const alignment = getProp('alignment', 'center');

      return (
        <div
          className={`${spacingClass} relative flex flex-col md:flex-row items-center gap-6 rounded-b-2xl overflow-hidden transition-all`}
          style={{ background: `linear-gradient(135deg, ${bg} 0%, ${accent}15 100%)` }}
        >
          <div className={`flex-1 ${alignment === 'center' ? 'text-center mx-auto max-w-xl' : alignment === 'right' ? 'text-right' : 'text-left'}`}>
            <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] font-extrabold mb-3" style={{ backgroundColor: primary, color: '#ffffff' }}>
              PROMO EXCLUSIVE
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight" style={headingStyle}>
              {title}
            </h2>
            <p className="mt-2.5 text-xs md:text-sm leading-relaxed" style={{ ...bodyStyle, color: 'rgba(0,0,0,0.6)' }}>
              {subtitle}
            </p>
            {cta && (
              <button
                className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: primary }}
              >
                {cta}
              </button>
            )}
          </div>

          {image ? (
            <div className="flex-1 w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-white/40">
              <img src={image} alt="Hero Banner" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex-1 w-full max-w-sm aspect-[16/10] rounded-xl overflow-hidden shadow-inner border border-dashed border-gray-300 flex items-center justify-center bg-gray-50/50">
              <div className="text-center p-4">
                <span className="text-lg mb-1 block">✨</span>
                <span className="text-[10px] text-gray-400 block font-medium">Bannière (Optionnelle)</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    case 'product-grid': {
      const title = getProp('title', 'Produits Phares');
      const columns = getProp('columns', 4);
      const showPrice = getProp('showPrice', true);

      // Dummy products
      const items = [
        { id: 'p1', name: 'Robe Wax Royale', price: '15,000 FCFA', tag: 'Best Seller' },
        { id: 'p2', name: 'Sac en Cuir Touareg', price: '25,000 FCFA', tag: 'Nouveau' },
        { id: 'p3', name: 'Sandales Africaines', price: '9,500 FCFA', tag: 'Populaire' },
        { id: 'p4', name: 'Collier Perles Masaï', price: '12,000 FCFA', tag: 'Promo' }
      ];

      return (
        <div className={`${spacingClass} transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold tracking-tight uppercase" style={headingStyle}>
              {title}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:underline" style={{ color: primary }}>
              Voir Tout
            </span>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {items.slice(0, columns).map(item => (
              <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm hover:shadow-md transition-all group relative">
                <span className="absolute top-3 left-3 z-10 text-[8px] font-black uppercase px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: secondary }}>
                  {item.tag}
                </span>
                <div className="aspect-square rounded-lg mb-2 relative overflow-hidden flex items-center justify-center bg-gray-50" style={{ background: `linear-gradient(135deg, ${primary}12, ${accent}12)` }}>
                  <span className="text-2xl group-hover:scale-110 transition-all duration-300">🛍️</span>
                </div>
                <div className="text-[11px] font-bold truncate text-gray-800" style={bodyStyle}>
                  {item.name}
                </div>
                {showPrice && (
                  <div className="text-[10px] font-extrabold mt-0.5" style={{ color: primary }}>
                    {item.price}
                  </div>
                )}
                <div className="mt-2 w-full text-[9px] py-1 bg-gray-900 text-white font-bold rounded text-center cursor-pointer hover:bg-gray-800 active:scale-95 transition-all">
                  Ajouter
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'category-grid': {
      const title = getProp('title', 'Catégories');
      const categories = [
        { name: 'Vêtements', icon: '👗', bg: `${primary}15` },
        { name: 'Sacs & Cuir', icon: '👜', bg: `${accent}15` },
        { name: 'Bijoux', icon: '✨', bg: `${secondary}15` },
        { name: 'Chaussures', icon: '👞', bg: `${primary}10` },
        { name: 'Artisanat', icon: '🏺', bg: `${accent}10` },
        { name: 'Épices & Thés', icon: '🍃', bg: `${secondary}10` },
      ];

      return (
        <div className={`${spacingClass} transition-all`}>
          <h3 className="text-sm font-extrabold tracking-tight mb-3 uppercase" style={headingStyle}>
            {title}
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {categories.map(cat => (
              <div key={cat.name} className="flex flex-col items-center p-2 rounded-xl border border-gray-50 cursor-pointer hover:shadow-sm hover:scale-[1.03] transition-all" style={{ backgroundColor: cat.bg }}>
                <span className="text-xl mb-1">{cat.icon}</span>
                <span className="text-[9px] font-bold text-center tracking-tight" style={bodyStyle}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'countdown': {
      const title = getProp('title', 'Promo flash');
      const endDate = getProp('endDate', '2026-12-31');

      return (
        <div
          className="px-6 py-5 text-center shadow-inner relative overflow-hidden rounded-xl"
          style={{ background: `linear-gradient(110deg, ${primary}, ${accent})`, color: 'white' }}
        >
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-20 h-20 rounded-full bg-white/10" />
          <h3 className="font-extrabold text-sm uppercase tracking-wide">
            🔥 {title}
          </h3>
          <p className="text-[10px] opacity-90 mt-0.5">Offre limitée dans le temps se terminant le {endDate}</p>
          <div className="mt-3 flex justify-center gap-1.5">
            {[
              { val: '02', label: 'J' },
              { val: '14', label: 'H' },
              { val: '35', label: 'M' },
              { val: '48', label: 'S' }
            ].map((u, idx) => (
              <div key={idx} className="bg-white text-gray-900 rounded-lg px-2.5 py-1 text-center min-w-[40px] shadow-sm">
                <div className="text-xs font-black font-mono leading-none">{u.val}</div>
                <div className="text-[7px] font-bold text-gray-400 mt-0.5 leading-none">{u.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'testimonials': {
      const title = getProp('title', 'Témoignages');
      const rawItems = getProp('items', 'Excellent service ! - Fatou;Très pro, merci - Ali');
      const parsedItems = rawItems.split(';').map((s: string) => {
        const parts = s.split('-');
        return {
          text: parts[0]?.trim() || '',
          author: parts[1]?.trim() || 'Client vérifié'
        };
      });

      return (
        <div className={`${spacingClass} transition-all bg-gray-50/50 rounded-xl`}>
          <h3 className="text-center text-xs font-extrabold tracking-widest uppercase mb-4" style={{ color: primary }}>
            ★ {title} ★
          </h3>
          <div className="grid md:grid-cols-3 gap-3">
            {parsedItems.map((item: any, i: number) => (
              <div key={i} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <p className="text-[11px] italic leading-relaxed text-gray-600" style={bodyStyle}>
                  "{item.text}"
                </p>
                <div className="mt-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: secondary }}>
                  - {item.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'newsletter': {
      const title = getProp('title', 'Newsletter');
      const subtitle = getProp('subtitle', 'Recevez les nouveautés');
      const buttonText = getProp('buttonText', "S'inscrire");

      return (
        <div className={`${spacingClass} text-center rounded-3xl p-6 transition-all border border-gray-100`} style={{ backgroundColor: `${accent}08` }}>
          <h3 className="text-sm font-extrabold tracking-tight" style={headingStyle}>
            📬 {title}
          </h3>
          <p className="text-[11px] mt-1 mb-4" style={{ ...bodyStyle, color: 'rgba(0,0,0,0.5)' }}>
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] w-full focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': primary } as React.CSSProperties}
              disabled
            />
            <button className="px-4 py-1.5 rounded-lg text-white text-[11px] font-bold shadow-sm whitespace-nowrap" style={{ backgroundColor: primary }}>
              {buttonText}
            </button>
          </div>
        </div>
      );
    }

    case 'about': {
      const title = getProp('title', 'Notre Histoire');
      const content = getProp('content', 'Section À propos — racontez votre histoire.');

      return (
        <div className={`${spacingClass} rounded-2xl bg-white border border-gray-50 p-5 transition-all`}>
          <h3 className="text-sm font-extrabold tracking-tight mb-2 uppercase" style={headingStyle}>
            ℹ️ {title}
          </h3>
          <p className="text-[11px] leading-relaxed text-gray-600" style={bodyStyle}>
            {content}
          </p>
        </div>
      );
    }

    case 'faq': {
      const title = getProp('title', 'Foire Aux Questions');
      const rawFaqs = getProp('items', 'Comment payer ? - Par Wave, Orange Money ou Carte;Délai de livraison ? - 2 à 3 jours en Côte d\'Ivoire');
      const faqs = rawFaqs.split(';').map((f: string) => {
        const parts = f.split('-');
        return { q: parts[0]?.trim() || '', a: parts[1]?.trim() || '' };
      });

      return (
        <div className={`${spacingClass} transition-all`}>
          <h3 className="text-sm font-extrabold tracking-tight mb-3 uppercase" style={headingStyle}>
            ❓ {title}
          </h3>
          <div className="space-y-2">
            {faqs.map((faq: any, i: number) => (
              <div key={i} className="p-3 bg-white rounded-xl border border-gray-100">
                <p className="text-[11px] font-black" style={headingStyle}>
                  Q: {faq.q}
                </p>
                <p className="text-[10px] text-gray-500 mt-1" style={bodyStyle}>
                  R: {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'payments': {
      const title = getProp('title', 'Paiements compatibles');
      return (
        <div className={`${theme.spacing === 'compact' ? 'px-4 py-3' : 'px-6 py-4'} text-center border-y bg-white/40 transition-all`} style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
            💳 {title}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Wave', 'Orange Money', 'MTN MoMo', 'Flutterwave', 'Paystack', 'Visa', 'Mastercard'].map(p => (
              <span key={p} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      );
    }

    case 'footer': {
      const copyright = getProp('copyright', '© 2026 Ma Boutique');
      const showSocials = getProp('showSocials', true);

      return (
        <div className={`${theme.spacing === 'compact' ? 'px-4 py-3' : 'px-6 py-4.5'} bg-gray-950 text-white text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2 rounded-t-xl mt-4`}>
          <span className="font-medium opacity-80">{copyright}</span>
          {showSocials && (
            <div className="flex gap-3 text-[10px] opacity-75">
              <span className="hover:underline cursor-pointer">Facebook</span>
              <span className="hover:underline cursor-pointer">Instagram</span>
              <span className="hover:underline cursor-pointer font-bold" style={{ color: primary }}>Powered by Os</span>
            </div>
          )}
        </div>
      );
    }

    case 'social-bar': {
      return (
        <div className="fixed right-3 top-1/2 -translate-y-1/2 space-y-1.5 z-40 hidden md:block">
          {['F', 'I', 'X'].map((s, idx) => (
            <div key={idx} className="w-6 h-6 rounded-full bg-gray-900 text-white text-[9px] font-extrabold flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all" style={{ backgroundColor: primary }}>
              {s}
            </div>
          ))}
        </div>
      );
    }

    case 'chat-float': {
      const msg = getProp('message', '💬 Une question ?');
      return (
        <div className="fixed bottom-3 right-3 flex items-center gap-1.5 bg-white text-gray-800 text-[10px] font-extrabold py-1.5 px-3 rounded-full shadow-2xl border border-gray-100 animate-bounce cursor-pointer z-40">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span style={{ color: primary }}>{msg}</span>
        </div>
      );
    }

    default:
      return null;
  }
}

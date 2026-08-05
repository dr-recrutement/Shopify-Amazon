import React, { useState } from 'react';
import {
  Search, ShoppingBag, User, Star, Check, Mail, Phone, MapPin,
  Facebook, Instagram, Twitter, Clock, ArrowRight, Lock,
  ShieldCheck, AlertCircle, MessageCircle, Plus, Minus, Heart, Send
} from 'lucide-react';

export type SiteType = 'landing' | 'ecommerce' | 'business' | 'marketplace';
export type ThemePreset = 'universal' | 'luxury' | 'african' | 'editorial';

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
  { type: 'header', label: 'En-tête (Header)', icon: '☰' },
  { type: 'hero', label: 'Bannière (Hero)', icon: '✦' },
  { type: 'product-grid', label: 'Grille produits', icon: '▦' },
  { type: 'category-grid', label: 'Grille catégories', icon: '▤' },
  { type: 'countdown', label: 'Compte à rebours', icon: '⏱' },
  { type: 'filters-list', label: 'Filtres + liste', icon: '⇕' },
  { type: 'product-detail', label: 'Fiche produit', icon: '⬚' },
  { type: 'payments', label: 'Paiements acceptés', icon: '💳' },
  { type: 'testimonials', label: 'Témoignages clients', icon: '★' },
  { type: 'about', label: 'Histoire (À propos)', icon: 'ℹ' },
  { type: 'newsletter', label: 'Newsletter', icon: '✉' },
  { type: 'faq', label: 'Foire Aux Questions', icon: '?' },
  { type: 'footer', label: 'Pied de page (Footer)', icon: '▭' },
  { type: 'social-bar', label: 'Barre de réseaux', icon: '◎' },
  { type: 'chat-float', label: 'Chat support', icon: '💬' },
];

export const THEME_PRESETS: Record<ThemePreset, { label: string; desc: string; colors: ThemeConfig['colors']; fonts: ThemeConfig['fonts'] }> = {
  universal: {
    label: 'Universel', desc: 'Design moderne et polyvalent', colors: { primary: '#F2632C', secondary: '#1e293b', accent: '#F59E0B', background: '#FFFFFF', text: '#111114' }, fonts: { heading: 'Montserrat', body: 'Inter' },
  },
  luxury: {
    label: 'Luxe', desc: 'Élégant, premium, haut de gamme', colors: { primary: '#B07C2D', secondary: '#111827', accent: '#D4AF37', background: '#FCF7ED', text: '#111827' }, fonts: { heading: 'Cormorant Garamond', body: 'Inter' },
  },
  african: {
    label: 'African Vibrant', desc: 'Couleurs dynamiques orientées commerce pan-africain', colors: { primary: '#EF6B2A', secondary: '#0F766E', accent: '#F59E0B', background: '#FFF9F2', text: '#14213D' }, fonts: { heading: 'Montserrat', body: 'Inter' },
  },
  editorial: {
    label: 'Éditorial', desc: 'Style magazine, très propre et épuré', colors: { primary: '#1F2937', secondary: '#A16207', accent: '#D97706', background: '#F8FAFC', text: '#111827' }, fonts: { heading: 'Playfair Display', body: 'Inter' },
  },
};

export const FONT_OPTIONS = ['Inter', 'Montserrat', 'Playfair Display', 'Cormorant Garamond', 'Poppins', 'Manrope'];

export function getPresetColors(preset: ThemePreset): ThemeConfig['colors'] {
  return THEME_PRESETS[preset].colors;
}

function getSpacingClass(spacing: ThemeConfig['spacing']) {
  if (spacing === 'compact') return 'px-4 py-6 md:px-6 md:py-8';
  if (spacing === 'spacious') return 'px-8 py-16 md:px-12 md:py-24';
  return 'px-6 py-10 md:px-8 md:py-16';
}

export function defaultThemeForType(siteType: SiteType): ThemeConfig {
  const preset: ThemePreset = siteType === 'landing' ? 'luxury' : siteType === 'ecommerce' ? 'african' : siteType === 'business' ? 'editorial' : 'universal';
  const presetConfig = THEME_PRESETS[preset];
  const colors = presetConfig.colors;
  const fonts = presetConfig.fonts;

  // Let's populate sections with highly rich defaults
  const sections: ThemeSection[] = [];

  // Header Default Props
  const headerSection: ThemeSection = {
    id: 'header-1',
    type: 'header',
    visible: true,
    props: {
      logoText: 'Ma Superbe Boutique',
      logoUrl: '',
      nav: ['Accueil', 'Nouveautés', 'Collections', 'À Propos', 'FAQ', 'Contact'],
      showSearch: true,
      showCart: true,
      announcementText: '✨ LIVRAISON GRATUITE dès 35 000 FCFA avec Orange Money et Wave ! ✨',
      showAnnouncement: true,
    }
  };

  // Hero Default Props
  const heroSection: ThemeSection = {
    id: 'hero-1',
    type: 'hero',
    visible: true,
    props: {
      title: 'L’Élégance de la Mode Africaine',
      subtitle: 'Découvrez notre collection exclusive de robes en Wax Royal faites à la main par des couturiers locaux de renom.',
      cta: 'Acheter Maintenant',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1200',
      align: 'center',
      overlayOpacity: '50',
      textColor: '#ffffff',
    }
  };

  // Category Grid Default Props
  const categoryGridSection: ThemeSection = {
    id: 'categories-1',
    type: 'category-grid',
    visible: true,
    props: {
      title: 'Nos Collections Inspirantes',
      columns: 4,
      categories: [
        { name: 'Créations Wax', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=300' },
        { name: 'Accessoires Cuir', image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=300' },
        { name: 'Pagne Traditionnel', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300' },
        { name: 'Bijoux Dorés', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=300' },
      ]
    }
  };

  // Countdown Default Props
  const countdownSection: ThemeSection = {
    id: 'countdown-1',
    type: 'countdown',
    visible: true,
    props: {
      title: 'Vente Flash Exclusive ! ⚡',
      promoText: 'Profitez de -25% de réduction immédiate sur tous nos sacs en cuir faits main.',
      endDate: '2026-12-31',
      bgColor: '#EF6B2A',
      textColor: '#ffffff',
    }
  };

  // Product Grid Default Props
  const productGridSection: ThemeSection = {
    id: 'products-1',
    type: 'product-grid',
    visible: true,
    props: {
      title: 'Nos Best-Sellers du Moment',
      subtitle: 'Les créations les plus prisées de notre communauté.',
      columns: 4,
      limit: 4,
      products: [
        { name: 'Robe Wax Traditionnelle', price: 15000, oldPrice: 18000, image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=300', rating: 5 },
        { name: 'Sac en Cuir Artisanal', price: 25000, oldPrice: 30000, image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=300', rating: 4 },
        { name: 'Boucles d’oreilles Dorées', price: 8000, oldPrice: 0, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=300', rating: 5 },
        { name: 'Collier Perles Multicolore', price: 12000, oldPrice: 15000, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=300', rating: 4 },
      ]
    }
  };

  // Product Detail Default Props
  const productDetailSection: ThemeSection = {
    id: 'product-detail-1',
    type: 'product-detail',
    visible: true,
    props: {
      title: 'Ensemble Wax Royal Premium',
      price: 35000,
      oldPrice: 45000,
      description: 'Cet ensemble traditionnel en pagne de cire premium est conçu pour offrir un style distingué et un confort royal absolu. Idéal pour les célébrations, les réceptions et les tenues de prestige au quotidien.',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600',
      rating: 5,
      reviewsCount: 42,
      currency: 'FCFA',
      variants: ['Taille S', 'Taille M', 'Taille L', 'Taille XL'],
    }
  };

  // Testimonials Default Props
  const testimonialsSection: ThemeSection = {
    id: 'testimonials-1',
    type: 'testimonials',
    visible: true,
    props: {
      title: 'Témoignages de nos Clients Satisfaits',
      list: [
        { name: 'Aïcha Diallo', comment: 'Qualité de couture impeccable ! La robe tombe parfaitement et le tissu ne décolore pas au lavage. Livraison rapide en 48h à Abidjan.', rating: 5, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
        { name: 'Kwame Mensah', comment: 'Le sac à dos en cuir est robuste et élégant. Parfait pour aller au bureau. Je recommande chaudement cet artisanat de premier choix !', rating: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
        { name: 'Fatou Bensouda', comment: 'Excellent support client. J’avais un doute sur ma taille et on m’a conseillée en direct via WhatsApp. Très satisfaite de mon achat.', rating: 5, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150' },
      ]
    }
  };

  // About Default Props
  const aboutSection: ThemeSection = {
    id: 'about-1',
    type: 'about',
    visible: true,
    props: {
      title: 'Notre Vision de l’Artisanat Local',
      badge: 'HISTOIRE & VALEURS',
      content: 'Chaque création vendue sur notre boutique est le fruit d’un travail acharné réalisé par des coopératives de femmes et des maîtres artisans couturiers en Afrique de l’Ouest. Nous garantissons une rémunération juste, éthique et équitable tout en préservant des techniques ancestrales de tissage et de teinture.',
      image: 'https://images.unsplash.com/photo-1488459716781-31852582fe9d?auto=format&fit=crop&q=80&w=600',
      alignImage: 'right',
    }
  };

  // FAQ Default Props
  const faqSection: ThemeSection = {
    id: 'faq-1',
    type: 'faq',
    visible: true,
    props: {
      title: 'Questions Fréquentes (FAQ)',
      list: [
        { q: 'Quels sont les modes de livraison disponibles ?', a: 'Nous livrons à domicile par livreur express à Abidjan, Dakar, Lomé, Cotonou (24-48h) et par DHL à l’international (3-5 jours).' },
        { q: 'Puis-je payer en plusieurs fois ou à la livraison ?', a: 'Le paiement à la livraison est disponible uniquement dans nos villes partenaires principales. Pour les autres, nous proposons Orange Money, Wave, MTN MoMo et cartes bancaires.' },
        { q: 'Comment retourner un article non adapté ?', a: 'Vous disposez de 14 jours après réception pour demander un échange ou un remboursement complet. Les articles doivent être retournés non portés et dans leur emballage.' },
      ]
    }
  };

  // Payments Default Props
  const paymentsSection: ThemeSection = {
    id: 'payments-1',
    type: 'payments',
    visible: true,
    props: {
      title: 'Passerelles de Paiements Sécurisées et Compatibles',
      list: ['Orange Money', 'Wave', 'MTN MoMo', 'Flutterwave', 'Paystack', 'Visa', 'Mastercard'],
    }
  };

  // Newsletter Default Props
  const newsletterSection: ThemeSection = {
    id: 'newsletter-1',
    type: 'newsletter',
    visible: true,
    props: {
      title: 'Rejoignez le Club Privé',
      subtitle: 'Inscrivez-vous pour recevoir nos lancements de nouvelles collections de tissus, nos ventes secrètes et bénéficiez de -10% sur votre commande.',
      placeholder: 'Entrez votre adresse email',
      buttonText: 'S’abonner gratuitement',
      successMsg: '🎉 Félicitations ! Votre code promo de -10% a été envoyé à votre adresse email.',
    }
  };

  // Footer Default Props
  const footerSection: ThemeSection = {
    id: 'footer-1',
    type: 'footer',
    visible: true,
    props: {
      logoText: 'Ma Superbe Boutique',
      description: 'L’excellence du fait-main africain livré directement à votre porte.',
      copyright: '© 2026 Ma Superbe Boutique. Tous droits réservés.',
    }
  };

  // Filters List Default Props
  const filtersListSection: ThemeSection = {
    id: 'filters-1',
    type: 'filters-list',
    visible: true,
    props: {
      title: 'Filtrer les Créations',
      filters: ['Toutes les tailles', 'Par Prix croissant', 'Par Couleur', 'Matières 100% Coton'],
    }
  };

  // Social Bar Default Props
  const socialBarSection: ThemeSection = {
    id: 'social-1',
    type: 'social-bar',
    visible: true,
    props: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com',
    }
  };

  // Chat Float Default Props
  const chatFloatSection: ThemeSection = {
    id: 'chat-1',
    type: 'chat-float',
    visible: true,
    props: {
      agentName: 'Awa - Service Client',
      welcomeMessage: 'Bonjour ! Comment puis-je vous aider aujourd’hui ? Je réponds en moins de 5 minutes.',
      phoneNumber: '+2250700000000',
    }
  };

  if (siteType === 'landing') {
    return {
      siteType, preset, colors, fonts, spacing: 'comfortable', isPublished: false,
      sections: [
        headerSection,
        heroSection,
        countdownSection,
        testimonialsSection,
        paymentsSection,
        newsletterSection,
        footerSection,
      ],
    };
  }

  if (siteType === 'ecommerce') {
    return {
      siteType, preset, colors, fonts, spacing: 'comfortable', isPublished: false,
      sections: [
        headerSection,
        heroSection,
        categoryGridSection,
        countdownSection,
        productGridSection,
        productDetailSection,
        testimonialsSection,
        paymentsSection,
        newsletterSection,
        footerSection,
        socialBarSection,
        chatFloatSection,
      ],
    };
  }

  if (siteType === 'business') {
    return {
      siteType, preset, colors, fonts, spacing: 'spacious', isPublished: false,
      sections: [
        headerSection,
        heroSection,
        aboutSection,
        testimonialsSection,
        newsletterSection,
        footerSection,
      ],
    };
  }

  // Marketplace Default
  return {
    siteType, preset, colors, fonts, spacing: 'comfortable', isPublished: false,
    sections: [
      headerSection,
      heroSection,
      categoryGridSection,
      countdownSection,
      productGridSection,
      testimonialsSection,
      paymentsSection,
      footerSection,
      socialBarSection,
      chatFloatSection,
    ],
  };
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS WITH PROPER REACT STATES FOR INTERACTION & REAL RENDERING
// ---------------------------------------------------------------------------

function HeaderSection({ props, colors, fonts }: { props: any; colors: any; fonts: any }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoText = props.logoText || 'Ma Boutique';
  const navItems = props.nav || ['Accueil', 'Boutique', 'À propos', 'Contact'];

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Announcement Bar */}
      {props.showAnnouncement && (
        <div className="text-center py-1.5 px-4 text-xs font-semibold animate-pulse tracking-wide" style={{ backgroundColor: colors.accent, color: '#FFFFFF' }}>
          {props.announcementText || '✨ Promo exceptionnelle en cours ✨'}
        </div>
      )}

      {/* Main Header */}
      <header className="border-b transition-colors duration-200" style={{ backgroundColor: colors.background, borderColor: `${colors.text}15`, color: colors.text }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            {props.logoUrl ? (
              <img src={props.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
            ) : (
              <div className="text-lg font-black tracking-wider uppercase flex items-center gap-1" style={{ fontFamily: fonts.heading, color: colors.primary }}>
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                <span>{logoText}</span>
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wider uppercase">
            {navItems.map((item: string) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:opacity-80 transition-opacity" style={{ color: colors.text }}>
                {item}
              </a>
            ))}
          </nav>

          {/* Icons Area */}
          <div className="flex items-center gap-3">
            {props.showSearch && (
              <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                <Search className="w-4 h-4" />
              </button>
            )}
            <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors relative">
              <User className="w-4 h-4" />
            </button>
            {props.showCart && (
              <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors relative">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-bounce" style={{ backgroundColor: colors.primary }}>
                  2
                </span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-1.5 hover:bg-black/5 rounded-full" onClick={(e) => { e.stopPropagation(); setMobileOpen(!mobileOpen); }}>
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-2 text-sm font-semibold border-gray-100 shadow-lg">
            {navItems.map((item: string) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block py-1 hover:text-orange-500" onClick={() => setMobileOpen(false)}>
                {item}
              </a>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

function HeroSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const alignClass = props.align === 'left' ? 'text-left items-start' : props.align === 'right' ? 'text-right items-end' : 'text-center items-center';
  const overlayOpacity = Number(props.overlayOpacity || 50) / 100;
  const imageSrc = props.image || 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1200';

  return (
    <div
      className={`relative min-h-[420px] flex items-center justify-center ${spacingClass} text-white overflow-hidden bg-cover bg-center transition-all duration-300`}
      style={{ backgroundImage: `url(${imageSrc})` }}
    >
      {/* Visual Overlay */}
      <div className="absolute inset-0 bg-black transition-opacity" style={{ opacity: overlayOpacity }} />

      {/* Content */}
      <div className={`relative z-10 max-w-3xl flex flex-col ${alignClass} px-4`}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.25em] font-black bg-white/10 backdrop-blur-md border border-white/20 mb-4 animate-pulse">
          ⚡ EXCLUSIVITÉ BOUTIQUE
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: fonts.heading, color: props.textColor || '#ffffff' }}>
          {props.title || 'Bannière Principale'}
        </h2>
        <p className="mt-4 text-sm md:text-base opacity-90 max-w-xl leading-relaxed" style={{ fontFamily: fonts.body, color: props.textColor || '#ffffff' }}>
          {props.subtitle || 'Ajoutez une superbe description pour vos articles en vedette.'}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all text-white" style={{ backgroundColor: colors.primary }}>
            {props.cta || 'Découvrir'}
          </button>
          <button className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/25">
            En savoir plus
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductGridSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const headingStyle = { fontFamily: fonts.heading, color: colors.text };
  const products = props.products || [];
  const cols = Math.min(props.columns || 4, 4);

  const colClasses =
    cols === 1 ? 'grid-cols-1' :
    cols === 2 ? 'grid-cols-2' :
    cols === 3 ? 'grid-cols-2 sm:grid-cols-3' :
    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background }}>
      <div className="text-center mb-8 max-w-lg mx-auto">
        <h3 className="text-2xl font-extrabold" style={headingStyle}>{props.title || 'Produits Vedettes'}</h3>
        {props.subtitle && <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: fonts.body }}>{props.subtitle}</p>}
        <div className="w-12 h-1 mx-auto mt-3 rounded-full" style={{ backgroundColor: colors.primary }} />
      </div>

      <div className={`grid gap-4 md:gap-6 ${colClasses}`}>
        {products.map((p: any, i: number) => (
          <div key={i} className="group rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full" style={{ borderColor: `${colors.text}10`, backgroundColor: colors.background }}>

            {/* Image Wrap */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              {p.oldPrice > p.price && (
                <span className="absolute top-3 left-3 text-[10px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce" style={{ backgroundColor: colors.primary }}>
                  PROMO
                </span>
              )}
              <button className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full text-gray-700 shadow-sm transition-colors">
                <Heart className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-0.5 mb-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className={`w-3 h-3 fill-current ${idx < (p.rating || 5) ? '' : 'opacity-30'}`} />
                  ))}
                  <span className="text-[10px] text-gray-400 font-medium ml-1">(5.0)</span>
                </div>

                <h4 className="font-bold text-xs md:text-sm line-clamp-2" style={{ color: colors.text, fontFamily: fonts.heading }}>
                  {p.name}
                </h4>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-xs md:text-sm font-black" style={{ color: colors.primary }}>
                    {(p.price || 10000).toLocaleString('fr-FR')} FCFA
                  </span>
                  {p.oldPrice > 0 && (
                    <span className="text-[10px] text-gray-400 line-through ml-1.5">
                      {p.oldPrice.toLocaleString('fr-FR')} FCFA
                    </span>
                  )}
                </div>
                <button className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: colors.primary }}>
                  Acheter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryGridSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const headingStyle = { fontFamily: fonts.heading, color: colors.text };
  const categories = props.categories || [];
  const cols = Math.min(props.columns || 4, 4);

  const colClasses =
    cols === 2 ? 'grid-cols-2' :
    cols === 3 ? 'grid-cols-3' :
    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background }}>
      <h3 className="text-center text-xl font-extrabold mb-6" style={headingStyle}>
        {props.title || 'Parcourir les catégories'}
      </h3>
      <div className={`grid gap-4 ${colClasses}`}>
        {categories.map((c: any, i: number) => (
          <div key={i} className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300">
            <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="font-extrabold text-xs tracking-wider uppercase" style={{ fontFamily: fonts.heading }}>{c.name}</p>
              <span className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5 group-hover:underline">
                Voir la collection <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountdownSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const bgColor = props.bgColor || colors.primary;
  const textColor = props.textColor || '#ffffff';

  return (
    <div className={`text-center py-10 px-6 rounded-2xl mx-4 my-2 transition-all`} style={{ backgroundColor: bgColor, color: textColor, fontFamily: fonts.body }}>
      <div className="max-w-xl mx-auto space-y-4">
        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/15 backdrop-blur-md">
          🔥 OFFRE À DURÉE TRÈS LIMITÉE
        </span>
        <h3 className="text-xl md:text-3xl font-black leading-tight" style={{ fontFamily: fonts.heading }}>
          {props.title || 'Vente flash !'}
        </h3>
        <p className="text-xs md:text-sm opacity-90 max-w-md mx-auto">
          {props.promoText || 'Les stocks s’épuisent rapidement. Ne ratez pas votre chance !'}
        </p>

        {/* Counter UI */}
        <div className="flex justify-center items-center gap-3 md:gap-4 py-2">
          {[
            { v: '02', l: 'Jours' },
            { v: '14', l: 'Heures' },
            { v: '32', l: 'Min' },
            { v: '45', l: 'Sec' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-lg md:text-xl font-black bg-white/20 backdrop-blur-md shadow-sm">
                {item.v}
              </div>
              <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1.5 font-bold">
                {item.l}
              </span>
            </div>
          ))}
        </div>

        {/* Action button */}
        <button className="mt-4 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-white text-gray-950 shadow-md hover:scale-105 active:scale-95 transition-transform">
          Obtenir mon code promo
        </button>
      </div>
    </div>
  );
}

function FiltersListSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const filters = props.filters || ['Tout', 'Nouveautés', 'Prix'];
  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body }}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full md:w-1/4 space-y-4">
          <h4 className="font-extrabold text-sm tracking-wider uppercase border-b pb-2" style={{ color: colors.text, fontFamily: fonts.heading }}>
            {props.title || 'Filtres'}
          </h4>
          <div className="flex flex-wrap md:flex-col gap-2">
            {filters.map((f: string) => (
              <button key={f} className="text-left px-3 py-2 bg-black/5 hover:bg-black/10 rounded-lg text-xs font-bold transition-colors w-fit md:w-full" style={{ color: colors.text }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Mock Listing */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-black/5 p-3 flex flex-col justify-between">
              <div className="aspect-[4/5] rounded-lg bg-gray-100 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-gray-300" />
              </div>
              <div className="mt-3">
                <div className="h-3 rounded bg-gray-200 w-3/4 mb-1.5" />
                <div className="h-2 rounded bg-gray-100 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductDetailSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(props.variants?.[1] || 'M');

  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body, color: colors.text }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Left: Beautiful Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50 border border-black/5 shadow-sm">
          <img src={props.image || 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600'} alt="Détail" className="w-full h-full object-cover" />
          <span className="absolute top-4 left-4 text-[10px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest bg-emerald-500 shadow-sm animate-pulse">
            EN STOCK • ARTISANAL
          </span>
        </div>

        {/* Right: Custom Shopify-like form details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-1 text-amber-500 mb-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className="w-3.5 h-3.5 fill-current" />
              ))}
              <span className="text-xs text-gray-400 font-bold ml-1">({props.reviewsCount || 24} avis vérifiés)</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ fontFamily: fonts.heading }}>
              {props.title || 'Fiche Produit Premium'}
            </h2>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black" style={{ color: colors.primary }}>
              {(props.price || 15000).toLocaleString('fr-FR')} FCFA
            </span>
            {props.oldPrice > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {props.oldPrice.toLocaleString('fr-FR')} FCFA
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-gray-600 leading-relaxed border-y py-4 border-black/5">
            {props.description || 'Voici une superbe description détaillée pour votre produit phare.'}
          </p>

          {/* Variants */}
          {props.variants && props.variants.length > 0 && (
            <div className="space-y-2">
              <span className="block text-[11px] font-black uppercase tracking-wider text-gray-500">Option : {selectedVariant}</span>
              <div className="flex flex-wrap gap-2">
                {props.variants.map((v: string) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 border text-xs font-bold rounded-lg transition-all ${selectedVariant === v ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-500' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="flex items-center border border-gray-300 rounded-lg max-w-[120px] self-start">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2 hover:bg-gray-100"><Minus className="w-3.5 h-3.5" /></button>
              <span className="flex-1 text-center font-bold text-sm w-8">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="p-2 hover:bg-gray-100"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <button className="flex-1 py-3 px-6 rounded-lg text-xs font-black uppercase tracking-wider text-white shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2" style={{ backgroundColor: colors.primary }}>
              <ShoppingBag className="w-4 h-4" /> Ajouter au Panier
            </button>
          </div>

          {/* Secure Badges */}
          <div className="bg-slate-50 border border-black/5 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" /> Paiement Sécurisé avec Orange Money, Wave et MoMo
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
              <Lock className="w-4 h-4 text-gray-400" /> Vos informations bancaires sont 100% cryptées.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentsSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const list = props.list || ['Orange Money', 'Wave', 'MTN MoMo', 'Visa', 'Mastercard'];
  return (
    <div className={`text-center py-8 border-y px-4`} style={{ backgroundColor: colors.background, fontFamily: fonts.body, borderColor: `${colors.text}10` }}>
      <span className="block text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase mb-4">
        {props.title || 'Moyens de paiement acceptés'}
      </span>
      <div className="flex flex-wrap justify-center items-center gap-3">
        {list.map((p: string) => (
          <span key={p} className="text-xs font-extrabold tracking-wide px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 shadow-sm border border-slate-200">
            💳 {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function TestimonialsSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const headingStyle = { fontFamily: fonts.heading, color: colors.text };
  const list = props.list || [];

  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background }}>
      <h3 className="text-center text-2xl font-extrabold mb-8" style={headingStyle}>
        {props.title || 'Ce que pensent nos clients'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {list.map((t: any, i: number) => (
          <div key={i} className="p-6 rounded-2xl border flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-all duration-300" style={{ borderColor: `${colors.text}10` }}>
            <div className="space-y-3">
              <div className="flex gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, starIdx) => (
                  <Star key={starIdx} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed italic" style={{ fontFamily: fonts.body }}>
                "{t.comment}"
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-orange-500/20" />
              <div>
                <p className="text-xs font-extrabold" style={{ color: colors.text, fontFamily: fonts.heading }}>{t.name}</p>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Acheteur Vérifié
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const imageSrc = props.image || 'https://images.unsplash.com/photo-1488459716781-31852582fe9d?auto=format&fit=crop&q=80&w=600';
  const headingStyle = { fontFamily: fonts.heading, color: colors.text };
  const imageOnRight = props.alignImage === 'right';

  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body, color: colors.text }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Text Area */}
        <div className={`space-y-4 ${imageOnRight ? 'order-1' : 'order-1 md:order-2'}`}>
          {props.badge && (
            <span className="inline-block text-[10px] font-black tracking-[0.2em] text-orange-600 uppercase">
              {props.badge}
            </span>
          )}
          <h3 className="text-2xl md:text-3xl font-extrabold" style={headingStyle}>
            {props.title || 'Notre Histoire'}
          </h3>
          <div className="w-12 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed pt-2">
            {props.content || 'Voici l’histoire qui se cache derrière nos collections artisanales...'}
          </p>
        </div>

        {/* Image Area */}
        <div className={`aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden border border-black/5 shadow-md ${imageOnRight ? 'order-2' : 'order-2 md:order-1'}`}>
          <img src={imageSrc} alt="Story" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function NewsletterSection({ props, colors, fonts }: { props: any; colors: any; fonts: any }) {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSuccess(true);
      setEmail('');
    }
  };

  return (
    <div className="mx-4 my-6 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-lg" style={{ backgroundColor: `${colors.accent}12`, border: `1px solid ${colors.accent}30`, fontFamily: fonts.body }}>
      <div className="max-w-xl mx-auto space-y-4 relative z-10">
        <Mail className="w-10 h-10 mx-auto text-orange-600 animate-bounce" />
        <h3 className="text-xl md:text-2xl font-extrabold" style={{ fontFamily: fonts.heading, color: colors.text }}>
          {props.title || 'Inscrivez-vous à notre lettre'}
        </h3>
        <p className="text-xs md:text-sm text-gray-600 max-w-sm mx-auto">
          {props.subtitle || 'Soyez informé de nos nouveautés de couture locale.'}
        </p>

        {success ? (
          <div className="p-4 bg-emerald-50 rounded-2xl text-xs md:text-sm text-emerald-700 font-bold border border-emerald-200">
            {props.successMsg || 'Merci pour votre inscription !'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={props.placeholder || 'votre-email@adresse.com'}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
            <button type="submit" className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all" style={{ backgroundColor: colors.primary }}>
              {props.buttonText || 'S’abonner'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function FaqSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const headingStyle = { fontFamily: fonts.heading, color: colors.text };
  const list = props.list || [];

  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body }}>
      <div className="max-w-2xl mx-auto">
        <h3 className="text-center text-2xl font-extrabold mb-6" style={headingStyle}>
          {props.title || 'Foire Aux Questions'}
        </h3>
        <div className="space-y-3">
          {list.map((item: any, idx: number) => {
            const isOpen = activeIndex === idx;
            return (
              <div key={idx} className="border rounded-xl overflow-hidden transition-all duration-200" style={{ borderColor: `${colors.text}10`, backgroundColor: colors.background }}>
                <button
                  onClick={() => setActiveIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 font-bold text-xs md:text-sm flex items-center justify-between hover:bg-slate-50"
                  style={{ color: colors.text }}
                >
                  <span>{item.q}</span>
                  <span className="text-lg font-black">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs md:text-sm text-gray-500 border-t border-gray-50 leading-relaxed bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FooterSection({ props, colors, fonts }: { props: any; colors: any; fonts: any }) {
  return (
    <footer className="bg-slate-900 text-white p-8 md:p-12 text-xs" style={{ fontFamily: fonts.body }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-white/10 pb-8">
        <div>
          <h4 className="font-extrabold text-sm tracking-wider uppercase mb-3" style={{ fontFamily: fonts.heading, color: colors.accent }}>
            {props.logoText || 'Ma Boutique'}
          </h4>
          <p className="text-gray-400 leading-relaxed max-w-xs">{props.description || 'Votre partenaire mode locale.'}</p>
        </div>
        <div className="space-y-2">
          <h5 className="font-bold uppercase tracking-wider mb-3">Service Client</h5>
          <div className="flex items-center gap-2 text-gray-400"><Mail className="w-3.5 h-3.5" /> support@boutique.com</div>
          <div className="flex items-center gap-2 text-gray-400"><Phone className="w-3.5 h-3.5" /> +225 07 00 00 00 00</div>
        </div>
        <div>
          <h5 className="font-bold uppercase tracking-wider mb-3">Confiance & Sécurité</h5>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" /> Certifié SSL crypté
          </div>
          <p className="text-gray-500">Achetez en toute sécurité par Mobile Money.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center text-gray-500 gap-3">
        <span>{props.copyright || '© 2026 Ma Boutique. Tous droits réservés.'}</span>
        <div className="flex gap-4">
          <a href="#cgu" className="hover:underline">CGU</a>
          <a href="#privacy" className="hover:underline">Confidentialité</a>
        </div>
      </div>
    </footer>
  );
}

function SocialBarSection({ props, colors }: { props: any; colors: any }) {
  const fb = props.facebook || 'https://facebook.com';
  const ig = props.instagram || 'https://instagram.com';
  const tw = props.twitter || 'https://twitter.com';

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 space-y-2.5 z-40">
      <a href={fb} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform" style={{ backgroundColor: '#1877F2' }}>
        <Facebook className="w-4 h-4" />
      </a>
      <a href={ig} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform" style={{ backgroundColor: '#E1306C' }}>
        <Instagram className="w-4 h-4" />
      </a>
      <a href={tw} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform" style={{ backgroundColor: '#1DA1F2' }}>
        <Twitter className="w-4 h-4" />
      </a>
    </div>
  );
}

function ChatFloatSection({ props, colors, fonts }: { props: any; colors: any; fonts: any }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    { sender: 'agent', text: props.welcomeMessage || 'Bonjour ! Une question ? Posez-la moi ici.' }
  ]);

  const handleSend = () => {
    if (!msg.trim()) return;
    const nextHistory = [...chatHistory, { sender: 'user' as const, text: msg }];
    setChatHistory(nextHistory);
    setMsg('');

    // Mock agent reply
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        { sender: 'agent' as const, text: 'Merci pour votre message ! Un conseiller va vous recontacter par SMS sur votre numéro de téléphone.' }
      ]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40" style={{ fontFamily: fonts.body }}>
      {/* Floating Action Button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-transform animate-bounce"
        style={{ backgroundColor: colors.primary }}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Mini Chat Widget popup */}
      {open && (
        <div className="absolute bottom-14 right-0 w-72 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col text-xs text-gray-700 animate-slide-up">
          {/* Header */}
          <div className="p-3 text-white font-extrabold flex items-center justify-between" style={{ backgroundColor: colors.primary }}>
            <div>
              <p className="text-xs leading-none">{props.agentName || 'Support Boutique'}</p>
              <span className="text-[10px] text-green-100 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" /> En ligne
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white hover:opacity-80 text-sm">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 space-y-2 max-h-52 overflow-y-auto bg-slate-50">
            {chatHistory.map((item, i) => (
              <div key={i} className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`p-2.5 rounded-xl max-w-[80%] leading-relaxed ${item.sender === 'user' ? 'bg-orange-600 text-white font-bold' : 'bg-white text-gray-800 shadow-sm'}`}
                  style={item.sender === 'user' ? { backgroundColor: colors.primary } : {}}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input field */}
          <div className="p-2 border-t border-gray-100 flex gap-1.5 bg-white">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Écrivez un message..."
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none"
            />
            <button onClick={handleSend} className="p-2 rounded-lg text-white" style={{ backgroundColor: colors.primary }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN RENDER ROUTER
// ---------------------------------------------------------------------------
export function renderSection(section: ThemeSection, theme: ThemeConfig): React.ReactNode {
  const colors = theme.colors;
  const fonts = theme.fonts;
  const spacingClass = getSpacingClass(theme.spacing);

  switch (section.type) {
    case 'header':
      return <HeaderSection props={section.props} colors={colors} fonts={fonts} />;
    case 'hero':
      return <HeroSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'product-grid':
      return <ProductGridSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'category-grid':
      return <CategoryGridSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'countdown':
      return <CountdownSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'filters-list':
      return <FiltersListSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'product-detail':
      return <ProductDetailSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'payments':
      return <PaymentsSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'testimonials':
      return <TestimonialsSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'about':
      return <AboutSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'newsletter':
      return <NewsletterSection props={section.props} colors={colors} fonts={fonts} />;
    case 'faq':
      return <FaqSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'footer':
      return <FooterSection props={section.props} colors={colors} fonts={fonts} />;
    case 'social-bar':
      return <SocialBarSection props={section.props} colors={colors} />;
    case 'chat-float':
      return <ChatFloatSection props={section.props} colors={colors} fonts={fonts} />;
    default:
      return null;
  }
}

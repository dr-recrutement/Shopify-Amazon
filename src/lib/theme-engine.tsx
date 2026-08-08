import React, { useState, useRef, useEffect } from 'react';
import {
  Search, ShoppingBag, User, Star, Check, Mail, Phone, MapPin,
  Facebook, Instagram, Twitter, Clock, ArrowRight, Lock,
  ShieldCheck, AlertCircle, MessageCircle, Plus, Minus, Heart, Send,
  ChevronLeft, ChevronRight, Play, Quote, Megaphone, X
} from 'lucide-react';
import { getShopProfile } from './app-state';

export function formatCurrency(amount: number, currency: string): string {
  const symbolMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'XOF': 'CFA',
    'XAF': 'FCFA',
    'GHS': 'GH₵',
    'NGN': '₦',
    'KES': 'KSh',
    'ZAR': 'R'
  };
  const symbol = symbolMap[currency] || currency;
  if (['USD', 'EUR', 'GBP'].includes(currency)) {
    const converted = amount > 1000 ? Math.round(amount / 600) : amount;
    return `${symbol}${converted.toLocaleString('en-US')}`;
  }
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

/**
 * Generates a deterministic CSS gradient placeholder instead of an external image URL.
 * No external links — purely visual via inline gradient + pattern.
 */
const PLACEHOLDER_GRADIENTS = [
  ['#008060', '#004C3F'],
  ['#1A1A1A', '#3A3A3A'],
  ['#5CC190', '#008060'],
  ['#C4A86A', '#8B6F3F'],
  ['#2B2B2B', '#1A1A1A'],
  ['#36A18A', '#005A45'],
  ['#9ED8C5', '#5CC190'],
  ['#6BC4A8', '#008060'],
  ['#1B1B1B', '#2B2B2B'],
  ['#004C3F', '#00352B'],
];
export function placeholderGradient(seed: string | number): string {
  const s = String(seed);
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const [a, b] = PLACEHOLDER_GRADIENTS[hash % PLACEHOLDER_GRADIENTS.length];
  const angle = (hash % 4) * 45;
  return `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)`;
}

/** Inline SVG data URI placeholder — no external requests at all. */
export function placeholderImg(seed: string | number, w = 300, h = 300): string {
  const grad = placeholderGradient(seed);
  // CSS gradients can't be used in <img src>, so we return empty string and
  // callers should use gradientStyle() instead. This keeps the API explicit.
  void w; void h;
  return '';
}

/** Returns a React style object for gradient placeholders. */
export function gradientStyle(seed: string | number): React.CSSProperties {
  return { background: placeholderGradient(seed) };
}

/** Checks whether a string is a real fetchable image URL (http/data/asset path). */
export function isRealImage(src: string | undefined | null): boolean {
  if (!src) return false;
  return src.startsWith('http') || src.startsWith('data:') || src.startsWith('/assets') || src.startsWith('/');
}

/**
 * MediaBox — renders <img> when a real URL is provided, otherwise a gradient
 * placeholder div. Eliminates ALL external image dependencies.
 */
export function MediaBox({ src, alt, seed, className, style }: {
  src?: string; alt?: string; seed: string | number; className?: string; style?: React.CSSProperties;
}) {
  if (isRealImage(src)) {
    return <img src={src as string} alt={alt || ''} className={className} style={style} />;
  }
  return <div className={className} style={{ ...gradientStyle(seed), ...style }} aria-label={alt} />;
}

export type SiteType = 'landing' | 'ecommerce' | 'business' | 'marketplace';
export type ThemePreset = 'universal' | 'luxury' | 'african' | 'editorial' | 'ecommerce-pro' | 'vitrine' | 'business-corp' | 'services' | 'creative-magazine';

export type SectionType =
  | 'header' | 'announcement-bar' | 'footer'
  | 'hero' | 'image-banner' | 'slideshow' | 'video'
  | 'product-grid' | 'featured-collection' | 'category-grid' | 'collection-list'
  | 'multicolumn' | 'image-with-text' | 'rich-text'
  | 'countdown' | 'filters-list' | 'product-detail' | 'payments'
  | 'testimonials' | 'about'
  | 'social-bar' | 'chat-float'
  | 'newsletter' | 'email-signup' | 'faq' | 'collapsible-content' | 'contact-form';

export interface ThemeSection {
  id: string;
  type: SectionType;
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
  // Layout variant drives visually distinct templates (header style, card style,
  // radius, dividers) — mirrors how Shopify themes differ beyond colour.
  layoutVariant: LayoutVariant;
  sections: ThemeSection[];
  isPublished: boolean;
}

// Each variant produces a genuinely different design, not just a colour swap.
export type LayoutVariant =
  | 'ecommerce-pro'   // E-commerce: full store, product grid, cart, promos, badges
  | 'vitrine'         // Site vitrine: portfolio, team, testimonials, airy
  | 'business-corp'   // Business/Corporate: agency/startup, bold, trust-led
  | 'services'        // Services: consultants/freelance, booking, contact-led
  | 'creative-magazine' // Créatif/Magazine/Blog: editorial, asymmetric, typographic
  // Legacy variants kept for backward compatibility with stored themes
  | 'dawn' | 'refresh' | 'spotlight' | 'crave' | 'sense'
  | 'craft' | 'colorblock' | 'studio' | 'publisher' | 'taste';

export const LAYOUT_VARIANTS: { id: LayoutVariant; label: string; desc: string; radius: string; headerStyle: string; cardStyle: string }[] = [
  // The 5 professional templates — each a complete, distinct theme
  { id: 'ecommerce-pro', label: 'E-commerce Pro', desc: 'Boutique en ligne moderne — produits, catégories, panier, promotions', radius: 'rounded-xl', headerStyle: 'ecommerce', cardStyle: 'product' },
  { id: 'vitrine', label: 'Site Vitrine', desc: 'Présentation entreprise — portfolio, équipe, témoignages, contact', radius: 'rounded-2xl', headerStyle: 'centered', cardStyle: 'rounded' },
  { id: 'business-corp', label: 'Business Corporate', desc: 'Solution pro — agences, startups, sociétés, services B2B', radius: 'rounded-lg', headerStyle: 'block', cardStyle: 'shadowed' },
  { id: 'services', label: 'Services Pro', desc: 'Consultants, freelances, cabinets — réservation et contact', radius: 'rounded-md', headerStyle: 'warm', cardStyle: 'bordered' },
  { id: 'creative-magazine', label: 'Créatif / Magazine', desc: 'Éditorial, médias, blogs, créateurs — design typographique', radius: 'rounded-sm', headerStyle: 'editorial', cardStyle: 'text-led' },
  // Legacy variants (kept for backward compat)
  { id: 'dawn', label: 'Dawn', desc: 'Minimal, bannière plein cadre, cartes nettes', radius: 'rounded-none', headerStyle: 'thin', cardStyle: 'flat' },
  { id: 'refresh', label: 'Refresh', desc: 'Éditorial centré, cartes arrondies', radius: 'rounded-2xl', headerStyle: 'centered', cardStyle: 'rounded' },
  { id: 'spotlight', label: 'Spotlight', desc: 'Grandes images, nav overlay', radius: 'rounded-lg', headerStyle: 'overlay', cardStyle: 'shadowed' },
  { id: 'crave', label: 'Crave', desc: 'Vibrant arrondi, badges ludiques', radius: 'rounded-full', headerStyle: 'pill', cardStyle: 'rounded-bold' },
  { id: 'sense', label: 'Sense', desc: 'Pastel doux, radius gentle', radius: 'rounded-xl', headerStyle: 'airy', cardStyle: 'soft' },
  { id: 'craft', label: 'Craft', desc: 'Artisanal chaleureux, bordures texturées', radius: 'rounded-md', headerStyle: 'warm', cardStyle: 'bordered' },
  { id: 'colorblock', label: 'Colorblock', desc: 'Blocs audacieux, contraste fort', radius: 'rounded-none', headerStyle: 'block', cardStyle: 'hard' },
  { id: 'studio', label: 'Studio', desc: 'Créatif asymétrique, accent or', radius: 'rounded-lg', headerStyle: 'asymmetric', cardStyle: 'mixed' },
  { id: 'publisher', label: 'Publisher', desc: 'Colonnes éditoriales, serif dense', radius: 'rounded-sm', headerStyle: 'editorial', cardStyle: 'text-led' },
  { id: 'taste', label: 'Taste', desc: 'Typographique, grille serrée monochrome', radius: 'rounded-none', headerStyle: 'minimal', cardStyle: 'tight' },
];

export const SITE_TYPES: { id: SiteType; label: string; desc: string }[] = [
  { id: 'landing', label: 'Landing page', desc: 'Page de présentation produit/service unique, sans catalogue complet' },
  { id: 'ecommerce', label: 'E-commerce complet', desc: 'Catalogue multi-produits, panier, checkout, filtres, fiches produit' },
  { id: 'business', label: 'Site vitrine', desc: 'À propos + services + contact, vente limitée ou aucune' },
  { id: 'marketplace', label: 'Marketplace basique', desc: 'Plusieurs vendeurs/catégories sur une même boutique' },
];

export const SECTION_LIBRARY: { type: SectionType; label: string; icon: string; group: string }[] = [
  // Layout / structure
  { type: 'header', label: 'En-tête (Header)', icon: '☰', group: 'Structure' },
  { type: 'announcement-bar', label: 'Barre d\'annonce', icon: '📢', group: 'Structure' },
  { type: 'footer', label: 'Pied de page (Footer)', icon: '▭', group: 'Structure' },
  // Banners & media (Shopify Dawn: image-banner, slideshow, video)
  { type: 'image-banner', label: 'Bannière image (Image banner)', icon: '🖼', group: 'Bannières' },
  { type: 'hero', label: 'Bannière Hero', icon: '✦', group: 'Bannières' },
  { type: 'slideshow', label: 'Diaporama (Slideshow)', icon: '⏵', group: 'Bannières' },
  { type: 'video', label: 'Vidéo', icon: '▶', group: 'Bannières' },
  // Collections & products (Shopify Dawn: featured-collection, collection-list)
  { type: 'featured-collection', label: 'Collection en vedette', icon: '🛍', group: 'Produits' },
  { type: 'product-grid', label: 'Grille produits', icon: '▦', group: 'Produits' },
  { type: 'collection-list', label: 'Liste de collections', icon: '▤', group: 'Produits' },
  { type: 'category-grid', label: 'Grille catégories', icon: '▦', group: 'Produits' },
  { type: 'product-detail', label: 'Fiche produit', icon: '⬚', group: 'Produits' },
  { type: 'filters-list', label: 'Filtres + liste', icon: '⇕', group: 'Produits' },
  { type: 'countdown', label: 'Compte à rebours', icon: '⏱', group: 'Produits' },
  { type: 'payments', label: 'Paiements acceptés', icon: '💳', group: 'Produits' },
  // Content blocks (Shopify Dawn: multicolumn, image-with-text, rich-text, collapsible-content)
  { type: 'multicolumn', label: 'Multi-colonnes', icon: '⫴', group: 'Contenu' },
  { type: 'image-with-text', label: 'Image avec texte', icon: '◧', group: 'Contenu' },
  { type: 'rich-text', label: 'Texte enrichi', icon: '¶', group: 'Contenu' },
  { type: 'testimonials', label: 'Témoignages clients', icon: '★', group: 'Contenu' },
  { type: 'about', label: 'Histoire (À propos)', icon: 'ℹ', group: 'Contenu' },
  // Engagement & conversion
  { type: 'collapsible-content', label: 'Contenu repliable', icon: '∭', group: 'Engagement' },
  { type: 'faq', label: 'Foire Aux Questions', icon: '?', group: 'Engagement' },
  { type: 'newsletter', label: 'Newsletter', icon: '✉', group: 'Engagement' },
  { type: 'email-signup', label: 'Inscription email', icon: '📨', group: 'Engagement' },
  { type: 'contact-form', label: 'Formulaire de contact', icon: '✎', group: 'Engagement' },
  { type: 'social-bar', label: 'Barre de réseaux', icon: '◎', group: 'Engagement' },
  { type: 'chat-float', label: 'Chat support', icon: '💬', group: 'Engagement' },
];

export const THEME_PRESETS: Record<ThemePreset, { label: string; desc: string; colors: ThemeConfig['colors']; fonts: ThemeConfig['fonts']; layoutVariant: LayoutVariant }> = {
  universal: {
    label: 'Dawn', desc: 'Thème de référence Shopify OS 2.0 — minimal, rapide, polyvalent',
    colors: { primary: '#008060', secondary: '#1A1A1A', accent: '#5C5C5C', background: '#FFFFFF', text: '#121212' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }, layoutVariant: 'dawn',
  },
  luxury: {
    label: 'Studio', desc: 'Élégant et créatif, pour marques de design et studios artistiques',
    colors: { primary: '#1B1B1B', secondary: '#3A3A3A', accent: '#C4A86A', background: '#FAFAFA', text: '#1B1B1B' },
    fonts: { heading: 'Playfair Display', body: 'Montserrat' }, layoutVariant: 'studio',
  },
  african: {
    label: 'Crave', desc: 'Vibrant et gourmand, pensé pour l’alimentaire et les boissons',
    colors: { primary: '#008060', secondary: '#1A1A1A', accent: '#5CC190', background: '#FBFBFB', text: '#1A1A1A' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }, layoutVariant: 'crave',
  },
  editorial: {
    label: 'Publisher', desc: 'Éditorial et riche en contenu, livres, musique et storytelling',
    colors: { primary: '#2B2B2B', secondary: '#1A1A1A', accent: '#6B6B6B', background: '#F8F6F1', text: '#1A1A1A' },
    fonts: { heading: 'Playfair Display', body: 'Lora' }, layoutVariant: 'publisher',
  },
  // The 5 professional templates — each a complete, distinct theme for a use case
  'ecommerce-pro': {
    label: 'E-commerce Pro', desc: 'Boutique en ligne moderne — produits, panier, promotions',
    colors: { primary: '#008060', secondary: '#1A1A1A', accent: '#00A878', background: '#FFFFFF', text: '#121212' },
    fonts: { heading: 'Poppins', body: 'Inter' }, layoutVariant: 'ecommerce-pro',
  },
  'vitrine': {
    label: 'Site Vitrine', desc: 'Présentation entreprise — portfolio, équipe, témoignages',
    colors: { primary: '#2563EB', secondary: '#1E293B', accent: '#60A5FA', background: '#F8FAFC', text: '#1E293B' },
    fonts: { heading: 'Manrope', body: 'DM Sans' }, layoutVariant: 'vitrine',
  },
  'business-corp': {
    label: 'Business Corporate', desc: 'Solution pro — agences, startups, sociétés B2B',
    colors: { primary: '#0F172A', secondary: '#1E293B', accent: '#3B82F6', background: '#FFFFFF', text: '#0F172A' },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' }, layoutVariant: 'business-corp',
  },
  'services': {
    label: 'Services Pro', desc: 'Consultants, freelances, cabinets — réservation et contact',
    colors: { primary: '#7C3AED', secondary: '#1F2937', accent: '#A78BFA', background: '#FAFAFA', text: '#1F2937' },
    fonts: { heading: 'Outfit', body: 'Inter' }, layoutVariant: 'services',
  },
  'creative-magazine': {
    label: 'Créatif / Magazine', desc: 'Éditorial, médias, blogs, créateurs — design typographique',
    colors: { primary: '#DC2626', secondary: '#171717', accent: '#F59E0B', background: '#FAFAF9', text: '#171717' },
    fonts: { heading: 'Playfair Display', body: 'Lora' }, layoutVariant: 'creative-magazine',
  },
};

/**
 * The 5 professional templates — exactly five, each for a distinct use case.
 * This is the canonical list shown in the theme selector: the user picks one,
 * activates it, then customizes everything via the CMS page builder.
 */
export interface TemplateProfile {
  id: ThemePreset;
  layoutVariant: LayoutVariant;
  label: string;
  useCase: string;
  description: string;
  icon: string;
  colors: ThemeConfig['colors'];
  fonts: { heading: string; body: string };
  features: string[];
}

export const TEMPLATE_PROFILES: TemplateProfile[] = [
  {
    id: 'ecommerce-pro',
    layoutVariant: 'ecommerce-pro',
    label: 'E-commerce Pro',
    useCase: 'E-commerce',
    description: 'Boutique en ligne moderne avec produits, catégories, panier, checkout et promotions.',
    icon: '🛍️',
    colors: { primary: '#008060', secondary: '#1A1A1A', accent: '#00A878', background: '#FFFFFF', text: '#121212' },
    fonts: { heading: 'Poppins', body: 'Inter' },
    features: ['Catalogue produits', 'Collections', 'Panier', 'Promotions', 'Paiements', 'Checkout'],
  },
  {
    id: 'vitrine',
    layoutVariant: 'vitrine',
    label: 'Site Vitrine',
    useCase: 'Site vitrine',
    description: 'Présentation d’entreprise, portfolio, équipe, témoignages et formulaire de contact.',
    icon: '🏢',
    colors: { primary: '#2563EB', secondary: '#1E293B', accent: '#60A5FA', background: '#F8FAFC', text: '#1E293B' },
    fonts: { heading: 'Manrope', body: 'DM Sans' },
    features: ['Portfolio', 'À propos', 'Équipe', 'Témoignages', 'Contact'],
  },
  {
    id: 'business-corp',
    layoutVariant: 'business-corp',
    label: 'Business Corporate',
    useCase: 'Business / Corporate',
    description: 'Solution professionnelle pour entreprises, agences, startups et sociétés B2B.',
    icon: '💼',
    colors: { primary: '#0F172A', secondary: '#1E293B', accent: '#3B82F6', background: '#FFFFFF', text: '#0F172A' },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },
    features: ['Services B2B', 'À propos', 'Témoignages', 'Stats', 'Contact pro'],
  },
  {
    id: 'services',
    layoutVariant: 'services',
    label: 'Services Pro',
    useCase: 'Services',
    description: 'Adapté aux consultants, freelances, cabinets et services professionnels avec réservation.',
    icon: '🤝',
    colors: { primary: '#7C3AED', secondary: '#1F2937', accent: '#A78BFA', background: '#FAFAFA', text: '#1F2937' },
    fonts: { heading: 'Outfit', body: 'Inter' },
    features: ['Prestations', 'Réservation', 'À propos', 'Témoignages', 'Contact'],
  },
  {
    id: 'creative-magazine',
    layoutVariant: 'creative-magazine',
    label: 'Créatif / Magazine',
    useCase: 'Créatif / Magazine / Blog',
    description: 'Design éditorial et créatif pour médias, créateurs, blogs et contenus riches.',
    icon: '🎨',
    colors: { primary: '#DC2626', secondary: '#171717', accent: '#F59E0B', background: '#FAFAF9', text: '#171717' },
    fonts: { heading: 'Playfair Display', body: 'Lora' },
    features: ['Articles', 'Diaporama', 'Édito', 'Catégories', 'Newsletter'],
  },
];

export function getLayoutVariant(preset: ThemePreset): LayoutVariant {
  return THEME_PRESETS[preset].layoutVariant;
}

// Returns Tailwind radius + card style classes for a layout variant, used by
// section renderers to produce visually distinct templates.
export function getVariantStyles(variant: LayoutVariant): { radius: string; cardClass: string; headerClass: string } {
  const v = LAYOUT_VARIANTS.find(l => l.id === variant) || LAYOUT_VARIANTS[0];
  const cardMap: Record<string, string> = {
    flat: 'rounded-none shadow-none border border-gray-100',
    rounded: 'rounded-2xl shadow-sm border border-gray-100',
    shadowed: 'rounded-lg shadow-lg border-0',
    'rounded-bold': 'rounded-3xl shadow-md border-2 border-gray-50',
    soft: 'rounded-xl shadow-sm border border-gray-100',
    bordered: 'rounded-md shadow-none border-2 border-gray-200',
    hard: 'rounded-none shadow-none border-0',
    mixed: 'rounded-lg shadow-md border border-gray-100',
    'text-led': 'rounded-sm shadow-none border border-gray-200',
    tight: 'rounded-none shadow-none border border-gray-100',
    product: 'rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition-shadow',
  };
  const headerMap: Record<string, string> = {
    thin: 'border-b border-gray-100 py-3',
    centered: 'justify-center text-center py-4 border-b border-gray-100',
    overlay: 'absolute top-0 left-0 right-0 z-20 bg-transparent text-white',
    pill: 'rounded-full mx-auto py-2 px-6 bg-gray-50',
    airy: 'py-6 border-b border-gray-50',
    warm: 'py-4 border-b-2 border-gray-200',
    block: 'py-3 bg-gray-900 text-white',
    asymmetric: 'py-4 border-b border-gray-100',
    editorial: 'py-5 border-b border-gray-200',
    minimal: 'py-2 border-b border-gray-100',
    ecommerce: 'border-b border-gray-100 py-3 sticky top-0 bg-white/95 backdrop-blur z-30',
  };
  return { radius: v.radius, cardClass: cardMap[v.cardStyle] || cardMap.flat, headerClass: headerMap[v.headerStyle] || headerMap.thin };
}

export const FONT_OPTIONS = [
  'Montserrat',
  'Playfair Display',
  'Cormorant Garamond',
  'Poppins',
  'Inter',
  'Manrope',
  'Roboto',
  'Open Sans',
  'Lato',
  'Oswald',
  'Merriweather',
  'Lora',
  'PT Sans',
  'Raleway',
  'Cinzel',
  'DM Sans',
  'Outfit',
  'Plus Jakarta Sans'
];

export function getPresetColors(preset: ThemePreset): ThemeConfig['colors'] {
  return THEME_PRESETS[preset].colors;
}

function getSpacingClass(spacing: ThemeConfig['spacing']) {
  if (spacing === 'compact') return 'px-4 py-6 md:px-6 md:py-8';
  if (spacing === 'spacious') return 'px-8 py-16 md:px-12 md:py-24';
  return 'px-6 py-10 md:px-8 md:py-16';
}

/**
 * Public section-arrangement generator — returns a distinct homepage section
 * list per Shopify theme variant. Each variant produces a visibly different
 * page structure (different sections, different order, different count).
 * This mirrors how real Shopify themes ship different default arrangements.
 */
export function sectionsForVariantPublic(variant: LayoutVariant, s: Record<string, ThemeSection>): ThemeSection[] {
  switch (variant) {
    // 1. E-commerce Pro — full online store: banner → collections → featured →
    //    countdown promo → product detail → trust badges → payments → newsletter
    case 'ecommerce-pro':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.collectionListSection, s.multicolumnSection, s.countdownSection,
        s.featuredCollectionSection, s.productDetailSection, s.imageWithTextSection,
        s.testimonialsSection, s.paymentsSection, s.newsletterSection,
        s.footerSection, s.socialBarSection, s.chatFloatSection,
      ];
    // 2. Site Vitrine — company showcase: banner → about → portfolio/team →
    //    multicolumn values → testimonials → contact → footer
    case 'vitrine':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.aboutSection, s.imageWithTextSection, s.multicolumnSection,
        s.richTextSection, s.testimonialsSection, s.collapsibleContentSection,
        s.contactFormSection, s.emailSignupSection, s.footerSection,
      ];
    // 3. Business / Corporate — B2B trust-led: banner → rich-text → services
    //    (multicolumn) → about → testimonials → stats → contact → footer
    case 'business-corp':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.richTextSection, s.multicolumnSection, s.imageWithTextSection,
        s.aboutSection, s.testimonialsSection, s.collapsibleContentSection,
        s.contactFormSection, s.emailSignupSection, s.footerSection,
      ];
    // 4. Services Pro — consultants/freelance: banner → services (multicolumn)
    //    → image-with-text → about → testimonials → pricing/countdown →
    //    contact/booking → footer
    case 'services':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.multicolumnSection, s.imageWithTextSection, s.aboutSection,
        s.testimonialsSection, s.countdownSection, s.collapsibleContentSection,
        s.contactFormSection, s.emailSignupSection, s.footerSection,
      ];
    // 5. Créatif / Magazine / Blog — editorial: slideshow → rich-text →
    //    image-with-text (asymmetric) → featured-collection → testimonials →
    //    collapsible → newsletter → footer
    case 'creative-magazine':
      return [
        s.announcementBarSection, s.headerSection, s.slideshowSection,
        s.richTextSection, s.imageWithTextSection, s.aboutSection,
        s.featuredCollectionSection, s.testimonialsSection,
        s.collapsibleContentSection, s.emailSignupSection, s.footerSection,
      ];
    // Legacy arrangements kept for backward compatibility
    // Dawn — minimalist, media-forward, balanced
    case 'dawn':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.multicolumnSection, s.featuredCollectionSection, s.imageWithTextSection,
        s.collapsibleContentSection, s.paymentsSection, s.emailSignupSection, s.footerSection,
      ];
    // Refresh — editorial, image-with-text overlap, testimonials focus
    case 'refresh':
      return [
        s.announcementBarSection, s.headerSection, s.imageWithTextSection,
        s.multicolumnSection, s.richTextSection, s.featuredCollectionSection,
        s.testimonialsSection, s.contactFormSection, s.emailSignupSection, s.footerSection,
      ];
    // Spotlight — sparse, image-led, fewer sections, big visuals
    case 'spotlight':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.slideshowSection, s.featuredCollectionSection, s.imageWithTextSection,
        s.collapsibleContentSection, s.footerSection,
      ];
    // Crave — vibrant, promo-heavy, countdown + collection-list + newsletter
    case 'crave':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.collectionListSection, s.countdownSection, s.featuredCollectionSection,
        s.productDetailSection, s.multicolumnSection, s.testimonialsSection,
        s.newsletterSection, s.paymentsSection, s.footerSection, s.socialBarSection,
      ];
    // Sense — soft, story-led, about + rich-text + testimonials
    case 'sense':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.richTextSection, s.aboutSection, s.imageWithTextSection,
        s.featuredCollectionSection, s.testimonialsSection, s.collapsibleContentSection,
        s.emailSignupSection, s.footerSection,
      ];
    // Craft — artisanal, product-narrative, about + product detail + collapsible
    case 'craft':
      return [
        s.announcementBarSection, s.headerSection, s.imageWithTextSection,
        s.aboutSection, s.productDetailSection, s.featuredCollectionSection,
        s.collapsibleContentSection, s.testimonialsSection, s.contactFormSection, s.footerSection,
      ];
    // Colorblock — bold blocks, collection-list + multicolumn + countdown
    case 'colorblock':
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.collectionListSection, s.multicolumnSection, s.countdownSection,
        s.featuredCollectionSection, s.imageWithTextSection, s.paymentsSection, s.footerSection,
      ];
    // Studio — asymmetric, rich-text + image-with-text + featured-collection
    case 'studio':
      return [
        s.announcementBarSection, s.headerSection, s.richTextSection,
        s.imageWithTextSection, s.featuredCollectionSection, s.productDetailSection,
        s.testimonialsSection, s.contactFormSection, s.footerSection,
      ];
    // Publisher — editorial columns, rich-text + about + collapsible
    case 'publisher':
      return [
        s.announcementBarSection, s.headerSection, s.richTextSection,
        s.aboutSection, s.featuredCollectionSection, s.collapsibleContentSection,
        s.testimonialsSection, s.contactFormSection, s.emailSignupSection, s.footerSection,
      ];
    // Taste — sleek image-forward, slideshow + featured-collection + image-with-text
    case 'taste':
      return [
        s.announcementBarSection, s.headerSection, s.slideshowSection,
        s.featuredCollectionSection, s.imageWithTextSection, s.collectionListSection,
        s.collapsibleContentSection, s.emailSignupSection, s.footerSection,
      ];
    default:
      return [
        s.announcementBarSection, s.headerSection, s.imageBannerSection,
        s.featuredCollectionSection, s.multicolumnSection, s.imageWithTextSection,
        s.collapsibleContentSection, s.footerSection,
      ];
  }
}


export function defaultThemeForType(siteType: SiteType, presetOverride?: ThemePreset): ThemeConfig {
  const preset: ThemePreset = presetOverride ?? (siteType === 'landing' ? 'luxury' : siteType === 'ecommerce' ? 'african' : siteType === 'business' ? 'editorial' : 'universal');
  const presetConfig = THEME_PRESETS[preset];
  const colors = presetConfig.colors;
  const fonts = presetConfig.fonts;
  const layoutVariant = presetConfig.layoutVariant;

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
      image: '',
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
        { name: 'Créations Wax', image: '' },
        { name: 'Accessoires Cuir', image: '' },
        { name: 'Pagne Traditionnel', image: '' },
        { name: 'Bijoux Dorés', image: '' },
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
      bgColor: '#008060',
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
        { name: 'Robe Wax Traditionnelle', price: 15000, oldPrice: 18000, image: '', rating: 5 },
        { name: 'Sac en Cuir Artisanal', price: 25000, oldPrice: 30000, image: '', rating: 4 },
        { name: 'Boucles d’oreilles Dorées', price: 8000, oldPrice: 0, image: '', rating: 5 },
        { name: 'Collier Perles Multicolore', price: 12000, oldPrice: 15000, image: '', rating: 4 },
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
      image: '',
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
        { name: 'Aïcha Diallo', comment: 'Qualité de couture impeccable ! La robe tombe parfaitement et le tissu ne décolore pas au lavage. Livraison rapide en 48h à Abidjan.', rating: 5, avatar: '' },
        { name: 'Kwame Mensah', comment: 'Le sac à dos en cuir est robuste et élégant. Parfait pour aller au bureau. Je recommande chaudement cet artisanat de premier choix !', rating: 5, avatar: '' },
        { name: 'Fatou Bensouda', comment: 'Excellent support client. J’avais un doute sur ma taille et on m’a conseillée en direct via WhatsApp. Très satisfaite de mon achat.', rating: 5, avatar: '' },
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
      image: '',
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

  // Shopify Dawn "announcement-bar" — rotating promo messages above header.
  const announcementBarSection: ThemeSection = {
    id: 'announcement-1',
    type: 'announcement-bar',
    visible: true,
    props: {
      messages: [
        '✨ Livraison gratuite dès 35 000 FCFA',
        '💳 Paiement Mobile Money accepté — Orange Money, Wave, MTN MoMo',
        '🚚 Expédition en 24-48h dans toute l’Afrique de l’Ouest',
      ],
      bgColor: colors.secondary,
      textColor: '#ffffff',
    }
  };

  // Shopify Dawn "image-banner" — full-bleed hero with overlay.
  const imageBannerSection: ThemeSection = {
    id: 'image-banner-1',
    type: 'image-banner',
    visible: true,
    props: {
      title: 'L’art de vivre africain, livré chez vous',
      subtitle: 'COLLECTION EXCLUSIVE',
      description: 'Des créations artisanales uniques, pensées par des couturiers et artisans locaux d’exception.',
      image: '',
      align: 'center',
      overlayOpacity: '35',
      height: 'medium',
      cta: 'Découvrir la collection',
      cta2: 'Notre histoire',
      textColor: '#ffffff',
    }
  };

  // Shopify Dawn "slideshow" — auto-rotating slides.
  const slideshowSection: ThemeSection = {
    id: 'slideshow-1',
    type: 'slideshow',
    visible: false,
    props: {
      overlayOpacity: '35',
      slides: [
        { title: 'Collection Printemps', subtitle: 'Nouveautés', cta: 'Découvrir', image: '' },
        { title: 'Soldes d’été', subtitle: '−30%', description: 'Profitez de réductions exclusives sur une sélection d’articles.', cta: 'J’en profite', image: '' },
        { title: 'Artisanat local', subtitle: 'Fait main', cta: 'Voir les créations', image: '' },
      ],
    }
  };

  // Shopify Dawn "multicolumn" — value props / trust badges.
  const multicolumnSection: ThemeSection = {
    id: 'multicolumn-1',
    type: 'multicolumn',
    visible: true,
    props: {
      title: 'Pourquoi nous choisir',
      subtitle: 'Une expérience d’achat pensée pour l’Afrique.',
      align: 'center',
      columns: [
        { title: 'Livraison rapide', text: 'Expédition en 24-48h dans les grandes villes africaines.', icon: '🚚' },
        { title: 'Paiement sécurisé', text: 'Orange Money, Wave, MTN MoMo et cartes bancaires.', icon: '🔒' },
        { title: 'Support 7j/7', text: 'Une équipe dédiée à votre écoute par WhatsApp et chat.', icon: '💬' },
        { title: 'Qualité garantie', text: 'Retours acceptés sous 14 jours, satisfait ou remboursé.', icon: '✅' },
      ],
    }
  };

  // Shopify Dawn "image-with-text" — brand story split block.
  const imageWithTextSection: ThemeSection = {
    id: 'iwt-1',
    type: 'image-with-text',
    visible: true,
    props: {
      badge: 'NOTRE SAVOIR-FAIRE',
      title: 'L’artisanat africain réinventé',
      text: 'Chaque pièce est le fruit d’un travail acharné réalisé par des coopératives d’artisans. Nous garantissons une rémunération juste et éthique tout en préservant les techniques ancestrales.',
      image: '',
      layout: 'image-right',
      cta: 'En savoir plus',
    }
  };

  // Shopify Dawn "rich-text" — editorial paragraph block.
  const richTextSection: ThemeSection = {
    id: 'rich-text-1',
    type: 'rich-text',
    visible: true,
    props: {
      title: 'Bienvenue dans notre univers',
      text: 'Nous croyons à une mode africaine responsable, locale et accessible. Découvrez des créations qui célèbrent le talent de nos artisans tout en soutenant l’économie locale.',
      align: 'center',
      width: 'narrow',
    }
  };

  // Shopify Dawn "collapsible-content" — FAQ-style accordions.
  const collapsibleContentSection: ThemeSection = {
    id: 'collapsible-1',
    type: 'collapsible-content',
    visible: true,
    props: {
      title: 'Informations utiles',
      rows: [
        { heading: 'Livraison & retours', content: 'Livraison en 24-48h dans les grandes villes. Retours acceptés sous 14 jours après réception.' },
        { heading: 'Modes de paiement', content: 'Orange Money, Wave, MTN MoMo, Flutterwave, Paystack et cartes Visa/Mastercard.' },
        { heading: 'Suivi de commande', content: 'Un lien de suivi vous est envoyé par SMS dès l’expédition de votre commande.' },
      ],
    }
  };

  // Shopify Dawn "contact-form".
  const contactFormSection: ThemeSection = {
    id: 'contact-1',
    type: 'contact-form',
    visible: true,
    props: {
      title: 'Contactez-nous',
      subtitle: 'Une question ? Écrivez-nous, nous répondons sous 24h.',
    }
  };

  // Shopify Dawn "email-signup".
  const emailSignupSection: ThemeSection = {
    id: 'email-signup-1',
    type: 'email-signup',
    visible: true,
    props: {
      title: 'Rejoignez notre communauté',
      subtitle: 'Recevez nos offres exclusives et nouveautés directement dans votre boîte mail.',
    }
  };

  // Shopify Dawn "featured-collection" (alias of product-grid, Dawn naming).
  const featuredCollectionSection: ThemeSection = { ...productGridSection, id: 'featured-collection-1', type: 'featured-collection' };

  // Shopify Dawn "collection-list" (alias of category-grid, Dawn naming).
  const collectionListSection: ThemeSection = { ...categoryGridSection, id: 'collection-list-1', type: 'collection-list' };

  /**
   * Distinct homepage section arrangements per Shopify theme — this is exactly
   * how real Shopify themes differ (same code, different default arrangement +
   * container color scheme + corner radius). Each variant produces a visibly
   * different page structure.
   */
  function sectionsForVariant(variant: LayoutVariant): ThemeSection[] {
    return sectionsForVariantPublic(variant, {
      announcementBarSection, headerSection, imageBannerSection, heroSection,
      imageWithTextSection, multicolumnSection, richTextSection, aboutSection,
      featuredCollectionSection, collectionListSection, countdownSection,
      productDetailSection, testimonialsSection, collapsibleContentSection,
      contactFormSection, emailSignupSection, newsletterSection, paymentsSection,
      footerSection, socialBarSection, chatFloatSection, slideshowSection,
    });
  }

  // Use the variant-specific section arrangement for a genuinely distinct template
  const variantSections = sectionsForVariant(layoutVariant);
  return {
    siteType, preset, colors, fonts, spacing: siteType === 'business' ? 'spacious' : 'comfortable', layoutVariant, isPublished: false,
    sections: variantSections,
  };
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS WITH PROPER REACT STATES FOR INTERACTION & REAL RENDERING
// ---------------------------------------------------------------------------

function HeaderSection({ props, colors, fonts, headerClass }: { props: any; colors: any; fonts: any; headerClass?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoText = props.logoText || 'Ma Boutique';
  const navItems = props.nav || ['Accueil', 'Boutique', 'À propos', 'Contact'];
  const profile = getShopProfile();

  const announcement = props.announcementText || `✨ LIVRAISON GRATUITE dès ${formatCurrency(35000, profile.currency)} avec nos paiements connectés ! ✨`;
  const hClass = headerClass || 'border-b border-gray-100 py-3';

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Announcement Bar */}
      {props.showAnnouncement && (
        <div className="text-center py-1.5 px-4 text-xs font-semibold animate-pulse tracking-wide" style={{ backgroundColor: colors.accent, color: '#FFFFFF' }}>
          {announcement}
        </div>
      )}

      {/* Main Header */}
      <header className={`transition-colors duration-200 ${hClass}`} style={{ backgroundColor: colors.background, borderColor: `${colors.text}15`, color: colors.text }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            {props.logoUrl ? (
              <MediaBox src={props.logoUrl} alt="Logo" seed="header-logo" className="h-8 max-w-[120px] object-contain" />
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
              <a key={item} href={`#${item.toLowerCase()}`} className="block py-1 hover:text-brand-500" onClick={() => setMobileOpen(false)}>
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
  const imageSrc = props.image || '';

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

function ProductGridSection({ props, colors, fonts, spacingClass, theme, onAddToCart }: { props: any; colors: any; fonts: any; spacingClass: string; theme: ThemeConfig; onAddToCart?: (p: any) => void }) {
  const headingStyle = { fontFamily: fonts.heading, color: colors.text };
  const products = props.products || [];
  const cols = Math.min(props.columns || 4, 4);

  const colClasses =
    cols === 1 ? 'grid-cols-1' :
    cols === 2 ? 'grid-cols-2' :
    cols === 3 ? 'grid-cols-2 sm:grid-cols-3' :
    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  const isLuxury = theme.preset === 'luxury';
  const isEditorial = theme.preset === 'editorial';
  const isAfrican = theme.preset === 'african';

  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background }}>
      <div className={`mb-8 max-w-lg mx-auto ${isEditorial ? 'text-left ml-0' : 'text-center'}`}>
        <h3 className={`text-2xl font-extrabold ${isLuxury ? 'tracking-widest uppercase' : ''}`} style={headingStyle}>
          {props.title || 'Produits Vedettes'}
        </h3>
        {props.subtitle && <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: fonts.body }}>{props.subtitle}</p>}
        {!isEditorial && <div className="w-12 h-1 mx-auto mt-3 rounded-full animate-pulse" style={{ backgroundColor: colors.primary }} />}
      </div>

      <div className={`grid gap-4 md:gap-6 ${colClasses}`}>
        {products.map((p: any, i: number) => {
          // Dynamic templates per preset
          if (isLuxury) {
            return (
              <div key={i} className="group flex flex-col h-full bg-white relative overflow-hidden transition-all duration-300 border-b-2 hover:shadow-2xl p-2" style={{ borderColor: `${colors.primary}40` }}>
                <div className="relative aspect-square overflow-hidden bg-gray-50 border border-gray-100">
                  <MediaBox src={p.image} alt={p.name} seed={`prod-lux-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <button className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-colors">
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between text-center mt-2">
                  <div>
                    <h4 className="font-semibold text-xs tracking-wider uppercase line-clamp-1" style={{ color: colors.text, fontFamily: fonts.heading }}>{p.name}</h4>
                    <p className="text-[10px] text-amber-600 font-bold mt-1">★ EXCLUSIF</p>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-dashed border-gray-100 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold tracking-widest" style={{ color: colors.primary }}>
                      {formatCurrency(p.price || 10000, getShopProfile().currency)}
                    </span>
                    <button onClick={() => onAddToCart?.(p)} className="w-full py-1 text-[9px] font-black uppercase tracking-widest border text-gray-900 border-gray-900 hover:bg-gray-900 hover:text-white transition-all">
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (isEditorial) {
            return (
              <div key={i} className="group flex flex-col h-full bg-transparent overflow-hidden transition-all duration-300">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                  <MediaBox src={p.image} alt={p.name} seed={`prod-edit-${i}`} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300" />
                </div>
                <div className="py-3 flex-1 flex flex-col justify-between text-left">
                  <div>
                    <h4 className="font-extrabold text-sm line-clamp-2 leading-tight" style={{ color: colors.text, fontFamily: fonts.heading }}>{p.name}</h4>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-sm font-black" style={{ color: colors.text }}>
                      {formatCurrency(p.price || 10000, getShopProfile().currency)}
                    </span>
                    <span className="text-[10px] underline cursor-pointer font-bold hover:text-brand-600" onClick={() => onAddToCart?.(p)}>Acheter</span>
                  </div>
                </div>
              </div>
            );
          }

          // Default / African vibrants with shadow & badges
          return (
            <div key={i} className={`group rounded-2xl border overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-white relative ${isAfrican ? 'border-brand-100 shadow-sm' : 'border-gray-100'}`}>
              {/* Image Wrap */}
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                                  <MediaBox src={p.image} alt={p.name} seed={`prod-def-${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {p.oldPrice > p.price && (
                  <span className="absolute top-3 left-3 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse" style={{ backgroundColor: colors.primary }}>
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
                  <div className="flex items-center gap-0.5 mb-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="w-3 h-3 fill-current" />
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
                      {formatCurrency(p.price || 10000, getShopProfile().currency)}
                    </span>
                    {p.oldPrice > 0 && (
                      <span className="text-[10px] text-gray-400 line-through ml-1.5">
                        {formatCurrency(p.oldPrice, getShopProfile().currency)}
                      </span>
                    )}
                  </div>
                  <button onClick={() => onAddToCart?.(p)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: colors.primary }}>
                    Acheter
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
            <MediaBox src={c.image} alt={c.name} seed={`cat-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
          <MediaBox src={props.image} alt="Détail" seed="pdetail" className="w-full h-full object-cover" />
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
              {formatCurrency(props.price || 15000, getShopProfile().currency)}
            </span>
            {props.oldPrice > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(props.oldPrice, getShopProfile().currency)}
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
                    className={`px-3 py-1.5 border text-xs font-bold rounded-lg transition-all ${selectedVariant === v ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
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
              <MediaBox src={t.avatar} alt={t.name} seed={`avatar-${i}`} className="w-10 h-10 rounded-full object-cover border border-brand-500/20" />
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
  const imageSrc = props.image || '';
  const headingStyle = { fontFamily: fonts.heading, color: colors.text };
  const imageOnRight = props.alignImage === 'right';

  return (
    <div className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body, color: colors.text }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Text Area */}
        <div className={`space-y-4 ${imageOnRight ? 'order-1' : 'order-1 md:order-2'}`}>
          {props.badge && (
            <span className="inline-block text-[10px] font-black tracking-[0.2em] text-brand-600 uppercase">
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
          <MediaBox src={imageSrc} alt="Story" seed="hero-story" className="w-full h-full object-cover" />
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
        <Mail className="w-10 h-10 mx-auto text-brand-600 animate-bounce" />
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
              className="flex-1 px-4 py-2.5 rounded-xl text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
                  className={`p-2.5 rounded-xl max-w-[80%] leading-relaxed ${item.sender === 'user' ? 'bg-brand-600 text-white font-bold' : 'bg-white text-gray-800 shadow-sm'}`}
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
// SHOPIFY DAWN (ONLINE STORE 2.0) SECTIONS
// Sections aligned with Shopify's reference theme: image-banner, slideshow,
// multicolumn, image-with-text, rich-text, collapsible-content, contact-form,
// featured-collection, collection-list, email-signup, video, announcement-bar.
// ---------------------------------------------------------------------------

// Shopify "announcement-bar" group — sticky rotating messages above the header.
function AnnouncementBarSection({ props, colors, fonts }: { props: any; colors: any; fonts: any }) {
  const messages: string[] = Array.isArray(props.messages) && props.messages.length
    ? props.messages
    : ['Livraison gratuite dès 35 000 FCFA', 'Paiement Mobile Money accepté', 'Nouvelle collection disponible'];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [messages.length]);
  const bgColor = props.bgColor || colors.secondary;
  const txtColor = props.textColor || '#ffffff';
  return (
    <div
      className="text-center py-2 px-4 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
      style={{ backgroundColor: bgColor, color: txtColor, fontFamily: fonts.body }}
    >
      <Megaphone className="w-3.5 h-3.5 shrink-0" />
      <span key={idx} className="animate-fade-in-up">{messages[idx]}</span>
    </div>
  );
}

// Shopify "image-banner" section — single full-bleed image with overlay content.
function ImageBannerSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const overlay = Number(props.overlayOpacity ?? 40) / 100;
  const height = props.height || 'medium';
  const heightClass = height === 'small' ? 'min-h-[320px]' : height === 'large' ? 'min-h-[560px]' : 'min-h-[440px]';
  const align = props.align === 'left' ? 'items-start text-left' : props.align === 'right' ? 'items-end text-right' : 'items-center text-center';
  const img = props.image || '';
  return (
    <section className={`relative flex ${heightClass} ${align} justify-center overflow-hidden`} style={{ fontFamily: fonts.body }}>
      <MediaBox src={img} alt={props.title || 'Banner'} seed="image-banner" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ backgroundColor: '#000', opacity: overlay }} />
      <div className={`relative z-10 max-w-2xl px-6 py-12 flex flex-col ${align} ${spacingClass}`}>
        {props.subtitle && (
          <span className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: colors.accent }}>
            {props.subtitle}
          </span>
        )}
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: fonts.heading, color: props.textColor || '#fff' }}>
          {props.title || 'Bannière image'}
        </h2>
        {props.description && (
          <p className="mt-4 max-w-xl text-sm md:text-base opacity-90" style={{ color: props.textColor || '#fff' }}>
            {props.description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {props.cta && (
            <button className="px-6 py-3 text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-transform text-white" style={{ backgroundColor: colors.primary }}>
              {props.cta}
            </button>
          )}
          {props.cta2 && (
            <button className="px-6 py-3 text-xs font-black uppercase tracking-wider border border-white/60 text-white hover:bg-white/10 transition-colors">
              {props.cta2}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Shopify "slideshow" section — auto-rotating slides with manual controls.
function SlideshowSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const slides: any[] = Array.isArray(props.slides) && props.slides.length ? props.slides : [
    { title: 'Collection Printemps', subtitle: 'Nouveautés', cta: 'Découvrir', image: '' },
    { title: 'Soldes d\'été', subtitle: '-30%', cta: 'J\'en profite', image: '' },
  ];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const next = () => setActive(a => (a + 1) % total);
  const prev = () => setActive(a => (a - 1 + total) % total);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, total]);
  const slide = slides[active];
  const overlay = Number(props.overlayOpacity ?? 35) / 100;
  const align = slide.align === 'left' ? 'items-start text-left' : slide.align === 'right' ? 'items-end text-right' : 'items-center text-center';
  return (
    <section
      className={`relative ${spacingClass} overflow-hidden min-h-[440px] flex ${align} justify-center`}
      style={{ fontFamily: fonts.body }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt={s.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0" style={{ backgroundColor: '#000', opacity: overlay }} />
      <div className={`relative z-10 max-w-2xl px-6 py-12 flex flex-col ${align}`}>
        {slide.subtitle && (
          <span className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: colors.accent }}>{slide.subtitle}</span>
        )}
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: fonts.heading, color: slide.textColor || '#fff' }}>{slide.title}</h2>
        <p className="mt-3 text-sm opacity-90" style={{ color: slide.textColor || '#fff' }}>{slide.description}</p>
        {slide.cta && (
          <button className="mt-6 px-6 py-3 text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-transform text-white" style={{ backgroundColor: colors.primary }}>{slide.cta}</button>
        )}
      </div>
      {total > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-white hover:bg-white/50 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-white hover:bg-white/50 transition-colors"><ChevronRight className="w-5 h-5" /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// Shopify "multicolumn" section — repeatable column blocks with image + text.
function MulticolumnSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const columns: any[] = Array.isArray(props.columns) && props.columns.length ? props.columns : [
    { title: 'Livraison rapide', text: 'Expédition en 24-48h partout en Afrique.', icon: '🚚' },
    { title: 'Paiement sécurisé', text: 'Orange Money, Wave, cartes bancaires.', icon: '🔒' },
    { title: 'Support 7j/7', text: 'Une équipe dédiée à votre écoute.', icon: '💬' },
  ];
  const align = props.align || 'center';
  const grid = columns.length <= 2 ? 'md:grid-cols-2' : columns.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';
  return (
    <section className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body }}>
      <div className={`max-w-5xl mx-auto ${align === 'left' ? 'text-left' : 'text-center'}`}>
        {props.title && <h3 className="text-2xl font-extrabold mb-2" style={{ fontFamily: fonts.heading, color: colors.text }}>{props.title}</h3>}
        {props.subtitle && <p className="text-sm text-gray-500 mb-8 max-w-xl mx-auto">{props.subtitle}</p>}
      </div>
      <div className={`grid gap-6 ${grid} ${align === 'center' ? 'text-center' : ''}`}>
        {columns.map((c, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: `${colors.primary}15` }}>
              {c.image ? <MediaBox src={c.image} alt={c.title} seed={`coll-${i}`} className="w-full h-full rounded-full object-cover" /> : c.icon || '✦'}
            </div>
            <h4 className="font-extrabold text-sm mb-1" style={{ fontFamily: fonts.heading, color: colors.text }}>{c.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[220px]">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Shopify "image-with-text" section — two-column image + rich text.
function ImageWithTextSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const imageRight = props.layout === 'image-right';
  const img = props.image || '';
  return (
    <section className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body, color: colors.text }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className={`aspect-[4/3] rounded-xl overflow-hidden ${imageRight ? 'md:order-2' : ''}`}>
          <MediaBox src={img} alt={props.title || 'Image'} seed="img-text" className="w-full h-full object-cover" />
        </div>
        <div className={`space-y-4 ${imageRight ? 'md:order-1' : ''}`}>
          {props.badge && <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: colors.primary }}>{props.badge}</span>}
          <h3 className="text-2xl md:text-3xl font-extrabold" style={{ fontFamily: fonts.heading }}>{props.title || 'Texte avec image'}</h3>
          <div className="w-12 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
          <p className="text-sm text-gray-600 leading-relaxed">{props.text || props.description || 'Décrivez ici votre marque, vos valeurs ou votre produit phare.'}</p>
          {props.cta && <button className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white" style={{ backgroundColor: colors.primary }}>{props.cta}</button>}
        </div>
      </div>
    </section>
  );
}

// Shopify "rich-text" section — heading + paragraph + optional button, full width.
function RichTextSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const width = props.width === 'narrow' ? 'max-w-2xl' : 'max-w-4xl';
  const align = props.align === 'left' ? 'text-left' : props.align === 'right' ? 'text-right' : 'text-center';
  return (
    <section className={`${spacingClass} ${align}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body, color: colors.text }}>
      <div className={`${width} mx-auto space-y-4`}>
        {props.title && <h3 className="text-2xl md:text-3xl font-extrabold" style={{ fontFamily: fonts.heading }}>{props.title}</h3>}
        {props.text && <p className="text-sm md:text-base text-gray-600 leading-relaxed">{props.text}</p>}
        {props.cta && <button className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white" style={{ backgroundColor: colors.primary }}>{props.cta}</button>}
      </div>
    </section>
  );
}

// Shopify "video" section — hosted/embedded video with overlay poster.
function VideoSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const [playing, setPlaying] = useState(false);
  const poster = props.poster || '';
  return (
    <section className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body }}>
      <div className="max-w-5xl mx-auto">
        {props.title && <h3 className="text-2xl font-extrabold text-center mb-6" style={{ fontFamily: fonts.heading, color: colors.text }}>{props.title}</h3>}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black group cursor-pointer" onClick={() => setPlaying(true)}>
          {playing && props.videoUrl ? (
            <iframe src={props.videoUrl} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={props.title || 'Video'} />
          ) : (
            <>
              <MediaBox src={poster} alt="Video poster" seed="video-poster" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 text-gray-900 fill-current ml-1" />
                </span>
              </div>
            </>
          )}
        </div>
        {props.description && <p className="text-center text-sm text-gray-500 mt-3">{props.description}</p>}
      </div>
    </section>
  );
}

// Shopify "collapsible-content" section — accordions grouped by row.
function CollapsibleContentSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const rows: any[] = Array.isArray(props.rows) && props.rows.length ? props.rows : [
    { heading: 'Livraison & retours', content: 'Livraison en 24-48h dans les grandes villes. Retours sous 14 jours.' },
    { heading: 'Modes de paiement', content: 'Orange Money, Wave, MTN MoMo, cartes Visa/Mastercard.' },
  ];
  return (
    <section className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body }}>
      <div className="max-w-2xl mx-auto">
        {props.title && <h3 className="text-center text-2xl font-extrabold mb-6" style={{ fontFamily: fonts.heading, color: colors.text }}>{props.title}</h3>}
        <div className="space-y-2">
          {rows.map((r, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: `${colors.text}15` }}>
                <button onClick={() => setOpenIdx(isOpen ? null : i)} className="w-full flex items-center justify-between p-4 text-left text-sm font-bold" style={{ color: colors.text }}>
                  <span>{r.heading}</span>
                  <span className="text-lg font-black">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <div className="p-4 pt-0 text-sm text-gray-500 leading-relaxed">{r.content}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Shopify "contact-form" section — name/email/phone/message form.
function ContactFormSection({ props, colors, fonts, spacingClass }: { props: any; colors: any; fonts: any; spacingClass: string }) {
  const [sent, setSent] = useState(false);
  return (
    <section className={`${spacingClass}`} style={{ backgroundColor: colors.background, fontFamily: fonts.body }}>
      <div className="max-w-xl mx-auto">
        {props.title && <h3 className="text-center text-2xl font-extrabold mb-2" style={{ fontFamily: fonts.heading, color: colors.text }}>{props.title}</h3>}
        {props.subtitle && <p className="text-center text-sm text-gray-500 mb-6">{props.subtitle}</p>}
        {sent ? (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold text-center">
            ✓ Merci ! Votre message a bien été envoyé. Notre équipe vous répond sous 24h.
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Nom complet" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2" style={{ borderColor: colors.primary }} />
              <input required type="email" placeholder="Adresse email" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2" style={{ borderColor: colors.primary }} />
            </div>
            <input placeholder="Téléphone (optionnel)" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2" style={{ borderColor: colors.primary }} />
            <textarea required placeholder="Votre message" rows={4} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2" style={{ borderColor: colors.primary }} />
            <button type="submit" className="w-full py-3 text-xs font-black uppercase tracking-wider text-white" style={{ backgroundColor: colors.primary }}>Envoyer le message</button>
          </form>
        )}
      </div>
    </section>
  );
}

// Shopify "featured-collection" — same product grid, Dawn-named. Reuses ProductGridSection.
function FeaturedCollectionSection(props: any) {
  return ProductGridSection(props);
}

// Shopify "collection-list" — same category grid, Dawn-named. Reuses CategoryGridSection.
function CollectionListSection(props: any) {
  return CategoryGridSection(props);
}

// Shopify "email-signup" — Dawn footer email capture, more minimal than newsletter.
function EmailSignupSection({ props, colors, fonts }: { props: any; colors: any; fonts: any }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div className="py-8 px-4 text-center" style={{ backgroundColor: colors.secondary, color: '#fff', fontFamily: fonts.body }}>
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-extrabold mb-1" style={{ fontFamily: fonts.heading }}>{props.title || 'Inscrivez-vous à notre lettre d\'information'}</h3>
        <p className="text-xs opacity-80 mb-4">{props.subtitle || 'Recevez nos offres et nouveautés.'}</p>
        {done ? (
          <p className="text-xs font-bold text-emerald-300">✓ Merci pour votre inscription !</p>
        ) : (
          <form onSubmit={e => { e.preventDefault(); if (email.trim()) setDone(true); }} className="flex gap-2 max-w-sm mx-auto">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="flex-1 px-3 py-2 rounded-lg text-xs text-gray-900 bg-white" />
            <button type="submit" className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: colors.primary }}>S'inscrire</button>
          </form>
        )}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// MAIN RENDER ROUTER
// ---------------------------------------------------------------------------
export function renderSection(section: ThemeSection, theme: ThemeConfig, callbacks?: { onAddToCart?: (p: any) => void }): React.ReactNode {
  const colors = theme.colors;
  const fonts = theme.fonts;
  const spacingClass = getSpacingClass(theme.spacing);
  const variantStyles = getVariantStyles(theme.layoutVariant);

  switch (section.type) {
    case 'header':
      return <HeaderSection props={section.props} colors={colors} fonts={fonts} headerClass={variantStyles.headerClass} />;
    case 'announcement-bar':
      return <AnnouncementBarSection props={section.props} colors={colors} fonts={fonts} />;
    case 'hero':
      return <HeroSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'image-banner':
      return <ImageBannerSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'slideshow':
      return <SlideshowSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'video':
      return <VideoSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'product-grid':
      return <ProductGridSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} theme={theme} onAddToCart={callbacks?.onAddToCart} />;
    case 'featured-collection':
      return <FeaturedCollectionSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} theme={theme} onAddToCart={callbacks?.onAddToCart} />;
    case 'category-grid':
      return <CategoryGridSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'collection-list':
      return <CollectionListSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'multicolumn':
      return <MulticolumnSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'image-with-text':
      return <ImageWithTextSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'rich-text':
      return <RichTextSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
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
    case 'email-signup':
      return <EmailSignupSection props={section.props} colors={colors} fonts={fonts} />;
    case 'faq':
      return <FaqSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'collapsible-content':
      return <CollapsibleContentSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
    case 'contact-form':
      return <ContactFormSection props={section.props} colors={colors} fonts={fonts} spacingClass={spacingClass} />;
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

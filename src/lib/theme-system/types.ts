/**
 * ============================================================================
 * THEME CONFIG SCHEMA
 * ----------------------------------------------------------------------------
 * Schéma universel piloté par JSON, inspiré de Shopify Sections / Astra /
 * Elementor. Un `ThemeConfig` complet décrit :
 *   - `settings`  : le design system global (couleurs, typographies, forme)
 *   - `sections`  : une pile ordonnée de blocs de contenu réordonnables,
 *                   chacun activable/désactivable et stylable individuellement
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// Design tokens
// ----------------------------------------------------------------------------

export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ContainerWidth = 'boxed' | 'full';
export type Alignment = 'left' | 'center' | 'right';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  cardBackground: string;
  border: string;
}

export interface ThemeTypography {
  headingFont: string; // ex: "'Montserrat', sans-serif"
  bodyFont: string; // ex: "'Plus Jakarta Sans', sans-serif"
}

export interface ThemeSettings {
  colors: ThemeColors;
  typography: ThemeTypography;
  borderRadius: BorderRadius;
  containerWidth: ContainerWidth;
}

// ----------------------------------------------------------------------------
// Section (bloc générique)
// ----------------------------------------------------------------------------

/** Styles appliqués au conteneur de section, indépendamment de son contenu. */
export interface SectionStyles {
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string; // override ponctuel, sinon hérite de settings.colors.background
  textColor?: string; // override ponctuel, sinon hérite de settings.colors.text
  alignment?: Alignment;
}

export type SectionType =
  | 'header'
  | 'hero'
  | 'features'
  | 'productGrid'
  | 'socialProof'
  | 'testimonials'
  | 'cta'
  | 'footer';

// ----------------------------------------------------------------------------
// Content payloads — un type de `content` par type de section
// ----------------------------------------------------------------------------

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderContent {
  logoType: 'text' | 'image';
  logoText?: string;
  logoImageUrl?: string;
  navLinks: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  showCart?: boolean;
  cartCount?: number;
}

export type HeroLayout = 'split' | 'centered' | 'full-bg';

export interface HeroButton {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
}

export interface HeroContent {
  layout: HeroLayout;
  eyebrow?: string;
  title: string;
  subtitle: string;
  buttons: HeroButton[];
  reassuranceBadge?: string;
  imageUrl?: string; // utilisé par 'split' et 'full-bg'
}

export interface FeatureItem {
  icon: string; // nom d'icône lucide-react, ex: "Zap"
  title: string;
  description: string;
}

export interface FeaturesContent {
  title?: string;
  subtitle?: string;
  columns: 2 | 3 | 4;
  items: FeatureItem[];
}

export interface ProductItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  badge?: 'promo' | 'nouveau' | null;
}

export interface ProductGridContent {
  title?: string;
  subtitle?: string;
  columns: 2 | 3 | 4;
  products: ProductItem[];
}

export interface StatItem {
  value: string;
  label: string;
}

export interface LogoItem {
  name: string;
  imageUrl: string;
}

export interface SocialProofContent {
  title?: string;
  stats: StatItem[];
  logos: LogoItem[];
}

export interface TestimonialItem {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  authorImageUrl?: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface TestimonialsContent {
  title?: string;
  subtitle?: string;
  items: TestimonialItem[];
}

export interface CTAContent {
  title: string;
  subtitle?: string;
  buttonLabel: string;
  buttonHref: string;
  backgroundStyle?: 'solid' | 'gradient';
}

export interface FooterLinkColumn {
  title: string;
  links: NavLink[];
}

export interface SocialLink {
  platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok';
  href: string;
}

export interface FooterContent {
  logoText: string;
  description?: string;
  columns: FooterLinkColumn[]; // 3 colonnes attendues
  socialLinks: SocialLink[];
  copyright: string;
}

/** Union discriminée reliant `type` de section à la forme de son `content`. */
export type SectionContentMap = {
  header: HeaderContent;
  hero: HeroContent;
  features: FeaturesContent;
  productGrid: ProductGridContent;
  socialProof: SocialProofContent;
  testimonials: TestimonialsContent;
  cta: CTAContent;
  footer: FooterContent;
};

/**
 * Section réordonnable et union discriminée sur `type`. Construite via un
 * mapped type distribué sur `SectionType`, ce qui permet à TypeScript de
 * narrower automatiquement `content` dans un `switch (section.type)`
 * (utilisé par `TemplateRenderer`) — exactement le comportement recherché
 * pour un schéma à la Shopify Sections.
 */
export type Section = {
  [K in SectionType]: {
    id: string; // identifiant unique, ex: "hero-1"
    type: K;
    active: boolean;
    styles: SectionStyles;
    content: SectionContentMap[K];
  };
}[SectionType];

/** Alias pratique pour référencer la forme exacte d'une section d'un type donné. */
export type TypedSection<T extends SectionType> = Extract<Section, { type: T }>;

// ----------------------------------------------------------------------------
// ThemeConfig — racine du schéma
// ----------------------------------------------------------------------------

export interface ThemeConfig {
  settings: ThemeSettings;
  sections: Section[];
}

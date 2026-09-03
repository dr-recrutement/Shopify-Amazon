import React, { useMemo } from 'react';
import { Section, ThemeConfig } from './types';
import { ThemeTokensProvider } from './ThemeContext';
import {
  HeaderSection,
  HeroSection,
  FeaturesSection,
  ProductGridSection,
  SocialProofSection,
  TestimonialsSection,
  CTASection,
  FooterSection,
} from './sections';

export interface TemplateRendererCallbacks {
  /** Panier cliqué dans le header (n'affiche l'icône panier que si fourni). */
  onCartClick?: () => void;
  /** "Ajouter au panier" cliqué sur une carte produit, avec l'id du produit
   *  (n'affiche le bouton que si fourni — pas de bouton mort). */
  onAddToCart?: (productId: string) => void;
}

interface TemplateRendererProps {
  config: ThemeConfig;
  /** Classe additionnelle appliquée à l'élément racine (ex: pour un aperçu encadré). */
  className?: string;
  /** Callbacks reliant les sections interactives (panier) aux vraies
   *  actions de la boutique. Sans eux, ces boutons ne sont pas rendus. */
  callbacks?: TemplateRendererCallbacks;
}

/**
 * Dispatch une `Section` vers le composant React correspondant à son `type`.
 * Un `switch` (plutôt qu'un `Record` casté) permet à TypeScript de vérifier
 * que `section.content` correspond bien à la forme attendue par chaque
 * composant, section par section.
 */
export function renderSection(section: Section, callbacks?: TemplateRendererCallbacks): React.ReactNode {
  switch (section.type) {
    case 'header':
      return <HeaderSection content={section.content} styles={section.styles} onCartClick={callbacks?.onCartClick} />;
    case 'hero':
      return <HeroSection content={section.content} styles={section.styles} />;
    case 'features':
      return <FeaturesSection content={section.content} styles={section.styles} />;
    case 'productGrid':
      return <ProductGridSection content={section.content} styles={section.styles} onAddToCart={callbacks?.onAddToCart} />;
    case 'socialProof':
      return <SocialProofSection content={section.content} styles={section.styles} />;
    case 'testimonials':
      return <TestimonialsSection content={section.content} styles={section.styles} />;
    case 'cta':
      return <CTASection content={section.content} styles={section.styles} />;
    case 'footer':
      return <FooterSection content={section.content} styles={section.styles} />;
    default: {
      // Garde-fou exhaustif : si un nouveau SectionType est ajouté au schéma
      // sans composant associé, TypeScript signale `section` comme `never` ici.
      const _exhaustive: never = section;
      console.warn('TemplateRenderer : type de section inconnu', _exhaustive);
      return null;
    }
  }
}

const radiusPx: Record<ThemeConfig['settings']['borderRadius'], string> = {
  none: '0px',
  sm: '6px',
  md: '12px',
  lg: '20px',
  full: '999px',
};

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ config, className, callbacks }) => {
  const { settings, sections } = config;

  // Variables CSS globales dérivées de `settings`, injectées sur le conteneur racine.
  // Tous les composants de section les consomment via `var(--color-*)` / `var(--font-*)`.
  const cssVariables = useMemo<React.CSSProperties>(
    () =>
      ({
        '--color-primary': settings.colors.primary,
        '--color-secondary': settings.colors.secondary,
        '--color-accent': settings.colors.accent,
        '--color-background': settings.colors.background,
        '--color-text': settings.colors.text,
        '--color-cardBackground': settings.colors.cardBackground,
        '--color-border': settings.colors.border,
        '--font-heading': settings.typography.headingFont,
        '--font-body': settings.typography.bodyFont,
        '--radius-base': radiusPx[settings.borderRadius],
      }) as React.CSSProperties,
    [settings]
  );

  const activeSections = useMemo(() => sections.filter((s) => s.active), [sections]);

  return (
    <div
      className={`theme-root min-h-screen bg-[var(--color-background)] text-[var(--color-text)] antialiased ${
        className ?? ''
      }`}
      style={{ ...cssVariables, fontFamily: 'var(--font-body)' }}
    >
      <ThemeTokensProvider settings={settings}>
        {activeSections.map((section) => (
          <React.Fragment key={section.id}>{renderSection(section, callbacks)}</React.Fragment>
        ))}
      </ThemeTokensProvider>
    </div>
  );
};

export default TemplateRenderer;

import type { CSSProperties } from 'react';
import { Alignment, BorderRadius, SectionStyles } from './types';

/**
 * Tailwind ne peut pas lire des classes générées dynamiquement à partir de
 * chaînes arbitraires (purge JIT), donc chaque valeur de token est mappée
 * explicitement vers une classe Tailwind statique.
 */

export const radiusClass: Record<BorderRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-md',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
};

/** Variante de radius pour les éléments "carte" (jamais 'full' pour rester lisible). */
export const cardRadiusClass: Record<BorderRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-md',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-3xl',
};

export const paddingTopClass: Record<NonNullable<SectionStyles['paddingTop']>, string> = {
  none: 'pt-0',
  sm: 'pt-8 md:pt-12',
  md: 'pt-16 md:pt-20',
  lg: 'pt-24 md:pt-28',
  xl: 'pt-32 md:pt-40',
};

export const paddingBottomClass: Record<NonNullable<SectionStyles['paddingBottom']>, string> = {
  none: 'pb-0',
  sm: 'pb-8 md:pb-12',
  md: 'pb-16 md:pb-20',
  lg: 'pb-24 md:pb-28',
  xl: 'pb-32 md:pb-40',
};

export const alignmentClass: Record<Alignment, string> = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
};

export const columnsClass: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function resolveSectionStyle(styles: SectionStyles): CSSProperties {
  const style: CSSProperties = {};
  if (styles.backgroundColor) style.backgroundColor = styles.backgroundColor;
  if (styles.textColor) style.color = styles.textColor;
  return style;
}

export function formatPrice(value: number, currency = 'EUR', locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

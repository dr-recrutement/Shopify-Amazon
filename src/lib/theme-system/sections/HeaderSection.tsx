import React, { useState } from 'react';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { HeaderContent, SectionStyles } from '../types';
import { paddingTopClass, paddingBottomClass, radiusClass } from '../tokens';
import { useThemeTokens } from '../ThemeContext';

interface HeaderSectionProps {
  content: HeaderContent;
  styles: SectionStyles;
  /** Appelé au clic sur l'icône panier. Sans handler, l'icône panier n'est
   *  pas affichée plutôt que de rendre un bouton cliquable sans effet. */
  onCartClick?: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ content, styles, onCartClick }) => {
  const { radius, containerClass } = useThemeTokens();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md bg-[var(--color-background)]/90 border-[var(--color-border)] ${
        paddingTopClass[styles.paddingTop ?? 'sm']
      } ${paddingBottomClass[styles.paddingBottom ?? 'sm']}`}
    >
      <div className={`${containerClass} flex items-center justify-between gap-6`}>
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          {content.logoType === 'image' && content.logoImageUrl ? (
            <img src={content.logoImageUrl} alt={content.logoText ?? 'Logo'} className="h-8 w-auto" />
          ) : (
            <span
              className="text-xl font-bold tracking-tight text-[var(--color-text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {content.logoText}
            </span>
          )}
        </a>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {content.navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--color-text)]/70 hover:text-[var(--color-text)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {content.showCart && onCartClick && (
            <button
              type="button"
              aria-label="Panier"
              onClick={onCartClick}
              className="relative p-2 text-[var(--color-text)]/70 hover:text-[var(--color-text)] transition-colors"
            >
              <ShoppingCart size={20} strokeWidth={1.75} />
              {!!content.cartCount && content.cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-semibold text-white"
                >
                  {content.cartCount}
                </span>
              )}
            </button>
          )}
          {content.ctaLabel && (
            <a
              href={content.ctaHref ?? '#'}
              className={`${radiusClass[radius]} bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              {content.ctaLabel}
            </a>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-[var(--color-text)]"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] px-6 py-4 flex flex-col gap-4">
          {content.navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--color-text)]/80"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {content.ctaLabel && (
            <a
              href={content.ctaHref ?? '#'}
              className={`${radiusClass[radius]} bg-[var(--color-primary)] px-5 py-2.5 text-center text-sm font-semibold text-white`}
            >
              {content.ctaLabel}
            </a>
          )}
        </div>
      )}
    </header>
  );
};

export default HeaderSection;

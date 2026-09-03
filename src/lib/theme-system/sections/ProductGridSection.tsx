import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { ProductGridContent, SectionStyles } from '../types';
import {
  paddingTopClass,
  paddingBottomClass,
  cardRadiusClass,
  columnsClass,
  resolveSectionStyle,
  formatPrice,
} from '../tokens';
import { useThemeTokens } from '../ThemeContext';

interface ProductGridSectionProps {
  content: ProductGridContent;
  styles: SectionStyles;
  /** Appelé avec l'id du produit au clic sur "Ajouter au panier". Sans
   *  handler, le bouton n'est pas affiché plutôt que de rendre un bouton
   *  cliquable sans effet. */
  onAddToCart?: (productId: string) => void;
}

export const ProductGridSection: React.FC<ProductGridSectionProps> = ({ content, styles, onAddToCart }) => {
  const { containerClass, radius } = useThemeTokens();
  const sectionStyle = resolveSectionStyle(styles);

  return (
    <section
      className={`${paddingTopClass[styles.paddingTop ?? 'lg']} ${paddingBottomClass[styles.paddingBottom ?? 'lg']}`}
      style={sectionStyle}
    >
      <div className={containerClass}>
        {(content.title || content.subtitle) && (
          <div className="flex flex-col gap-3 mb-12 max-w-2xl">
            {content.title && (
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {content.title}
              </h2>
            )}
            {content.subtitle && <p className="text-lg text-[var(--color-text)]/65">{content.subtitle}</p>}
          </div>
        )}

        <div className={`grid ${columnsClass[content.columns]} gap-6`}>
          {content.products.map((product) => {
            const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;
            return (
              <div
                key={product.id}
                className={`group relative flex flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-cardBackground)] ${cardRadiusClass[radius]} transition-shadow hover:shadow-lg`}
              >
                <div className="relative aspect-square overflow-hidden bg-[var(--color-border)]/30">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {product.badge && (
                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
                        product.badge === 'promo' ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]'
                      }`}
                    >
                      {product.badge === 'promo' ? 'Promo' : 'Nouveau'}
                    </span>
                  )}
                  {onAddToCart && (
                    <button
                      type="button"
                      aria-label={`Ajouter ${product.name} au panier`}
                      onClick={() => onAddToCart(product.id)}
                      className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-text)] opacity-0 shadow-md transition-all duration-200 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[var(--color-primary)] hover:text-white"
                    >
                      <ShoppingCart size={17} strokeWidth={1.75} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 p-4">
                  <h3 className="text-sm font-medium text-[var(--color-text)] line-clamp-1">{product.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-semibold text-[var(--color-text)]">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-[var(--color-text)]/40 line-through">
                        {formatPrice(product.compareAtPrice as number, product.currency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductGridSection;

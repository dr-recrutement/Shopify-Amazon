import React from 'react';
import { Star } from 'lucide-react';
import { TestimonialsContent, SectionStyles } from '../types';
import { paddingTopClass, paddingBottomClass, cardRadiusClass, resolveSectionStyle } from '../tokens';
import { useThemeTokens } from '../ThemeContext';

interface TestimonialsSectionProps {
  content: TestimonialsContent;
  styles: SectionStyles;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5" aria-label={`Note : ${rating} sur 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={15}
        strokeWidth={0}
        className={i < rating ? 'fill-[var(--color-accent)]' : 'fill-[var(--color-border)]'}
      />
    ))}
  </div>
);

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ content, styles }) => {
  const { containerClass, radius } = useThemeTokens();
  const sectionStyle = resolveSectionStyle(styles);

  return (
    <section
      className={`${paddingTopClass[styles.paddingTop ?? 'lg']} ${paddingBottomClass[styles.paddingBottom ?? 'lg']}`}
      style={sectionStyle}
    >
      <div className={containerClass}>
        {(content.title || content.subtitle) && (
          <div className="flex flex-col gap-3 mb-14 max-w-2xl mx-auto text-center items-center">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.items.map((item) => (
            <figure
              key={item.id}
              className={`flex flex-col gap-5 border border-[var(--color-border)] bg-[var(--color-cardBackground)] p-7 ${cardRadiusClass[radius]}`}
            >
              <StarRating rating={item.rating} />
              <blockquote className="text-[15px] leading-relaxed text-[var(--color-text)]/85">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-2">
                {item.authorImageUrl ? (
                  <img
                    src={item.authorImageUrl}
                    alt={item.authorName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                    {item.authorName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[var(--color-text)]">{item.authorName}</span>
                  <span className="text-xs text-[var(--color-text)]/55">{item.authorRole}</span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CTAContent, SectionStyles } from '../types';
import { paddingTopClass, paddingBottomClass, radiusClass, cardRadiusClass, resolveSectionStyle } from '../tokens';
import { useThemeTokens } from '../ThemeContext';

interface CTASectionProps {
  content: CTAContent;
  styles: SectionStyles;
}

export const CTASection: React.FC<CTASectionProps> = ({ content, styles }) => {
  const { containerClass, radius } = useThemeTokens();
  const sectionStyle = resolveSectionStyle(styles);
  const isGradient = (content.backgroundStyle ?? 'solid') === 'gradient';

  return (
    <section className={`${paddingTopClass[styles.paddingTop ?? 'md']} ${paddingBottomClass[styles.paddingBottom ?? 'md']}`}>
      <div className={containerClass}>
        <div
          className={`relative overflow-hidden ${cardRadiusClass[radius]} px-8 py-16 md:px-16 md:py-20 flex flex-col items-center text-center gap-6`}
          style={{
            ...sectionStyle,
            background: isGradient
              ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)'
              : sectionStyle.backgroundColor ?? 'var(--color-primary)',
            color: sectionStyle.color ?? '#ffffff',
          }}
        >
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight max-w-2xl leading-[1.1]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {content.title}
          </h2>
          {content.subtitle && <p className="text-lg opacity-85 max-w-xl">{content.subtitle}</p>}
          <a
            href={content.buttonHref}
            className={`${radiusClass[radius]} inline-flex items-center gap-2 bg-white px-8 py-3.5 text-sm font-semibold text-[var(--color-primary)] shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]`}
          >
            {content.buttonLabel}
            <ArrowRight size={16} strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

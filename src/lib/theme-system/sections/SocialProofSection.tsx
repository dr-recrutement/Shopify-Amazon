import React from 'react';
import { SocialProofContent, SectionStyles } from '../types';
import { paddingTopClass, paddingBottomClass, resolveSectionStyle } from '../tokens';
import { useThemeTokens } from '../ThemeContext';

interface SocialProofSectionProps {
  content: SocialProofContent;
  styles: SectionStyles;
}

export const SocialProofSection: React.FC<SocialProofSectionProps> = ({ content, styles }) => {
  const { containerClass } = useThemeTokens();
  const sectionStyle = resolveSectionStyle(styles);

  return (
    <section
      className={`${paddingTopClass[styles.paddingTop ?? 'md']} ${paddingBottomClass[styles.paddingBottom ?? 'md']}`}
      style={sectionStyle}
    >
      <div className={`${containerClass} flex flex-col gap-16`}>
        {content.title && (
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-[var(--color-text)]/50">
            {content.title}
          </h2>
        )}

        {content.stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {content.stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1">
                <span
                  className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {stat.value}
                </span>
                <span className="text-sm text-[var(--color-text)]/60">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {content.logos.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {content.logos.map((logo, i) => (
              <img
                key={i}
                src={logo.imageUrl}
                alt={logo.name}
                className="h-6 md:h-7 w-auto opacity-50 grayscale transition-opacity hover:opacity-80"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SocialProofSection;

import React from 'react';
import { Sparkles, Headset, LineChart, ShieldCheck, Truck, Users, Workflow, Zap, type LucideIcon } from 'lucide-react';
import { FeaturesContent, SectionStyles } from '../types';
import { paddingTopClass, paddingBottomClass, cardRadiusClass, columnsClass, resolveSectionStyle } from '../tokens';
import { useThemeTokens } from '../ThemeContext';

interface FeaturesSectionProps {
  content: FeaturesContent;
  styles: SectionStyles;
}

// Curated map rather than `import * as Icons from 'lucide-react'` — the
// namespace import pulls the entire icon set (700KB+) into the bundle even
// though a features grid only ever needs a handful of them. Add an entry
// here when a new preset needs a new icon.
const ICONS: Record<string, LucideIcon> = {
  Headset, LineChart, ShieldCheck, Truck, Users, Workflow, Zap,
};

/** Résout un nom d'icône lucide-react ("Zap") vers son composant, avec repli sûr. */
function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ content, styles }) => {
  const { containerClass, radius } = useThemeTokens();
  const sectionStyle = resolveSectionStyle(styles);
  const alignHeader = styles.alignment === 'left' ? 'text-left items-start' : 'text-center items-center mx-auto';

  return (
    <section
      className={`${paddingTopClass[styles.paddingTop ?? 'lg']} ${paddingBottomClass[styles.paddingBottom ?? 'lg']}`}
      style={sectionStyle}
    >
      <div className={containerClass}>
        {(content.title || content.subtitle) && (
          <div className={`flex flex-col gap-4 max-w-2xl mb-14 ${alignHeader}`}>
            {content.title && (
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {content.title}
              </h2>
            )}
            {content.subtitle && <p className="text-lg text-[var(--color-text)]/65 leading-relaxed">{content.subtitle}</p>}
          </div>
        )}

        <div className={`grid ${columnsClass[content.columns]} gap-6`}>
          {content.items.map((item, i) => {
            const Icon = resolveIcon(item.icon);
            return (
              <div
                key={i}
                className={`group ${cardRadiusClass[radius]} border border-[var(--color-border)] bg-[var(--color-cardBackground)] p-7 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
              >
                <div
                  className={`mb-5 inline-flex h-11 w-11 items-center justify-center ${cardRadiusClass[radius]} bg-[var(--color-primary)]/10 text-[var(--color-primary)]`}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3
                  className="text-lg font-semibold text-[var(--color-text)] mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--color-text)]/65 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

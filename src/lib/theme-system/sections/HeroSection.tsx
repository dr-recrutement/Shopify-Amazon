import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { HeroContent, SectionStyles } from '../types';
import { paddingTopClass, paddingBottomClass, radiusClass, resolveSectionStyle } from '../tokens';
import { useThemeTokens } from '../ThemeContext';

interface HeroSectionProps {
  content: HeroContent;
  styles: SectionStyles;
}

const Buttons: React.FC<{ content: HeroContent; justify: string }> = ({ content, justify }) => {
  const { radius } = useThemeTokens();
  return (
    <div className={`flex flex-wrap gap-4 ${justify}`}>
      {content.buttons.map((btn, i) => (
        <a
          key={i}
          href={btn.href}
          className={`${radiusClass[radius]} px-7 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
            btn.variant === 'primary'
              ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20'
              : 'bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-cardBackground)]'
          }`}
        >
          {btn.label}
        </a>
      ))}
    </div>
  );
};

const Reassurance: React.FC<{ label?: string; justify: string }> = ({ label, justify }) => {
  if (!label) return null;
  return (
    <div className={`flex items-center gap-2 ${justify} text-sm text-[var(--color-text)]/60`}>
      <ShieldCheck size={16} strokeWidth={1.75} className="text-[var(--color-accent)]" />
      <span>{label}</span>
    </div>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({ content, styles }) => {
  const { containerClass } = useThemeTokens();
  const sectionStyle = resolveSectionStyle(styles);
  const wrapperClasses = `${paddingTopClass[styles.paddingTop ?? 'xl']} ${
    paddingBottomClass[styles.paddingBottom ?? 'xl']
  }`;

  if (content.layout === 'centered') {
    return (
      <section
        className={`relative overflow-hidden ${wrapperClasses}`}
        style={{
          ...sectionStyle,
          background:
            sectionStyle.backgroundColor ??
            'radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-primary) 0%, transparent 60%), var(--color-background)',
        }}
      >
        <div className={`${containerClass} flex flex-col items-center text-center gap-6 max-w-3xl mx-auto`}>
          {content.eyebrow && (
            <span className="text-sm font-semibold text-[var(--color-primary)]">{content.eyebrow}</span>
          )}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {content.title}
          </h1>
          <p className="text-lg text-[var(--color-text)]/70 max-w-2xl leading-relaxed">{content.subtitle}</p>
          <Buttons content={content} justify="justify-center" />
          <Reassurance label={content.reassuranceBadge} justify="justify-center" />
        </div>
      </section>
    );
  }

  if (content.layout === 'full-bg') {
    return (
      <section className={`relative overflow-hidden ${wrapperClasses}`} style={sectionStyle}>
        {content.imageUrl && (
          <>
            <img
              src={content.imageUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
          </>
        )}
        <div className={`${containerClass} relative flex flex-col gap-6 max-w-2xl`}>
          {content.eyebrow && <span className="text-sm font-semibold text-white/80">{content.eyebrow}</span>}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {content.title}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">{content.subtitle}</p>
          <Buttons content={content} justify="justify-start" />
          <Reassurance label={content.reassuranceBadge} justify="justify-start" />
        </div>
      </section>
    );
  }

  // layout === 'split'
  return (
    <section className={`relative overflow-hidden ${wrapperClasses}`} style={sectionStyle}>
      <div className={`${containerClass} grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}>
        <div className="flex flex-col gap-6">
          {content.eyebrow && (
            <span className="text-sm font-semibold text-[var(--color-primary)]">{content.eyebrow}</span>
          )}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {content.title}
          </h1>
          <p className="text-lg text-[var(--color-text)]/70 leading-relaxed max-w-xl">{content.subtitle}</p>
          <Buttons content={content} justify="justify-start" />
          <Reassurance label={content.reassuranceBadge} justify="justify-start" />
        </div>
        {content.imageUrl && (
          <div className="relative">
            <img
              src={content.imageUrl}
              alt=""
              className="w-full h-auto rounded-2xl shadow-2xl shadow-black/10 object-cover aspect-[4/3]"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;

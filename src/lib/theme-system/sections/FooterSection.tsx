import React from 'react';
import { FooterContent, SectionStyles, SocialLink } from '../types';
import { paddingTopClass, paddingBottomClass, resolveSectionStyle } from '../tokens';
import { useThemeTokens } from '../ThemeContext';

interface FooterSectionProps {
  content: FooterContent;
  styles: SectionStyles;
}

/**
 * lucide-react ne fournit plus les logos de marque (Twitter, Instagram, etc.)
 * depuis sa v1 — de petites icônes SVG inline, minimales et neutres,
 * évitent une dépendance supplémentaire pour un besoin aussi simple.
 */
type IconProps = { size?: number };

const iconPaths: Record<SocialLink['platform'], string> = {
  twitter: 'M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.4-1.3 1.7-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5v.1a4.1 4.1 0 0 0 3.3 4 4.2 4.2 0 0 1-1.8.1 4.1 4.1 0 0 0 3.8 2.9A8.3 8.3 0 0 1 2 18.4a11.6 11.6 0 0 0 6.3 1.9c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.2Z',
  instagram:
    'M12 2c2.7 0 3.1 0 4.1.1 1.1.1 1.9.2 2.5.5.7.3 1.2.6 1.8 1.2.6.6.9 1.1 1.2 1.8.3.6.4 1.4.5 2.5.1 1 .1 1.4.1 4.1s0 3.1-.1 4.1c-.1 1.1-.2 1.9-.5 2.5-.3.7-.6 1.2-1.2 1.8-.6.6-1.1.9-1.8 1.2-.6.3-1.4.4-2.5.5-1 .1-1.4.1-4.1.1s-3.1 0-4.1-.1c-1.1-.1-1.9-.2-2.5-.5-.7-.3-1.2-.6-1.8-1.2-.6-.6-.9-1.1-1.2-1.8-.3-.6-.4-1.4-.5-2.5C2 15.1 2 14.7 2 12s0-3.1.1-4.1c.1-1.1.2-1.9.5-2.5.3-.7.6-1.2 1.2-1.8C4.4 3 4.9 2.7 5.6 2.4c.6-.3 1.4-.4 2.5-.5C9.1 2 9.5 2 12 2Zm0 3.8A6.2 6.2 0 1 0 12 18.2 6.2 6.2 0 0 0 12 5.8Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-10.4a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z',
  linkedin:
    'M6.9 8.4H3.3V20h3.6V8.4ZM5.1 3a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2ZM20.7 20v-6.4c0-3.4-1.8-5-4.3-5-2 0-2.8 1.1-3.3 1.8V8.4H9.5c0 .9 0 12 0 12H13v-6.7c0-.4 0-.7.1-1 .3-.7 1-1.5 2.1-1.5 1.5 0 2.1 1.1 2.1 2.8V20h3.4Z',
  facebook:
    'M13.5 21v-7.6h2.6l.4-3H13.5V8.4c0-.9.2-1.5 1.6-1.5H16.6V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H7.6v3h2.6V21h3.3Z',
  youtube:
    'M22 12c0-1.7-.1-3-.5-4.1-.3-.9-1-1.5-1.9-1.7C18 6 12 6 12 6s-6 0-7.6.2c-.9.2-1.6.8-1.9 1.7C2.1 9 2 10.3 2 12c0 1.7.1 3 .5 4.1.3.9 1 1.5 1.9 1.7C6 18 12 18 12 18s6 0 7.6-.2c.9-.2 1.6-.8 1.9-1.7.4-1.1.5-2.4.5-4.1ZM10 15V9l5.2 3-5.2 3Z',
  tiktok:
    'M16.6 3h-3v12.4a2.6 2.6 0 1 1-2.1-2.6v-3.1a5.7 5.7 0 1 0 5.1 5.7V9.4a7.6 7.6 0 0 0 4.4 1.4V7.8a4.6 4.6 0 0 1-4.4-4.4Z',
};

const SocialIcon: React.FC<{ platform: SocialLink['platform'] } & IconProps> = ({ platform, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={iconPaths[platform]} />
  </svg>
);

export const FooterSection: React.FC<FooterSectionProps> = ({ content, styles }) => {
  const { containerClass } = useThemeTokens();
  const sectionStyle = resolveSectionStyle(styles);

  return (
    <footer
      className={`border-t border-[var(--color-border)] ${paddingTopClass[styles.paddingTop ?? 'lg']} ${
        paddingBottomClass[styles.paddingBottom ?? 'md']
      }`}
      style={sectionStyle}
    >
      <div className={containerClass}>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_repeat(3,1fr)] gap-12 pb-12">
          {/* Brand block */}
          <div className="flex flex-col gap-4 max-w-sm">
            <span
              className="text-xl font-bold tracking-tight text-[var(--color-text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {content.logoText}
            </span>
            {content.description && (
              <p className="text-sm text-[var(--color-text)]/60 leading-relaxed">{content.description}</p>
            )}
            {content.socialLinks.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                {content.socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    aria-label={social.platform}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text)]/60 transition-colors hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                  >
                    <SocialIcon platform={social.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {content.columns.map((column, i) => (
            <div key={i} className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-1">{column.title}</h4>
              {column.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <p className="text-xs text-[var(--color-text)]/45">{content.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

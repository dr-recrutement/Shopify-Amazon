import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { InstagramFeed } from './InstagramFeed';
import { useLang } from '../lib/i18n';
import { Mail, Phone, Globe2, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

// lucide-react has no TikTok glyph — same path data used by
// src/lib/theme-system/sections/FooterSection.tsx for consistency.
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 3h-3v12.4a2.6 2.6 0 1 1-2.1-2.6v-3.1a5.7 5.7 0 1 0 5.1 5.7V9.4a7.6 7.6 0 0 0 4.4 1.4V7.8a4.6 4.6 0 0 1-4.4-4.4Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: 'TikTok', href: 'https://www.tiktok.com/@liyahgroup?_r=1&_t=ZS-9981XGgaxrE', Icon: TikTokIcon },
  { label: 'Facebook', href: 'https://www.facebook.com/share/1LMAGqsy3n/?mibextid=wwXIfr', Icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com/liafrik_tech?igsi=eXBjdTc5NG42Zml4&utm_source=qr', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/liafrik/', Icon: Linkedin },
  { label: 'YouTube', href: 'https://youtube.com/@liyah-n?si=D-lXwovYubw3sdaf', Icon: Youtube },
];

export function Footer() {
  const { t } = useLang();
  const cols = [
    {
      title: 'Produit',
      links: [
        { to: '/features', label: 'Fonctionnalités' },
        { to: '/pricing', label: 'Tarifs' },
        { to: '/marketplace', label: 'Marketplace' },
        { to: '/order-tracking', label: 'Suivi de commande' },
        { to: '/register', label: 'Devenir vendeur' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { to: '/academy', label: 'Académie vendeur' },
        { to: '/blog', label: 'Blog' },
        { to: '/help', label: "Centre d'aide" },
        { to: '/support', label: 'Support' },
      ],
    },
    {
      title: 'Entreprise',
      links: [
        { to: '/about', label: 'À propos' },
        { to: '/contact', label: 'Contact' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { to: '/legal/terms', label: "Conditions d'utilisation" },
        { to: '/legal/privacy', label: 'Politique de confidentialité' },
        { to: '/legal/cookies', label: 'Politique de cookies' },
        { to: '/legal/refund', label: 'Politique de remboursement' },
        { to: '/legal/legal', label: 'Mentions légales' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2">
            <Logo white />
            <p className="mt-4 text-sm text-gray-400 max-w-xs">
              {t('footer.tagline')}
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400"><Mail size={14} /> contact@os.liafrik.com</div>
              <div className="flex items-center gap-2 text-gray-400"><Phone size={14} /> +225 07 00 00 00 00</div>
              <div className="flex items-center gap-2 text-gray-400"><Globe2 size={14} /> Disponible dans le monde entier 🌍</div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-brand-600 hover:text-white transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-gray-400 hover:text-brand-500 transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">Suivez-nous sur Instagram</h4>
          <InstagramFeed />
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Sellia — Conçu et développé par{' '}
            <a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 underline underline-offset-2">LiAfrik</a>.
            {' '}Tous droits réservés.
          </p>
          <p className="text-xs text-gray-500 mt-1 md:mt-0">{t('footer.origin')}</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link to="/legal/terms" className="hover:text-brand-500">CGU</Link>
            <Link to="/legal/privacy" className="hover:text-brand-500">Confidentialité</Link>
            <Link to="/legal/cookies" className="hover:text-brand-500">Cookies</Link>
            <Link to="/legal/refund" className="hover:text-brand-500">Remboursement</Link>
            <Link to="/legal/legal" className="hover:text-brand-500">Mentions légales</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

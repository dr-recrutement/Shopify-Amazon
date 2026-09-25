import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, ArrowRight, Mail } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { COMPETITOR_LIST } from '@/lib/competitors';
import { ORG_SOCIALS, SUPPORT_EMAIL, CS_EMAIL } from '@/lib/seo';

// Small inline TikTok mark — lucide-react ships no TikTok icon, and
// pulling in a whole extra icon package for one glyph isn't worth it.
function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82c-.85-.93-1.36-2.13-1.36-3.46h-3.1v13.6a2.75 2.75 0 1 1-2.75-2.75c.24 0 .48.03.7.08V10.3a5.85 5.85 0 0 0-.7-.04A5.85 5.85 0 1 0 15.24 16V9.4a7.14 7.14 0 0 0 4.17 1.34V7.65c-1.02 0-2-.32-2.81-.86-.36-.24-.68-.52-1-.97Z" />
    </svg>
  );
}

// Every link below points to a route that actually exists (App.jsx) or a
// real in-page anchor on the landing page. Previously this column was
// plain <span> text with no href at all, promising pages (Carrières,
// Documentation, RGPD…) the site never actually had.
const COLS = [
  {
    title: 'Plateforme',
    links: [
      { label: 'Éditeur de boutique', to: '/#fonctionnalites' },
      { label: 'Thèmes premium', to: '/#fonctionnalites' },
      { label: 'Paiements & Mobile Money', to: '/#fonctionnalites' },
      { label: 'Sellia Assistant (IA)', to: '/#fonctionnalites' },
      { label: 'Tarifs', to: '/#tarifs' },
    ],
  },
  {
    title: 'Alternatives',
    links: COMPETITOR_LIST.map((c) => ({ label: `Alternative à ${c.name}`, to: `/alternative-a-${c.slug}` })),
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Centre d\u2019aide', to: '/centre-aide' },
      { label: 'Guides', to: '/guides' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', to: '/a-propos' },
      { label: 'Carrières', to: '/carrieres' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Conditions d\u2019utilisation', to: '/conditions' },
      { label: 'Confidentialité', to: '/confidentialite' },
      { label: 'Cookies', to: '/confidentialite#cookies' },
      { label: 'RGPD', to: '/confidentialite#rgpd' },
      { label: 'Mentions légales', to: '/mentions-legales' },
    ],
  },
];

const SOCIALS = [
  { icon: Linkedin, label: 'LinkedIn', href: ORG_SOCIALS[0] },
  { icon: Facebook, label: 'Facebook', href: ORG_SOCIALS[1] },
  { icon: Instagram, label: 'Instagram', href: ORG_SOCIALS[2] },
  { icon: TikTokIcon, label: 'TikTok', href: ORG_SOCIALS[3] },
];

export default function LandingFooter() {
  return (
    <footer className="bg-foreground text-background">
      {/* CTA strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-landing font-extrabold text-2xl text-background">Prêt à lancer votre boutique ?</h3>
            <p className="mt-1.5 text-background/70">Essayez Sellia gratuitement pendant 14 jours. Sans carte bancaire.</p>
          </div>
          <Link to="/register" className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-semibold px-6 py-3.5 rounded-full text-base hover:bg-brand/90 transition-colors shadow-lg shadow-brand/30 shrink-0">
            Commencer maintenant <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {/* Brand as a fixed-width sidebar + an evenly-spaced column grid
            beside it, rather than mixing a col-span block into the same
            grid as the nav columns — that previous approach needed the
            column count to match brand-span + number of columns exactly,
            and silently broke (last column wrapping, misaligned) the
            moment a column was added or removed. This layout can't drift
            out of alignment as content changes. */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="lg:w-72 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center bg-white rounded-lg px-2 py-1.5"><img src={BRAND.logo} alt="Sellia" className="h-6 w-auto object-contain" /></span>
              <span className="font-landing font-bold text-lg text-background">Sellia</span>
            </div>
            <p className="mt-4 text-sm text-background/70 max-w-xs leading-relaxed">La plateforme e-commerce premium pour les marchands du monde entier — une alternative complète à Shopify, BigCommerce, PrestaShop, WooCommerce, Odoo et Wix.</p>

            <div className="mt-5 space-y-2">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {SUPPORT_EMAIL}
              </a>
              <a href={`mailto:${CS_EMAIL}`} className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {CS_EMAIL}
              </a>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 flex-1">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="font-landing font-semibold text-sm text-background">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      {l.to.startsWith('/#') ? (
                        <a href={l.to.slice(1)} className="text-sm text-background/70 hover:text-background transition-colors">{l.label}</a>
                      ) : (
                        <Link to={l.to} className="text-sm text-background/70 hover:text-background transition-colors">{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/60">© {new Date().getFullYear()} Sellia — {BRAND.tagline}. Tous droits réservés.</p>
          <div className="flex items-center gap-5 text-xs text-background/70">
            <Link to="/login" className="hover:text-background transition-colors">Connexion</Link>
            <Link to="/confidentialite" className="hover:text-background transition-colors">Confidentialité</Link>
            <Link to="/conditions" className="hover:text-background transition-colors">Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

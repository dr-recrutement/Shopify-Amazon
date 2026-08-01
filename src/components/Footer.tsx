import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useLang } from '../lib/i18n';
import { Mail, Phone, MapPin } from 'lucide-react';

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
        { to: '/legal/terms', label: "Conditions d'utilisation" },
        { to: '/legal/privacy', label: 'Confidentialité' },
        { to: '/contact', label: 'Contact' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Logo white />
            <p className="mt-4 text-sm text-gray-400 max-w-xs">
              {t('footer.tagline')}
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400"><Mail size={14} /> support@liafrik.com</div>
              <div className="flex items-center gap-2 text-gray-400"><Mail size={14} /> cs@liafrik.com</div>
              <div className="flex items-center gap-2 text-gray-400"><MapPin size={14} /> Dubai, UAE 🇦🇪 &amp; Afrique 🌍</div>
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-gray-400 hover:text-orange-500 transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} OS — Conçu et développé par LiAfrik. Tous droits réservés.</p>
          <p className="text-xs text-gray-500 mt-1 md:mt-0">Conçu et développé au Cameroun 🇨🇲 par LiAfrk — pour toute l'Afrique et pret pour le monde</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link to="/legal/terms" className="hover:text-orange-500">CGU</Link>
            <Link to="/legal/privacy" className="hover:text-orange-500">Confidentialité</Link>
            <Link to="/legal/legal" className="hover:text-orange-500">Mentions légales</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

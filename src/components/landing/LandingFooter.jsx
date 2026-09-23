import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';


const COLS = [
  { title: 'Plateforme', links: ['Éditeur de boutique', 'Thèmes premium', 'Checkout', 'Paiements', 'Gestion des stocks', 'Analytics', 'Sellia Assistant'] },
  { title: 'Solutions', links: ['Mode & Textile', 'Beauté & Cosmétiques', 'Électronique', 'Restaurant & Food', 'Marketplace', 'Multi-boutiques'] },
  { title: 'Ressources', links: ['Documentation', 'Centre d’aide', 'Blog', 'Communauté', 'Développeurs', 'Statut système'] },
  { title: 'Entreprise', links: ['À propos', 'Carrières', 'Partenaires', 'Contact', 'Presse', 'Sécurité'] },
  { title: 'Légal', links: ['Conditions d’utilisation', 'Confidentialité', 'Cookies', 'RGPD', 'Mentions légales'] },
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center bg-white rounded-lg px-2 py-1.5"><img src={BRAND.logo} alt="Sellia" className="h-6 w-auto object-contain" /></span>
              <span className="font-landing font-bold text-lg text-background">Sellia</span>
            </div>
            <p className="mt-4 text-sm text-background/70 max-w-xs">La plateforme e-commerce premium pour les marchands du monde entier. Lancez votre boutique, vendez au monde.</p>
            <a href={BRAND.site} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand hover:opacity-80">{BRAND.site.replace('https://', '')}</a>
            <div className="mt-5 flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Ic, i) => (
                <span key={i} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Ic className="w-4 h-4" /></span>
              ))}
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-landing font-semibold text-sm text-background">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}><span className="text-sm text-background/70">{l}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/60">© {new Date().getFullYear()} Sellia — {BRAND.tagline}. Tous droits réservés.</p>
          <div className="flex items-center gap-5 text-xs text-background/70">
            <Link to="/login" className="hover:text-background transition-colors">Connexion</Link>
            <span className="text-background/60">Confidentialité</span>
            <span className="text-background/60">Conditions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
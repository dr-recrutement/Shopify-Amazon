import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';


const COLS = [
  { title: 'Plateforme', links: ['Éditeur de boutique', 'Thèmes premium', 'Checkout', 'Paiements', 'Gestion des stocks', 'Analytics', 'Assistant IA'] },
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
              <img src={BRAND.logo} alt="Sellia" className="h-9 w-auto object-contain" />
              <span className="font-landing font-bold text-lg text-background">Sellia</span>
            </div>
            <p className="mt-4 text-sm text-background/70 max-w-xs">La plateforme e-commerce premium pour les marchands du monde entier. Lancez votre boutique, vendez au monde.</p>
            <a href={BRAND.site} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand hover:opacity-80">{BRAND.site.replace('https://', '')}</a>
            <div className="mt-5 flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Ic, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Ic className="w-4 h-4" /></a>
              ))}
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-landing font-semibold text-sm text-background">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-background/70 hover:text-background transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* PSP names strip */}
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold text-background/60 uppercase tracking-wide">Paiements sécurisés via</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {['Paystack','Flutterwave','M-Pesa','Stripe','PayPal','Payunit','Wave','Orange Money','Kkiapay','Square','Klarna','Adyen','Razorpay','Mercado Pago'].map((name, i) => (
              <span key={name} className="inline-flex items-center gap-3 text-sm font-semibold text-background/80">
                {i > 0 && <span className="text-background/30">•</span>}{name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/60">© {new Date().getFullYear()} Sellia — {BRAND.tagline}. Tous droits réservés.</p>
          <div className="flex items-center gap-5 text-xs text-background/70">
            <Link to="/login" className="hover:text-background transition-colors">Connexion</Link>
            <a href="#" className="hover:text-background transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-background transition-colors">Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
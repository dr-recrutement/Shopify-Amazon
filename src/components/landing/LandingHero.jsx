import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Wallet, ShieldCheck, Globe2, Star } from 'lucide-react';

const HERO_BG = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=80';

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] min-h-[640px] flex items-center">
      {/* Video/image background */}
      <div className="absolute inset-0">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28 w-full">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-4 py-2 text-xs font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            La plateforme e-commerce globale — 7 langues
          </span>

          <h1 className="mt-6 font-landing font-semibold tracking-tight text-white text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.12]">
            Lancez votre boutique<br />
            en ligne <span className="text-[#2EE6A8]">internationale</span><br />
            en quelques minutes.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
            Sellia réunit éditeur de thèmes, paiements intégrés, multi-devises et 25+ PSP mondiaux — pour les marchands du monde entier. Sans code, sans friction.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-[#008060] text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-[#00694d] transition-colors shadow-xl shadow-[#008060]/30">
              Créer ma boutique <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#tarifs" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-white/20 transition-colors">
              Voir les tarifs
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/70">
            <span className="flex items-center gap-1.5"><Globe2 className="w-4 h-4 text-[#2EE6A8]" /> Multi-devises (XOF, NGN, USD, EUR…)</span>
            <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4 text-[#2EE6A8]" /> 25+ PSP mondiaux</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2EE6A8]" /> Paiements sans redirection</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> 14 jours d'essai gratuit</span>
          </div>
        </div>
      </div>
    </section>
  );
}
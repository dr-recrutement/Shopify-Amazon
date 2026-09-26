import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, Users, ShieldCheck, Sparkles } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';

const STATS = [
  { value: '12 000+', label: 'marchands actifs' },
  { value: '25+', label: 'moyens de paiement intégrés' },
  { value: '7', label: 'langues disponibles' },
  { value: '4,9/5', label: 'satisfaction moyenne' },
];

const VALUES = [
  { icon: Globe2, title: 'Une ambition mondiale', text: "Sellia est conçu pour vendre partout dans le monde : multi-devises natif, Mobile Money et cartes internationales dans une seule plateforme." },
  { icon: ShieldCheck, title: 'Le premium comme standard', text: "Thèmes soignés, checkout sans redirection, sécurité et performance ne sont pas des options payantes — c'est la base de chaque plan." },
  { icon: Users, title: 'Des marchands, pas des tickets', text: "Chaque fonctionnalité part d'un vrai besoin de commerçant, pas d'une case à cocher marketing." },
  { icon: Sparkles, title: "L'IA au service du commerce", text: "Sellia Assistant génère contenus, thèmes et optimisations SEO pour que vous vous concentriez sur vos produits et vos clients." },
];

export default function About() {
  return (
    <MarketingLayout
      title="À propos de Sellia"
      description="Sellia est la plateforme e-commerce premium développée par Liafrik pour permettre à tout marchand de lancer, gérer et développer une boutique en ligne à l'international."
      url="/a-propos"
    >
      <section className="relative overflow-hidden bg-[#0A0A0A] py-16 lg:py-20">
        <div className="absolute inset-0">
          <img src="/marketing/hero/robinhiggins-confident-3082818_1920.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-[#0A0A0A]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">À propos de Sellia</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">
            Sellia est développée par Liafrik pour donner aux marchands du monde entier une alternative premium aux grandes plateformes e-commerce — plus complète sur les paiements locaux, plus simple à prendre en main, et pensée pour vendre à l'international dès le premier jour.
          </p>
        </div>
      </section>

      <section className="py-14 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-landing font-bold text-3xl text-[#202223]">{s.value}</p>
              <p className="mt-1 text-sm text-[#6D7175]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-landing font-semibold text-2xl sm:text-3xl text-[#202223] text-center tracking-tight">Notre mission</h2>
          <p className="mt-4 max-w-2xl mx-auto text-center text-[#6D7175] leading-relaxed">
            Donner à tout marchand — d'Abidjan à Paris, de Lagos à Montréal — les mêmes outils premium que les plus grandes marques, sans la complexité technique ni les coûts cachés des plateformes historiques.
          </p>
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white border border-[#E1E1E1] rounded-2xl p-6">
                <v.icon className="w-6 h-6 text-[#008060]" />
                <h3 className="mt-4 font-landing font-semibold text-lg text-[#202223]">{v.title}</h3>
                <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-landing font-bold text-2xl sm:text-3xl text-[#202223] tracking-tight">Envie de rejoindre l'aventure Sellia ?</h2>
          <p className="mt-3 text-[#6D7175]">Lancez votre boutique aujourd'hui, ou découvrez nos offres d'emploi.</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition-colors shadow-lg shadow-[#008060]/20">
              Créer ma boutique <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/carrieres" className="inline-flex items-center gap-2 border border-[#E1E1E1] text-[#202223] font-semibold px-6 py-3 rounded-full text-sm hover:bg-black/5 transition-colors">
              Voir les carrières
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

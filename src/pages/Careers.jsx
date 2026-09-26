import { Mail, Globe2, Rocket, HeartHandshake } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

const REASONS = [
  { icon: Globe2, title: 'Impact international', text: "Votre travail sert des marchands sur plusieurs continents, dès le premier jour." },
  { icon: Rocket, title: 'Un produit qui bouge vite', text: "Nouvelles fonctionnalités, nouveaux marchés, nouveaux moyens de paiement — l'équipe avance vite et ship souvent." },
  { icon: HeartHandshake, title: 'Une équipe à taille humaine', text: "Chez Liafrik, chaque personne compte et a un impact direct et visible sur le produit." },
];

export default function Careers() {
  return (
    <MarketingLayout
      title="Carrières"
      description="Rejoignez l'équipe Liafrik qui développe Sellia, la plateforme e-commerce premium. Découvrez notre mission et comment postuler."
      url="/carrieres"
    >
      <section className="relative overflow-hidden bg-[#0A0A0A] py-16 lg:py-20">
        <div className="absolute inset-0">
          <img src="/marketing/hero/t_ushar-watch-3891591_1920.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-[#0A0A0A]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">Carrières chez Sellia</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">
            Sellia est développée par l'équipe Liafrik. Nous grandissons vite et sommes toujours à l'écoute de profils talentueux — même en dehors de nos offres publiées.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid sm:grid-cols-3 gap-6">
          {REASONS.map((r) => (
            <div key={r.title} className="bg-white border border-[#E1E1E1] rounded-2xl p-6 text-center">
              <r.icon className="w-6 h-6 text-[#008060] mx-auto" />
              <h3 className="mt-4 font-landing font-semibold text-base text-[#202223]">{r.title}</h3>
              <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-12 text-center bg-[#F8F9FA] border border-[#E1E1E1] rounded-2xl p-8">
          <h2 className="font-landing font-semibold text-xl text-[#202223]">Aucun poste ouvert ne correspond à votre profil ?</h2>
          <p className="mt-3 text-sm text-[#6D7175]">Envoyez-nous votre candidature spontanée — nous lisons chaque message.</p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Candidature%20spontan%C3%A9e`} className="mt-5 inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition-colors">
            <Mail className="w-4 h-4" /> Postuler par e-mail
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}

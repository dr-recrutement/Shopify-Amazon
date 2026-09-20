import { Star, Quote } from 'lucide-react';
import { Image } from '@/components/ui/image';

const ITEMS = [
  {
    quote: 'J’ai lancé ma boutique de mode wax en un après-midi. Les paiements mobile money ont transformé mes ventes — mes clients n’ont plus besoin de cash.',
    author: 'Aïssatou Diop',
    role: 'Fondatrice, Boutique Mode Wax — Dakar',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    quote: 'Sellia gère le multi-devises nativement. Mes clients au Nigeria et en Côte d’Ivoire paient sans friction, et je suis tout depuis un seul dashboard.',
    author: 'Emeka Okoro',
    role: 'CEO, TechMart — Lagos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    quote: 'L’éditeur de thème est intuitif et les thèmes sont sublimes. Mon image de marque a changé de niveau, et l’assistant IA m’a fait gagner des heures.',
    author: 'Sarah Koné',
    role: 'Fondatrice, Abidjan Beauty',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
  },
];

const STATS = [
  { value: '12 000+', label: 'Marchands actifs' },
  { value: '40+', label: 'Pays couverts' },
  { value: '8,5 M$', label: 'Ventes traitées' },
  { value: '99,9 %', label: 'Disponibilité' },
];

export default function LandingTestimonials() {
  return (
    <section id="temoignages" className="py-20 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">Témoignages</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">Ils vendent avec Sellia</h2>
          <p className="mt-3 text-muted-foreground text-lg">Des milliers de marchands à travers le monde font confiance à Sellia.</p>
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center rounded-2xl border border-border bg-surface p-6">
              <p className="font-landing font-extrabold text-3xl text-brand">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {ITEMS.map((t) => (
            <div key={t.author} className="rounded-2xl border border-border bg-white p-7 flex flex-col hover:shadow-lg transition-shadow">
              <Quote className="w-8 h-8 text-brand/20" />
              <div className="mt-2 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="mt-4 text-foreground leading-relaxed flex-1">{t.quote}</p>
              <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-surface shrink-0">
                  <Image src={t.avatar} alt={t.author} fittingType="fill" className="w-full h-full" />
                </div>
                <div>
                  <p className="font-landing font-bold text-foreground text-sm">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
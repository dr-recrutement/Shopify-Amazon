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
  const loop = [...ITEMS, ...ITEMS];
  return (
    <section id="temoignages" className="py-14 lg:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">Témoignages</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">Ils vendent avec Sellia</h2>
          <p className="mt-3 text-muted-foreground text-lg">Des milliers de marchands à travers le monde font confiance à Sellia.</p>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="text-center rounded-xl border border-border bg-surface p-4">
              <p className="font-landing font-extrabold text-2xl text-brand">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scrolling testimonials banner */}
      <div className="relative mt-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-4 w-max animate-scroll-x">
          {loop.map((t, i) => (
            <div key={i} className="w-[320px] shrink-0 rounded-2xl border border-border bg-white p-5 flex flex-col">
              <div className="flex items-center justify-between">
                <Quote className="w-6 h-6 text-brand/20" />
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground leading-relaxed flex-1 line-clamp-4">{t.quote}</p>
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-surface shrink-0">
                  <Image src={t.avatar} alt={t.author} fittingType="fill" className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <p className="font-landing font-bold text-foreground text-xs truncate">{t.author}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
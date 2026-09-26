import { useTranslation } from 'react-i18next';
import { Star, Quote } from 'lucide-react';
import { Image } from '@/components/ui/image';

// Avatars and author names are illustrative composite personas (not real
// identifiable people), so translating their quotes across languages is
// just ordinary marketing copy — the photos and names stay fixed while
// t() swaps the quote/role text per language.
const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
];
const AUTHORS = ['Aïssatou Diop', 'Emeka Okoro', 'Sarah Koné'];

export default function LandingTestimonials() {
  const { t } = useTranslation();
  const items = t('landing.testimonials.items', { returnObjects: true }).map((it, i) => ({ ...it, avatar: AVATARS[i], author: AUTHORS[i] }));
  const stats = t('landing.testimonials.stats', { returnObjects: true });
  const loop = [...items, ...items];

  return (
    <section id="temoignages" className="py-14 lg:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">{t('landing.testimonials.eyebrow')}</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">{t('landing.testimonials.h2')}</h2>
          <p className="mt-3 text-muted-foreground text-lg">{t('landing.testimonials.p')}</p>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
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
          {loop.map((t2, i) => (
            <div key={i} className="w-[320px] shrink-0 rounded-2xl border border-border bg-white p-5 flex flex-col">
              <div className="flex items-center justify-between">
                <Quote className="w-6 h-6 text-brand/20" />
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground leading-relaxed flex-1 line-clamp-4">{t2.quote}</p>
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-surface shrink-0">
                  <Image src={t2.avatar} alt={t2.author} fittingType="fill" className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <p className="font-landing font-bold text-foreground text-xs truncate">{t2.author}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t2.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

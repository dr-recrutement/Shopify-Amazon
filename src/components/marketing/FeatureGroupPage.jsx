import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';

// Scrolls to the item the visitor actually clicked in the nav (e.g.
// /fonctionnalites/gerer#paiements-integres) instead of always landing at
// the top of the page — react-router doesn't do this automatically on its
// own for in-page hashes.
function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [hash]);
}

export default function FeatureGroupPage({ eyebrow, title, description, url, intro, sections, heroImage }) {
  const { t } = useTranslation();
  useHashScroll();
  return (
    <MarketingLayout title={title} description={description} url={url}>
      <section className="relative overflow-hidden bg-[#0A0A0A] py-16 lg:py-20">
        {heroImage && (
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-[#0A0A0A]" />
          </div>
        )}
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold text-white">{eyebrow}</span>
          <h1 className="mt-6 font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">{title}</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">{intro}</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
          {sections.map((s, i) => (
            <div key={s.id} id={s.id} className={`grid lg:grid-cols-2 gap-10 items-center scroll-mt-24 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#008060]/10 flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-[#008060]" />
                </div>
                <h2 className="mt-5 font-landing font-semibold text-2xl text-[#202223] tracking-tight">{s.title}</h2>
                <p className="mt-3 text-[#6D7175] leading-relaxed">{s.text}</p>
                <ul className="mt-5 space-y-2.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-[#202223]">
                      <span className="w-5 h-5 rounded-full bg-[#008060] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden border border-[#E1E1E1] shadow-xl">
                <img src={s.image} alt={s.title} className="w-full aspect-[4/3] object-cover" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-landing font-bold text-2xl sm:text-3xl text-[#202223] tracking-tight">{t('pages.feature_group_cta.h2')}</h2>
          <p className="mt-3 text-[#6D7175]">{t('pages.feature_group_cta.p')}</p>
          <Link to="/register" className="mt-6 inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-7 py-3.5 rounded-full text-sm hover:bg-[#00694d] transition-colors shadow-lg shadow-[#008060]/20">
            {t('pages.feature_group_cta.button')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}

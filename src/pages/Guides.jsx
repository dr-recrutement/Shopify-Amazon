import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Calendar } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { GUIDES, localizeGuide } from '@/lib/guides';

export default function Guides() {
  const { t, i18n } = useTranslation();
  const locale = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', pt: 'pt-PT', ar: 'ar', sw: 'sw', wo: 'fr-FR' }[i18n.language] || 'fr-FR';
  const guides = GUIDES.map((g) => localizeGuide(g, t));

  return (
    <MarketingLayout
      title={t('pages.guides_index.meta_title')}
      description={t('pages.guides_index.meta_desc')}
      url="/guides"
    >
      <section className="relative overflow-hidden bg-[#0A0A0A] py-16 lg:py-20">
        <div className="absolute inset-0">
          <img src="/marketing/hero/thedigitalartist-shopping-4360296_1920.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-[#0A0A0A]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">{t('pages.guides_index.h1')}</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">{t('pages.guides_index.hero_p')}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          {guides.map((g) => (
            <Link key={g.slug} to={`/guides/${g.slug}`} className="block bg-white border border-[#E1E1E1] rounded-2xl p-6 hover:border-[#008060] hover:shadow-lg transition-all">
              <div className="flex items-center gap-1.5 text-xs text-[#6D7175]">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(g.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <h2 className="mt-2 font-landing font-semibold text-lg text-[#202223]">{g.title}</h2>
              <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{g.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060]">{t('pages.guides_index.read_more')} <ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}

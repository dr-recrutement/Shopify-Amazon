import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Globe2, Users, ShieldCheck, Sparkles } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';

const VALUE_ICONS = [Globe2, ShieldCheck, Users, Sparkles];

export default function About() {
  const { t } = useTranslation();
  const p = (k) => t(`pages.about.${k}`);
  const stats = t('pages.about.stats', { returnObjects: true });
  const values = t('pages.about.values', { returnObjects: true });

  return (
    <MarketingLayout title={p('meta_title')} description={p('meta_desc')} url="/a-propos">
      <section className="relative overflow-hidden bg-[#0A0A0A] py-16 lg:py-20">
        <div className="absolute inset-0">
          <img src="/marketing/hero/robinhiggins-confident-3082818_1920.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-[#0A0A0A]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">{p('h1')}</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">{p('hero_p')}</p>
        </div>
      </section>

      <section className="py-14 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-landing font-bold text-3xl text-[#202223]">{s.value}</p>
              <p className="mt-1 text-sm text-[#6D7175]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-landing font-semibold text-2xl sm:text-3xl text-[#202223] text-center tracking-tight">{p('mission_h2')}</h2>
          <p className="mt-4 max-w-2xl mx-auto text-center text-[#6D7175] leading-relaxed">{p('mission_p')}</p>
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            {values.map((v, i) => {
              const Icon = VALUE_ICONS[i];
              return (
                <div key={v.title} className="bg-white border border-[#E1E1E1] rounded-2xl p-6">
                  <Icon className="w-6 h-6 text-[#008060]" />
                  <h3 className="mt-4 font-landing font-semibold text-lg text-[#202223]">{v.title}</h3>
                  <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{v.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-landing font-bold text-2xl sm:text-3xl text-[#202223] tracking-tight">{p('cta_h2')}</h2>
          <p className="mt-3 text-[#6D7175]">{p('cta_p')}</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition-colors shadow-lg shadow-[#008060]/20">
              {p('cta_button1')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/carrieres" className="inline-flex items-center gap-2 border border-[#E1E1E1] text-[#202223] font-semibold px-6 py-3 rounded-full text-sm hover:bg-black/5 transition-colors">
              {p('cta_button2')}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

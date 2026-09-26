import { useTranslation } from 'react-i18next';
import { Mail, Globe2, Rocket, HeartHandshake } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

const REASON_ICONS = [Globe2, Rocket, HeartHandshake];

export default function Careers() {
  const { t } = useTranslation();
  const p = (k) => t(`pages.careers.${k}`);
  const reasons = t('pages.careers.reasons', { returnObjects: true });

  return (
    <MarketingLayout title={p('meta_title')} description={p('meta_desc')} url="/carrieres">
      <section className="relative overflow-hidden bg-[#0A0A0A] py-16 lg:py-20">
        <div className="absolute inset-0">
          <img src="/marketing/hero/t_ushar-watch-3891591_1920.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-[#0A0A0A]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">{p('h1')}</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">{p('hero_p')}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid sm:grid-cols-3 gap-6">
          {reasons.map((r, i) => {
            const Icon = REASON_ICONS[i];
            return (
              <div key={r.title} className="bg-white border border-[#E1E1E1] rounded-2xl p-6 text-center">
                <Icon className="w-6 h-6 text-[#008060] mx-auto" />
                <h3 className="mt-4 font-landing font-semibold text-base text-[#202223]">{r.title}</h3>
                <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{r.text}</p>
              </div>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-12 text-center bg-[#F8F9FA] border border-[#E1E1E1] rounded-2xl p-8">
          <h2 className="font-landing font-semibold text-xl text-[#202223]">{p('spontaneous_h2')}</h2>
          <p className="mt-3 text-sm text-[#6D7175]">{p('spontaneous_p')}</p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Candidature%20spontan%C3%A9e`} className="mt-5 inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition-colors">
            <Mail className="w-4 h-4" /> {p('spontaneous_button')}
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}

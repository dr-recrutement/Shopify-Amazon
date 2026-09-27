import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, Server, CreditCard, RefreshCw, Eye } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

const ICONS = [Lock, CreditCard, Server, RefreshCw, Eye, ShieldCheck];

export default function Security() {
  const { t } = useTranslation();
  const s = (k) => t(`pages.security.${k}`);
  const points = t('pages.security.points', { returnObjects: true });

  return (
    <MarketingLayout title={s('meta_title')} description={s('meta_desc')} url="/securite">
      <section className="relative overflow-hidden bg-[#0A0A0A] py-16 lg:py-20">
        <div className="absolute inset-0">
          <img src="/marketing/hero/digitalmarketingagency-marketing-online-1427787_1920.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-[#0A0A0A]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold text-white">
            <ShieldCheck className="w-3.5 h-3.5" /> {s('badge')}
          </span>
          <h1 className="mt-6 font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">{s('h1')}</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">{s('hero_p')}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 gap-6">
          {points.map((p, i) => {
            const Icon = ICONS[i];
            return (
              <div key={p.title} className="bg-white border border-[#E1E1E1] rounded-2xl p-6">
                <Icon className="w-6 h-6 text-[#008060]" />
                <h2 className="mt-4 font-landing font-semibold text-lg text-[#202223]">{p.title}</h2>
                <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{p.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-landing font-semibold text-xl text-[#202223]">{s('contact_h2')}</h2>
          <p className="mt-3 text-sm text-[#6D7175]">{s('contact_p')}</p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=S%C3%A9curit%C3%A9`} className="mt-5 inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition-colors">
            {s('contact_button')}
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}

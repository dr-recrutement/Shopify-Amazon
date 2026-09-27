import { useTranslation } from 'react-i18next';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

export default function LegalNotice() {
  const { t } = useTranslation();
  const sections = t('pages.legal.sections', { returnObjects: true });

  return (
    <MarketingLayout title={t('pages.legal.meta_title')} description={t('pages.legal.meta_desc')} url="/mentions-legales">
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="font-landing font-semibold text-3xl text-[#202223] tracking-tight">{t('pages.legal.h1')}</h1>
          <div className="mt-10 space-y-8">
            {sections.map((s) => (
              <div key={s.t}>
                <h2 className="font-landing font-semibold text-lg text-[#202223]">{s.t}</h2>
                <p className="mt-2 text-sm text-[#44474A] leading-relaxed whitespace-pre-line">{s.b.replace('{{email}}', SUPPORT_EMAIL)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

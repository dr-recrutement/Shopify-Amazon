import { useTranslation } from 'react-i18next';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

const IDS = ['', '', 'rgpd', 'cookies', 'securite', '', '', ''];

export default function Privacy() {
  const { t, i18n } = useTranslation();
  const sections = t('pages.privacy.sections', { returnObjects: true });
  const locale = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', pt: 'pt-PT', ar: 'ar', sw: 'sw', wo: 'fr-FR' }[i18n.language] || 'fr-FR';

  return (
    <MarketingLayout title={t('pages.privacy.meta_title')} description={t('pages.privacy.meta_desc')} url="/confidentialite">
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="font-landing font-semibold text-3xl text-[#202223] tracking-tight">{t('pages.privacy.h1')}</h1>
          <p className="mt-2 text-sm text-[#6D7175]">{t('pages.updated_label')} {new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p>
          <div className="mt-10 space-y-8">
            {sections.map((s, i) => (
              <div key={s.t} id={IDS[i] || undefined}>
                <h2 className="font-landing font-semibold text-lg text-[#202223]">{s.t}</h2>
                <p className="mt-2 text-sm text-[#44474A] leading-relaxed">{s.b.replace('{{email}}', SUPPORT_EMAIL)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

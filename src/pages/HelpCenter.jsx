import { useTranslation } from 'react-i18next';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import Support from '@/pages/Support';

// Public entry point for the help center. The FAQ content itself lives in
// Support.jsx (also reused as an embedded tab inside the merchant's
// Settings page), so this file only adds the marketing header/footer and
// page-level SEO needed to make it reachable and indexable without login -
// previously this content was accidentally only reachable via /support
// behind authentication, invisible to both visitors and search engines.
export default function HelpCenter() {
  const { t } = useTranslation();
  return (
    <MarketingLayout
      title={t('pages.help.meta_title')}
      description={t('pages.help.meta_desc')}
      url="/centre-aide"
    >
      <div className="py-10">
        <Support />
      </div>
    </MarketingLayout>
  );
}

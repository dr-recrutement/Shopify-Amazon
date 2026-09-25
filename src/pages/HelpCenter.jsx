import MarketingLayout from '@/components/marketing/MarketingLayout';
import Support from '@/pages/Support';

// Public entry point for the help center. The FAQ content itself lives in
// Support.jsx (also reused as an embedded tab inside the merchant's
// Settings page), so this file only adds the marketing header/footer and
// page-level SEO needed to make it reachable and indexable without login -
// previously this content was accidentally only reachable via /support
// behind authentication, invisible to both visitors and search engines.
export default function HelpCenter() {
  return (
    <MarketingLayout
      title="Centre d'aide"
      description="Trouvez des réponses sur la création de votre boutique, les paiements, la livraison et les thèmes Sellia. Contactez le support à support@liafrik.com."
      url="/centre-aide"
    >
      <div className="py-10">
        <Support />
      </div>
    </MarketingLayout>
  );
}

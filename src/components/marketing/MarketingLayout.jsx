import { useEffect } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { applySEO, applyOrganizationJsonLd } from '@/lib/seo';

// Shared chrome for every public marketing/content page (about, legal,
// help center, guides, comparison pages) so none of them are ever an
// orphan page with no way back to the rest of the site - the exact defect
// that left /support unreachable and un-navigable before this change.
export default function MarketingLayout({ title, description, url, children, faqJsonLd }) {
  useEffect(() => {
    applyOrganizationJsonLd();
    applySEO({
      title: title ? `${title} | Sellia` : 'Sellia',
      description,
      url: url ? `https://sellia.liafrik.com${url}` : undefined,
    });
  }, [title, description, url]);

  return (
    <div className="min-h-screen bg-background font-landing flex flex-col">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}

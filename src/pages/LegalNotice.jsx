import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

export default function LegalNotice() {
  return (
    <MarketingLayout
      title="Mentions légales"
      description="Mentions légales de la plateforme Sellia, éditée par Liafrik."
      url="/mentions-legales"
    >
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="font-landing font-semibold text-3xl text-[#202223] tracking-tight">Mentions légales</h1>

          <div className="mt-10 space-y-8">
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">Éditeur</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">La plateforme Sellia est éditée par Liafrik. Pour toute demande relative à l'éditeur, contactez {SUPPORT_EMAIL}.</p>
            </div>
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">Hébergement</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">La plateforme est hébergée par des prestataires cloud professionnels garantissant la disponibilité, la sécurité et la redondance des données des marchands.</p>
            </div>
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">Propriété intellectuelle</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">La marque Sellia, son logo, son interface et l'ensemble des éléments graphiques et logiciels de la plateforme sont la propriété de Liafrik et sont protégés par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.</p>
            </div>
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">Contact</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Support technique : {SUPPORT_EMAIL}<br />Service client : cs@liafrik.com</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

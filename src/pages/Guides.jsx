import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { GUIDES } from '@/lib/guides';

export default function Guides() {
  return (
    <MarketingLayout
      title="Guides e-commerce"
      description="Guides pratiques sur le choix d'une plateforme e-commerce, la migration vers Sellia et les paiements Mobile Money en Afrique."
      url="/guides"
    >
      <section className="bg-[#0A0A0A] py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">Guides Sellia</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">
            Choisir sa plateforme, migrer sans risque, vendre à l'international — nos guides pour e-commerçants.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          {GUIDES.map((g) => (
            <Link key={g.slug} to={`/guides/${g.slug}`} className="block bg-white border border-[#E1E1E1] rounded-2xl p-6 hover:border-[#008060] hover:shadow-lg transition-all">
              <div className="flex items-center gap-1.5 text-xs text-[#6D7175]">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(g.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <h2 className="mt-2 font-landing font-semibold text-lg text-[#202223]">{g.title}</h2>
              <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{g.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060]">Lire le guide <ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}

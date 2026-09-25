import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowRight, Check, X, Minus } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { COMPETITORS, COMPETITOR_LIST } from '@/lib/competitors';
import { applyFAQJsonLd } from '@/lib/seo';

function Cell({ value }) {
  if (value === true) return <Check className="w-5 h-5 text-[#008060] mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-red-400 mx-auto" />;
  return <span className="text-sm text-[#202223]">{value}</span>;
}

// Takes `brand` as a prop (one static <Route> per competitor in App.jsx)
// rather than a route param: react-router v6 does not match a dynamic
// segment mixed with static text in the same path chunk (confirmed via
// matchPath — "/alternative-a-:brand" never matches "/alternative-a-shopify"),
// so a single param-based route would silently 404 on every one of these
// URLs. Falls back to useParams()/brand for safety if ever reused behind a
// real param route.
export default function AlternativeTo({ brand: brandProp }) {
  const { brand: brandParam } = useParams();
  const brand = brandProp || brandParam;
  const data = COMPETITORS[brand];

  const faqs = data ? [
    { q: `Sellia est-il vraiment moins cher que ${data.name} ?`, a: `Sellia démarre à 7$/mois avec les fonctionnalités essentielles incluses (thèmes, paiements, multi-devises), sans les coûts additionnels souvent nécessaires avec ${data.name}. Le tarif exact dépend de vos besoins — comparez les plans en détail ci-dessus.` },
    { q: `Puis-je migrer facilement depuis ${data.name} vers Sellia ?`, a: `Oui. L'équipe Sellia peut vous accompagner pour importer vos produits, clients et commandes. Contactez support@liafrik.com pour démarrer votre migration.` },
    { q: 'Sellia prend-il en charge le Mobile Money ?', a: 'Oui, nativement : Orange Money, Wave, MTN Mobile Money, Airtel Money et plus de 25 prestataires de paiement mondiaux, sans redirection hors de votre boutique.' },
  ] : [];

  useEffect(() => {
    if (data) applyFAQJsonLd('sellia-jsonld-faq-alt', faqs);
  }, [data, faqs]);

  if (!data) return <Navigate to="/" replace />;

  return (
    <MarketingLayout title={data.metaTitle} description={data.metaDescription} url={`/alternative-a-${data.slug}`}>
      {/* Hero */}
      <section className="bg-[#0A0A0A] py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold text-white">
            Comparatif {new Date().getFullYear()}
          </span>
          <h1 className="mt-6 font-landing font-semibold text-white text-3xl sm:text-4xl lg:text-[2.5rem] leading-[1.15] tracking-tight">
            La meilleure alternative à {data.name}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">{data.intro}</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition-colors shadow-xl shadow-[#008060]/30">
              Essayer Sellia gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#comparatif" className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/20 transition-colors">
              Voir le comparatif
            </a>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-14 bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-landing font-semibold text-xl sm:text-2xl text-[#202223] text-center">Les limites de {data.name} pour les marchands d'aujourd'hui</h2>
          <ul className="mt-8 grid sm:grid-cols-1 gap-4">
            {data.painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-3 bg-white border border-[#E1E1E1] rounded-2xl p-5">
                <Minus className="w-4 h-4 mt-1 text-red-400 shrink-0" />
                <span className="text-sm text-[#44474A] leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comparison table */}
      <section id="comparatif" className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-landing font-semibold text-2xl sm:text-3xl text-[#202223] text-center tracking-tight">Sellia vs {data.name}</h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-[#E1E1E1]">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-[#0A0A0A]">
                  <th className="p-4 text-sm font-semibold text-white/70">Critère</th>
                  <th className="p-4 text-sm font-bold text-white text-center">Sellia</th>
                  <th className="p-4 text-sm font-semibold text-white/70 text-center">{data.name}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]'}>
                    <td className="p-4 text-sm font-medium text-[#202223] border-t border-[#E1E1E1]">{r.label}</td>
                    <td className="p-4 text-center border-t border-[#E1E1E1] font-semibold"><Cell value={r.sellia} /></td>
                    <td className="p-4 text-center border-t border-[#E1E1E1]"><Cell value={r.them} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-[#6D7175] text-center">Comparaison basée sur les offres publiques de {data.name} et de Sellia au {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}. Les tarifs et fonctionnalités des concurrents peuvent évoluer.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-landing font-semibold text-2xl text-[#202223] text-center">Questions fréquentes</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white border border-[#E1E1E1] rounded-2xl p-5">
                <p className="font-semibold text-[#202223] text-sm">{f.q}</p>
                <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-landing font-bold text-2xl sm:text-3xl text-[#202223] tracking-tight">Prêt à passer à Sellia ?</h2>
          <p className="mt-3 text-[#6D7175]">14 jours d'essai gratuit. Sans carte bancaire. Migration accompagnée depuis {data.name}.</p>
          <Link to="/register" className="mt-6 inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-7 py-3.5 rounded-full text-sm hover:bg-[#00694d] transition-colors shadow-lg shadow-[#008060]/20">
            Créer ma boutique <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Internal links to the other comparison pages — keeps crawl
              depth shallow across all six pages instead of relying only on
              the footer. */}
          <div className="mt-10 pt-8 border-t border-[#E1E1E1]">
            <p className="text-xs font-semibold text-[#6D7175] uppercase tracking-wide">Autres comparatifs</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {COMPETITOR_LIST.filter((c) => c.slug !== data.slug).map((c) => (
                <Link key={c.slug} to={`/alternative-a-${c.slug}`} className="text-sm font-medium text-[#008060] hover:underline px-3 py-1.5">
                  Alternative à {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { GUIDES, getGuide } from '@/lib/guides';
import { applyArticleJsonLd } from '@/lib/seo';

export default function GuideArticle() {
  const { slug } = useParams();
  const guide = getGuide(slug);

  useEffect(() => {
    if (guide) {
      applyArticleJsonLd({
        headline: guide.title,
        description: guide.excerpt,
        datePublished: guide.date,
        author: 'Sellia',
        url: `https://sellia.liafrik.com/guides/${guide.slug}`,
      });
    }
  }, [guide]);

  if (!guide) return <Navigate to="/guides" replace />;

  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 2);

  return (
    <MarketingLayout title={guide.title} description={guide.excerpt} url={`/guides/${guide.slug}`}>
      <article className="py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link to="/guides" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D7175] hover:text-[#202223]">
            <ArrowLeft className="w-4 h-4" /> Tous les guides
          </Link>
          <div className="mt-6 flex items-center gap-1.5 text-xs text-[#6D7175]">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(guide.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 className="mt-3 font-landing font-semibold text-2xl sm:text-3xl text-[#202223] tracking-tight leading-tight">{guide.title}</h1>
          <div className="mt-8 space-y-5">
            {guide.body.map((p, i) => (
              <p key={i} className="text-[#44474A] leading-relaxed">{p}</p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-[#E1E1E1] text-center bg-[#F8F9FA] rounded-2xl p-8">
            <h2 className="font-landing font-semibold text-xl text-[#202223]">Prêt à lancer votre boutique ?</h2>
            <p className="mt-2 text-sm text-[#6D7175]">14 jours d'essai gratuit sur Sellia, sans carte bancaire.</p>
            <Link to="/register" className="mt-5 inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition-colors">
              Commencer maintenant <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {others.length > 0 && (
            <div className="mt-12">
              <p className="text-xs font-semibold text-[#6D7175] uppercase tracking-wide">À lire aussi</p>
              <div className="mt-3 space-y-3">
                {others.map((g) => (
                  <Link key={g.slug} to={`/guides/${g.slug}`} className="block text-sm font-semibold text-[#008060] hover:underline">{g.title}</Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </MarketingLayout>
  );
}

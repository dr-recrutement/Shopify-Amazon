import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme } from '@/lib/themes';
import { applySEO, applyArticleJsonLd } from '@/lib/seo';

// Was calling base44.functions.invoke('publicStore', ...) - a Base44 edge
// function that no longer exists, so this page has been fully broken since
// the migration off Base44 earlier this session. Rewritten onto the same
// real tables Storefront.jsx uses (tenants, theme_configs.published_config,
// content_pages for the article itself - no dedicated blog-post table
// exists yet, same limitation noted there).
export default function ArticleDetail() {
  const { slug, handle } = useParams();
  const [store, setStore] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => cloneTheme(DEFAULT_THEME_ID));

  const load = useCallback(async () => {
    if (!slug || !handle) return;
    setLoading(true);
    try {
      const { data: tenant, error: tenantError } = await supabase.from('tenants').select('*').eq('slug', slug).maybeSingle();
      if (tenantError) throw tenantError;
      if (!tenant) throw new Error('Cette boutique n\u2019existe pas.');
      setStore(tenant);

      const [themeRes, pageRes] = await Promise.all([
        supabase.from('theme_configs').select('published_config').eq('tenant_id', tenant.id).maybeSingle(),
        supabase.from('content_pages').select('*').eq('tenant_id', tenant.id).eq('slug', handle).eq('status', 'published').maybeSingle(),
      ]);
      setTheme(isValidTheme(themeRes.data?.published_config) ? themeRes.data.published_config : cloneTheme(DEFAULT_THEME_ID));
      if (!pageRes.data) throw new Error('Article introuvable');
      setArticle(pageRes.data);
      setError(null);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [slug, handle]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!store || !article) return;
    const plainExcerpt = (article.body || '').replace(/<[^>]*>/g, '').slice(0, 160);
    const url = `${window.location.origin}/store/${slug}/blog/${handle}`;
    applySEO({ title: `${article.title} — ${store.name}`, description: plainExcerpt, url, countryCode: store.country, type: 'article' });
    applyArticleJsonLd({ headline: article.title, description: plainExcerpt, datePublished: article.published_at, url });
  }, [store, article, slug, handle]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#008060]" /></div>;
  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <AlertCircle className="w-10 h-10 text-[#6D7175] mx-auto mb-3" />
      <h1 className="text-lg font-bold text-[#202223]">Article introuvable</h1>
      <p className="text-sm text-[#6D7175] mt-1">{error}</p>
      <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-4">Retour à la boutique</Link>
    </div>
  );
  if (!store || !article) return null;

  const p = theme.palette;

  return (
    <div className="min-h-screen bg-white" style={{ color: p.text, fontFamily: theme.fonts?.body }}>
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b" style={{ borderColor: p.border }}>
        <Link to={`/store/${slug}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: p.dark }}>
          <ArrowLeft className="w-4 h-4" /> {store.name}
        </Link>
        <span className="text-xs font-medium" style={{ color: p.muted }}>Blog</span>
      </header>

      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{article.title}</h1>
        {article.published_at && (
          <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: p.muted }}>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        )}
        <div className="mt-6 prose prose-sm max-w-none text-sm leading-relaxed [&_a]:underline" style={{ color: p.text }} dangerouslySetInnerHTML={{ __html: article.body || '' }} />
        <Link to={`/store/${slug}`} className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: theme.palette.primary }}>
          Retour à la boutique <ArrowRight className="w-4 h-4" />
        </Link>
      </article>
    </div>
  );
}

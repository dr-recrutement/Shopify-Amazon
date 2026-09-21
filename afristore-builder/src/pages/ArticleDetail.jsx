import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Calendar, User, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cloneTheme, DEFAULT_THEME_ID } from '@/lib/themes';

const CUSTOM_KEY = 'sellia_theme_custom';
const THEME_KEY = 'sellia_theme';

function loadTheme() {
  const custom = localStorage.getItem(CUSTOM_KEY);
  if (custom) { try { return JSON.parse(custom); } catch { /* fall through */ } }
  return cloneTheme(localStorage.getItem(THEME_KEY) || DEFAULT_THEME_ID);
}

export default function ArticleDetail() {
  const { slug, handle } = useParams();
  const [store, setStore] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(loadTheme);

  const load = useCallback(async () => {
    if (!slug || !handle) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('publicStore', { slug });
      if (res.data?.error) throw new Error(res.data.error);
      setStore(res.data.store);
      const found = (res.data.articles || []).find((a) => a.handle === handle);
      if (!found) throw new Error('Article introuvable');
      setArticle(found);
      setError(null);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [slug, handle]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#008060]" /></div>;
  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <AlertCircle className="w-10 h-10 text-[#6D7175] mx-auto mb-3" />
      <h1 className="text-lg font-bold text-[#202223]">Article introuvable</h1>
      <p className="text-sm text-[#6D7175] mt-1">{error}</p>
      <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-4">Retour \u00e0 la boutique</Link>
    </div>
  );
  if (!store || !article) return null;

  const p = theme.palette;

  return (
    <div className="min-h-screen bg-white" style={{ color: p.text, fontFamily: theme.fonts?.body }}>
      {/* Simple header */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b" style={{ borderColor: p.border }}>
        <Link to={`/store/${slug}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: p.dark }}>
          <ArrowLeft className="w-4 h-4" /> {store.name}
        </Link>
        <span className="text-xs font-medium" style={{ color: p.muted }}>Blog</span>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{article.title}</h1>
        <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: p.muted }}>
          {article.author && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {article.author}</span>}
          {article.published_at && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
        </div>
        {article.featured_image && (
          <div className="mt-6 rounded-2xl overflow-hidden aspect-[16/9]">
            <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}
        {article.excerpt && <p className="mt-6 text-base font-medium leading-relaxed" style={{ color: p.muted }}>{article.excerpt}</p>}
        <div className="mt-6 prose prose-sm max-w-none text-sm leading-relaxed [&_a]:underline" style={{ color: p.text }} dangerouslySetInnerHTML={{ __html: article.content || '' }} />
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t" style={{ borderColor: p.border }}>
            {article.tags.map((t) => (
              <span key={t} className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: p.surface, color: p.muted }}>#{t}</span>
            ))}
          </div>
        )}
        <Link to={`/store/${slug}`} className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: theme.palette.primary }}>
          Retour \u00e0 la boutique <ArrowRight className="w-4 h-4" />
        </Link>
      </article>
    </div>
  );
}
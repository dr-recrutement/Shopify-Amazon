import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ThemeRenderer from '@/components/theme/ThemeRenderer';
import { cloneTheme, DEFAULT_THEME_ID } from '@/lib/themes';

const THEME_KEY = 'sellia_theme';
const CUSTOM_KEY = 'sellia_theme_custom';

function loadTheme() {
  const custom = localStorage.getItem(CUSTOM_KEY);
  if (custom) { try { return JSON.parse(custom); } catch { /* fall through */ } }
  return cloneTheme(localStorage.getItem(THEME_KEY) || DEFAULT_THEME_ID);
}

export default function StorefrontPage() {
  const { slug, handle } = useParams();
  const [store, setStore] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme] = useState(loadTheme);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await base44.functions.invoke('publicStore', { slug });
        if (res.data?.error) throw new Error(res.data.error);
        const s = res.data.store;
        const pages = res.data.pages || [];
        const found = pages.find((p) => p.handle === handle || p.id === handle);
        if (!alive) return;
        setStore(s);
        if (!found) setError('Page introuvable');
        else setPage(found);
      } catch (e) {
        if (alive) setError(e.message || 'Boutique introuvable');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug, handle]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (error || !store) return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <h1 className="text-lg font-bold text-foreground">{error || 'Page introuvable'}</h1>
      <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-brand/90 mt-4">Retour à la boutique</Link>
    </div>
  );

  const headerSection = theme.sections.find((s) => s.type === 'header');
  const footerSection = theme.sections.find((s) => s.type === 'footer');
  const p = theme.palette;

  return (
    <div className="min-h-screen bg-white">
      {headerSection && <ThemeRenderer theme={theme} sections={[headerSection]} mode="storefront" storeSlug={slug} />}
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
        <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-4 h-4" /> Retour à la boutique</Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{page.title}</h1>
        <div className="sellia-page" dangerouslySetInnerHTML={{ __html: page.content || '' }} />
      </div>
      {footerSection && <ThemeRenderer theme={theme} sections={[footerSection]} mode="storefront" storeSlug={slug} />}
    </div>
  );
}
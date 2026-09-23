import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { Search, Sparkles, Loader2, Check, ArrowLeft, Package, Copy, AlertCircle } from 'lucide-react';

// SEO title/description stored in products.metafields.seo (no dedicated
// seo column exists). Uses the real ai-assistant Edge Function (merchant's
// own configured key, falling back to Sellia's shared one) instead of the
// dead base44 function.
export default function SeoIa() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [results, setResults] = useState({});
  const [batch, setBatch] = useState({ running: false, done: 0, total: 0 });

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const parseSeoResult = (text) => {
    // Best-effort parse of the free-form AI text into {title, description}.
    const titleMatch = text.match(/titre[^:]*:\s*(.+)/i);
    const descMatch = text.match(/meta[- ]?description[^:]*:\s*(.+)/i);
    return {
      seo_title: titleMatch ? titleMatch[1].trim() : text.split('\n')[0]?.slice(0, 60) || '',
      seo_description: descMatch ? descMatch[1].trim() : text.split('\n').slice(1).join(' ').slice(0, 155),
      raw: text,
    };
  };

  const generateOne = async (p) => {
    setBusy(p.id);
    try {
      const input = `${p.name}. ${(p.description || '').replace(/<[^>]+>/g, '').slice(0, 200)}`;
      const { data, error } = await supabase.functions.invoke('ai-assistant', { body: { tenant_id: store.id, task: 'seo', input, context: store?.name || '' } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResults((r) => ({ ...r, [p.id]: parseSeoResult(data.result) }));
    } catch (e) {
      setResults((r) => ({ ...r, [p.id]: { erreur: e.message } }));
    } finally { setBusy(null); }
  };

  const apply = async (p) => {
    const r = results[p.id];
    if (!r || r.erreur) return;
    setBusy(p.id + 'apply');
    try {
      const nextMetafields = { ...(p.metafields || {}), seo: { title: r.seo_title, description: r.seo_description } };
      const { error } = await supabase.from('products').update({ metafields: nextMetafields }).eq('id', p.id);
      if (error) throw error;
      setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, metafields: nextMetafields } : x)));
    } catch (e) {
      alert(e.message || "Échec de l'application");
    } finally { setBusy(null); }
  };

  const runBatch = async () => {
    const targets = products.filter((p) => !p.metafields?.seo?.title);
    setBatch({ running: true, done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      await generateOne(targets[i]);
      setBatch((b) => ({ ...b, done: i + 1 }));
    }
    setBatch({ running: false, done: targets.length, total: targets.length });
  };

  const copy = (text) => { navigator.clipboard.writeText(text); };

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  const optimized = products.filter((p) => p.metafields?.seo?.title).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
        <Search className="w-5 h-5 text-[#008060]" />
        <h1 className="text-xl font-bold text-[#202223]">SEO IA</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#202223]">Optimisation SEO du catalogue</p>
          <p className="text-xs text-[#6D7175] mt-0.5">{products.length} produits · {optimized} déjà optimisés</p>
          {batch.running && <p className="text-xs text-[#008060] mt-1 font-medium">Traitement… {batch.done}/{batch.total}</p>}
        </div>
        <button onClick={runBatch} disabled={batch.running || loading || products.length === 0} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40 shrink-0">
          {batch.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Optimiser tout
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const r = results[p.id];
            return (
              <div key={p.id} className="bg-white rounded-xl border border-[#E1E1E1] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Package className="w-4 h-4 text-[#6D7175] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#202223] truncate">{p.name}</p>
                      {p.metafields?.seo?.title ? (
                        <p className="text-[11px] text-[#008060] mt-0.5 flex items-center gap-1"><Check className="w-3 h-3" /> SEO appliqué</p>
                      ) : (
                        <p className="text-[11px] text-[#6D7175] mt-0.5">SEO non configuré</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => generateOne(p)} disabled={busy === p.id} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-[#E1E1E1] hover:bg-black/5 disabled:opacity-40 shrink-0">
                    {busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#008060]" />} Générer
                  </button>
                </div>

                {r && !r.erreur && (
                  <div className="mt-3 pt-3 border-t border-[#F4F4F4] space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-[#6D7175] uppercase mt-0.5 w-12 shrink-0">Titre</span>
                      <p className="text-xs text-[#202223] flex-1">{r.seo_title}</p>
                      <button onClick={() => copy(r.seo_title)} className="text-[#6D7175] hover:text-[#008060]"><Copy className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-[#6D7175] uppercase mt-0.5 w-12 shrink-0">Desc.</span>
                      <p className="text-xs text-[#202223] flex-1">{r.seo_description}</p>
                      <button onClick={() => copy(r.seo_description)} className="text-[#6D7175] hover:text-[#008060]"><Copy className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button onClick={() => apply(p)} disabled={busy === p.id + 'apply'} className="flex items-center gap-1.5 bg-[#008060] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">
                        {busy === p.id + 'apply' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Appliquer au produit
                      </button>
                    </div>
                  </div>
                )}
                {r?.erreur && <p className="mt-2 text-xs text-red-600">{r.erreur}</p>}
              </div>
            );
          })}
          {products.length === 0 && <p className="text-center text-sm text-[#6D7175] py-10">Aucun produit dans le catalogue.</p>}
        </div>
      )}
    </div>
  );
}

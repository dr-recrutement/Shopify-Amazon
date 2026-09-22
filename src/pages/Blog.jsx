import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Loader2, Trash2, Edit3, X, Save, Globe } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const STATUS_STYLES = { draft: 'bg-gray-100 text-gray-600', published: 'bg-[#008060]/10 text-[#008060]' };

// Native content_pages: id/tenant_id/title/slug/body/status/published_at
// only - no excerpt/featured_image/tags/author columns, so this form edits
// what actually exists rather than fields that would silently be dropped.
export default function Blog() {
  const { store, loading } = useCurrentStore();
  const [articles, setArticles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    const { data, error } = await supabase.from('content_pages').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(100);
    if (error) { console.error('Failed to load blog posts:', error); setArticles([]); return; }
    setArticles(data || []);
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const startNew = () => setEditing({ title: '', body: '', status: 'draft', slug: '' });
  const startEdit = (a) => setEditing({ ...a });

  const save = async () => {
    setBusy(true);
    try {
      const slug = editing.slug || editing.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const payload = {
        tenant_id: store.id,
        title: editing.title,
        slug,
        body: editing.body || '',
        status: editing.status,
        published_at: editing.status === 'published' ? (editing.published_at || new Date().toISOString()) : editing.published_at || null,
      };
      const { error } = editing.id
        ? await supabase.from('content_pages').update(payload).eq('id', editing.id)
        : await supabase.from('content_pages').insert(payload);
      if (error) throw error;
      setEditing(null);
      await load();
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement de l'article");
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cet article ?')) return;
    const { error } = await supabase.from('content_pages').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  const fld = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">Blog</h1></div>
        <button onClick={startNew} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Nouvel article</button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-[#202223]">{editing.id ? 'Modifier l\'article' : 'Nouvel article'}</h2><button onClick={() => setEditing(null)} className="text-[#6D7175]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-[#6D7175]">Titre</label><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={fld} /></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Contenu (HTML)</label><textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={10} className={`${fld} font-mono text-xs`} /></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Statut</label><select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className={fld}><option value="draft">Brouillon</option><option value="published">Publié</option></select></div>
            </div>
            <button onClick={save} disabled={busy || !editing.title} className="w-full mt-5 flex items-center justify-center gap-1.5 bg-[#008060] text-white text-sm font-medium py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40"><Save className="w-4 h-4" /> {busy ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.length === 0 ? (
          <div className="sm:col-span-3 bg-white rounded-xl border border-[#E1E1E1] p-10 text-center"><FileText className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" /><p className="text-sm text-[#6D7175]">Aucun article. Créez votre premier article de blog.</p></div>
        ) : articles.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
            <div className="aspect-video bg-[#F4F4F4] flex items-center justify-center"><FileText className="w-8 h-8 text-[#C9C9C9]" /></div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[a.status]}`}>{a.status}</span>{a.published_at && <span className="text-[10px] text-[#6D7175]">{new Date(a.published_at).toLocaleDateString('fr-FR')}</span>}</div>
              <p className="text-sm font-bold text-[#202223] line-clamp-2">{a.title}</p>
              <p className="text-xs text-[#6D7175] mt-1 line-clamp-2">{(a.body || '').replace(/<[^>]*>/g, '').slice(0, 100)}</p>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => startEdit(a)} className="flex items-center gap-1 text-xs font-semibold text-[#008060] hover:underline"><Edit3 className="w-3.5 h-3.5" /> Modifier</button>
                {a.status === 'published' && store?.slug && <a href={`/store/${store.slug}/blog/${a.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#6D7175] hover:text-[#008060]"><Globe className="w-3.5 h-3.5" /> Voir</a>}
                <button onClick={() => remove(a.id)} className="ml-auto text-[#6D7175] hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Trash2, Loader2, X, Send, FileEdit } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const CATEGORIES = ['annonce', 'nouveauté', 'maintenance', 'astuce'];

function slugify(s) {
  return (s || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function CommunicationsManager() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('platform_posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => setEditing({ title: '', excerpt: '', content: '', category: CATEGORIES[0], status: 'draft' });

  const save = async (publish) => {
    if (!editing.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: editing.title.trim(),
        excerpt: editing.excerpt || '',
        content: editing.content || '',
        category: editing.category,
        status: publish ? 'published' : 'draft',
        slug: editing.slug || slugify(editing.title),
        author_id: user.id,
        author_name: user.user_metadata?.full_name || user.email,
        published_at: publish ? (editing.published_at || new Date().toISOString()) : editing.published_at || null,
      };
      const { error } = editing.id
        ? await supabase.from('platform_posts').update(payload).eq('id', editing.id)
        : await supabase.from('platform_posts').insert(payload);
      if (error) throw error;
      setEditing(null);
      await load();
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette communication ?')) return;
    const { error } = await supabase.from('platform_posts').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Megaphone className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Communications plateforme</h2><span className="text-xs text-[#6D7175]">({posts.length})</span></div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-[#008060] text-white text-xs font-semibold px-3.5 py-2 rounded-full hover:bg-[#00694d]"><Plus className="w-3.5 h-3.5" /> Nouvelle communication</button>
      </div>
      <p className="text-xs text-[#6D7175] mb-4">Publié ici, un message apparaît dans le fil « Nouveautés Sellia » du tableau de bord de chaque marchand.</p>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : posts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune communication pour l'instant.</p>
        ) : (
          <div className="divide-y divide-[#E1E1E1]">
            {posts.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#202223] truncate">{p.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'published' ? 'bg-[#008060]/10 text-[#008060]' : 'bg-[#F4F4F4] text-[#6D7175]'}`}>{p.status === 'published' ? 'Publié' : 'Brouillon'}</span>
                    <span className="text-[10px] text-[#6D7175]">{p.category}</span>
                  </div>
                  <p className="text-[11px] text-[#6D7175] mt-0.5 truncate">{p.excerpt}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditing(p)} className="w-7 h-7 rounded-md border border-[#E1E1E1] flex items-center justify-center text-[#6D7175] hover:bg-black/5"><FileEdit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(p.id)} className="w-7 h-7 rounded-md border border-[#E1E1E1] flex items-center justify-center text-[#6D7175] hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-[#202223]">{editing.id ? 'Modifier' : 'Nouvelle'} communication</h2><button onClick={() => setEditing(null)} className="text-[#6D7175]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-[#6D7175]">Titre</label><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Catégorie</label><select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Résumé court</label><input value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Contenu</label><textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={5} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => save(false)} disabled={saving} className="flex-1 text-sm font-semibold text-[#202223] border border-[#E1E1E1] rounded-full py-2.5 hover:bg-black/5 disabled:opacity-40">Enregistrer en brouillon</button>
              <button onClick={() => save(true)} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold bg-[#008060] text-white rounded-full py-2.5 hover:bg-[#00694d] disabled:opacity-40">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

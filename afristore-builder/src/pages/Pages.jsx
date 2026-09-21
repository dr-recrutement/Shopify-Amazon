import { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Plus, Trash2, Loader2, Check, ExternalLink, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const slugify = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    ['link', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
  ],
};

export default function Pages() {
  const { store } = useCurrentStore();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', handle: '', content: '', status: 'draft' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const list = await base44.entities.Page.filter({ store_id: store.id }, '-updated_date', 100);
      setPages(list || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const startNew = () => { setEditing('new'); setForm({ title: '', handle: '', content: '', status: 'draft' }); };
  const startEdit = (pg) => { setEditing(pg.id); setForm({ title: pg.title || '', handle: pg.handle || '', content: pg.content || '', status: pg.status || 'draft' }); };
  const cancel = () => { setEditing(null); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = {
        store_id: store.id,
        title: form.title.trim(),
        handle: form.handle.trim() || slugify(form.title),
        content: form.content,
        status: form.status,
      };
      if (editing === 'new') await base44.entities.Page.create(data);
      else await base44.entities.Page.update(editing, data);
      setSaved(true); setTimeout(() => setSaved(false), 1500);
      setEditing(null);
      load();
    } catch (e) {
      alert('Erreur : ' + (e.message || 'enregistrement impossible'));
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette page ?')) return;
    try { await base44.entities.Page.delete(id); if (editing === id) setEditing(null); load(); } catch { /* ignore */ }
  };

  if (!store) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pages</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Créez des pages personnalisées (À propos, Contact, FAQ) et ajoutez-les au menu du thème.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand/90 shrink-0"><Plus className="w-4 h-4" /> Nouvelle page</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        <div className="bg-white rounded-xl border border-border overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-border text-xs font-bold uppercase text-muted-foreground">Vos pages</div>
          {loading ? <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> :
            pages.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Aucune page pour l'instant.</div> :
            <div className="divide-y divide-border">
              {pages.map((pg) => (
                <button key={pg.id} onClick={() => startEdit(pg)} className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-surface ${editing === pg.id ? 'bg-surface' : ''}`}>
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{pg.title || 'Sans titre'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">/{pg.handle || slugify(pg.title)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${pg.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{pg.status === 'published' ? 'Publiée' : 'Brouillon'}</span>
                </button>
              ))}
            </div>}
        </div>

        <div className="bg-white rounded-xl border border-border">
          {editing === null ? (
            <div className="p-10 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Sélectionnez ou créez une page</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Astuce : nommez une page « À propos » puis ajoutez « À propos » aux liens du menu du thème — le clic ouvrira automatiquement la page.</p>
            </div>
          ) : (
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Titre</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, handle: editing === 'new' && !form.handle ? slugify(e.target.value) : form.handle })} placeholder="À propos" className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">URL (slug)</label>
                  <input value={form.handle} onChange={(e) => setForm({ ...form, handle: slugify(e.target.value) })} placeholder="a-propos" className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono" />
                </div>
              </div>
              <div className="mb-3 flex items-center gap-3 flex-wrap">
                <label className="text-[11px] font-semibold text-muted-foreground">Statut</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-2.5 py-1.5 border border-border rounded-md text-xs">
                  <option value="draft">Brouillon</option>
                  <option value="published">Publiée</option>
                </select>
                {form.status === 'published' && store.slug && form.handle && (
                  <a href={`/store/${store.slug}/p/${form.handle}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"><ExternalLink className="w-3 h-3" /> Voir en ligne</a>
                )}
              </div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Contenu</label>
              <div className="quill-sellia">
                <ReactQuill theme="snow" value={form.content} onChange={(v) => setForm({ ...form, content: v })} modules={QUILL_MODULES} />
              </div>
              <div className="flex items-center justify-between mt-5">
                {editing !== 'new' && (
                  <button onClick={() => remove(editing)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline"><Trash2 className="w-3.5 h-3.5" /> Supprimer</button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={cancel} className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-full hover:bg-surface">Annuler</button>
                  <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand text-brand-foreground rounded-full hover:bg-brand/90 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                    {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
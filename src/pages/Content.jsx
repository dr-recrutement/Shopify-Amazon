import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Loader2, AlertCircle, Plus, Search, Pencil, Trash2,
  Eye, EyeOff, X, Calendar, Tag as TagIcon, Upload, Image as ImageIcon,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

function slugify(str) {
  return (str || '').toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ArticleEditor({ article, onSave, onClose, saving }) {
  const [form, setForm] = useState(article || {
    title: '', excerpt: '', content: '', featured_image: '',
    author: '', tags: [], status: 'draft', published_at: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useCallback((node) => { if (node && form.featured_image === undefined) node; }, [form.featured_image]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set('featured_image', file_url);
    } finally { setUploading(false); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };

  const submit = () => {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      handle: form.handle || slugify(form.title),
      published_at: form.status === 'published' && !form.published_at ? new Date().toISOString() : form.published_at,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-[#E1E1E1] px-5 py-3 flex items-center justify-between z-10">
          <h2 className="font-bold text-[#202223]">{article ? 'Modifier l\u2019article' : 'Nouvel article'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-black/5 text-[#6D7175]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1">Titre</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} className="w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm" placeholder="Titre de l\u2019article" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1">Extrait</label>
            <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} className="w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm" placeholder="Court r\u00e9sum\u00e9 affich\u00e9 dans les listes" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1">Image de couverture</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-[#E1E1E1] bg-[#F4F4F4] flex items-center justify-center shrink-0">
                {form.featured_image ? <img src={form.featured_image} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-[#C9C9C9]" />}
              </div>
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0])} ref={fileRef} className="hidden" id="art-img" />
                <label htmlFor="art-img" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008060] border border-[#008060]/40 rounded-md px-3 py-1.5 cursor-pointer hover:bg-[#008060]/5">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {uploading ? 'T\u00e9l\u00e9versement…' : 'T\u00e9l\u00e9verser'}
                </label>
                <input value={form.featured_image || ''} onChange={(e) => set('featured_image', e.target.value)} className="mt-1.5 w-full px-2 py-1.5 border border-[#E1E1E1] rounded text-[11px] font-mono" placeholder="ou colle une URL" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1">Contenu</label>
            <ReactQuill theme="snow" value={form.content} onChange={(v) => set('content', v)} className="quill-sellia" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6D7175] mb-1">Auteur</label>
              <input value={form.author} onChange={(e) => set('author', e.target.value)} className="w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm" placeholder="Nom de l\u2019auteur" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6D7175] mb-1">Statut</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white">
                <option value="draft">Brouillon</option>
                <option value="published">Publi\u00e9</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-[#008060]/10 text-[#008060] text-xs font-medium px-2 py-1 rounded-full">
                  {t}
                  <button onClick={() => set('tags', form.tags.filter((x) => x !== t))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1 px-3 py-1.5 border border-[#E1E1E1] rounded-md text-sm" placeholder="Ajouter un tag" />
              <button onClick={addTag} className="px-3 py-1.5 text-sm font-semibold text-[#008060] border border-[#008060]/40 rounded-md hover:bg-[#008060]/5"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-[#E1E1E1] px-5 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#6D7175] hover:bg-black/5 rounded-md">Annuler</button>
          <button onClick={submit} disabled={saving || !form.title.trim()} className="px-4 py-2 text-sm font-medium text-white bg-[#008060] rounded-md hover:bg-[#00694d] disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Content() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      setArticles(await base44.entities.Article.filter({ store_id: store.id }, '-created_date', 200));
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = articles.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openNew = () => { setEditing(null); setShowEditor(true); };
  const openEdit = (a) => { setEditing(a); setShowEditor(true); };

  const save = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Article.update(editing.id, data);
      } else {
        await base44.entities.Article.create({ ...data, store_id: store.id });
      }
      setShowEditor(false);
      setEditing(null);
      load();
    } catch (e) {
      alert('Erreur : ' + (e.message || 'inconnue'));
    } finally { setSaving(false); }
  };

  const remove = async (a) => {
    if (!confirm(`Supprimer \u00ab ${a.title} \u00bb ?`)) return;
    await base44.entities.Article.delete(a.id);
    load();
  };

  const toggleStatus = async (a) => {
    const status = a.status === 'published' ? 'draft' : 'published';
    await base44.entities.Article.update(a.id, {
      status,
      published_at: status === 'published' && !a.published_at ? new Date().toISOString() : a.published_at,
    });
    load();
  };

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#6D7175]" />
          <div>
            <h1 className="text-xl font-bold text-[#202223]">Contenu</h1>
            <p className="text-xs text-[#6D7175]">Articles de blog et pages de votre boutique.</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d]">
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-md px-3 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#6D7175]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un article" className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-[#E1E1E1] rounded-md p-1">
          {[['all', 'Tous'], ['published', 'Publi\u00e9s'], ['draft', 'Brouillons']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 text-xs font-medium rounded ${filter === k ? 'bg-[#008060] text-white' : 'text-[#6D7175] hover:bg-black/5'}`}>{l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-12 text-center">
          <FileText className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#202223]">Aucun article</p>
          <p className="text-xs text-[#6D7175] mt-1">Cr\u00e9ez votre premier article de blog pour attirer plus de visiteurs.</p>
          <button onClick={openNew} className="mt-4 inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Cr\u00e9er un article</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-[#E1E1E1] p-3 flex items-center gap-3 hover:shadow-sm transition-shadow group">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F4F4F4] border border-[#E1E1E1] shrink-0">
                {a.featured_image ? <img src={a.featured_image} alt="" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-[#C9C9C9] m-auto mt-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#202223] truncate">{a.title}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.status === 'published' ? 'bg-[#008060]/10 text-[#008060]' : 'bg-[#F4F4F4] text-[#6D7175]'}`}>{a.status === 'published' ? 'Publi\u00e9' : 'Brouillon'}</span>
                </div>
                <p className="text-xs text-[#6D7175] truncate mt-0.5">{a.excerpt || a.content?.replace(/<[^>]*>/g, '').slice(0, 80) || 'Aucun contenu'}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6D7175]">
                  {a.author && <span>{a.author}</span>}
                  {a.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(a.published_at).toLocaleDateString()}</span>}
                  {a.tags?.length > 0 && <span className="flex items-center gap-1"><TagIcon className="w-3 h-3" /> {a.tags.length}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleStatus(a)} title={a.status === 'published' ? 'D\u00e9publier' : 'Publier'} className="p-2 rounded-md text-[#6D7175] hover:bg-black/5">
                  {a.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(a)} className="p-2 rounded-md text-[#6D7175] hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(a)} className="p-2 rounded-md text-[#6D7175] hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && <ArticleEditor article={editing} onSave={save} onClose={() => { setShowEditor(false); setEditing(null); }} saving={saving} />}
    </div>
  );
}
import { PageHeader, Card, Badge, Button, EmptyState } from '../dashboard/ui';
import { FileText, Plus, Trash2, Pencil, ExternalLink, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type PlatformPost = {
  id: string;
  slug: string;
  category: 'blog' | 'academy';
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  status: 'draft' | 'published';
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function PostEditor({ post, onClose, onSaved }: { post: PlatformPost | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [category, setCategory] = useState<'blog' | 'academy'>(post?.category || 'blog');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [coverImage, setCoverImage] = useState(post?.cover_image || '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status || 'draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !slug.trim() || !content.trim()) { setError('Titre, slug et contenu sont requis.'); return; }
    setSaving(true);
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const authorId = sessionData.session?.user?.id;
    const authorName = sessionData.session?.user?.email || null;

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      category,
      excerpt: excerpt.trim() || null,
      content,
      cover_image: coverImage.trim() || null,
      status,
      published_at: status === 'published' ? (post?.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    };

    const result = post
      ? await supabase.from('platform_posts').update(payload).eq('id', post.id)
      : await supabase.from('platform_posts').insert({ ...payload, author_id: authorId, author_name: authorName });

    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{post ? 'Modifier l\'article' : 'Nouvel article'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">Titre *</label>
            <input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Slug (URL) *</label>
            <input
              value={slug}
              onChange={e => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value as 'blog' | 'academy')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="blog">Blog</option>
              <option value="academy">Académie</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">Extrait</label>
            <input value={excerpt} onChange={e => setExcerpt(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Résumé court affiché dans la liste" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">Image de couverture (URL)</label>
            <input value={coverImage} onChange={e => setCoverImage(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="https://..." />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">Contenu * (Markdown supporté en texte brut)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={10} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Real "CMS Plateforme" for super admins — blog & académie articles.
 * Deliberately does NOT cover the legal pages (Terms/Privacy/Cookies/
 * Refund/Mentions légales): those stay as reviewed, version-controlled
 * components in LegalPageContent.tsx rather than becoming rows any
 * super admin could edit without review. This covers what didn't exist
 * at all before: publishable blog/academy content, backed by the new
 * platform_posts table (see the 20260915090000_platform_posts.sql
 * migration — needs to be applied to the Supabase project before this
 * page will show real data).
 */
export default function AdminCms() {
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PlatformPost | null | 'new'>(null);
  const [filter, setFilter] = useState<'all' | 'blog' | 'academy'>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('platform_posts').select('*').order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    setPosts((data as PlatformPost[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => filter === 'all' ? posts : posts.filter(p => p.category === filter), [posts, filter]);

  const remove = async (post: PlatformPost) => {
    if (!confirm(`Supprimer "${post.title}" ? Cette action est irréversible.`)) return;
    const { error: err } = await supabase.from('platform_posts').delete().eq('id', post.id);
    if (err) { setError(err.message); return; }
    load();
  };

  return (
    <div>
      <PageHeader
        title="CMS Plateforme"
        subtitle="Blog et Académie — contenu public. Les pages légales restent gérées dans le code, pas ici."
        action={<Button onClick={() => setEditing('new')}><Plus size={14} /> Nouvel article</Button>}
      />

      <div className="flex gap-2 mb-4">
        {(['all', 'blog', 'academy'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${filter === f ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {f === 'all' ? 'Tous' : f === 'blog' ? 'Blog' : 'Académie'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">
          Erreur : {error}. Si la table n'existe pas encore, la migration 20260915090000_platform_posts.sql doit être appliquée sur le projet Supabase.
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {!loading && filtered.length === 0 && !error ? (
          <EmptyState icon={FileText} title="Aucun article" desc="Créez votre premier article de blog ou d'académie." />
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(post => (
              <div key={post.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge color={post.status === 'published' ? 'green' : 'gray'}>{post.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
                    <Badge color="blue">{post.category === 'blog' ? 'Blog' : 'Académie'}</Badge>
                    <h4 className="font-semibold text-gray-900 truncate">{post.title}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">/{post.category}/{post.slug}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {post.status === 'published' && (
                    <a href={`/${post.category}/${post.slug}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-brand-600" title="Voir">
                      <ExternalLink size={15} />
                    </a>
                  )}
                  <button onClick={() => setEditing(post)} className="p-2 text-gray-400 hover:text-brand-600" title="Modifier"><Pencil size={15} /></button>
                  <button onClick={() => remove(post)} className="p-2 text-gray-400 hover:text-red-600" title="Supprimer"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editing && (
        <PostEditor
          post={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

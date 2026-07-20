import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, EmptyState, Badge } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { FileText, Plus, X, Trash2, Edit3, Eye } from 'lucide-react';

type Page = { id: string; title: string; slug: string; body: string | null; status: string; created_at: string };

export default function Content() {
  const { tenant } = useTenant();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', body: '', status: 'draft' });
  const [previewing, setPreviewing] = useState<Page | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('content_pages').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    setPages(data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const openNew = () => { setEditing(null); setForm({ title: '', slug: '', body: '', status: 'draft' }); setShowForm(true); };
  const openEdit = (p: Page) => { setEditing(p); setForm({ title: p.title, slug: p.slug, body: p.body || '', status: p.status }); setShowForm(true); };

  const save = async () => {
    if (!tenant || !form.title) return;
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const payload = { tenant_id: tenant.id, title: form.title, slug, body: form.body, status: form.status, published_at: form.status === 'published' ? new Date().toISOString() : null };
    if (editing) {
      await supabase.from('content_pages').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('content_pages').insert(payload);
    }
    setShowForm(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette page ?')) return;
    await supabase.from('content_pages').delete().eq('id', id); load();
  };

  const publish = async (p: Page) => {
    await supabase.from('content_pages').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', p.id); load();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Content" subtitle="Pages personnalisées et blocs de contenu de votre boutique." action={<Button onClick={openNew}><Plus size={16} /> Nouvelle page</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Pages</h3></div>
          {pages.length === 0 ? (
            <EmptyState icon={FileText} title="Aucune page" desc="Créez des pages personnalisées pour votre boutique." action={<Button onClick={openNew}><Plus size={16} /> Nouvelle page</Button>} />
          ) : (
            <div className="divide-y divide-gray-50">
              {pages.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div><div className="font-medium text-gray-900">{p.title}</div><div className="text-xs text-gray-500">/{p.slug}</div></div>
                  <div className="flex items-center gap-2">
                    <Badge color={p.status === 'published' ? 'green' : 'gray'}>{p.status === 'published' ? 'Publiée' : 'Brouillon'}</Badge>
                    <button onClick={() => setPreviewing(p)} className="text-gray-600 text-sm hover:underline"><Eye size={12} /></button>
                    {p.status !== 'published' && <button onClick={() => publish(p)} className="text-green-600 text-xs hover:underline">Publier</button>}
                    <button onClick={() => openEdit(p)} className="text-orange-600 text-sm hover:underline"><Edit3 size={12} /></button>
                    <button onClick={() => remove(p.id)} className="text-red-600 text-sm hover:underline"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Aperçu</h3>
          {previewing ? (
            <div>
              <h4 className="font-medium text-gray-900">{previewing.title}</h4>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{previewing.body || 'Aucun contenu.'}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sélectionnez une page pour la prévisualiser.</p>
          )}
        </Card>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editing ? 'Modifier la page' : 'Nouvelle page'}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Titre *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Slug (URL)</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-généré" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Contenu</label><textarea rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Statut</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="draft">Brouillon</option><option value="published">Publiée</option></select></div>
              <Button onClick={save} disabled={!form.title} className="w-full">{editing ? 'Sauvegarder' : 'Créer'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

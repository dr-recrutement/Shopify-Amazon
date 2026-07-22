import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Button, Input, Modal, Badge } from './ui';
import { Plus, FileText, Pencil, Trash2 } from 'lucide-react';

interface Page { id: string; title: string; slug: string; body: string; status: string; }

export default function Content() {
  const { tenant } = useTenant();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', body: '' });

  const load = () => {
    if (!tenant) return;
    supabase.from('content_pages').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => { setPages((data as Page[]) || []); setLoading(false); });
  };
  useEffect(load, [tenant]);

  const openNew = () => { setEditing(null); setForm({ title: '', slug: '', body: '' }); setModal(true); };
  const openEdit = (p: Page) => { setEditing(p); setForm({ title: p.title, slug: p.slug, body: p.body }); setModal(true); };

  const save = async () => {
    if (!tenant || !form.title) return;
    const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, '-');
    if (editing) {
      await supabase.from('content_pages').update({ title: form.title, slug, body: form.body }).eq('id', editing.id);
    } else {
      await supabase.from('content_pages').insert({ tenant_id: tenant.id, title: form.title, slug, body: form.body, status: 'draft' });
    }
    setModal(false); load();
  };

  const del = async (p: Page) => { await supabase.from('content_pages').delete().eq('id', p.id); load(); };

  return (
    <div>
      <PageHeader title="Content" subtitle="Manage your store pages and content" action={<Button onClick={openNew}><Plus size={16} /> New Page</Button>} />
      <Card className="p-5">
        {loading ? <div className="text-gray-400 text-sm py-8 text-center">Loading…</div> : pages.length === 0 ? (
          <div className="text-center py-12"><FileText size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No content pages yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Title</th><th className="pb-3 font-medium">Slug</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{p.title}</td>
                    <td className="py-3 text-gray-500 font-mono">/{p.slug}</td>
                    <td className="py-3"><Badge color={p.status === 'published' ? 'green' : 'gray'}>{p.status}</Badge></td>
                    <td className="py-3"><div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={15} /></button>
                      <button onClick={() => del(p)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Page' : 'New Page'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="About Us" />
          <Input label="Slug (optional)" value={form.slug} onChange={v => setForm({ ...form, slug: v })} placeholder="about-us" />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Body</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 resize-y" placeholder="Write your page content…" />
          </div>
          <div className="flex gap-2 justify-end pt-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save} disabled={!form.title}>{editing ? 'Save' : 'Create'}</Button></div>
        </div>
      </Modal>
    </div>
  );
}

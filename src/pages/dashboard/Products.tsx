import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, EmptyState, Table, Badge } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Package, Plus, Sparkles, X, Trash2, Edit3, AlertCircle } from 'lucide-react';

type Product = {
  id: string; name: string; description: string | null; price_cents: number; currency: string;
  stock: number; status: string; sku: string | null; images: string[] | null; created_at: string;
};

export default function Products() {
  const { tenant } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '0', sku: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('products').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', price: '', stock: '0', sku: '', status: 'active' }); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, description: p.description || '', price: String(p.price_cents / 100), stock: String(p.stock), sku: p.sku || '', status: p.status }); setShowForm(true); };

  const save = async () => {
    if (!tenant || !form.name || !form.price) return;
    setSaving(true); setError('');
    const payload = {
      tenant_id: tenant.id, name: form.name, description: form.description,
      price_cents: Math.round(parseFloat(form.price) * 100), currency: tenant.currency || 'XOF',
      stock: parseInt(form.stock) || 0, sku: form.sku || null, status: form.status,
    };
    let result;
    if (editing) {
      result = await supabase.from('products').update(payload).eq('id', editing.id);
    } else {
      result = await supabase.from('products').insert(payload);
    }
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setShowForm(false); setSaving(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  const fmt = (cents: number, currency: string) => `${(cents / 100).toLocaleString('fr-FR')} ${currency}`;

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Produits" subtitle="Gérez votre catalogue, vos stocks et vos collections." action={<Button onClick={openNew}><Plus size={16} /> Ajouter un produit</Button>} />
      <Card>
        {products.length === 0 ? (
          <EmptyState icon={Package} title="Aucun produit" desc="Ajoutez votre premier produit pour commencer à vendre." action={<Button onClick={openNew}><Plus size={16} /> Ajouter</Button>} />
        ) : (
          <Table headers={['Produit', 'Prix', 'Stock', 'Statut', '']}>
            {products.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                <td className="py-3 px-4 text-gray-700">{fmt(p.price_cents, p.currency)}</td>
                <td className="py-3 px-4 text-gray-700">{p.stock}</td>
                <td className="py-3 px-4"><Badge color={p.stock === 0 ? 'red' : p.status === 'active' ? 'green' : 'gray'}>{p.stock === 0 ? 'Rupture' : p.status === 'active' ? 'Actif' : 'Brouillon'}</Badge></td>
                <td className="py-3 px-4 flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-orange-600 text-sm font-medium hover:underline flex items-center gap-1"><Edit3 size={12} /> Éditer</button>
                  <button onClick={() => remove(p.id)} className="text-red-600 text-sm hover:underline"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Nom du produit *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Prix ({tenant?.currency || 'XOF'}) *</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Stock</label><input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Statut</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="active">Actif</option><option value="draft">Brouillon</option></select></div>
              </div>
              <Button onClick={save} disabled={saving || !form.name || !form.price} className="w-full">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, EmptyState, Table, Badge } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Package, Plus, X, Trash2, Edit3, AlertCircle, Image as ImageIcon, Layers, Tag as TagIcon } from 'lucide-react';

type Product = {
  id: string; name: string; description: string | null; price_cents: number; currency: string;
  stock: number; status: string; sku: string | null; images: string[] | null; variants: any[] | null; created_at: string;
};

type Category = { id: string; name: string };
type Metafield = { id: string; name: string; field_type: string; entity_type: string };

export default function Products() {
  const { tenant } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productMetafields, setProductMetafields] = useState<Metafield[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '0', sku: '', status: 'active', category: '' });
  const [variants, setVariants] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [metaValues, setMetaValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');

  const load = useCallback(async () => {
    if (!tenant) return;
    const [prodRes, catRes, metaRes] = await Promise.all([
      supabase.from('products').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
      supabase.from('product_categories').select('*').eq('tenant_id', tenant.id),
      supabase.from('metafields').select('*').eq('tenant_id', tenant.id).eq('entity_type', 'product'),
    ]);
    setProducts(prodRes.data || []);
    setCategories(catRes.data || []);
    setProductMetafields(metaRes.data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', stock: '0', sku: '', status: 'active', category: '' });
    setVariants([]); setImages([]); setMetaValues({});
    setShowForm(true);
  };

  const openEdit = async (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price_cents / 100), stock: String(p.stock), sku: p.sku || '', status: p.status, category: '' });
    setVariants(p.variants || []);
    setImages(p.images || []);
    // Load category assignment
    const { data: assignment } = await supabase.from('product_category_assignments').select('category_id').eq('product_id', p.id).maybeSingle();
    if (assignment) setForm(f => ({ ...f, category: assignment.category_id }));
    // Load metafield values
    const metaVals: Record<string, string> = {};
    setMetaValues(metaVals);
    setShowForm(true);
  };

  const addVariant = () => setVariants([...variants, { name: '', value: '', price: '', stock: '0' }]);
  const updateVariant = (i: number, field: string, val: string) => setVariants(variants.map((v, j) => j === i ? { ...v, [field]: val } : v));
  const removeVariant = (i: number) => setVariants(variants.filter((_, j) => j !== i));

  const addImage = () => setImages([...images, '']);
  const updateImage = (i: number, val: string) => setImages(images.map((img, j) => j === i ? val : img));
  const removeImage = (i: number) => setImages(images.filter((_, j) => j !== i));

  const addCategory = async () => {
    if (!tenant || !catName) return;
    await supabase.from('product_categories').insert({ tenant_id: tenant.id, name: catName });
    setCatName(''); setShowCatForm(false); load();
  };

  const save = async () => {
    if (!tenant || !form.name || !form.price) return;
    setSaving(true); setError('');
    const payload = {
      tenant_id: tenant.id, name: form.name, description: form.description,
      price_cents: Math.round(parseFloat(form.price) * 100), currency: tenant.currency || 'XOF',
      stock: parseInt(form.stock) || 0, sku: form.sku || null, status: form.status,
      images: images.filter(Boolean), variants: variants.filter(v => v.name && v.value),
    };
    let productId = editing?.id;
    if (editing) {
      const { error: e } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { data, error: e } = await supabase.from('products').insert(payload).select().single();
      if (e) { setError(e.message); setSaving(false); return; }
      productId = data.id;
    }
    // Save category assignment
    if (productId && form.category) {
      await supabase.from('product_category_assignments').delete().eq('product_id', productId);
      await supabase.from('product_category_assignments').insert({ product_id: productId, category_id: form.category });
    }
    // Save metafield values
    if (productId) {
      for (const [name, value] of Object.entries(metaValues)) {
        if (value) {
          await supabase.from('metafields').upsert({
            tenant_id: tenant.id, name, namespace: 'product', entity_type: 'product',
            field_type: 'text', value,
          }, { onConflict: 'tenant_id,name,namespace,entity_type' });
        }
      }
    }
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
      <PageHeader title="Produits" subtitle="Gérez votre catalogue, variantes, images, stock et collections." action={<Button onClick={openNew}><Plus size={16} /> Ajouter un produit</Button>} />

      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <span className="text-xs font-medium text-gray-500">Collections:</span>
          {categories.map(c => <Badge key={c.id} color="gray">{c.name}</Badge>)}
          <button onClick={() => setShowCatForm(true)} className="text-xs text-orange-600 hover:underline">+ Nouvelle</button>
        </div>
      )}

      <Card>
        {products.length === 0 ? (
          <EmptyState icon={Package} title="Aucun produit" desc="Ajoutez votre premier produit pour commencer à vendre." action={<Button onClick={openNew}><Plus size={16} /> Ajouter</Button>} />
        ) : (
          <Table headers={['Produit', 'Prix', 'Stock', 'Variantes', 'Statut', '']}>
            {products.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {p.images && p.images[0] ? <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center"><ImageIcon size={12} className="text-gray-400" /></div>}
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700">{fmt(p.price_cents, p.currency)}</td>
                <td className="py-3 px-4 text-gray-700">{p.stock}</td>
                <td className="py-3 px-4 text-gray-500">{(p.variants || []).length || '—'}</td>
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

      {showCatForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCatForm(false)}>
          <Card className="w-full max-w-sm p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-3">Nouvelle collection</h3>
            <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ex. Robes, Accessoires..." className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3" />
            <div className="flex gap-2"><Button size="sm" onClick={addCategory}>Créer</Button><Button variant="ghost" size="sm" onClick={() => setShowCatForm(false)}>Annuler</Button></div>
          </Card>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="space-y-4">
              {/* Basic info */}
              <div className="space-y-3">
                <div><label className="block text-sm font-medium mb-1">Nom du produit *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm font-medium mb-1">Prix ({tenant?.currency || 'XOF'}) *</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Stock</label><input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1">Statut</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="active">Actif</option><option value="draft">Brouillon</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Collection</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="">Aucune</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
              </div>

              {/* Images */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-sm font-medium mb-2 flex items-center gap-1"><ImageIcon size={14} /> Images du produit</label>
                <div className="space-y-2">
                  {images.map((img, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={img} onChange={e => updateImage(i, e.target.value)} placeholder="URL de l'image" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      {img && <img src={img} alt="" className="w-10 h-10 rounded object-cover" />}
                      <button onClick={() => removeImage(i)} className="text-red-600"><X size={16} /></button>
                    </div>
                  ))}
                  <button onClick={addImage} className="text-sm text-orange-600 hover:underline flex items-center gap-1"><Plus size={12} /> Ajouter une image</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Format recommandé: carré 1080x1080px, JPG/PNG, 5MB max</p>
              </div>

              {/* Variants */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-sm font-medium mb-2 flex items-center gap-1"><Layers size={14} /> Variantes (taille, couleur, etc.)</label>
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2">
                      <input value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} placeholder="Option (ex: Taille)" className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                      <input value={v.value} onChange={e => updateVariant(i, 'value', e.target.value)} placeholder="Valeur (ex: M)" className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                      <input value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} placeholder="Prix (optionnel)" type="number" className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                      <div className="flex gap-1">
                        <input value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} placeholder="Stock" type="number" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                        <button onClick={() => removeVariant(i)} className="text-red-600"><X size={16} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addVariant} className="text-sm text-orange-600 hover:underline flex items-center gap-1"><Plus size={12} /> Ajouter une variante</button>
                </div>
              </div>

              {/* Metafields */}
              {productMetafields.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-sm font-medium mb-2 flex items-center gap-1"><TagIcon size={14} /> Champs personnalisés</label>
                  <div className="space-y-2">
                    {productMetafields.map(m => (
                      <div key={m.id}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{m.name}</label>
                        <input value={metaValues[m.name] || ''} onChange={e => setMetaValues({ ...metaValues, [m.name]: e.target.value })} placeholder={`Valeur pour ${m.name}`} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={save} disabled={saving || !form.name || !form.price} className="w-full">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

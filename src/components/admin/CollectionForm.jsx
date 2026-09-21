import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Image as ImageIcon, X, Search, Check } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#202223] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ImageField({ value, onSet, pathPrefix }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (file) => {
    setBusy(true); setError('');
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      onSet(data.publicUrl);
    } catch (e) {
      setError(e.message || "Échec de l'envoi");
    } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-lg border border-[#E1E1E1] bg-[#F4F4F4] overflow-hidden flex items-center justify-center">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-[#C9C9C9]" />}
        </div>
        {value ? (
          <button type="button" onClick={() => onSet('')} className="flex items-center gap-1 text-xs font-semibold text-[#6D7175] hover:text-red-500"><X className="w-3.5 h-3.5" /> Retirer</button>
        ) : (
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] border border-[#008060]/40 rounded-md px-3 py-2 cursor-pointer hover:bg-[#008060]/5">
            {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Téléversement…</> : <><Upload className="w-3.5 h-3.5" /> Téléverser</>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          </label>
        )}
      </div>
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function ProductPicker({ store, selectedIds, onSet }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    supabase.from('products').select('id, name, images, status').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setProducts(data || []))
      .finally(() => setLoading(false));
  }, [store?.id]);

  const toggle = (id) => {
    if (selectedIds?.includes(id)) onSet(selectedIds.filter((x) => x !== id));
    else onSet([...(selectedIds || []), id]);
  };

  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="border border-[#E1E1E1] rounded-lg">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E1E1E1] bg-[#FAFAFA]">
        <Search className="w-4 h-4 text-[#6D7175]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" className="flex-1 outline-none text-xs" />
        <span className="text-[11px] font-semibold text-[#6D7175]">{selectedIds?.length || 0} sélectionné(s)</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-[#6D7175] text-center py-6">Aucun produit. Ajoutez d'abord des produits.</p>
        ) : (
          filtered.map((p) => {
            const checked = selectedIds?.includes(p.id);
            return (
              <button key={p.id} type="button" onClick={() => toggle(p.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-[#F0F0F0] transition ${checked ? 'bg-[#008060]/5' : 'hover:bg-[#F4F4F4]'}`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-[#008060] border-[#008060]' : 'border-[#C9C9C9]'}`}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="w-9 h-9 rounded bg-[#F4F4F4] overflow-hidden shrink-0">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-[#C9C9C9] m-auto mt-2" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#202223] truncate">{p.name}</p>
                  <p className="text-[10px] text-[#6D7175]">{p.status === 'active' ? 'Actif' : 'Brouillon'}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Native schema: `product_categories` (name/description/image_url/slug) +
// `product_category_assignments` (product_id, category_id) as the
// many-to-many link. No `status` or smart/rule-based auto-collections on
// this schema, so this form is manual-selection only.
export default function CollectionForm({ open, onOpenChange, store, collection, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = collection || { name: '', description: '', image_url: '', product_ids: [] };
    setForm({ ...base, product_ids: base.product_ids || [] });
  }, [open, collection]);

  if (!form) return null;
  const set = (patch) => setForm({ ...form, ...patch });
  const isNew = !form.id;

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        tenant_id: store.id,
        name: form.name,
        slug: form.name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description: form.description || '',
        image_url: form.image_url || '',
      };
      let categoryId = form.id;
      if (isNew) {
        const { data, error } = await supabase.from('product_categories').insert(payload).select('id').single();
        if (error) throw error;
        categoryId = data.id;
      } else {
        const { error } = await supabase.from('product_categories').update(payload).eq('id', categoryId);
        if (error) throw error;
      }
      // Reconcile the product<->category links: drop the old set, insert the
      // current selection. Simple and correct; not the most efficient for
      // huge collections, but collections here are small.
      const { error: delError } = await supabase.from('product_category_assignments').delete().eq('category_id', categoryId);
      if (delError) throw delError;
      if (form.product_ids.length > 0) {
        const { error: insError } = await supabase.from('product_category_assignments').insert(
          form.product_ids.map((product_id) => ({ product_id, category_id: categoryId }))
        );
        if (insError) throw insError;
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement de la collection");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nouvelle collection' : 'Modifier la collection'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nom *"><input value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder="Ex : Nouveautés" /></Field>
          <Field label="Image"><ImageField value={form.image_url || ''} onSet={(u) => set({ image_url: u })} pathPrefix={`categories/${store.id}`} /></Field>
          <Field label="Description"><textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} className={inputCls} /></Field>
          <Field label="Produits de la collection">
            <ProductPicker store={store} selectedIds={form.product_ids} onSet={(ids) => set({ product_ids: ids })} />
          </Field>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save} disabled={saving || !form.name} className="bg-[#008060] hover:bg-[#00694d]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

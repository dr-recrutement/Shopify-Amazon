import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Image as ImageIcon, X, Search, Check, Plus } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#202223] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ImageField({ value, onSet }) {
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onSet(file_url);
    } finally { setBusy(false); }
  };
  return (
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
  );
}

const RULE_FIELDS = [
  { value: 'product_type', label: 'Type de produit' },
  { value: 'tag', label: 'Tag' },
  { value: 'vendor', label: 'Marque / Fournisseur' },
  { value: 'price', label: 'Prix' },
  { value: 'status', label: 'Statut' },
];
const RULE_OPS = [
  { value: 'eq', label: 'égal à' },
  { value: 'neq', label: 'différent de' },
  { value: 'contains', label: 'contient' },
  { value: 'gt', label: 'supérieur à' },
  { value: 'lt', label: 'inférieur à' },
];

function RulesEditor({ rules, onSet }) {
  const add = () => onSet([...(rules || []), { field: 'product_type', operator: 'eq', value: '' }]);
  const setRule = (i, patch) => onSet(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i) => onSet(rules.filter((_, j) => j !== i));
  return (
    <div className="space-y-2">
      {(rules || []).map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <select value={r.field} onChange={(e) => setRule(i, { field: e.target.value })} className="flex-1 px-2 py-1.5 border border-[#E1E1E1] rounded text-xs">
            {RULE_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={r.operator} onChange={(e) => setRule(i, { operator: e.target.value })} className="px-2 py-1.5 border border-[#E1E1E1] rounded text-xs">
            {RULE_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={r.value} onChange={(e) => setRule(i, { value: e.target.value })} placeholder="Valeur" className="flex-1 px-2 py-1.5 border border-[#E1E1E1] rounded text-xs" />
          <button type="button" onClick={() => remove(i)} className="text-[#6D7175] hover:text-red-500"><X className="w-4 h-4" /></button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs font-semibold text-[#008060] inline-flex items-center gap-1.5 border border-dashed border-[#008060]/40 rounded-md px-3 py-1.5 hover:bg-[#008060]/5"><Plus className="w-3.5 h-3.5" /> Ajouter une règle</button>
    </div>
  );
}

function ProductPicker({ store, selectedIds, onSet }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    base44.entities.Product.filter({ store_id: store.id }, '-created_date', 200)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [store?.id]);

  const toggle = (id) => {
    if (selectedIds?.includes(id)) onSet(selectedIds.filter((x) => x !== id));
    else onSet([...(selectedIds || []), id]);
  };

  const filtered = products.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));

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
                  <p className="text-xs font-medium text-[#202223] truncate">{p.title}</p>
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

export default function CollectionForm({ open, onOpenChange, store, collection, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = collection || { name: '', description: '', type: 'manual', image: '', status: 'active', product_ids: [], rules: [] };
    setForm({ ...base, product_ids: base.product_ids || [], rules: base.rules || [] });
  }, [open, collection]);

  if (!form) return null;
  const set = (patch) => setForm({ ...form, ...patch });
  const isNew = !form.id;

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        store_id: store.id,
        name: form.name,
        handle: form.name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description: form.description || '',
        type: form.type || 'manual',
        image: form.image || '',
        status: form.status || 'active',
        product_ids: form.type === 'manual' ? (form.product_ids || []) : [],
        rules: form.type === 'smart' ? (form.rules || []) : [],
      };
      if (isNew) await base44.entities.Collection.create(payload);
      else await base44.entities.Collection.update(form.id, payload);
      onSaved();
      onOpenChange(false);
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
          <Field label="Type">
            <select value={form.type} onChange={(e) => set({ type: e.target.value })} className={inputCls}>
              <option value="manual">Manuelle (sélection de produits)</option>
              <option value="smart">Automatique (règles)</option>
            </select>
          </Field>
          <Field label="Image"><ImageField value={form.image || ''} onSet={(u) => set({ image: u })} /></Field>
          <Field label="Description"><textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} className={inputCls} /></Field>
          <Field label="Statut">
            <select value={form.status} onChange={(e) => set({ status: e.target.value })} className={inputCls}>
              <option value="active">Active</option>
              <option value="draft">Brouillon</option>
            </select>
          </Field>

          {form.type === 'manual' ? (
            <Field label="Produits de la collection">
              <ProductPicker store={store} selectedIds={form.product_ids} onSet={(ids) => set({ product_ids: ids })} />
            </Field>
          ) : (
            <Field label="Règles automatiques">
              <RulesEditor rules={form.rules} onSet={(r) => set({ rules: r })} />
              <p className="text-[11px] text-[#6D7175] mt-2">Les produits correspondant à ces règles seront ajoutés automatiquement.</p>
            </Field>
          )}
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
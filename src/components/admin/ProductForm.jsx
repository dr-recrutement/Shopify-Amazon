import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Loader2, Plus, Trash2, ChevronDown, ChevronRight, Package, Sparkles, Wand2 } from 'lucide-react';
import { formatMoney } from '@/lib/world/currencies';

const STATUSES = [
  { value: 'active', label: 'Actif' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'archived', label: 'Archivé' },
];

const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#202223] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ImagesEditor({ images, onSet }) {
  const [busy, setBusy] = useState(false);
  const upload = async (files) => {
    setBusy(true);
    try {
      const urls = [];
      for (const f of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        urls.push(file_url);
      }
      onSet([...(images || []), ...urls]);
    } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(images || []).map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-md border border-[#E1E1E1] overflow-hidden group">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onSet(images.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className="w-20 h-20 rounded-md border-2 border-dashed border-[#E1E1E1] hover:border-[#008060]/50 flex items-center justify-center cursor-pointer text-[#C9C9C9] hover:text-[#008060]">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const fs = e.target.files; if (fs?.length) upload(fs); }} />
        </label>
      </div>
      <p className="text-[11px] text-[#6D7175]">PNG · JPG · WEBP — multiple</p>
    </div>
  );
}

// Generate variant combinations from options
function generateVariants(options, basePrice) {
  const valid = (options || []).filter((o) => o.name && (o.values || []).filter(Boolean).length > 0);
  if (valid.length === 0) return [];
  const combos = valid.reduce((acc, opt) => {
    const vals = opt.values.filter(Boolean);
    if (acc.length === 0) return vals.map((v) => [v]);
    return acc.flatMap((c) => vals.map((v) => [...c, v]));
  }, []);
  return combos.map((c) => ({
    title: c.join(' / '),
    sku: '',
    price: basePrice || 0,
    compare_at_price: 0,
    stock: 0,
    option1: c[0] || '',
    option2: c[1] || '',
    option3: c[2] || '',
    status: 'active',
  }));
}

function VariantsEditor({ options, variants, basePrice, onSetOptions, onSetVariants, currency }) {
  const [open, setOpen] = useState(true);

  const addOption = () => onSetOptions([...(options || []), { name: '', values: [''] }]);
  const setOption = (i, patch) => onSetOptions(options.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const removeOption = (i) => onSetOptions(options.filter((_, j) => j !== i));
  const addValue = (i) => setOption(i, { values: [...(options[i].values || []), ''] });
  const setValue = (i, vi, v) => setOption(i, { values: options[i].values.map((x, j) => (j === vi ? v : x)) });
  const removeValue = (i, vi) => setOption(i, { values: options[i].values.filter((_, j) => j !== vi) });

  const regen = () => onSetVariants(generateVariants(options, basePrice));

  const setVar = (i, patch) => onSetVariants(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div className="rounded-lg border border-[#E1E1E1]">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-[#F4F4F4] rounded-t-lg">
        <span className="flex items-center gap-2 text-xs font-bold text-[#202223]"><Package className="w-4 h-4 text-[#008060]" /> Variantes & options</span>
        {open ? <ChevronDown className="w-4 h-4 text-[#6D7175]" /> : <ChevronRight className="w-4 h-4 text-[#6D7175]" />}
      </button>
      {open && (
        <div className="p-4 space-y-4">
          <p className="text-[11px] text-[#6D7175]">Ajoutez des options (Couleur, Taille…) et leurs valeurs. Les variantes sont générées automatiquement.</p>

          {/* Options */}
          {(options || []).map((opt, i) => (
            <div key={i} className="rounded-md border border-[#E1E1E1] p-3 bg-[#FAFAFA]">
              <div className="flex items-center gap-2 mb-2">
                <input value={opt.name} onChange={(e) => setOption(i, { name: e.target.value })} placeholder="Nom (ex: Couleur)" className="flex-1 px-2 py-1.5 border border-[#E1E1E1] rounded text-xs" />
                <button type="button" onClick={() => removeOption(i)} className="text-[#6D7175] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(opt.values || []).map((v, vi) => (
                  <div key={vi} className="flex items-center gap-1 bg-white border border-[#E1E1E1] rounded-md pl-2 pr-1 py-1">
                    <input value={v} onChange={(e) => setValue(i, vi, e.target.value)} placeholder="Valeur" className="w-20 text-xs outline-none" />
                    <button type="button" onClick={() => removeValue(i, vi)} className="text-[#C9C9C9] hover:text-red-500"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addValue(i)} className="text-xs font-semibold text-[#008060] border border-dashed border-[#008060]/40 rounded-md px-2 py-1 hover:bg-[#008060]/5">+ Valeur</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addOption} className="text-xs font-semibold text-[#008060] inline-flex items-center gap-1.5 border border-dashed border-[#008060]/40 rounded-md px-3 py-1.5 hover:bg-[#008060]/5"><Plus className="w-3.5 h-3.5" /> Ajouter une option</button>

          {/* Variants table */}
          {variants && variants.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#202223]">{variants.length} variante(s)</p>
                <button type="button" onClick={regen} className="text-[11px] font-semibold text-[#008060] hover:underline">Régénérer</button>
              </div>
              <div className="overflow-x-auto border border-[#E1E1E1] rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-[#F4F4F4] text-[#6D7175]">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Variante</th>
                      <th className="text-left px-2 py-2 font-semibold">Prix</th>
                      <th className="text-left px-2 py-2 font-semibold">SKU</th>
                      <th className="text-left px-2 py-2 font-semibold">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={i} className="border-t border-[#E1E1E1]">
                        <td className="px-3 py-1.5 font-medium text-[#202223]">{v.title}</td>
                        <td className="px-2 py-1.5"><input type="number" min="0" step="0.01" value={v.price} onChange={(e) => setVar(i, { price: Number(e.target.value) })} className="w-20 px-1.5 py-1 border border-[#E1E1E1] rounded text-xs" /></td>
                        <td className="px-2 py-1.5"><input value={v.sku || ''} onChange={(e) => setVar(i, { sku: e.target.value })} className="w-24 px-1.5 py-1 border border-[#E1E1E1] rounded text-xs" /></td>
                        <td className="px-2 py-1.5"><input type="number" min="0" value={v.stock} onChange={(e) => setVar(i, { stock: Number(e.target.value) })} className="w-16 px-1.5 py-1 border border-[#E1E1E1] rounded text-xs" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductForm({ open, onOpenChange, store, product, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tagsText, setTagsText] = useState('');
  const [aiBrief, setAiBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!open) return;
    const base = product || {
      title: '', description: '', status: 'draft', vendor: '', product_type: '',
      price: 0, compare_at_price: 0, sku: '', images: [], tags: [],
      options: [], variants: [], track_inventory: true, weight: 0, barcode: '', stock: 0,
    };
    setForm({ ...base });
    setTagsText((base.tags || []).join(', '));
  }, [open, product]);

  if (!form) return null;
  const set = (patch) => setForm({ ...form, ...patch });
  const isNew = !form.id;

  const generateWithAI = async () => {
    if (!aiBrief.trim()) return;
    setAiLoading(true); setAiError('');
    try {
      const res = await base44.functions.invoke('aiAssistant', {
        task: 'product_description',
        input: aiBrief,
        context: store?.name || '',
      });
      if (res.data?.error) throw new Error(res.data.error);
      const r = res.data?.result || {};
      set({
        title: r.title || form.title,
        description: r.description || form.description,
        seo: { title: r.title || '', description: r.short_description || '' },
      });
      if (Array.isArray(r.tags) && r.tags.length) setTagsText(r.tags.join(', '));
    } catch (e) {
      setAiError(e.message || 'Échec de la génération IA');
    } finally { setAiLoading(false); }
  };

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      const payload = {
        store_id: store.id,
        title: form.title,
        handle: (form.title || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description: form.description || '',
        status: form.status || 'draft',
        vendor: form.vendor || '',
        product_type: form.product_type || '',
        price: Number(form.price) || 0,
        compare_at_price: Number(form.compare_at_price) || 0,
        currency: store.currency,
        sku: form.sku || '',
        barcode: form.barcode || '',
        weight: Number(form.weight) || 0,
        track_inventory: form.track_inventory !== false,
        stock: (form.variants || []).length === 0 ? Number(form.stock) || 0 : 0,
        images: form.images || [],
        tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
        options: (form.options || []).filter((o) => o.name && (o.values || []).filter(Boolean).length),
        variants: form.variants || [],
        seo: form.seo || { title: '', description: '' },
      };
      if (isNew) {
        await base44.entities.Product.create(payload);
      } else {
        await base44.entities.Product.update(form.id, payload);
      }
      onSaved();
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nouveau produit' : 'Modifier le produit'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Titre *"><input value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} placeholder="Ex : Boubou wax premium" /></Field>
          <div className="rounded-lg border border-[#008060]/30 bg-[#008060]/[0.03] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-[#008060]" />
              <span className="text-xs font-bold text-[#202223]">Assistant IA</span>
            </div>
            <textarea value={aiBrief} onChange={(e) => setAiBrief(e.target.value)} rows={2} placeholder="Décrivez le produit en quelques mots (matière, origine, public, atouts)…" className={inputCls + ' mb-2'} />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-[#6D7175]">Génère titre, description & tags SEO.</p>
              <button type="button" onClick={generateWithAI} disabled={aiLoading || !aiBrief.trim()} className="flex items-center gap-1.5 bg-[#008060] text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-[#00694d] disabled:opacity-40">
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Rédiger avec l'IA
              </button>
            </div>
            {aiError && <p className="text-[11px] text-red-600 mt-1.5">{aiError}</p>}
          </div>
          <Field label="Images"><ImagesEditor images={form.images || []} onSet={(imgs) => set({ images: imgs })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Prix (${store.currency})`}><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set({ price: e.target.value })} className={inputCls} /></Field>
            <Field label="Prix barré"><input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={(e) => set({ compare_at_price: e.target.value })} className={inputCls} /></Field>
          </div>
          {(form.variants || []).length === 0 && (
            <Field label="Stock (quantité) — produit simple">
              <input type="number" min="0" value={form.stock || 0} onChange={(e) => set({ stock: e.target.value })} className={inputCls} placeholder="0" />
              <p className="text-[11px] text-[#6D7175] mt-1">Pour les produits avec variantes, le stock est géré par variante ci-dessous.</p>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU"><input value={form.sku} onChange={(e) => set({ sku: e.target.value })} className={inputCls} /></Field>
            <Field label="Code-barres"><input value={form.barcode || ''} onChange={(e) => set({ barcode: e.target.value })} className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Statut">
              <select value={form.status} onChange={(e) => set({ status: e.target.value })} className={inputCls}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Poids (kg)"><input type="number" min="0" step="0.01" value={form.weight || 0} onChange={(e) => set({ weight: e.target.value })} className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marque / Fournisseur"><input value={form.vendor} onChange={(e) => set({ vendor: e.target.value })} className={inputCls} /></Field>
            <Field label="Type de produit"><input value={form.product_type} onChange={(e) => set({ product_type: e.target.value })} className={inputCls} placeholder="Vêtement, Accessoire…" /></Field>
          </div>
          <Field label="Tags"><input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={inputCls} placeholder="nouveauté, wax, homme (séparés par virgules)" /></Field>
          <Field label="Description"><textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={4} className={inputCls} /></Field>

          {/* Variants */}
          <VariantsEditor
            options={form.options || []}
            variants={form.variants || []}
            basePrice={Number(form.price) || 0}
            onSetOptions={(opts) => set({ options: opts })}
            onSetVariants={(vars) => set({ variants: vars })}
            currency={store.currency}
          />
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save} disabled={saving || !form.title} className="bg-[#008060] hover:bg-[#00694d]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
        <p className="text-[11px] text-[#6D7175] -mt-2">Aperçu prix : {formatMoney(form.price, store.currency)}</p>
      </DialogContent>
    </Dialog>
  );
}
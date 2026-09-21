import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

const TYPES = [
  { value: 'percentage', label: 'Pourcentage' },
  { value: 'fixed_amount', label: 'Montant fixe' },
  { value: 'free_shipping', label: 'Livraison gratuite' },
];

const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#202223] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#6D7175] mt-1">{hint}</p>}
    </div>
  );
}

function genCode() {
  return 'SELLIA-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default function DiscountForm({ open, onOpenChange, store, discount, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = discount || {
      code: genCode(), type: 'percentage', value: 10, min_order_amount: 0,
      usage_limit: 0, used_count: 0, status: 'active', applies_to: 'all', starts_at: '', ends_at: '',
    };
    setForm({ ...base });
  }, [open, discount]);

  if (!form) return null;
  const set = (patch) => setForm({ ...form, ...patch });
  const isNew = !form.id;

  const save = async () => {
    if (!form.code || (form.type !== 'free_shipping' && (form.value === '' || form.value == null))) return;
    setSaving(true);
    try {
      // Native discount_codes has is_active (boolean) instead of a 3-way
      // status - "scheduled" is derived on read from starts_at, not stored.
      const payload = {
        tenant_id: store.id,
        code: form.code.toUpperCase(),
        discount_type: form.type,
        value: Number(form.value) || 0,
        min_amount_cents: Math.round((Number(form.min_order_amount) || 0) * 100),
        max_uses: Number(form.usage_limit) > 0 ? Number(form.usage_limit) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.status !== 'disabled',
      };
      const { error } = isNew
        ? await supabase.from('discount_codes').insert(payload)
        : await supabase.from('discount_codes').update(payload).eq('id', form.id);
      if (error) throw error;
      onSaved();
      onOpenChange(false);
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement de la réduction");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nouvelle réduction' : 'Modifier la réduction'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Code promo *">
            <div className="flex gap-2">
              <input value={form.code} onChange={(e) => set({ code: e.target.value })} className={`${inputCls} font-mono uppercase`} />
              <button type="button" onClick={() => set({ code: genCode() })} className="px-3 border border-[#E1E1E1] rounded-md text-[#6D7175] hover:bg-black/5 shrink-0"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={(e) => set({ type: e.target.value })} className={inputCls}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          {form.type !== 'free_shipping' && (
            <Field label={form.type === 'percentage' ? 'Valeur (%)' : 'Montant'} hint={form.type === 'percentage' ? 'Ex : 10 pour 10%' : `Dans la devise de la boutique (${store.currency})`}>
              <input type="number" min="0" step={form.type === 'percentage' ? '1' : '0.01'} value={form.value} onChange={(e) => set({ value: e.target.value })} className={inputCls} />
            </Field>
          )}
          <Field label="Montant minimum" hint="0 = pas de minimum">
            <input type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(e) => set({ min_order_amount: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Limite d'utilisation" hint="0 = illimité">
            <input type="number" min="0" value={form.usage_limit} onChange={(e) => set({ usage_limit: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Début"><input type="date" value={form.starts_at ? form.starts_at.slice(0, 10) : ''} onChange={(e) => set({ starts_at: e.target.value })} className={inputCls} /></Field>
            <Field label="Fin"><input type="date" value={form.ends_at ? form.ends_at.slice(0, 10) : ''} onChange={(e) => set({ ends_at: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Statut">
            <select value={form.status} onChange={(e) => set({ status: e.target.value })} className={inputCls}>
              <option value="active">Active</option>
              <option value="scheduled">Programmée</option>
              <option value="disabled">Désactivée</option>
            </select>
          </Field>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save} disabled={saving} className="bg-[#008060] hover:bg-[#00694d]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
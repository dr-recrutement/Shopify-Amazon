import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#202223] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// The native `customers` table only has name/email/phone (plus
// total_spent_cents/orders_count, computed from orders) - no tags, note or
// marketing-consent columns yet, so this form only edits what's real.
export default function CustomerForm({ open, onOpenChange, store, customer, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = customer || { first_name: '', last_name: '', email: '', phone: '' };
    setForm({ ...base });
  }, [open, customer]);

  if (!form) return null;
  const set = (patch) => setForm({ ...form, ...patch });
  const isNew = !form.id;

  const save = async () => {
    if (!form.email) return;
    setSaving(true);
    try {
      const payload = {
        tenant_id: store.id,
        name: [form.first_name, form.last_name].filter(Boolean).join(' '),
        email: form.email,
        phone: form.phone || '',
      };
      const { error } = isNew
        ? await supabase.from('customers').insert(payload)
        : await supabase.from('customers').update(payload).eq('id', form.id);
      if (error) throw error;
      onSaved();
      onOpenChange(false);
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement du client");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nouveau client' : 'Modifier le client'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom"><input value={form.first_name} onChange={(e) => set({ first_name: e.target.value })} className={inputCls} /></Field>
            <Field label="Nom"><input value={form.last_name} onChange={(e) => set({ last_name: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="E-mail *"><input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={inputCls} /></Field>
          <Field label="Téléphone"><input value={form.phone} onChange={(e) => set({ phone: e.target.value })} className={inputCls} placeholder="+221…" /></Field>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save} disabled={saving || !form.email} className="bg-[#008060] hover:bg-[#00694d]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

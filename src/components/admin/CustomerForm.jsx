import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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

export default function CustomerForm({ open, onOpenChange, store, customer, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    if (!open) return;
    const base = customer || { first_name: '', last_name: '', email: '', phone: '', accepts_marketing: false, tags: [], note: '' };
    setForm({ ...base });
    setTagsText((base.tags || []).join(', '));
  }, [open, customer]);

  if (!form) return null;
  const set = (patch) => setForm({ ...form, ...patch });
  const isNew = !form.id;

  const save = async () => {
    if (!form.email) return;
    setSaving(true);
    try {
      const payload = {
        store_id: store.id,
        first_name: form.first_name || '',
        last_name: form.last_name || '',
        email: form.email,
        phone: form.phone || '',
        accepts_marketing: !!form.accepts_marketing,
        tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
        note: form.note || '',
      };
      if (isNew) await base44.entities.Customer.create(payload);
      else await base44.entities.Customer.update(form.id, payload);
      onSaved();
      onOpenChange(false);
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
          <Field label="Tags"><input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={inputCls} placeholder="VIP, grossiste (séparés par virgules)" /></Field>
          <Field label="Note"><textarea value={form.note} onChange={(e) => set({ note: e.target.value })} rows={2} className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm text-[#202223] cursor-pointer">
            <input type="checkbox" checked={!!form.accepts_marketing} onChange={(e) => set({ accepts_marketing: e.target.checked })} className="accent-[#008060]" />
            Accepte de recevoir nos communications marketing
          </label>
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
import { useState, useEffect, useCallback } from 'react';
import { Store, Loader2, Save, Check, FileText, MapPin, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { COUNTRIES } from '@/lib/world/countries';

export default function StoreSettings() {
  const { store, loading } = useCurrentStore();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (store) setForm({
      name: store.name || '', business_name: store.business_name || '', business_type: store.business_type || '',
      description: store.description || '', email: store.email || '', phone: store.phone || '',
      address: store.address || '', country: store.country || '', currency: store.currency || 'USD',
      domain: store.domain || '',
    });
  }, [store]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Store.update(store.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  if (loading || !form) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  const fld = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008060]/30';
  const lbl = 'text-xs font-semibold text-[#6D7175] mb-1 block';

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2"><Store className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">Configuration de la boutique</h1></div>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">{saved ? <><Check className="w-4 h-4" /> Enregistré</> : saving ? 'Enregistrement…' : <><Save className="w-4 h-4" /> Enregistrer</>}</button>
      </div>

      <div className="space-y-5">
        <section className="bg-white rounded-xl border border-[#E1E1E1] p-5">
          <div className="flex items-center gap-2 mb-4"><Store className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Informations générales</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Nom de la boutique</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fld} /></div>
            <div><label className={lbl}>Type d'activité</label><input value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} placeholder="Mode, beauté, électronique…" className={fld} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={fld} /></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-[#E1E1E1] p-5">
          <div className="flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Détails légaux</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Raison sociale</label><input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className={fld} /></div>
            <div><label className={lbl}>Domaine personnalisé</label><input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="maboutique.com" className={fld} /></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-[#E1E1E1] p-5">
          <div className="flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Adresse d'expédition</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className={lbl}>Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fld} /></div>
            <div><label className={lbl}>Pays</label><select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={fld}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            <div><label className={lbl}>Devise</label><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={fld}><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="XOF">XOF (FCFA)</option><option value="NGN">NGN (₦)</option><option value="GBP">GBP (£)</option></select></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-[#E1E1E1] p-5">
          <div className="flex items-center gap-2 mb-4"><Phone className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Coordonnées de contact</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>E-mail</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fld} /></div>
            <div><label className={lbl}>Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fld} /></div>
          </div>
        </section>
      </div>
    </div>
  );
}
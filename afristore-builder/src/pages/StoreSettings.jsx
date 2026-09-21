import { useState, useEffect } from 'react';
import { Store, Loader2, Save, Check, FileText, MapPin, Phone, Globe2, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { useI18n } from '@/lib/i18n';
import { COUNTRIES } from '@/lib/world/countries';

const CURRENCIES = [
  { code: 'XOF', label: 'FCFA (XOF)' },
  { code: 'NGN', label: 'Naira (NGN)' },
  { code: 'USD', label: 'Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'Livre (GBP)' },
  { code: 'MAD', label: 'Dirham (MAD)' },
  { code: 'EGP', label: 'Livre (EGP)' },
  { code: 'KES', label: 'Shilling (KES)' },
  { code: 'ZAR', label: 'Rand (ZAR)' },
  { code: 'GHS', label: 'Cedi (GHS)' },
  { code: 'AED', label: 'Dirham UAE (AED)' },
  { code: 'BRL', label: 'Real (BRL)' },
];

export default function StoreSettings() {
  const { langs } = useI18n();
  const { store, loading } = useCurrentStore();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (store) setForm({
      name: store.name || '', business_name: store.business_name || '', business_type: store.business_type || '',
      description: store.description || '', email: store.email || '', phone: store.phone || '',
      address: store.address || '', country: store.country || '', currency: store.currency || 'XOF',
      domain: store.domain || '', language: store.language || 'fr',
    });
  }, [store]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e?.preventDefault();
    if (!store?.id || !form) return;
    setSaving(true); setSaved(false);
    try {
      await base44.entities.Store.update(store.id, form);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  if (loading || !form) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  const fld = 'w-full px-3 py-2.5 rounded-lg border border-[#E1E1E1] bg-white text-sm outline-none focus:ring-2 focus:ring-[#008060]/30 transition';
  const lbl = 'block text-xs font-semibold text-[#6D7175] mb-1.5';
  const card = 'bg-white rounded-2xl border border-[#E1E1E1] p-5 sm:p-6 shadow-sm';
  const head = 'flex items-center gap-2 mb-4';

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Paramètres de la boutique</h1>
          <p className="text-xs text-[#6D7175] mt-0.5">Identité, coordonnées et préférences régionales en un seul endroit.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-50 transition shrink-0">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</> : saved ? <><Check className="w-4 h-4" /> Enregistré</> : <><Save className="w-4 h-4" /> Enregistrer</>}
        </button>
      </div>

      <form onSubmit={save} className="space-y-5">
        <section className={card}>
          <div className={head}><Store className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Informations générales</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Nom de la boutique</label><input value={form.name} onChange={(e) => set('name', e.target.value)} className={fld} required /></div>
            <div><label className={lbl}>Type d'activité</label><input value={form.business_type} onChange={(e) => set('business_type', e.target.value)} placeholder="Mode, beauté, électronique…" className={fld} /></div>
          </div>
          <div className="mt-4"><label className={lbl}>Description</label><textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={fld} /></div>
        </section>

        <section className={card}>
          <div className={head}><Building2 className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Informations légales</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Raison sociale</label><input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} className={fld} /></div>
            <div><label className={lbl}>Domaine personnalisé</label><input value={form.domain} onChange={(e) => set('domain', e.target.value)} placeholder="maboutique.com" className={fld} /></div>
          </div>
        </section>

        <section className={card}>
          <div className={head}><Phone className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Coordonnées de contact</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>E-mail</label><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={fld} /></div>
            <div><label className={lbl}>Téléphone</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={fld} /></div>
          </div>
        </section>

        <section className={card}>
          <div className={head}><Globe2 className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Localisation & préférences régionales</h2></div>
          <div className="mb-4"><label className={lbl}>Adresse d'expédition</label><input value={form.address} onChange={(e) => set('address', e.target.value)} className={fld} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={lbl}>Pays</label><select value={form.country} onChange={(e) => set('country', e.target.value)} className={fld}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            <div><label className={lbl}>Devise</label><select value={form.currency} onChange={(e) => set('currency', e.target.value)} className={fld}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
            <div><label className={lbl}>Langue par défaut</label><select value={form.language} onChange={(e) => set('language', e.target.value)} className={fld}>{langs.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
          </div>
        </section>
      </form>
    </div>
  );
}
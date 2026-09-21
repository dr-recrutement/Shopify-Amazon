import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Loader2, Save, Check, MapPin, Phone, Globe } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { COUNTRIES } from '@/lib/world/countries';
import { CURRENCIES } from '@/lib/world/currencies';
import PhoneInput from '@/components/PhoneInput';

// Native `tenants` columns: name/sector/country/region/city/landmark/
// currency/phone. No description/email/business_name(raison sociale)/domain
// column yet, so those fields were dropped here rather than silently
// discarded on save - domain connection lives on its own page (/domains),
// which now writes to the real `domains` table.
export default function StoreSettings() {
  const { store, loading, reload } = useCurrentStore();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (store) setForm({
      name: store.name || '', sector: store.sector || '',
      country: store.country || '', region: store.region || '', city: store.city || '', landmark: store.landmark || '',
      currency: store.currency || 'USD', phone: store.phone || '',
    });
  }, [store]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('tenants').update(form).eq('id', store.id);
      if (error) throw error;
      await reload();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement");
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
            <div><label className={lbl}>Secteur d'activité</label><input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Mode, beauté, électronique…" className={fld} /></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-[#E1E1E1] p-5">
          <div className="flex items-center gap-2 mb-4"><Globe className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Domaine</h2></div>
          <p className="text-sm text-[#6D7175]">La connexion de domaine se gère désormais depuis <Link to="/domains" className="text-[#008060] font-semibold hover:underline">Domaines et DNS</Link>.</p>
        </section>

        <section className="bg-white rounded-xl border border-[#E1E1E1] p-5">
          <div className="flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Adresse d'expédition</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Pays</label><select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={fld}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            <div><label className={lbl}>Devise</label><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={fld}>{[...CURRENCIES].sort((a, b) => a.code.localeCompare(b.code)).map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>)}</select></div>
            <div><label className={lbl}>Région</label><input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={fld} /></div>
            <div><label className={lbl}>Ville</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={fld} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Repère / quartier</label><input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className={fld} /></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-[#E1E1E1] p-5">
          <div className="flex items-center gap-2 mb-4"><Phone className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Contact</h2></div>
          <label className={lbl}>Téléphone</label>
          <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} countryHint={form.country} />
        </section>
      </div>
    </div>
  );
}

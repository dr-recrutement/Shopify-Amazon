import { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Trash2, Loader2, X, Check, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';
import { COUNTRIES } from '@/lib/world/countries';

const AFRICAN_CARRIERS = ['DHL', 'FedEx', 'UPS', 'La Poste', 'Chronopost', 'Aramex', 'Gephart', 'Local Express', 'Transporteur local'];

export default function ShippingSettings() {
  const { store, loading } = useCurrentStore();
  const [zones, setZones] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', countries: [], carrier: 'DHL', rate_type: 'flat', rate: 0, min_days: 3, max_days: 7, min_order_amount: 0, enabled: true });

  const load = useCallback(async () => {
    if (!store?.id) return;
    setZones(await base44.entities.ShippingZone.filter({ store_id: store.id }, '-created_date', 100));
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      await base44.entities.ShippingZone.create({ ...form, store_id: store.id, currency: store.currency });
      setShowForm(false);
      setForm({ name: '', countries: [], carrier: 'DHL', rate_type: 'flat', rate: 0, min_days: 3, max_days: 7, min_order_amount: 0, enabled: true });
      await load();
    } finally { setBusy(false); }
  };

  const toggle = async (z) => { await base44.entities.ShippingZone.update(z.id, { enabled: !z.enabled }); await load(); };
  const remove = async (id) => { if (confirm('Supprimer cette zone ?')) { await base44.entities.ShippingZone.delete(id); await load(); } };

  const toggleCountry = (code) => setForm((f) => ({ ...f, countries: f.countries.includes(code) ? f.countries.filter((c) => c !== code) : [...f.countries, code] }));

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2"><Truck className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">Paramètres de livraison</h1></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Créer une zone</button>
      </div>

      <p className="text-sm text-[#6D7175] mb-4">Configurez vos zones de livraison, transporteurs locaux et frais d'expédition selon les régions.</p>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-[#202223]">Nouvelle zone de livraison</h2><button onClick={() => setShowForm(false)} className="text-[#6D7175]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-[#6D7175]">Nom de la zone</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Afrique de l'Ouest" className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Transporteur</label><select value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm">{AFRICAN_CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Type de tarif</label><select value={form.rate_type} onChange={(e) => setForm({ ...form, rate_type: e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm"><option value="flat">Forfait</option><option value="free">Gratuit</option><option value="weight_based">Selon le poids</option><option value="price_based">Selon le montant</option></select></div>
              {form.rate_type !== 'free' && <div><label className="text-xs font-semibold text-[#6D7175]">Frais ({store?.currency})</label><input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: +e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-[#6D7175]">Délai min (jours)</label><input type="number" value={form.min_days} onChange={(e) => setForm({ ...form, min_days: +e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
                <div><label className="text-xs font-semibold text-[#6D7175]">Délai max (jours)</label><input type="number" value={form.max_days} onChange={(e) => setForm({ ...form, max_days: +e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
              </div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Montant min pour gratuit ({store?.currency}, 0 = désactivé)</label><input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: +e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
              <div>
                <label className="text-xs font-semibold text-[#6D7175] flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Pays inclus</label>
                <div className="mt-1 max-h-40 overflow-y-auto border border-[#E1E1E1] rounded-lg p-2 grid grid-cols-2 gap-1">
                  {COUNTRIES.map((c) => (
                    <label key={c.code} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-black/5 rounded px-1.5 py-1">
                      <input type="checkbox" checked={form.countries.includes(c.code)} onChange={() => toggleCountry(c.code)} className="accent-[#008060]" /> {c.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={create} disabled={busy || !form.name} className="w-full mt-5 bg-[#008060] text-white text-sm font-medium py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">{busy ? 'Création…' : 'Créer la zone'}</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {zones.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E1E1E1] p-10 text-center"><Truck className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" /><p className="text-sm text-[#6D7175]">Aucune zone de livraison configurée.</p></div>
        ) : zones.map((z) => (
          <div key={z.id} className="bg-white rounded-xl border border-[#E1E1E1] p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2"><p className="text-sm font-bold text-[#202223]">{z.name}</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${z.enabled ? 'bg-[#008060]/10 text-[#008060]' : 'bg-gray-100 text-gray-500'}`}>{z.enabled ? 'Actif' : 'Désactivé'}</span></div>
              <p className="text-xs text-[#6D7175] mt-1">{z.carrier} · {z.rate_type === 'free' ? 'Livraison gratuite' : formatMoney(z.rate, z.currency)} · {z.min_days}–{z.max_days} jours</p>
              <p className="text-[11px] text-[#6D7175] mt-1">{(z.countries || []).length} pays inclus</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(z)} className="w-8 h-8 rounded-md border border-[#E1E1E1] flex items-center justify-center text-[#6D7175] hover:bg-black/5">{z.enabled ? <Check className="w-4 h-4 text-[#008060]" /> : <X className="w-4 h-4" />}</button>
              <button onClick={() => remove(z.id)} className="w-8 h-8 rounded-md border border-[#E1E1E1] flex items-center justify-center text-[#6D7175] hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
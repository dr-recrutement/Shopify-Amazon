import { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Trash2, Loader2, X, Check } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';
import { COUNTRIES } from '@/lib/world/countries';

// Native shipping_zones: one country per zone (not an array), a single
// estimated_days figure (not min/max), and no carrier column - simplified
// from the original multi-country/carrier UI to match what's really there.
export default function ShippingSettings() {
  const { store, loading } = useCurrentStore();
  const [zones, setZones] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', country: 'SN', rate_type: 'flat', rate: 0, estimated_days: 5, free_shipping_threshold: 0 });

  const load = useCallback(async () => {
    if (!store?.id) return;
    try {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('tenant_id', store.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setZones((data || []).map((z) => ({
        ...z,
        enabled: z.is_active,
        rate: (z.rate_amount_cents || 0) / 100,
        currency: store.currency,
      })));
    } catch (e) {
      console.error('Failed to load shipping zones:', e);
      setZones([]);
    }
  }, [store?.id, store?.currency]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from('shipping_zones').insert({
        tenant_id: store.id,
        name: form.name,
        country: form.country,
        rate_type: form.rate_type,
        rate_amount_cents: form.rate_type === 'free' ? 0 : Math.round(Number(form.rate) * 100),
        estimated_days: Number(form.estimated_days) || null,
        free_shipping_threshold_cents: Number(form.free_shipping_threshold) > 0 ? Math.round(Number(form.free_shipping_threshold) * 100) : null,
        is_active: true,
      });
      if (error) throw error;
      setShowForm(false);
      setForm({ name: '', country: 'SN', rate_type: 'flat', rate: 0, estimated_days: 5, free_shipping_threshold: 0 });
      await load();
    } catch (e) {
      alert(e.message || "Échec de la création de la zone");
    } finally { setBusy(false); }
  };

  const toggle = async (z) => {
    const { error } = await supabase.from('shipping_zones').update({ is_active: !z.is_active }).eq('id', z.id);
    if (error) { alert(error.message); return; }
    await load();
  };
  const remove = async (id) => {
    if (!confirm('Supprimer cette zone ?')) return;
    const { error } = await supabase.from('shipping_zones').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2"><Truck className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">Paramètres de livraison</h1></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Créer une zone</button>
      </div>

      <p className="text-sm text-[#6D7175] mb-4">Configurez vos zones de livraison et frais d'expédition par pays.</p>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-[#202223]">Nouvelle zone de livraison</h2><button onClick={() => setShowForm(false)} className="text-[#6D7175]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-[#6D7175]">Nom de la zone</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Dakar Express" className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Pays</label><select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm">{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Type de tarif</label><select value={form.rate_type} onChange={(e) => setForm({ ...form, rate_type: e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm"><option value="flat">Forfait</option><option value="free">Gratuit</option><option value="weight_based">Selon le poids</option></select></div>
              {form.rate_type !== 'free' && <div><label className="text-xs font-semibold text-[#6D7175]">Frais ({store?.currency})</label><input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: +e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>}
              <div><label className="text-xs font-semibold text-[#6D7175]">Délai estimé (jours)</label><input type="number" value={form.estimated_days} onChange={(e) => setForm({ ...form, estimated_days: +e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-[#6D7175]">Montant min pour gratuit ({store?.currency}, 0 = désactivé)</label><input type="number" value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: +e.target.value })} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
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
              <p className="text-xs text-[#6D7175] mt-1">{z.rate_type === 'free' ? 'Livraison gratuite' : formatMoney(z.rate, z.currency)} · {z.estimated_days ? `${z.estimated_days} jours` : '—'}</p>
              <p className="text-[11px] text-[#6D7175] mt-1">{COUNTRIES.find((c) => c.code === z.country)?.name || z.country}</p>
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

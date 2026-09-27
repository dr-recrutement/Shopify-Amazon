import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe, Loader2, AlertCircle, Store,
  ExternalLink, Check, Zap,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney, CURRENCIES } from '@/lib/world/currencies';
import { COUNTRIES } from '@/lib/world/countries';
import { Plus, Trash2 } from 'lucide-react';
import { hasFeature } from '@/lib/plans';
import PaywallCard from '@/components/admin/PaywallCard';

const CHANNELS = [
  { id: 'online_store', name: 'Boutique en ligne', icon: Store, color: '#008060', desc: 'Votre site Sellia', active: true },
];

export default function Markets() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState([]);
  const [newCountry, setNewCountry] = useState('');
  const [newCurrency, setNewCurrency] = useState('');
  const [savingMarket, setSavingMarket] = useState(false);

  const loadMarkets = useCallback(async () => {
    if (!store?.id) return;
    const { data } = await supabase.from('markets').select('*').eq('tenant_id', store.id).order('created_at');
    setMarkets(data || []);
  }, [store?.id]);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);

  const addMarket = async () => {
    if (!newCountry || !store?.id) return;
    setSavingMarket(true);
    try {
      const country = COUNTRIES.find((c) => c.code === newCountry);
      const { error } = await supabase.from('markets').insert({
        tenant_id: store.id,
        country: newCountry,
        currency: newCurrency || country?.currency || 'USD',
        language: 'fr',
        is_active: true,
      });
      if (error) throw error;
      setNewCountry('');
      setNewCurrency('');
      await loadMarkets();
    } catch (e) {
      alert(e.message || "Échec de l'ajout du marché");
    } finally { setSavingMarket(false); }
  };

  const toggleMarket = async (m) => {
    const { error } = await supabase.from('markets').update({ is_active: !m.is_active }).eq('id', m.id);
    if (error) { alert(error.message); return; }
    setMarkets((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const removeMarket = async (id) => {
    if (!confirm('Retirer ce marché ?')) return;
    const { error } = await supabase.from('markets').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setMarkets((prev) => prev.filter((x) => x.id !== id));
  };

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select('total_cents, status').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error('Failed to load orders:', e);
      setOrders([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  const NOT_PAID = new Set(['pending', 'cancelled', 'refunded']);
  const revenue = orders.filter((o) => !NOT_PAID.has(o.status)).reduce((s, o) => s + (o.total_cents || 0) / 100, 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="w-5 h-5 text-[#6D7175]" />
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Marchés</h1>
          <p className="text-xs text-[#6D7175]">Vendez sur plusieurs canaux et atteignez plus de clients.</p>
        </div>
      </div>

      {store?.slug && (
        <div className="bg-gradient-to-r from-[#008060] to-[#0EA5E9] rounded-xl p-5 mb-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium opacity-90">Votre boutique est en ligne</p>
              <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer" className="text-lg font-bold hover:underline flex items-center gap-1.5 mt-1">
                {store.slug} <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-90">Revenu total</p>
              <p className="text-2xl font-bold">{formatMoney(revenue, store.currency)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHANNELS.map((ch) => (
          <div key={ch.id} className="rounded-xl border p-5 transition bg-white border-[#008060]/30">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${ch.color}15` }}>
                <ch.icon className="w-5 h-5" style={{ color: ch.color }} />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#008060] bg-[#008060]/10 px-2 py-1 rounded-full"><Check className="w-3 h-3" /> Actif</span>
            </div>
            <h3 className="text-sm font-bold text-[#202223]">{ch.name}</h3>
            <p className="text-xs text-[#6D7175] mt-0.5 mb-4">{ch.desc}</p>
            <Link to="/theme-editor" className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] hover:underline">Gérer →</Link>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#6D7175] mt-4">D'autres canaux (Instagram, Facebook, WhatsApp, marketplace) demandent une intégration directe avec ces plateformes tierces et n'existent pas encore ici — ils n'apparaissent que lorsqu'ils sont réellement disponibles.</p>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-[#008060]" />
          <h2 className="text-sm font-bold text-[#202223]">Marchés</h2>
        </div>
        {!hasFeature(store.plan, 'multi_currency') ? (
          <PaywallCard requiredPlan="growth" title="Les marchés multi-devises nécessitent le plan Growth" description="Définissez les pays où vous vendez, chacun avec sa propre devise d'affichage. Passez au plan Growth pour y accéder." />
        ) : (
          <>
        <p className="text-xs text-[#6D7175] mb-4">Définissez les pays où vous vendez, chacun avec sa propre devise d'affichage.</p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select value={newCountry} onChange={(e) => { const c = e.target.value; setNewCountry(c); const country = COUNTRIES.find((x) => x.code === c); if (country) setNewCurrency(country.currency); }} className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm bg-white">
            <option value="">Choisir un pays…</option>
            {COUNTRIES.filter((c) => !markets.some((m) => m.country === c.code)).map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
          <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} className="w-full sm:w-32 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm bg-white">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
          <button onClick={addMarket} disabled={!newCountry || savingMarket} className="flex items-center justify-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#00694d] disabled:opacity-40 shrink-0"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>

        {markets.length === 0 ? (
          <p className="text-xs text-[#6D7175] py-4 text-center">Aucun marché défini. Votre boutique vend actuellement partout dans la devise principale ({store.currency}).</p>
        ) : (
          <div className="space-y-2">
            {markets.map((m) => {
              const country = COUNTRIES.find((c) => c.code === m.country);
              return (
                <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#E1E1E1]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country?.flag}</span>
                    <div>
                      <p className="text-sm font-medium text-[#202223]">{country?.name || m.country}</p>
                      <p className="text-[11px] text-[#6D7175]">Devise : {m.currency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-[#6D7175] cursor-pointer">
                      <input type="checkbox" checked={m.is_active} onChange={() => toggleMarket(m)} className="accent-[#008060]" /> Actif
                    </label>
                    <button onClick={() => removeMarket(m.id)} className="text-[#6D7175] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-[#6D7175] mt-3">Ceci définit dans quelle devise chaque marché s'affiche. La conversion automatique des prix (taux de change en temps réel) et les tarifs spécifiques par marché ne sont pas encore disponibles — les prix restent ceux saisis sur vos produits.</p>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#008060]" />
          <h2 className="text-sm font-bold text-[#202223]">Pourquoi vendre sur plusieurs canaux ?</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-[#202223] mb-1">🌍 Toucher plus de clients</p>
            <p className="text-[11px] text-[#6D7175]">Chaque canal ajoute une nouvelle audience et augmente vos chances de vente.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#202223] mb-1">📦 Synchronisation automatique</p>
            <p className="text-[11px] text-[#6D7175]">Stock et commandes synchronisés entre tous vos canaux de vente.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#202223] mb-1">📈 Booster votre croissance</p>
            <p className="text-[11px] text-[#6D7175]">Les marchands multi-canaux génèrent en moyenne 2x plus de revenus.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
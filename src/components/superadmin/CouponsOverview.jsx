import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tag, Loader2, Search } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { formatMoney } from '@/lib/world/currencies';

export default function CouponsOverview() {
  const [codes, setCodes] = useState([]);
  const [tenants, setTenants] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [c, t] = await Promise.all([
      supabase.from('discount_codes').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('tenants').select('id, name'),
    ]);
    setCodes(c.data || []);
    setTenants(Object.fromEntries((t.data || []).map((x) => [x.id, x.name])));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => codes.filter((c) => !search
    || c.code?.toLowerCase().includes(search.toLowerCase())
    || (tenants[c.tenant_id] || '').toLowerCase().includes(search.toLowerCase())
  ), [codes, tenants, search]);

  const totalUses = codes.reduce((s, c) => s + (c.used_count || 0), 0);
  const activeCount = codes.filter((c) => c.is_active).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Coupons & promotions</h2><span className="text-xs text-[#6D7175]">({filtered.length})</span></div>
        <div className="flex items-center gap-1.5 border border-[#E1E1E1] rounded-lg px-2.5 py-1.5 bg-white"><Search className="w-3.5 h-3.5 text-[#6D7175]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Code ou boutique…" className="text-xs outline-none w-44" /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><p className="text-2xl font-bold text-[#202223]">{codes.length}</p><p className="text-xs text-[#6D7175]">Codes créés (toutes boutiques)</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><p className="text-2xl font-bold text-[#008060]">{activeCount}</p><p className="text-xs text-[#6D7175]">Actifs</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><p className="text-2xl font-bold text-[#202223]">{totalUses}</p><p className="text-xs text-[#6D7175]">Utilisations cumulées</p></div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucun coupon.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]"><tr><th className="px-4 py-2.5 font-semibold">Code</th><th className="px-4 py-2.5 font-semibold">Boutique</th><th className="px-4 py-2.5 font-semibold">Réduction</th><th className="px-4 py-2.5 font-semibold">Utilisations</th><th className="px-4 py-2.5 font-semibold">Statut</th></tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-[#E1E1E1] hover:bg-[#F4F4F4]">
                    <td className="px-4 py-2.5 font-mono font-semibold text-[#202223]">{c.code}</td>
                    <td className="px-4 py-2.5 text-[#6D7175]">{tenants[c.tenant_id] || '—'}</td>
                    <td className="px-4 py-2.5 text-[#202223]">{c.discount_type === 'percentage' ? `${c.value}%` : c.discount_type === 'free_shipping' ? 'Livraison offerte' : formatMoney(c.value, 'USD')}</td>
                    <td className="px-4 py-2.5 text-[#6D7175]">{c.used_count || 0}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                    <td className="px-4 py-2.5"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-[#008060]/10 text-[#008060]' : 'bg-[#F4F4F4] text-[#6D7175]'}`}>{c.is_active ? 'Actif' : 'Inactif'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, Loader2, TrendingUp, Store, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/api/supabaseClient';
import { formatMoney } from '@/lib/world/currencies';

function dayKey(d) { return new Date(d).toISOString().slice(0, 10); }

export default function PlatformAnalytics() {
  const [orders, setOrders] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 90 * 86400000).toISOString();
    const [o, t] = await Promise.all([
      supabase.from('orders').select('total_cents, currency, status, created_at, tenant_id').gte('created_at', since).limit(5000),
      supabase.from('tenants').select('id, name, created_at'),
    ]);
    setOrders(o.data || []);
    setTenants(t.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const paidOrders = useMemo(() => orders.filter((o) => !['pending', 'cancelled', 'refunded'].includes(o.status)), [orders]);

  const revenueByDay = useMemo(() => {
    const map = {};
    paidOrders.forEach((o) => {
      const k = dayKey(o.created_at);
      map[k] = (map[k] || 0) + (o.total_cents || 0) / 100;
    });
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const k = dayKey(d);
      days.push({ day: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), revenue: Math.round((map[k] || 0) * 100) / 100 });
    }
    return days;
  }, [paidOrders]);

  const newStoresByWeek = useMemo(() => {
    const now = Date.now();
    const weeks = [0, 0, 0, 0, 0, 0, 0, 0]; // last 8 weeks
    tenants.forEach((t) => {
      const diff = now - new Date(t.created_at).getTime();
      const w = Math.floor(diff / (7 * 86400000));
      if (w >= 0 && w < 8) weeks[7 - w] += 1;
    });
    return weeks;
  }, [tenants]);

  const topStores = useMemo(() => {
    const byTenant = {};
    paidOrders.forEach((o) => { byTenant[o.tenant_id] = (byTenant[o.tenant_id] || 0) + (o.total_cents || 0); });
    return Object.entries(byTenant)
      .map(([id, cents]) => ({ id, cents, name: tenants.find((t) => t.id === id)?.name || id.slice(0, 8) }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 5);
  }, [paidOrders, tenants]);

  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total_cents || 0), 0) / 100;
  const totalOrders = paidOrders.length;
  const newStoresLast30 = tenants.filter((t) => Date.now() - new Date(t.created_at).getTime() < 30 * 86400000).length;

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Analytics plateforme</h2><span className="text-xs text-[#6D7175]">(90 derniers jours, commandes payées)</span></div>
      <p className="text-[11px] text-[#6D7175] mb-4">Les montants sont additionnés sans conversion de devise (chaque boutique facture dans sa propre devise) — à lire comme un ordre de grandeur, pas un total exact, tant qu'aucun taux de change n'est branché.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><TrendingUp className="w-4 h-4 text-[#008060] mb-2" /><p className="text-xl font-bold text-[#202223]">{formatMoney(totalRevenue, 'USD')}</p><p className="text-xs text-[#6D7175]">Revenu marchand cumulé</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><ShoppingCart className="w-4 h-4 text-purple-600 mb-2" /><p className="text-xl font-bold text-[#202223]">{totalOrders}</p><p className="text-xs text-[#6D7175]">Commandes payées</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><Store className="w-4 h-4 text-amber-600 mb-2" /><p className="text-xl font-bold text-[#202223]">{newStoresLast30}</p><p className="text-xs text-[#6D7175]">Nouvelles boutiques (30j)</p></div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 mb-5">
        <p className="text-xs font-bold text-[#202223] mb-3">Revenu quotidien — 30 derniers jours</p>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <AreaChart data={revenueByDay}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#008060" stopOpacity={0.3} /><stop offset="95%" stopColor="#008060" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6D7175' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#6D7175' }} width={50} />
              <Tooltip formatter={(v) => formatMoney(v, 'USD')} />
              <Area type="monotone" dataKey="revenue" stroke="#008060" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4">
          <p className="text-xs font-bold text-[#202223] mb-3">Top 5 boutiques (revenu, 90j)</p>
          {topStores.length === 0 ? <p className="text-xs text-[#6D7175]">Aucune commande payée.</p> : (
            <div className="space-y-2">
              {topStores.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#202223]">{i + 1}. {s.name}</span>
                  <span className="font-semibold text-[#008060]">{formatMoney(s.cents / 100, 'USD')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4">
          <p className="text-xs font-bold text-[#202223] mb-3">Nouvelles boutiques par semaine (8 dernières)</p>
          <div className="flex items-end gap-1.5 h-24">
            {newStoresByWeek.map((n, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-[#6D7175]">{n}</span>
                <div className="w-full bg-[#008060]/20 rounded-t" style={{ height: `${Math.max(4, n * 16)}px` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

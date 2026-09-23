import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Percent, ShoppingBag, Loader2, AlertCircle, Activity, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';
import StatCard from '@/components/admin/StatCard';
import { Wallet } from '@/components/admin/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const STATUS_COLORS = {
  pending: '#F59E0B', paid: '#008060', processing: '#3B82F6', fulfilled: '#8B5CF6',
  shipped: '#0EA5E9', delivered: '#10B981', cancelled: '#EF4444', refunded: '#6B7280',
};
const NOT_PAID = new Set(['pending', 'cancelled', 'refunded']);

export default function Analytics() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data: ord, error: ordError } = await supabase.from('orders').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(500);
      if (ordError) throw ordError;
      setOrders(ord || []);
      const orderIds = (ord || []).map((o) => o.id);
      if (orderIds.length > 0) {
        const { data: its } = await supabase.from('order_items').select('*').in('order_id', orderIds);
        setItems(its || []);
      } else {
        setItems([]);
      }
      const { data: carts } = await supabase.from('abandoned_carts').select('id').eq('tenant_id', store.id).eq('status', 'active');
      setAbandonedCarts(carts || []);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const monthly = useMemo(() => {
    const now = new Date();
    const map = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
    }
    orders.forEach((o) => {
      if (!o.created_at || NOT_PAID.has(o.status)) return;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (map.has(key)) map.set(key, map.get(key) + (o.total_cents || 0) / 100);
    });
    return Array.from(map.entries()).map(([k, v]) => {
      const [, m] = k.split('-');
      return { mois: MONTH_LABELS[Number(m)], revenu: Math.round(v / 1000) };
    });
  }, [orders]);

  const daily = useMemo(() => {
    const now = new Date();
    const map = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      map.set(d.toDateString(), { jour: DAY_LABELS[d.getDay()], commandes: 0, revenu: 0 });
    }
    orders.forEach((o) => {
      if (!o.created_at) return;
      const d = new Date(o.created_at).toDateString();
      if (map.has(d)) {
        const cur = map.get(d);
        cur.commandes += 1;
        if (!NOT_PAID.has(o.status)) cur.revenu += (o.total_cents || 0) / 100;
      }
    });
    return Array.from(map.values()).map((v) => ({ ...v, revenu: Math.round(v.revenu / 1000) }));
  }, [orders]);

  const totals = useMemo(() => {
    const paid = orders.filter((o) => !NOT_PAID.has(o.status));
    const revenue = paid.reduce((s, o) => s + (o.total_cents || 0) / 100, 0);
    const customers = new Set(orders.map((o) => o.customer_email).filter(Boolean)).size;
    const todayKey = new Date().toDateString();
    const todayOrders = orders.filter((o) => o.created_at && new Date(o.created_at).toDateString() === todayKey);
    const todayRevenue = todayOrders.filter((o) => !NOT_PAID.has(o.status)).reduce((s, o) => s + (o.total_cents || 0) / 100, 0);
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
    const aov = paid.length > 0 ? revenue / paid.length : 0;
    return { revenue, orders: orders.length, customers, todayRevenue, todayOrders: todayOrders.length, pending, aov };
  }, [orders]);

  const bestSellers = useMemo(() => {
    const acc = new Map();
    items.forEach((it) => {
      const key = it.product_id || it.product_name;
      if (!key) return;
      const cur = acc.get(key) || { nom: it.product_name, ventes: 0, revenu: 0 };
      cur.ventes += it.quantity || 0;
      cur.revenu += ((it.price_cents || 0) * (it.quantity || 0)) / 100;
      acc.set(key, cur);
    });
    const list = Array.from(acc.values()).sort((a, b) => b.ventes - a.ventes).slice(0, 6);
    const max = list[0]?.ventes || 1;
    return list.map((p) => ({ ...p, pct: Math.round((p.ventes / max) * 100) }));
  }, [items]);

  const funnel = useMemo(() => {
    const visits = Math.max(orders.length * 8, orders.length, 1);
    const productViews = Math.round(visits * 0.45);
    const cartsCount = orders.length + abandonedCarts.length;
    return [
      { etape: 'Visites', valeur: visits },
      { etape: 'Vues produit', valeur: productViews },
      { etape: 'Paniers', valeur: cartsCount },
      { etape: 'Commandes', valeur: orders.length },
    ];
  }, [orders, abandonedCarts]);

  const conversion = funnel[0].valeur > 0 ? ((orders.length / funnel[0].valeur) * 100).toFixed(2) : '0';
  const recentOrders = orders.slice(0, 5);

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#6D7175]" />
          <div>
            <h1 className="text-xl font-bold text-[#202223]">Analytiques boutique</h1>
            <p className="text-xs text-[#6D7175]">{store.name} · 6 derniers mois</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-full px-3 py-1.5 hover:bg-[#008060]/5">
          <Activity className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Aujourd'hui" value={formatMoney(totals.todayRevenue, store.currency)} hint={`${totals.todayOrders} commande(s)`} />
        <StatCard icon={Wallet} label="Revenu encaissé" value={formatMoney(totals.revenue, store.currency)} hint="6 mois" />
        <StatCard icon={ShoppingBag} label="Commandes" value={String(totals.orders)} hint={`${totals.pending} en attente`} />
        <StatCard icon={Percent} label="Taux de conversion" value={`${conversion} %`} hint="estimé" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#202223] mb-1">Revenu sur 6 mois</h2>
          <p className="text-xs text-[#6D7175] mb-4">Tendance mensuelle</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly} margin={{ left: -10, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008060" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#008060" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} formatter={(v) => [formatMoney(Number(v) * 1000, store.currency), 'Revenu']} />
              <Area type="monotone" dataKey="revenu" stroke="#008060" strokeWidth={2.5} fill="url(#gRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-4">Statuts des commandes</h2>
          {orders.length === 0 ? <p className="text-xs text-[#6D7175]">Aucune donnée.</p> : (
            <div className="space-y-2.5">
              {Object.entries(orders.reduce((m, o) => (m[o.status] = (m[o.status] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
                const pct = Math.round((v / orders.length) * 100);
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#6D7175] capitalize">{k}</span>
                      <span className="font-semibold text-[#202223]">{v}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F4F4F4] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: STATUS_COLORS[k] || '#008060' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-1">7 derniers jours</h2>
          <p className="text-xs text-[#6D7175] mb-4">Commandes par jour</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily} margin={{ left: -10, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
              <XAxis dataKey="jour" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} />
              <Bar dataKey="commandes" fill="#008060" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-1">Tunnel de conversion</h2>
          <p className="text-xs text-[#6D7175] mb-4">Estimation en temps réel</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="etape" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} />
              <Bar dataKey="valeur" fill="#008060" radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#008060]" /> Meilleures ventes
          </h2>
          {bestSellers.length === 0 ? (
            <p className="text-xs text-[#6D7175] py-4 text-center">Aucune vente enregistrée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p, i) => (
                <div key={p.nom + i} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-[#6D7175] w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#202223] truncate pr-3">{p.nom}</span>
                      <span className="text-xs text-[#6D7175] whitespace-nowrap">{p.ventes} ventes · {formatMoney(p.revenu, store.currency)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F4F4F4] overflow-hidden">
                      <div className="h-full rounded-full bg-[#008060]" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#008060]" /> Commandes récentes
          </h2>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-[#6D7175] py-4 text-center">Aucune commande pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <Link key={o.id} to="/orders" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F4F4F4] transition">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#202223] truncate">{'#' + o.id.slice(0, 8).toUpperCase() + (o.customer_email ? ` · ${o.customer_email}` : '')}</p>
                    <p className="text-xs text-[#6D7175]">{o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : ''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-[#202223]">{formatMoney((o.total_cents || 0) / 100, o.currency || store.currency)}</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: (STATUS_COLORS[o.status] || '#6D7175') + '20', color: STATUS_COLORS[o.status] || '#6D7175' }}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
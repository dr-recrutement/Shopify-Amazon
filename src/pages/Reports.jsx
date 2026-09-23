import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileBarChart, Loader2, AlertCircle, TrendingUp, Package, Users, Download } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const NOT_PAID = new Set(['pending', 'cancelled', 'refunded']);

export default function Reports() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [o, p, c] = await Promise.all([
        supabase.from('orders').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('products').select('id').eq('tenant_id', store.id).limit(100),
        supabase.from('customers').select('id').eq('tenant_id', store.id).limit(200),
      ]);
      setOrders(o.data || []); setProducts(p.data || []); setCustomers(c.data || []);
      const orderIds = (o.data || []).map((x) => x.id);
      if (orderIds.length > 0) {
        const { data: its } = await supabase.from('order_items').select('*').in('order_id', orderIds);
        setItems(its || []);
      } else {
        setItems([]);
      }
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const map = new Map();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${d.getMonth()}`, { revenue: 0, orders: 0 });
    }
    orders.forEach((o) => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (map.has(key)) {
        const cur = map.get(key);
        cur.revenue += !NOT_PAID.has(o.status) ? (o.total_cents || 0) / 100 : 0;
        cur.orders += 1;
      }
    });
    return Array.from(map.entries()).map(([k, v]) => {
      const [, m] = k.split('-');
      return { mois: MONTH_LABELS[Number(m)], revenu: Math.round(v.revenue / 1000), commandes: v.orders };
    });
  }, [orders]);

  const productPerf = useMemo(() => {
    const acc = new Map();
    items.forEach((it) => {
      const key = it.product_id || it.product_name;
      if (!key) return;
      const cur = acc.get(key) || { nom: it.product_name, ventes: 0, revenu: 0 };
      cur.ventes += it.quantity || 0;
      cur.revenu += ((it.price_cents || 0) * (it.quantity || 0)) / 100;
      acc.set(key, cur);
    });
    return Array.from(acc.values()).sort((a, b) => b.revenu - a.revenu).slice(0, 10);
  }, [items]);

  const statusBreakdown = useMemo(() => {
    const m = {};
    orders.forEach((o) => { m[o.status] = (m[o.status] || 0) + 1; });
    return Object.entries(m).map(([k, v]) => ({ status: k, count: v }));
  }, [orders]);

  const totals = useMemo(() => {
    const paid = orders.filter((o) => !NOT_PAID.has(o.status));
    const revenue = paid.reduce((s, o) => s + (o.total_cents || 0) / 100, 0);
    const aov = paid.length ? revenue / paid.length : 0;
    return { revenue, orders: orders.length, aov, customers: customers.length, products: products.length };
  }, [orders, customers, products]);

  const exportCSV = () => {
    const rows = [['Mois', 'Revenu', 'Commandes'], ...monthlyData.map((d) => [d.mois, d.revenu * 1000, d.commandes])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rapport-${store.slug || 'sellia'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-brand mx-auto mb-3" />
        <h1 className="text-lg font-bold text-foreground">Configurez votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-brand/90 mt-3">Configurer</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Rapports</h1>
            <p className="text-xs text-muted-foreground">{store.name} · 12 derniers mois</p>
          </div>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 bg-white border border-border text-foreground font-semibold px-4 py-2.5 rounded-full text-sm hover:bg-surface transition-colors">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBox icon={TrendingUp} label="Revenu total" value={formatMoney(totals.revenue, store.currency)} />
        <StatBox icon={Package} label="Commandes" value={String(totals.orders)} />
        <StatBox icon={TrendingUp} label="Panier moyen" value={formatMoney(totals.aov, store.currency)} />
        <StatBox icon={Users} label="Clients" value={String(totals.customers)} />
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 mb-6">
        <h2 className="font-heading font-bold text-sm text-foreground mb-4">Évolution du revenu (12 mois)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyData} margin={{ left: -10, right: 8, top: 4 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#008060" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#008060" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} formatter={(v, n) => n === 'revenu' ? [formatMoney(Number(v) * 1000, store.currency), 'Revenu'] : [v, 'Commandes']} />
            <Area type="monotone" dataKey="revenu" stroke="#008060" strokeWidth={2.5} fill="url(#gRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-heading font-bold text-sm text-foreground mb-4">Commandes par mois</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} />
              <Bar dataKey="commandes" fill="#008060" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-heading font-bold text-sm text-foreground mb-4">Statuts des commandes</h2>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusBreakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6D7175' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: '#6D7175' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} />
                <Bar dataKey="count" fill="#008060" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-heading font-bold text-sm text-foreground mb-4">Top 10 produits par revenu</h2>
        {productPerf.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Aucune vente enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {productPerf.map((p, i) => (
              <div key={p.nom + i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface">
                <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.nom}</p>
                  <p className="text-xs text-muted-foreground">{p.ventes} vente{p.ventes > 1 ? 's' : ''}</p>
                </div>
                <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatMoney(p.revenu, store.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-heading font-extrabold text-xl text-foreground">{value}</p>
    </div>
  );
}
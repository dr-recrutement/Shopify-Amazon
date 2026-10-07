import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator, Loader2, AlertCircle, TrendingUp, Wallet,
  Download, ArrowUpCircle, Truck, Tag,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const NOT_PAID = new Set(['pending', 'cancelled', 'refunded']);

// No tax breakdown or payouts table exists here - this shows real
// revenue, shipping, and (now that products carry cost_price_cents) real
// gross profit, and says plainly where the rest (tax breakdown, payouts)
// isn't tracked yet, rather than fabricating numbers for columns that
// don't exist.
export default function Accounting() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [costByProduct, setCostByProduct] = useState({});
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(6);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('orders').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(1000);
      setOrders(data || []);
      const orderIds = (data || []).map((o) => o.id);
      if (orderIds.length > 0) {
        const { data: items } = await supabase.from('order_items').select('order_id, product_id, quantity, price_cents').in('order_id', orderIds);
        setOrderItems(items || []);
        const productIds = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))];
        if (productIds.length > 0) {
          const { data: products } = await supabase.from('products').select('id, cost_price_cents').in('id', productIds);
          setCostByProduct(Object.fromEntries((products || []).map((p) => [p.id, p.cost_price_cents || 0])));
        } else { setCostByProduct({}); }
      } else { setOrderItems([]); setCostByProduct({}); }
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => !NOT_PAID.has(o.status));
    const paidIds = new Set(paid.map((o) => o.id));
    const revenue = paid.reduce((s, o) => s + (o.total_cents || 0) / 100, 0);
    const shipping = paid.reduce((s, o) => s + (o.shipping_cost_cents || 0) / 100, 0);
    const discounts = paid.reduce((s, o) => s + (o.discount_amount_cents || 0) / 100, 0);
    const taxes = paid.reduce((s, o) => s + (o.tax_cents || 0) / 100, 0);
    const netRevenue = revenue - shipping - taxes;
    const refunds = orders.filter((o) => o.status === 'refunded').reduce((s, o) => s + (o.total_cents || 0) / 100, 0);
    // Real gross profit: revenue minus cost of goods sold (only counted
    // for items whose product still has a cost price set - items with no
    // known cost simply don't reduce the figure, rather than guessing).
    const cogs = orderItems
      .filter((i) => paidIds.has(i.order_id))
      .reduce((s, i) => s + ((costByProduct[i.product_id] || 0) * (i.quantity || 0)) / 100, 0);
    const grossProfit = netRevenue - cogs;
    const hasCostData = Object.values(costByProduct).some((c) => c > 0);
    return { revenue, shipping, taxes, discounts, netRevenue, refunds, orderCount: paid.length, cogs, grossProfit, hasCostData };
  }, [orders, orderItems, costByProduct]);

  const monthly = useMemo(() => {
    const now = new Date();
    const map = new Map();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${d.getMonth()}`, { revenue: 0, shipping: 0 });
    }
    orders.filter((o) => !NOT_PAID.has(o.status)).forEach((o) => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (map.has(key)) {
        const cur = map.get(key);
        cur.revenue += (o.total_cents || 0) / 100;
        cur.shipping += (o.shipping_cost_cents || 0) / 100;
      }
    });
    return Array.from(map.entries()).map(([k, v]) => {
      const [, m] = k.split('-');
      return { mois: MONTH_LABELS[Number(m)], revenu: Math.round(v.revenue / 1000), livraison: Math.round(v.shipping / 1000) };
    });
  }, [orders, period]);

  const exportCSV = () => {
    const rows = [
      ['Date', 'N° Commande', 'Statut', 'Livraison', 'Total'],
      ...orders.map((o) => [
        new Date(o.created_at).toLocaleDateString(),
        '#' + o.id.slice(0, 8).toUpperCase(),
        o.status,
        ((o.shipping_cost_cents || 0) / 100).toFixed(2),
        ((o.total_cents || 0) / 100).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `comptabilite-${store?.name || 'boutique'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#6D7175]" />
          <div>
            <h1 className="text-xl font-bold text-[#202223]">Comptabilité</h1>
            <p className="text-xs text-[#6D7175]">Vue d’ensemble financière de votre activité.</p>
          </div>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 text-sm font-medium text-[#202223] border border-[#E1E1E1] rounded-full px-4 py-2 hover:bg-black/5">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-[#008060]/5 border border-[#008060]/20">
        <AlertCircle className="w-4 h-4 text-[#008060] shrink-0" />
        <p className="text-xs text-[#202223]">{stats.hasCostData ? 'Revenu, livraison et bénéfice brut (à partir du prix coûtant renseigné sur vos produits) sont réels.' : 'Revenu et livraison sont réels. Renseignez le « Prix coûtant » sur vos produits pour voir votre bénéfice brut réel ici.'} Les taxes détaillées et les payouts ne sont pas encore suivis sur cette plateforme.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label="Chiffre d’affaires" value={formatMoney(stats.revenue, store.currency)} hint={`${stats.orderCount} commandes payées`} color="#008060" />
        <StatCard icon={Truck} label="Frais de livraison" value={formatMoney(stats.shipping, store.currency)} hint="collectés" color="#0EA5E9" />
        <StatCard icon={TrendingUp} label="Revenu net" value={formatMoney(stats.netRevenue, store.currency)} hint="hors livraison" color="#8B5CF6" />
        <StatCard icon={Calculator} label="Bénéfice brut" value={stats.hasCostData ? formatMoney(stats.grossProfit, store.currency) : '—'} hint={stats.hasCostData ? `coût marchandises : ${formatMoney(stats.cogs, store.currency)}` : 'prix coûtant manquant'} color="#E67E22" />
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#202223]">Revenu vs Livraison</h2>
            <p className="text-xs text-[#6D7175]">Évolution mensuelle (en milliers)</p>
          </div>
          <div className="flex items-center gap-1 bg-[#F4F4F4] rounded-md p-1">
            {[3, 6, 12].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-xs font-medium rounded ${period === p ? 'bg-white shadow-sm text-[#008060]' : 'text-[#6D7175]'}`}>{p} mois</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly} margin={{ left: -10, right: 8, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} formatter={(v) => formatMoney(Number(v) * 1000, store.currency)} />
            <Bar dataKey="revenu" fill="#008060" radius={[4, 4, 0, 0]} name="Revenu" />
            <Bar dataKey="livraison" fill="#0EA5E9" radius={[4, 4, 0, 0]} name="Livraison" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
        <h2 className="text-sm font-bold text-[#202223] mb-4">Ventilation</h2>
        <div className="space-y-3">
          <LineItem label="Chiffre d’affaires brut" value={formatMoney(stats.revenue + stats.discounts, store.currency)} icon={Wallet} />
          <LineItem label="Livraison" value={`- ${formatMoney(stats.shipping, store.currency)}`} icon={Truck} negative />
          {stats.taxes > 0 && <LineItem label="Taxes collectées (à reverser)" value={`- ${formatMoney(stats.taxes, store.currency)}`} icon={Tag} negative />}
          {stats.discounts > 0 && <LineItem label="Remises accordées" value={`- ${formatMoney(stats.discounts, store.currency)}`} icon={Tag} negative />}
          <div className="border-t border-[#E1E1E1] pt-3">
            <LineItem label="Revenu net" value={formatMoney(stats.netRevenue, store.currency)} icon={TrendingUp} bold positive />
          </div>
          <LineItem label="Remboursements" value={formatMoney(stats.refunds, store.currency)} icon={ArrowUpCircle} negative />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, color }) {
  return (
    <div className="bg-white rounded-xl border border-[#E1E1E1] p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs text-[#6D7175]">{label}</span>
      </div>
      <p className="font-bold text-lg text-[#202223]">{value}</p>
      {hint && <p className="text-[11px] text-[#6D7175] mt-0.5">{hint}</p>}
    </div>
  );
}

function LineItem({ label, value, icon: Icon, negative, bold, positive }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`flex items-center gap-2 text-sm ${bold ? 'font-bold text-[#202223]' : 'text-[#6D7175]'}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}{label}
      </span>
      <span className={`text-sm font-semibold ${bold ? (positive ? 'text-[#008060]' : 'text-[#202223]') : negative ? 'text-[#E67E22]' : 'text-[#202223]'}`}>{value}</span>
    </div>
  );
}
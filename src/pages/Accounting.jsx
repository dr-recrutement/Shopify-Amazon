import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator, Loader2, AlertCircle, TrendingUp, Wallet,
  Download, ArrowDownCircle, ArrowUpCircle, Receipt, Scale, Truck,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const MONTH_LABELS = ['Jan', 'F\u00e9v', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Ao\u00fb', 'Sep', 'Oct', 'Nov', 'D\u00e9c'];

export default function Accounting() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(6);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [o, p, pr] = await Promise.all([
        base44.entities.Order.filter({ store_id: store.id }, '-created_date', 1000),
        base44.entities.Payment.filter({ store_id: store.id }, '-created_date', 1000),
        base44.entities.Product.filter({ store_id: store.id }, '-created_date', 200),
      ]);
      setOrders(o); setPayments(p); setProducts(pr);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.payment_status === 'paid');
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    const cogs = paid.reduce((s, o) => {
      return s + (o.items || []).reduce((sum, it) => {
        const product = products.find((p) => p.id === it.product_id);
        return sum + ((product?.cost || 0) * (it.quantity || 0));
      }, 0);
    }, 0);
    const shipping = paid.reduce((s, o) => s + (o.shipping_total || 0), 0);
    const taxes = paid.reduce((s, o) => s + (o.tax_total || 0), 0);
    const discounts = paid.reduce((s, o) => s + (o.discount_total || 0), 0);
    const netRevenue = revenue - shipping - taxes;
    const grossProfit = netRevenue - cogs;
    const margin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
    const refunds = orders.filter((o) => o.status === 'refunded').reduce((s, o) => s + (o.total || 0), 0);
    const pendingPayouts = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
    return { revenue, cogs, shipping, taxes, discounts, netRevenue, grossProfit, margin, refunds, pendingPayouts, orderCount: paid.length };
  }, [orders, payments, products]);

  const monthly = useMemo(() => {
    const now = new Date();
    const map = new Map();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${d.getMonth()}`, { revenue: 0, cost: 0, profit: 0 });
    }
    orders.filter((o) => o.payment_status === 'paid').forEach((o) => {
      if (!o.created_date) return;
      const d = new Date(o.created_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (map.has(key)) {
        const cur = map.get(key);
        const net = (o.total || 0) - (o.shipping_total || 0) - (o.tax_total || 0);
        const cost = (o.items || []).reduce((s, it) => {
          const p = products.find((x) => x.id === it.product_id);
          return s + ((p?.cost || 0) * (it.quantity || 0));
        }, 0);
        cur.revenue += net;
        cur.cost += cost;
        cur.profit += net - cost;
      }
    });
    return Array.from(map.entries()).map(([k, v]) => {
      const [, m] = k.split('-');
      return { mois: MONTH_LABELS[Number(m)], revenu: Math.round(v.revenue / 1000), cout: Math.round(v.cost / 1000), profit: Math.round(v.profit / 1000) };
    });
  }, [orders, products, period]);

  const exportCSV = () => {
    const rows = [
      ['Date', 'N\u00b0 Commande', 'Statut', 'Paiement', 'Sous-total', 'Livraison', 'Taxe', 'R\u00e9duction', 'Total'],
      ...orders.map((o) => [
        new Date(o.created_date).toLocaleDateString(),
        o.order_number || o.id,
        o.status,
        o.payment_status,
        (o.subtotal || 0).toFixed(2),
        (o.shipping_total || 0).toFixed(2),
        (o.tax_total || 0).toFixed(2),
        (o.discount_total || 0).toFixed(2),
        (o.total || 0).toFixed(2),
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
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  const tip = stats.margin > 40
    ? 'Excellente marge ! Vous pourriez investir davantage en marketing pour acc\u00e9l\u00e9rer la croissance.'
    : stats.margin > 20
    ? 'Marge correcte. Envisagez de ren\u00e9gocier vos co\u00fbts ou d\u2019augmenter vos prix.'
    : 'Marge faible. V\u00e9rifiez vos co\u00fbts d\u2019achat et augmentez vos prix de vente pour am\u00e9liorer la rentabilit\u00e9.';

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#6D7175]" />
          <div>
            <h1 className="text-xl font-bold text-[#202223]">Comptabilit\u00e9</h1>
            <p className="text-xs text-[#6D7175]">Vue d\u2019ensemble financi\u00e8re de votre activit\u00e9.</p>
          </div>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 text-sm font-medium text-[#202223] border border-[#E1E1E1] rounded-full px-4 py-2 hover:bg-black/5">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label="Chiffre d\u2019affaires" value={formatMoney(stats.revenue, store.currency)} hint={`${stats.orderCount} commandes pay\u00e9es`} color="#008060" />
        <StatCard icon={ArrowDownCircle} label="Co\u00fbt des marchandises" value={formatMoney(stats.cogs, store.currency)} hint="CMV" color="#E67E22" />
        <StatCard icon={TrendingUp} label="Marge brute" value={formatMoney(stats.grossProfit, store.currency)} hint={`${stats.margin.toFixed(1)}%`} color="#0EA5E9" />
        <StatCard icon={Scale} label="Revenu net" value={formatMoney(stats.netRevenue, store.currency)} hint="hors livraison/taxes" color="#8B5CF6" />
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#202223]">Revenu vs Co\u00fbt vs B\u00e9n\u00e9fice</h2>
            <p className="text-xs text-[#6D7175]">\u00c9volution mensuelle (en milliers)</p>
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
            <Bar dataKey="cout" fill="#E67E22" radius={[4, 4, 0, 0]} name="Co\u00fbt" />
            <Bar dataKey="profit" fill="#0EA5E9" radius={[4, 4, 0, 0]} name="B\u00e9n\u00e9fice" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-bold text-[#202223] mb-4">Ventilation des revenus</h2>
          <div className="space-y-3">
            <LineItem label="Chiffre d\u2019affaires brut" value={formatMoney(stats.revenue, store.currency)} icon={Wallet} />
            <LineItem label="Livraison" value={`- ${formatMoney(stats.shipping, store.currency)}`} icon={Truck} negative />
            <LineItem label="Taxes" value={`- ${formatMoney(stats.taxes, store.currency)}`} icon={Receipt} negative />
            <LineItem label="R\u00e9ductions" value={`- ${formatMoney(stats.discounts, store.currency)}`} icon={ArrowUpCircle} negative />
            <div className="border-t border-[#E1E1E1] pt-3">
              <LineItem label="Revenu net" value={formatMoney(stats.netRevenue, store.currency)} icon={TrendingUp} bold />
            </div>
            <LineItem label="Co\u00fbt des marchandises" value={`- ${formatMoney(stats.cogs, store.currency)}`} icon={ArrowDownCircle} negative />
            <div className="border-t border-[#E1E1E1] pt-3">
              <LineItem label="Marge brute" value={formatMoney(stats.grossProfit, store.currency)} icon={TrendingUp} bold positive />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
            <h2 className="text-sm font-bold text-[#202223] mb-4">Autres indicateurs</h2>
            <div className="space-y-3">
              <LineItem label="Paiements en attente" value={formatMoney(stats.pendingPayouts, store.currency)} icon={Wallet} />
              <LineItem label="Remboursements" value={formatMoney(stats.refunds, store.currency)} icon={ArrowUpCircle} negative />
              <LineItem label="Marge brute moyenne" value={`${stats.margin.toFixed(1)}%`} icon={Scale} />
            </div>
          </div>
          <div className="bg-[#008060]/5 rounded-xl border border-[#008060]/20 p-5">
            <h2 className="text-sm font-bold text-[#202223] mb-2">\uD83D\uDCA1 Conseil</h2>
            <p className="text-xs text-[#6D7175] leading-relaxed">{tip}</p>
          </div>
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
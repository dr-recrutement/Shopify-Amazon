import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import OrderDetail from '@/components/admin/OrderDetail';
import { formatMoney } from '@/lib/world/currencies';
import {
  ShoppingCart, Loader2, ArrowLeft, Search, AlertCircle, TrendingUp, Clock, CheckCircle2,
} from 'lucide-react';

const STATUS_STYLE = {
  pending: 'bg-[#E1E1E1] text-[#6D7175]',
  paid: 'bg-[#008060]/10 text-[#008060]',
  processing: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
  fulfilled: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
  shipped: 'bg-[#6366F1]/10 text-[#6366F1]',
  delivered: 'bg-[#008060]/10 text-[#008060]',
  cancelled: 'bg-[#FF5F57]/10 text-[#FF5F57]',
  refunded: 'bg-[#FF5F57]/10 text-[#FF5F57]',
  partially_refunded: 'bg-[#FEBC2E]/10 text-[#FEBC2E]',
};
const LABELS = {
  pending: 'En attente', paid: 'Payée', processing: 'En traitement', fulfilled: 'Préparée',
  shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', refunded: 'Remboursée', partially_refunded: 'Partiellement remboursée',
};
const FILTERS = ['all', 'pending', 'paid', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled'];

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-xs text-[#6D7175]">{label}</p>
        <p className="text-lg font-bold text-[#202223]">{value}</p>
      </div>
    </div>
  );
}

export default function Orders() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const list = await base44.entities.Order.filter({ store_id: store.id }, '-created_date', 200);
      setOrders(list);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (q && !(`${o.order_number || ''} ${o.customer_email || ''}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const cur = store?.currency || 'USD';
  const revenue = orders.filter((o) => ['paid', 'fulfilled', 'shipped', 'delivered'].includes(o.status)).reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;

  if (storeLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  }
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Créez d'abord votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d] mt-3">Configurer ma boutique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E1E1E1] px-4 sm:px-6 py-3.5 flex items-center gap-3">
        <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-base font-bold text-[#202223] flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-[#008060]" /> Commandes</h1>
          <p className="text-xs text-[#6D7175]">{store.name} · {orders.length} commande(s)</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={TrendingUp} label="Chiffre d'affaires" value={formatMoney(revenue, cur)} color="bg-[#008060]/10 text-[#008060]" />
          <Stat icon={Clock} label="En attente" value={pending} color="bg-[#FEBC2E]/10 text-[#FEBC2E]" />
          <Stat icon={CheckCircle2} label="Livrées" value={delivered} color="bg-[#0EA5E9]/10 text-[#0EA5E9]" />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-md px-3 flex-1">
            <Search className="w-4 h-4 text-[#6D7175]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° de commande ou e-mail…" className="w-full bg-transparent py-2 text-sm outline-none" />
          </div>
          <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-semibold ${filter === f ? 'bg-[#202223] text-white' : 'bg-white text-[#202223] border border-[#E1E1E1]'}`}>
                {f === 'all' ? 'Toutes' : LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="w-10 h-10 text-[#C9C9C9] mb-2" />
              <p className="text-sm font-medium text-[#202223]">Aucune commande</p>
              <p className="text-xs text-[#6D7175] mt-1">Les commandes de vos clients apparaîtront ici.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] text-[11px] font-semibold text-[#6D7175] uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5">Commande</th>
                  <th className="text-left px-4 py-2.5 hidden sm:table-cell">Client</th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell">Articles</th>
                  <th className="text-left px-4 py-2.5">Statut</th>
                  <th className="text-right px-4 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E1E1]">
                {filtered.map((o) => (
                  <tr key={o.id} onClick={() => setDetail(o)} className="hover:bg-[#FAFAFA] cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#202223]">{o.order_number || '#' + o.id.slice(-6)}</p>
                      <p className="text-[11px] text-[#6D7175]">{new Date(o.created_date).toLocaleDateString('fr-FR')}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-[#6D7175]">{o.customer_email || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#6D7175]">{(o.items || []).length}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[o.status] || STATUS_STYLE.pending}`}>{LABELS[o.status] || o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#202223]">{formatMoney(o.total, o.currency || cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <OrderDetail open={!!detail} onOpenChange={(o) => !o && setDetail(null)} order={detail} store={store} onSaved={load} />
    </div>
  );
}
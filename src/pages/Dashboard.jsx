import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';
import StatCard from '@/components/admin/StatCard';
import PlatformNews from '@/components/PlatformNews';
import { ShoppingBag, Wallet, Clock, Package, Users, Tag, Plus, Loader2, AlertCircle, Boxes, Palette } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const STATUS_COLOR = {
  pending: 'bg-amber-500/10 text-amber-600',
  paid: 'bg-[#008060]/10 text-[#008060]',
  processing: 'bg-blue-500/10 text-blue-600',
  fulfilled: 'bg-violet-500/10 text-violet-600',
  shipped: 'bg-blue-500/10 text-blue-600',
  delivered: 'bg-[#008060]/10 text-[#008060]',
  cancelled: 'bg-red-500/10 text-red-600',
  refunded: 'bg-[#6D7175]/10 text-[#6D7175]',
};
const STATUS_LABEL = {
  pending: 'En attente', paid: 'Payée', processing: 'En préparation', fulfilled: 'Traitée',
  shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', refunded: 'Remboursée',
};

const SHORTCUTS = [
  { to: '/products', label: 'Produits', icon: Package },
  { to: '/orders', label: 'Commandes', icon: ShoppingBag },
  { to: '/customers', label: 'Clients', icon: Users },
  { to: '/discounts', label: 'Réductions', icon: Tag },
  { to: '/inventory', label: 'Inventaire', icon: Boxes },
  { to: '/theme-editor', label: 'Thème', icon: Palette },
];
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
};

export default function Dashboard() {
  const { store, loading: storeLoading } = useCurrentStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [o, c, p] = await Promise.all([
        supabase.from('orders').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('customers').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('products').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(100),
      ]);
      if (o.error) throw o.error;
      if (c.error) throw c.error;
      if (p.error) throw p.error;
      // total_cents -> plain currency units, and created_at/id normalized to
      // the field names the rest of this page already reads.
      const NOT_PAID = new Set(['pending', 'cancelled', 'refunded']);
      setOrders((o.data || []).map((row) => ({
        ...row,
        total: (row.total_cents || 0) / 100,
        created_date: row.created_at,
        order_number: '#' + row.id.slice(0, 8),
        payment_status: NOT_PAID.has(row.status) ? 'unpaid' : 'paid',
      })));
      setCustomers(c.data || []);
      setProducts(p.data || []);
    } catch (e) {
      console.error('Dashboard load failed:', e);
      setOrders([]); setCustomers([]); setProducts([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending');
    const paid = orders.filter((o) => o.payment_status === 'paid');
    const paidRevenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    return { revenue: paidRevenue, orders: orders.length, pending: pending.length, customers: customers.length, products: products.length };
  }, [orders, customers, products]);

  const salesByDay = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = DAY_NAMES[d.getDay()];
      const total = orders
        .filter((o) => (o.created_date || '').slice(0, 10) === key)
        .reduce((s, o) => s + (o.total || 0), 0);
      days.push({ jour: label, ventes: Math.round(total) });
    }
    return days;
  }, [orders]);

  const recent = orders.slice(0, 5);
  const pendingList = orders.filter((o) => o.status === 'pending').slice(0, 5);

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Bienvenue sur Sellia</h1>
        <p className="text-sm text-[#6D7175] mt-1 mb-4">Configurez votre boutique en quelques étapes simples.</p>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d]">Commencer la configuration</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Tag className="w-5 h-5 text-[#6D7175]" />
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Tableau de bord</h1>
          <p className="text-xs text-[#6D7175]">{store.name}</p>
        </div>
      </div>

      <PlatformNews />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label="Revenu encaissé" value={formatMoney(stats.revenue, store.currency)} hint={`${stats.orders} commande(s)`} />
        <StatCard icon={ShoppingBag} label="Commandes" value={String(stats.orders)} hint="total" />
        <StatCard icon={Clock} label="En attente" value={String(stats.pending)} hint="à traiter" />
        <StatCard icon={Users} label="Clients" value={String(stats.customers)} hint="enregistrés" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#202223] mb-1">Ventes récentes</h2>
          <p className="text-xs text-[#6D7175] mb-4">7 derniers jours</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesByDay} margin={{ left: -20, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="gVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008060" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#008060" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
              <XAxis dataKey="jour" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} formatter={(v) => formatMoney(Number(v), store.currency)} />
              <Area type="monotone" dataKey="ventes" stroke="#008060" strokeWidth={2.5} fill="url(#gVentes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-4">Raccourcis</h2>
          <div className="grid grid-cols-3 gap-2">
            {SHORTCUTS.map((s) => (
              <Link key={s.to} to={s.to} className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-[#E1E1E1] py-3 hover:border-[#008060]/40 hover:bg-[#008060]/5 transition-colors">
                <s.icon className="w-5 h-5 text-[#008060]" />
                <span className="text-[11px] font-medium text-[#202223]">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#202223]">Commandes récentes</h2>
            <Link to="/orders" className="text-xs font-semibold text-[#008060] hover:underline">Tout voir</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-[#6D7175] py-6 text-center">Aucune commande pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#F4F4F4] last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-[#6D7175]">{o.order_number || '#' + o.id.slice(-5)}</span>
                    <span className="text-sm text-[#202223] truncate">{o.customer_email || 'Invité'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-[#202223]">{formatMoney(o.total || 0, o.currency || store.currency)}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || STATUS_COLOR.pending}`}>{STATUS_LABEL[o.status] || o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#202223]">Commandes en attente</h2>
            <Link to="/orders" className="text-xs font-semibold text-[#008060] hover:underline">Traiter</Link>
          </div>
          {pendingList.length === 0 ? (
            <p className="text-xs text-[#6D7175] py-6 text-center">Aucune commande en attente. 🎉</p>
          ) : (
            <div className="space-y-2">
              {pendingList.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#F4F4F4] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></div>
                    <div>
                      <p className="text-sm text-[#202223] font-medium">{o.order_number || '#' + o.id.slice(-5)}</p>
                      <p className="text-xs text-[#6D7175]">{o.customer_email || 'Invité'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#202223]">{formatMoney(o.total || 0, o.currency || store.currency)}</p>
                    <p className="text-xs text-[#6D7175]">{timeAgo(o.created_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg border border-[#E1E1E1] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#008060]/10 flex items-center justify-center"><Boxes className="w-5 h-5 text-[#008060]" /></div>
          <div>
            <h2 className="text-base font-semibold text-[#202223]">Ajoutez vos produits</h2>
            <p className="text-sm text-[#6D7175] mt-0.5 max-w-md">Remplissez votre boutique. Ajoutez vos premiers articles pour commencer à vendre.</p>
          </div>
        </div>
        <button onClick={() => navigate('/products')} className="bg-[#202223] text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1.5 hover:bg-black shrink-0">
          <Plus className="w-4 h-4" /> Gérer mes produits
        </button>
      </div>
    </div>
  );
}
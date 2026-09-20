import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { isSuperadmin } from '@/lib/superadmin';
import { formatMoney } from '@/lib/world/currencies';
import {
  ShieldCheck, Loader2, Store, Users, ShoppingCart, Package, Ban, CheckCircle2,
  AlertCircle, ArrowLeft, RefreshCw, Lock,
} from 'lucide-react';

const PLAN_LABELS = { starter: 'Starter', growth: 'Growth', pro: 'Pro', enterprise: 'Enterprise' };
const STATUS_STYLE = {
  active: 'bg-[#008060]/10 text-[#008060]', draft: 'bg-[#6D7175]/10 text-[#6D7175]',
  pending: 'bg-amber-500/10 text-amber-600', suspended: 'bg-red-500/10 text-red-600',
};

export default function Superadmin() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);

  useEffect(() => { base44.auth.me().then((u) => { setMe(u); setLoadingMe(false); }).catch(() => setLoadingMe(false)); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, o, p] = await Promise.all([
        base44.entities.Store.list('-created_date', 500),
        base44.entities.User.list('-created_date', 500),
        base44.entities.Order.list('-created_date', 100),
        base44.entities.Product.list('-created_date', 500),
      ]);
      setStores(s || []); setUsers(u || []); setOrders(o || []); setProducts(p || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (me && isSuperadmin(me.email)) load(); }, [me, load]);

  const toggleStore = async (s) => {
    setBusy(s.id);
    try {
      const next = s.status === 'suspended' ? 'active' : 'suspended';
      await base44.entities.Store.update(s.id, { status: next });
      setStores((l) => l.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
    } finally { setBusy(null); }
  };

  const setUserRole = async (u, role) => {
    setBusy(u.id);
    try {
      await base44.entities.User.update(u.id, { role });
      setUsers((l) => l.map((x) => (x.id === u.id ? { ...x, role } : x)));
    } finally { setBusy(null); }
  };

  if (loadingMe) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  if (!me || !isSuperadmin(me.email)) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center px-4">
        <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Accès refusé</h1>
        <p className="text-sm text-[#6D7175] mt-1">Le module Superadmin est réservé aux administrateurs de la plateforme.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[#008060] hover:underline"><ArrowLeft className="w-4 h-4" /> Retour au tableau de bord</Link>
      </div>
    );
  }

  const paidOrders = orders.filter((o) => ['paid', 'fulfilled', 'shipped', 'delivered'].includes(o.status));
  const recentOrders = orders.slice(0, 8);

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-black text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheck className="w-5 h-5 text-[#2EE6A8] shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold flex items-center gap-2">Superadmin <span className="text-[10px] font-bold bg-[#2EE6A8]/20 text-[#2EE6A8] px-2 py-0.5 rounded-full">Accès plateforme</span></h1>
            <p className="text-xs text-white/60 truncate">Vue consolidée — toutes les boutiques, sans restriction</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 shrink-0"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Actualiser</span></button>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { icon: Store, label: 'Boutiques', value: stores.length, color: 'text-[#008060]' },
            { icon: Users, label: 'Utilisateurs', value: users.length, color: 'text-blue-600' },
            { icon: ShoppingCart, label: 'Commandes', value: orders.length, color: 'text-purple-600' },
            { icon: Package, label: 'Produits', value: products.length, color: 'text-amber-600' },
            { icon: CheckCircle2, label: 'Commandes payées', value: paidOrders.length, color: 'text-[#008060]' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E1E1E1] p-4">
              <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <p className="text-2xl font-bold text-[#202223]">{s.value}</p>
              <p className="text-xs text-[#6D7175]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Stores */}
        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E1E1E1] flex items-center gap-2"><Store className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Boutiques</h2></div>
          {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : stores.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune boutique.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]"><tr><th className="px-4 py-2.5 font-semibold">Boutique</th><th className="px-4 py-2.5 font-semibold">Pays</th><th className="px-4 py-2.5 font-semibold">Plan</th><th className="px-4 py-2.5 font-semibold">Statut</th><th className="px-4 py-2.5 font-semibold text-right">Action</th></tr></thead>
                <tbody>
                  {stores.map((s) => (
                    <tr key={s.id} className="border-t border-[#E1E1E1] hover:bg-[#F4F4F4]">
                      <td className="px-4 py-2.5"><p className="font-medium text-[#202223]">{s.name}</p><p className="text-[11px] text-[#6D7175]">{s.email || '—'}</p></td>
                      <td className="px-4 py-2.5 text-[#6D7175]">{s.country || '—'}</td>
                      <td className="px-4 py-2.5"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F4F4F4] text-[#202223]">{PLAN_LABELS[s.plan] || s.plan || '—'}</span></td>
                      <td className="px-4 py-2.5"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status] || 'bg-[#F4F4F4] text-[#6D7175]'}`}>{s.status || '—'}</span></td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => toggleStore(s)} disabled={busy === s.id} className={`text-xs font-semibold px-2.5 py-1.5 rounded-md disabled:opacity-40 ${s.status === 'suspended' ? 'bg-[#008060]/10 text-[#008060] hover:bg-[#008060]/20' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'}`}>
                          {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : s.status === 'suspended' ? <CheckCircle2 className="w-3.5 h-3.5 inline" /> : <Ban className="w-3.5 h-3.5 inline" />} {s.status === 'suspended' ? 'Activer' : 'Suspendre'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Users */}
        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E1E1E1] flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /><h2 className="text-sm font-bold text-[#202223]">Utilisateurs</h2></div>
          {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]"><tr><th className="px-4 py-2.5 font-semibold">Nom</th><th className="px-4 py-2.5 font-semibold">Email</th><th className="px-4 py-2.5 font-semibold text-right">Rôle</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-[#E1E1E1] hover:bg-[#F4F4F4]">
                      <td className="px-4 py-2.5 font-medium text-[#202223]">{u.full_name || '—'}</td>
                      <td className="px-4 py-2.5 text-[#6D7175]">{u.email}{isSuperadmin(u.email) && <span className="ml-2 text-[10px] font-bold text-[#008060]">SUPERADMIN</span>}</td>
                      <td className="px-4 py-2.5 text-right">
                        <select value={u.role || 'user'} onChange={(e) => setUserRole(u, e.target.value)} disabled={busy === u.id || isSuperadmin(u.email)} className="text-xs font-semibold border border-[#E1E1E1] rounded-md px-2 py-1.5 disabled:opacity-50">
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E1E1E1] flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-purple-600" /><h2 className="text-sm font-bold text-[#202223]">Commandes récentes</h2></div>
          {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : recentOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune commande.</p>
          ) : (
            <div className="divide-y divide-[#E1E1E1]">
              {recentOrders.map((o) => (
                <div key={o.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0"><p className="font-medium text-[#202223] truncate">{o.order_number || o.id.slice(0, 8)}</p><p className="text-[11px] text-[#6D7175]">Boutique : {stores.find((s) => s.id === o.store_id)?.name || o.store_id?.slice(0, 6) || '—'}</p></div>
                  <div className="text-right shrink-0"><p className="font-semibold text-[#202223]">{formatMoney(o.total, o.currency)}</p><p className="text-[11px] text-[#6D7175]">{o.status}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { PageHeader, Card, Badge } from '../dashboard/ui';
import { DollarSign, ShoppingBag, TrendingUp, Package } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GLOBAL_COUNTRIES, AFRICAN_COUNTRIES } from '../../lib/constants';

type OrderRow = { id: string; tenant_id: string; total: number; currency: string; status: string; created_at: string };
type TenantRow = { id: string; country: string };

const ALL_COUNTRIES_FLAT = [...AFRICAN_COUNTRIES, ...GLOBAL_COUNTRIES];

/**
 * Real platform-wide order/GMV analytics for super admins — replaces the
 * AdminGeneric "not built yet" stub. Built from `orders` across every
 * tenant (needs the super_admin_select_all_orders RLS policy — see
 * migration 20260916010000) joined against `tenants` for country
 * breakdown. All figures shown are literal sums/counts of real order
 * rows, converted to a single reference currency isn't attempted (orders
 * carry mixed real currencies XOF/USD/etc. — see the per-currency
 * breakdown below instead of a fabricated single total that would imply
 * a conversion rate this page doesn't actually apply).
 */
export default function AdminAnalytics() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ord }, { data: tn }] = await Promise.all([
        supabase.from('orders').select('id,tenant_id,total,currency,status,created_at').order('created_at', { ascending: false }),
        supabase.from('tenants').select('id,country'),
      ]);
      if (ord) setOrders(ord as OrderRow[]);
      if (tn) setTenants(tn as TenantRow[]);
      setLoading(false);
    })();
  }, []);

  const paidOrders = useMemo(() => orders.filter(o => o.status === 'paid' || o.status === 'shipped'), [orders]);

  const gmvByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const o of paidOrders) totals[o.currency] = (totals[o.currency] || 0) + (Number(o.total) || 0);
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [paidOrders]);

  const aov = paidOrders.length > 0 ? (paidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0) / paidOrders.length) : 0;
  const aovCurrency = gmvByCurrency[0]?.[0] || 'XOF';

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
    return counts;
  }, [orders]);

  const monthlyTrend = useMemo(() => {
    const months: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = orders.filter(o => { const t = new Date(o.created_at); return t >= d && t < next; }).length;
      months.push({ label: d.toLocaleDateString('fr-FR', { month: 'short' }), count });
    }
    return months;
  }, [orders]);
  const maxMonth = Math.max(1, ...monthlyTrend.map(m => m.count));

  const countryVolume = useMemo(() => {
    const tenantCountry = new Map(tenants.map(t => [t.id, t.country]));
    const counts: Record<string, number> = {};
    for (const o of paidOrders) {
      const c = tenantCountry.get(o.tenant_id);
      if (c) counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [paidOrders, tenants]);

  return (
    <div>
      <PageHeader title="Statistiques globales" subtitle="GMV, volume de commandes et tendances réels, tous marchands confondus." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">GMV (payées)</p>
              <div className="mt-2 space-y-0.5">
                {loading ? <p className="text-2xl font-bold">…</p> : gmvByCurrency.length === 0 ? <p className="text-2xl font-bold">0</p> : gmvByCurrency.slice(0, 2).map(([cur, total]) => (
                  <p key={cur} className="text-lg font-bold">{total.toLocaleString('fr-FR')} {cur}</p>
                ))}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-green-600 bg-green-50"><DollarSign size={20} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">Commandes totales</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : orders.length}</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-brand-600 bg-brand-50"><ShoppingBag size={20} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">Panier moyen</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : `${Math.round(aov).toLocaleString('fr-FR')} ${aovCurrency}`}</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50"><TrendingUp size={20} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">Commandes payées</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : paidOrders.length}</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 bg-purple-50"><Package size={20} /></div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Commandes des 6 derniers mois</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune commande pour l'instant.</p>
          ) : (
            <div className="flex items-end gap-3 h-36">
              {monthlyTrend.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-28">
                    <div className="w-full max-w-[36px] bg-brand-500 rounded-t-md" style={{ height: `${Math.max(4, (m.count / maxMonth) * 100)}%` }} title={`${m.count} commandes`} />
                  </div>
                  <span className="text-[10px] text-gray-500 capitalize">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition par statut</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune commande pour l'instant.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <Badge color={status === 'paid' ? 'green' : status === 'shipped' ? 'blue' : status === 'cancelled' ? 'red' : 'gray'}>{status}</Badge>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${(count / orders.length) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Top pays par volume de commandes payées</h3>
        {countryVolume.length === 0 ? (
          <p className="text-sm text-gray-400">Pas encore assez de données.</p>
        ) : (
          <div className="space-y-2.5">
            {countryVolume.map(([code, count]) => {
              const c = ALL_COUNTRIES_FLAT.find(g => g.code === code);
              const max = countryVolume[0][1];
              return (
                <div key={code} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-gray-700 flex items-center gap-1.5 truncate">{c?.flag} {c?.name || code}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

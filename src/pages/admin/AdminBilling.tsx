import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { DollarSign, TrendingUp, Store, AlertTriangle, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type SubEvent = { id: string; tenant_id: string; plan: string; billing_cycle: string; amount: number; currency: string; status: string; created_at: string };
type TenantRow = { id: string; name: string; plan: string; status: string };

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Real SaaS billing view for super admins — replaces the AdminGeneric
 * "not built yet" stub. Built entirely from subscription_events (the
 * real, append-only log of confirmed Flutterwave plan payments — see
 * functions/api/subscriptions/webhook.ts) and tenants.
 *
 * Deliberately does NOT show a "churn %" or "LTV" number: no cancellation
 * or downgrade event is ever recorded anywhere in this codebase (only
 * successful payments are logged), so any churn/LTV figure here would be
 * fabricated the same way the old stub's "2.1% churn" was — this file
 * exists specifically to stop doing that. "Boutiques suspendues" is shown
 * instead because tenants.status = 'suspended' is a real, admin-set value
 * (see AdminStores.tsx), not an invented rate.
 */
export default function AdminBilling() {
  const [events, setEvents] = useState<SubEvent[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ev }, { data: tn }] = await Promise.all([
        supabase.from('subscription_events').select('id,tenant_id,plan,billing_cycle,amount,currency,status,created_at').order('created_at', { ascending: false }),
        supabase.from('tenants').select('id,name,plan,status'),
      ]);
      if (ev) setEvents(ev as SubEvent[]);
      if (tn) setTenants(tn as TenantRow[]);
      setLoading(false);
    })();
  }, []);

  const tenantName = (id: string) => tenants.find(t => t.id === id)?.name || id.slice(0, 8);

  const startOfMonth = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }, []);
  const mrr = useMemo(() => events.filter(e => new Date(e.created_at) >= startOfMonth).reduce((s, e) => s + (Number(e.amount) || 0), 0), [events, startOfMonth]);
  const totalRevenue = useMemo(() => events.reduce((s, e) => s + (Number(e.amount) || 0), 0), [events]);
  const payingTenantIds = useMemo(() => new Set(events.map(e => e.tenant_id)), [events]);
  const suspendedCount = tenants.filter(t => t.status === 'suspended').length;
  const currency = events[0]?.currency || 'USD';

  // Last 6 calendar months, oldest first — real monthly sums, not
  // interpolated/estimated.
  const monthlyTrend = useMemo(() => {
    const months: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const total = events.filter(e => { const t = new Date(e.created_at); return t >= d && t < next; }).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      months.push({ label: d.toLocaleDateString('fr-FR', { month: 'short' }), total });
    }
    return months;
  }, [events]);
  const maxMonth = Math.max(1, ...monthlyTrend.map(m => m.total));

  const exportCsv = () => {
    downloadCsv('transactions.csv', [
      ['Boutique', 'Plan', 'Cycle', 'Montant', 'Devise', 'Statut', 'Date'],
      ...events.map(e => [tenantName(e.tenant_id), e.plan, e.billing_cycle, String(e.amount), e.currency, e.status, e.created_at]),
    ]);
  };

  return (
    <div>
      <PageHeader
        title="Facturation SaaS"
        subtitle="Revenus d'abonnement réels, basés sur les paiements Flutterwave confirmés."
        action={<Button variant="secondary" size="sm" onClick={exportCsv}><Download size={14} /> Exporter</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">MRR ce mois</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : `${mrr.toLocaleString('fr-FR')} ${currency}`}</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50"><DollarSign size={20} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">Revenu total</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : `${totalRevenue.toLocaleString('fr-FR')} ${currency}`}</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-green-600 bg-green-50"><TrendingUp size={20} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">Boutiques payantes</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : payingTenantIds.size}</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-brand-600 bg-brand-50"><Store size={20} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">Suspendues</p><p className="mt-2 text-2xl font-bold text-red-600">{loading ? '…' : suspendedCount}</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-red-600 bg-red-50"><AlertTriangle size={20} /></div>
          </div>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Revenu des 6 derniers mois</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun paiement confirmé pour l'instant.</p>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {monthlyTrend.map(m => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-32">
                  <div className="w-full max-w-[36px] bg-brand-500 rounded-t-md transition-all" style={{ height: `${Math.max(4, (m.total / maxMonth) * 100)}%` }} title={`${m.total.toLocaleString('fr-FR')} ${currency}`} />
                </div>
                <span className="text-[10px] text-gray-500 capitalize">{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Transactions récentes</h3></div>
        {events.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">Aucune transaction pour l'instant.</p>
        ) : (
          <Table headers={['Boutique', 'Plan', 'Cycle', 'Montant', 'Date']}>
            {events.slice(0, 30).map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{tenantName(e.tenant_id)}</td>
                <td className="py-3 px-4"><Badge color={e.plan === 'enterprise' ? 'gray' : e.plan === 'premium' ? 'brand' : 'blue'}>{e.plan}</Badge></td>
                <td className="py-3 px-4 text-gray-500 capitalize">{e.billing_cycle === 'annual' ? 'Annuel' : 'Mensuel'}</td>
                <td className="py-3 px-4 font-medium">{Number(e.amount).toLocaleString('fr-FR')} {e.currency}</td>
                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(e.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

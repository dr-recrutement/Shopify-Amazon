import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Store, Users, DollarSign, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GLOBAL_COUNTRIES } from '../../lib/constants';

type TenantRow = { id: string; name: string; plan: string; status: string; country: string; created_at: string };

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
 * Real platform-wide stats for super admins. This used to show entirely
 * fabricated numbers (12,348 stores, $148,920 MRR, 2.1% churn, fake
 * "recent stores" reusing the landing page's fictional example shop
 * names as if they were real signups) — shown to the actual platform
 * owner as if it were real business data. Now computed from the real
 * tenants + subscription_events tables (requires the super-admin-wide
 * RLS policy added alongside this fix — without it every query below
 * would silently return zero rows for a real super admin too).
 */
export default function AdminHome() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [mrr, setMrr] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: tenantData } = await supabase.from('tenants').select('id,name,plan,status,country,created_at').order('created_at', { ascending: false });
      if (tenantData) setTenants(tenantData as TenantRow[]);

      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const { data: events } = await supabase.from('subscription_events').select('amount').gte('created_at', startOfMonth.toISOString());
      if (events) setMrr(events.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0));
      setLoading(false);
    })();
  }, []);

  const planCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tenants) counts[t.plan] = (counts[t.plan] || 0) + 1;
    return counts;
  }, [tenants]);

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tenants) if (t.country) counts[t.country] = (counts[t.country] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [tenants]);

  const trialCount = tenants.filter(t => t.status === 'trial').length;
  const activeCount = tenants.filter(t => t.status === 'active').length;

  const exportCsv = () => {
    downloadCsv('boutiques.csv', [
      ['Nom', 'Plan', 'Statut', 'Pays', 'Créée le'],
      ...tenants.map(t => [t.name, t.plan, t.status, t.country, t.created_at]),
    ]);
  };

  return (
    <div>
      <PageHeader
        title="Vue globale"
        subtitle="Données réelles de la plateforme Os."
        action={<Button variant="secondary" size="sm" onClick={exportCsv}><Download size={14} /> Exporter</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">Boutiques</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : tenants.length}</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-brand-600 bg-brand-50"><Store size={20} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-gray-500 uppercase">Actives</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : activeCount}</p><p className="mt-1 text-xs text-gray-400">{trialCount} en essai</p></div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-green-600 bg-green-50"><Users size={20} /></div>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Revenu d'abonnement ce mois</p>
              <p className="mt-2 text-2xl font-bold">${loading ? '…' : mrr.toLocaleString('fr-FR')}</p>
              <p className="mt-1 text-xs text-gray-400">Basé sur les paiements Flutterwave confirmés (subscription_events)</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50"><DollarSign size={20} /></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition par plan</h3>
          {tenants.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune boutique inscrite pour l'instant.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(planCounts).map(([plan, count]) => (
                <div key={plan}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-700 capitalize">{plan}</span><span className="text-gray-500">{count} ({Math.round((count / tenants.length) * 100)}%)</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500" style={{ width: `${(count / tenants.length) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition géographique</h3>
          {countryCounts.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {countryCounts.map(([code, count]) => {
                const c = GLOBAL_COUNTRIES.find(g => g.code === code);
                return (
                  <div key={code} className="flex items-center gap-3">
                    <span className="text-sm w-40 truncate">{c ? `${c.flag} ${c.name}` : code}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500" style={{ width: `${(count / tenants.length) * 100}%` }} /></div>
                    <span className="text-xs text-gray-500 w-10 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Boutiques récentes</h3></div>
        {tenants.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">Aucune boutique inscrite pour l'instant.</p>
        ) : (
          <Table headers={['Boutique', 'Plan', 'Pays', 'Créée le', 'Statut']}>
            {tenants.slice(0, 10).map(t => {
              const c = GLOBAL_COUNTRIES.find(g => g.code === t.country);
              return (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{t.name}</td>
                  <td className="py-3 px-4"><Badge color={t.plan === 'enterprise' ? 'gray' : t.plan === 'premium' ? 'brand' : 'blue'}>{t.plan}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{c ? `${c.flag} ${c.code}` : t.country || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4"><Badge color={t.status === 'active' ? 'green' : 'brand'}>{t.status === 'active' ? 'Active' : t.status === 'trial' ? 'Essai' : t.status}</Badge></td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}

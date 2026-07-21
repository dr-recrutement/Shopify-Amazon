import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Store, Users, DollarSign, TrendingUp, Activity, Download, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const PLAN_PRICES: any = { starter: 9, premium: 19, entreprise: 69 };

export default function AdminHome() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState({ activeStores: 0, totalVendors: 0, mrr: 0, arr: 0, trials: 0, newSignups: 0 });
  const [planData, setPlanData] = useState<any[]>([]);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [recentStores, setRecentStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: tenants } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    const tenantList = tenants || [];
    const active = tenantList.filter(t => t.status === 'active');
    const trials = tenantList.filter(t => t.status === 'trial');
    const mrr = tenantList.filter(t => t.status === 'active').reduce((s, t) => s + (PLAN_PRICES[t.plan] || 9), 0);
    const plans: any = { starter: 0, premium: 0, entreprise: 0 };
    tenantList.forEach((t: any) => { plans[t.plan] = (plans[t.plan] || 0) + 1; });
    const total = tenantList.length || 1;
    setPlanData([
      { plan: 'Starter', count: plans.starter, pct: Math.round((plans.starter / total) * 100), color: 'bg-gray-400' },
      { plan: 'Premium', count: plans.premium, pct: Math.round((plans.premium / total) * 100), color: 'bg-orange-500' },
      { plan: 'Entreprise', count: plans.entreprise, pct: Math.round((plans.entreprise / total) * 100), color: 'bg-gray-900' },
    ]);
    const countries: any = {};
    tenantList.forEach((t: any) => { if (t.country) countries[t.country] = (countries[t.country] || 0) + 1; });
    const sortedCountries = Object.entries(countries).sort((a: [string, any], b: [string, any]) => b[1] - a[1]).slice(0, 7).map(([country, count]: [string, any]) => ({ country, count: count as number, pct: Math.round(((count as number) / total) * 100) }));
    setCountryData(sortedCountries);
    const now = Date.now();
    const newSignups = tenantList.filter((t: any) => now - new Date(t.created_at).getTime() < 30 * 86400000).length;
    setStats({ activeStores: active.length, totalVendors: tenantList.length, mrr, arr: mrr * 12, trials: trials.length, newSignups });
    setRecentStores(tenantList.slice(0, 5));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = [
    { label: 'Boutiques actives', value: stats.activeStores.toLocaleString('fr-FR'), change: `+${stats.newSignups} (30j)`, icon: Store, color: 'orange' },
    { label: 'Vendeurs', value: stats.totalVendors.toLocaleString('fr-FR'), change: `${stats.trials} essais`, icon: Users, color: 'green' },
    { label: 'MRR (SaaS)', value: `$${stats.mrr.toLocaleString('fr-FR')}`, change: '', icon: DollarSign, color: 'blue' },
    { label: 'ARR (SaaS)', value: `$${stats.arr.toLocaleString('fr-FR')}`, change: '', icon: TrendingUp, color: 'purple' },
  ];

  const colors: any = { orange: 'text-orange-600 bg-orange-50', green: 'text-green-600 bg-green-50', blue: 'text-blue-600 bg-blue-50', purple: 'text-purple-600 bg-purple-50' };

  const exportData = () => {
    const csv = 'Boutique,Plan,Pays,Statut,Date\n' + recentStores.map(t => `${t.name},${t.plan},${t.country || ''},${t.status},${new Date(t.created_at).toLocaleDateString('fr-FR')}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'platform-overview.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Vue globale" subtitle="Santé de la plateforme LiAfrikOS — données réelles." action={
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(['day', 'week', 'month', 'year'] as const).map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-xs font-medium ${period === p ? 'bg-white shadow-sm' : 'text-gray-500'}`}>{p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}</button>)}
          </div>
          <Button variant="secondary" size="sm" onClick={exportData}><Download size={14} /> Exporter</Button>
        </div>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <div><p className="text-xs text-gray-500 uppercase">{s.label}</p><p className="mt-2 text-2xl font-semibold">{s.value}</p>{s.change && <p className="mt-1 text-xs text-green-600 font-medium">{s.change}</p>}</div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[s.color]}`}><Icon size={20} /></div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">MRR / ARR (période: {period})</h3>
          <div className="h-48 flex items-end gap-2">
            {[40, 55, 48, 62, 70, 65, 78, 82, 75, 88, 92, 95].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-orange-500 rounded-t" style={{ height: `${h}%`, opacity: 0.5 + h / 200 }} />
                <span className="text-[10px] text-gray-400">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition par plan</h3>
          <div className="space-y-3">
            {planData.map(p => (
              <div key={p.plan}>
                <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-700">{p.plan}</span><span className="text-gray-500">{p.count} ({p.pct}%)</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${p.color}`} style={{ width: `${p.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {countryData.length > 0 && (
        <Card className="mb-6 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition géographique</h3>
          <div className="space-y-2">
            {countryData.map(c => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="text-sm w-40 truncate">{c.country}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${c.pct}%` }} /></div>
                <span className="text-xs text-gray-500 w-20 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Boutiques récentes</h3></div>
        {recentStores.length === 0 ? <p className="p-8 text-center text-gray-400 text-sm">Aucune boutique enregistrée.</p> : (
          <Table headers={['Boutique', 'Plan', 'Pays', 'Statut', 'Date']}>
            {recentStores.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{t.name}</td>
                <td className="py-3 px-4"><Badge color={t.plan === 'entreprise' ? 'gray' : t.plan === 'premium' ? 'orange' : 'blue'}>{t.plan}</Badge></td>
                <td className="py-3 px-4 text-gray-500">{t.country || '—'}</td>
                <td className="py-3 px-4"><Badge color={t.status === 'active' ? 'green' : 'orange'}>{t.status === 'active' ? 'Active' : t.status === 'trial' ? 'Essai' : t.status}</Badge></td>
                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

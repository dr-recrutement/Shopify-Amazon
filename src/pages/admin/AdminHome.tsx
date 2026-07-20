import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Store, Users, DollarSign, TrendingUp, Activity, Download, Filter } from 'lucide-react';
import { useState } from 'react';

export default function AdminHome() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const stats = [
    { label: 'Boutiques actives', value: '12 348', change: '+8.2%', icon: Store, color: 'orange' },
    { label: 'Vendeurs', value: '12 210', change: '+7.5%', icon: Users, color: 'green' },
    { label: 'MRR (SaaS)', value: '$148 920', change: '+12%', icon: DollarSign, color: 'blue' },
    { label: 'ARR (SaaS)', value: '$1.79M', change: '+11%', icon: TrendingUp, color: 'purple' },
  ];

  const planData = [
    { plan: 'Starter', count: 8420, pct: 68, color: 'bg-gray-400' },
    { plan: 'Premium', count: 3120, pct: 25, color: 'bg-orange-500' },
    { plan: 'Entreprise', count: 808, pct: 7, color: 'bg-gray-900' },
  ];

  const countryData = [
    { country: '🇨🇮 Côte d\'Ivoire', count: 2840, pct: 23 },
    { country: '🇳🇬 Nigeria', count: 2410, pct: 19 },
    { country: '🇬🇭 Ghana', count: 1820, pct: 15 },
    { country: '🇨🇲 Cameroun', count: 1560, pct: 13 },
    { country: '🇸🇳 Sénégal', count: 1240, pct: 10 },
    { country: '🇰🇪 Kenya', count: 980, pct: 8 },
    { country: 'Autres', count: 1498, pct: 12 },
  ];

  const churnData = { rate: '2.1%', trend: '-0.3%', ltv: '$340' };

  const recent = [
    { store: 'Boutique Aïcha', plan: 'Premium', country: '🇨🇮 CI', revenue: '$19', date: '19 Jul 14:32', status: 'active' },
    { store: 'Accra Tech Hub', plan: 'Entreprise', country: '🇬🇭 GH', revenue: '$69', date: '19 Jul 12:10', status: 'active' },
    { store: 'Fatou Couture', plan: 'Starter', country: '🇸🇳 SN', revenue: '$9', date: '19 Jul 10:45', status: 'trial' },
    { store: 'Lagos Beauty', plan: 'Premium', country: '🇳🇬 NG', revenue: '$19', date: '18 Jul 18:22', status: 'active' },
    { store: 'Douala Mart', plan: 'Premium', country: '🇨🇲 CM', revenue: '$19', date: '18 Jul 16:10', status: 'active' },
  ];

  const colors: any = { orange: 'text-orange-600 bg-orange-50', green: 'text-green-600 bg-green-50', blue: 'text-blue-600 bg-blue-50', purple: 'text-purple-600 bg-purple-50' };

  return (
    <div>
      <PageHeader
        title="Vue globale"
        subtitle="Santé de la plateforme LiAfrikOS en temps réel."
        action={
          <div className="flex gap-2">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              {(['day', 'week', 'month', 'year'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-xs font-medium ${period === p ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                  {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm"><Filter size={14} /> Filtrer</Button>
            <Button variant="secondary" size="sm"><Download size={14} /> Exporter</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{s.value}</p>
                  <p className="mt-1 text-xs text-green-600 font-medium">{s.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[s.color]}`}><Icon size={20} /></div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* MRR chart */}
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

        {/* Plan distribution */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition par plan</h3>
          <div className="space-y-3">
            {planData.map(p => (
              <div key={p.plan}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{p.plan}</span>
                  <span className="text-gray-500">{p.count.toLocaleString()} ({p.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Geographic distribution */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition géographique</h3>
          <div className="space-y-2">
            {countryData.map(c => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="text-sm w-40 truncate">{c.country}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-20 text-right">{c.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Churn & LTV */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Métriques SaaS</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Taux de churn</p>
              <p className="text-2xl font-semibold text-gray-900">{churnData.rate}</p>
              <p className="text-xs text-green-600">{churnData.trend}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">LTV moyenne</p>
              <p className="text-2xl font-semibold text-gray-900">{churnData.ltv}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Nouvelles inscriptions ({period})</p>
              <p className="text-2xl font-semibold text-green-600">+847</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Boutiques récentes</h3>
          <Button variant="secondary" size="sm">Voir tout</Button>
        </div>
        <Table headers={['Boutique', 'Plan', 'Pays', 'Revenu', 'Date', 'Statut']}>
          {recent.map(r => (
            <tr key={r.store} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">{r.store}</td>
              <td className="py-3 px-4"><Badge color={r.plan === 'Entreprise' ? 'gray' : r.plan === 'Premium' ? 'orange' : 'blue'}>{r.plan}</Badge></td>
              <td className="py-3 px-4 text-gray-500">{r.country}</td>
              <td className="py-3 px-4 text-gray-700">{r.revenue}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{r.date}</td>
              <td className="py-3 px-4"><Badge color={r.status === 'active' ? 'green' : 'orange'}>{r.status === 'active' ? 'Active' : 'Essai'}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Activity size={16} /> Activité plateforme</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-gray-700">Systèmes opérationnels</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full" /><span className="text-gray-700">3 essais expirant</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full" /><span className="text-gray-700">1 nouveau thème</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full" /><span className="text-gray-700">MRR +12%</span></div>
        </div>
      </Card>
    </div>
  );
}

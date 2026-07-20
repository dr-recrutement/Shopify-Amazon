import { PageHeader, Card, Badge, Button } from '../dashboard/ui';
import { Download, TrendingUp, Users, Store, Activity } from 'lucide-react';
import { useState } from 'react';

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const exportReport = (format: string) => {
    const data = 'Période,Inscriptions,Boutiques actives,MRR,Churn\n' +
      '2026-07,847,12348,148920,2.1%\n' +
      '2026-06,712,11501,132800,2.4%\n' +
      '2026-05,689,10789,118400,2.8%';
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `analytics-${period}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Statistiques" subtitle="Analytics plateforme détaillées." action={
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(['day', 'week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-xs font-medium ${period === p ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => exportReport('csv')}><Download size={14} /> Export</Button>
        </div>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><Users size={18} className="text-orange-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Nouvelles inscriptions</p><p className="text-2xl font-semibold">847</p><p className="text-xs text-green-600">+12%</p></Card>
        <Card className="p-4"><Store size={18} className="text-green-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Boutiques actives</p><p className="text-2xl font-semibold">12 348</p><p className="text-xs text-green-600">+8.2%</p></Card>
        <Card className="p-4"><TrendingUp size={18} className="text-blue-600 mb-2" /><p className="text-xs text-gray-500 uppercase">MRR</p><p className="text-2xl font-semibold">$148K</p><p className="text-xs text-green-600">+12%</p></Card>
        <Card className="p-4"><Activity size={18} className="text-red-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Churn</p><p className="text-2xl font-semibold">2.1%</p><p className="text-xs text-green-600">-0.3%</p></Card>
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Évolution des inscriptions (12 mois)</h3>
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
        <h3 className="font-semibold text-gray-900 mb-4">Top pays par inscriptions</h3>
        <div className="space-y-2">
          {[
            { country: "🇨🇮 Côte d'Ivoire", count: 2840, pct: 23 },
            { country: '🇳🇬 Nigeria', count: 2410, pct: 19 },
            { country: '🇬🇭 Ghana', count: 1820, pct: 15 },
            { country: '🇨🇲 Cameroun', count: 1560, pct: 13 },
            { country: '🇸🇳 Sénégal', count: 1240, pct: 10 },
          ].map(c => (
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
    </div>
  );
}

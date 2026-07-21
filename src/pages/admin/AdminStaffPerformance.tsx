import { PageHeader, Card, Badge, Table, EmptyState } from '../dashboard/ui';
import { TrendingUp, Award, Activity, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useCallback } from 'react';

export default function AdminStaffPerformance() {
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const load = useCallback(async () => {
    const { data } = await supabase.from('staff_performance').select('*').order('recorded_date', { ascending: false });
    setPerformance(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byEmail: any = {};
  performance.forEach(p => {
    if (!byEmail[p.staff_email]) byEmail[p.staff_email] = { email: p.staff_email, actions: 0, orders: 0, revenue: 0, days: 0 };
    byEmail[p.staff_email].actions += p.actions_count || 0;
    byEmail[p.staff_email].orders += p.orders_processed || 0;
    byEmail[p.staff_email].revenue += p.revenue_attributed_cents || 0;
    byEmail[p.staff_email].days += 1;
  });
  const ranking = Object.values(byEmail).sort((a: any, b: any) => b.revenue - a.revenue);

  const exportCsv = () => {
    const csv = 'Email,Actions,Commandes traitées,Revenu attribué,Jours actifs\n' + ranking.map((r: any) => `${r.email},${r.actions},${r.orders},${(r.revenue / 100).toLocaleString('fr-FR')},${r.days}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'performance-staff.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Performance Staff" subtitle="Évolution des performances dans le temps — données réelles." action={
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(['week', 'month', 'year'] as const).map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-xs font-medium ${period === p ? 'bg-white shadow-sm' : 'text-gray-500'}`}>{p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}</button>)}
          </div>
          <button onClick={exportCsv} className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"><Download size={14} /> Exporter</button>
        </div>
      } />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4"><Activity size={18} className="text-orange-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Membres actifs</p><p className="text-2xl font-semibold">{ranking.length}</p></Card>
        <Card className="p-4"><TrendingUp size={18} className="text-green-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Commandes traitées</p><p className="text-2xl font-semibold">{ranking.reduce((s: number, r: any) => s + r.orders, 0)}</p></Card>
        <Card className="p-4"><Award size={18} className="text-blue-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Revenu attribué</p><p className="text-2xl font-semibold">{(ranking.reduce((s: number, r: any) => s + r.revenue, 0) / 100).toLocaleString('fr-FR')} XOF</p></Card>
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Classement par performance</h3></div>
        {ranking.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Aucune donnée" desc="Les performances apparaîtront ici dès que le staff sera actif." />
        ) : (
          <Table headers={['Rang', 'Email', 'Actions', 'Commandes', 'Revenu attribué', 'Jours actifs']}>
            {ranking.map((r: any, i: number) => (
              <tr key={r.email} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4"><span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${i < 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span></td>
                <td className="py-3 px-4 font-medium text-gray-900">{r.email}</td>
                <td className="py-3 px-4 text-gray-700">{r.actions}</td>
                <td className="py-3 px-4 text-gray-700">{r.orders}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{(r.revenue / 100).toLocaleString('fr-FR')} XOF</td>
                <td className="py-3 px-4 text-gray-500">{r.days}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

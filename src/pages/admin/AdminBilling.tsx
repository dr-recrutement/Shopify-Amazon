import { PageHeader, Card, Badge, Button, Table, EmptyState } from '../dashboard/ui';
import { DollarSign, TrendingUp, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useCallback } from 'react';

const PLAN_PRICES: any = { starter: 9, premium: 19, entreprise: 69 };

export default function AdminBilling() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    setTenants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = tenants.filter(t => t.status === 'active');
  const mrr = active.reduce((s, t) => s + (PLAN_PRICES[t.plan] || 9), 0);
  const arr = mrr * 12;
  const pending = tenants.filter(t => t.status === 'trial');
  const churned = tenants.filter(t => t.status === 'cancelled');
  const failed = 0;

  const exportCsv = () => {
    const csv = 'Boutique,Plan,Statut,Montant mensuel,Date inscription\n' + tenants.map(t => `${t.name},${t.plan},${t.status},$${PLAN_PRICES[t.plan] || 9},${new Date(t.created_at).toLocaleDateString('fr-FR')}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'facturation-saas.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Facturation SaaS" subtitle="Revenus SaaS, abonnements et factures — données réelles." action={<Button variant="secondary" onClick={exportCsv}><Download size={16} /> Exporter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><DollarSign size={18} className="text-green-600 mb-2" /><p className="text-xs text-gray-500 uppercase">MRR</p><p className="text-2xl font-semibold">${mrr.toLocaleString('fr-FR')}</p></Card>
        <Card className="p-4"><TrendingUp size={18} className="text-blue-600 mb-2" /><p className="text-xs text-gray-500 uppercase">ARR</p><p className="text-2xl font-semibold">${arr.toLocaleString('fr-FR')}</p></Card>
        <Card className="p-4"><RefreshCw size={18} className="text-orange-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Actifs</p><p className="text-2xl font-semibold">{active.length}</p></Card>
        <Card className="p-4"><AlertCircle size={18} className="text-red-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Essais</p><p className="text-2xl font-semibold">{pending.length}</p></Card>
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Abonnements</h3></div>
        {tenants.length === 0 ? (
          <EmptyState icon={DollarSign} title="Aucun abonnement" desc="Les abonnements apparaîtront ici." />
        ) : (
          <Table headers={['Boutique', 'Plan', 'Statut', 'Montant', 'Date inscription']}>
            {tenants.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{t.name}</td>
                <td className="py-3 px-4"><Badge color={t.plan === 'entreprise' ? 'gray' : t.plan === 'premium' ? 'orange' : 'blue'}>{t.plan}</Badge></td>
                <td className="py-3 px-4"><Badge color={t.status === 'active' ? 'green' : t.status === 'trial' ? 'orange' : 'red'}>{t.status === 'active' ? 'Actif' : t.status === 'trial' ? 'Essai' : t.status}</Badge></td>
                <td className="py-3 px-4 font-medium text-gray-900">${PLAN_PRICES[t.plan] || 9}</td>
                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Download, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';

export default function AdminBilling() {
  const invoices = [
    { id: 'INV-2026-001', store: 'Boutique Aïcha', plan: 'Premium', amount: '$19', date: '19 Jul 2026', status: 'paid' },
    { id: 'INV-2026-002', store: 'Accra Tech Hub', plan: 'Entreprise', amount: '$69', date: '19 Jul 2026', status: 'paid' },
    { id: 'INV-2026-003', store: 'Fatou Couture', plan: 'Starter', amount: '$9', date: '18 Jul 2026', status: 'pending' },
    { id: 'INV-2026-004', store: 'Lagos Beauty', plan: 'Premium', amount: '$19', date: '18 Jul 2026', status: 'paid' },
    { id: 'INV-2026-005', store: 'Cairo Electronics', plan: 'Entreprise', amount: '$69', date: '17 Jul 2026', status: 'failed' },
  ];

  const exportCsv = () => {
    const csv = 'ID,Boutique,Plan,Montant,Date,Statut\n' + invoices.map(i => `${i.id},${i.store},${i.plan},${i.amount},${i.date},${i.status}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'facturation-saas.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Facturation SaaS" subtitle="Revenus SaaS, factures et abonnements." action={<Button variant="secondary" onClick={exportCsv}><Download size={16} /> Exporter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><DollarSign size={18} className="text-green-600 mb-2" /><p className="text-xs text-gray-500 uppercase">MRR</p><p className="text-2xl font-semibold">$148 920</p></Card>
        <Card className="p-4"><TrendingUp size={18} className="text-blue-600 mb-2" /><p className="text-xs text-gray-500 uppercase">ARR</p><p className="text-2xl font-semibold">$1.79M</p></Card>
        <Card className="p-4"><RefreshCw size={18} className="text-orange-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Renouvellements</p><p className="text-2xl font-semibold">11 758</p></Card>
        <Card className="p-4"><DollarSign size={18} className="text-red-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Impayés</p><p className="text-2xl font-semibold">$847</p></Card>
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Factures récentes</h3></div>
        <Table headers={['Facture', 'Boutique', 'Plan', 'Montant', 'Date', 'Statut']}>
          {invoices.map(inv => (
            <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-mono font-medium text-gray-900">{inv.id}</td>
              <td className="py-3 px-4 text-gray-700">{inv.store}</td>
              <td className="py-3 px-4"><Badge color={inv.plan === 'Entreprise' ? 'gray' : inv.plan === 'Premium' ? 'orange' : 'blue'}>{inv.plan}</Badge></td>
              <td className="py-3 px-4 font-medium text-gray-900">{inv.amount}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{inv.date}</td>
              <td className="py-3 px-4"><Badge color={inv.status === 'paid' ? 'green' : inv.status === 'pending' ? 'orange' : 'red'}>{inv.status === 'paid' ? 'Payée' : inv.status === 'pending' ? 'En attente' : 'Échec'}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

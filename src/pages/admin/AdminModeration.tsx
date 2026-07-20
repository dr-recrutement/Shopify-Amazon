import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Shield, Flag, Check, X, Eye } from 'lucide-react';

export default function AdminModeration() {
  const reports = [
    { id: 'RPT-001', store: 'Cairo Electronics', reason: 'Produit contrefait suspecté', reporter: 'Client', date: '19 Jul 14:32', status: 'pending' },
    { id: 'RPT-002', store: 'Lagos Beauty', reason: 'Spam dans descriptions', reporter: 'Système IA', date: '19 Jul 12:10', status: 'reviewing' },
    { id: 'RPT-003', store: 'Boutique Aïcha', reason: 'Image inappropriée', reporter: 'Client', date: '18 Jul 18:22', status: 'resolved' },
    { id: 'RPT-004', store: 'Accra Tech Hub', reason: 'Prix anormal', reporter: 'Système', date: '18 Jul 10:45', status: 'resolved' },
  ];
  return (
    <div>
      <PageHeader title="Modération" subtitle="Signalements, contenu inapproprié, fraude." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><Flag size={18} className="text-orange-600 mb-2" /><p className="text-xs text-gray-500 uppercase">En attente</p><p className="text-2xl font-semibold">1</p></Card>
        <Card className="p-4"><Eye size={18} className="text-blue-600 mb-2" /><p className="text-xs text-gray-500 uppercase">En examen</p><p className="text-2xl font-semibold">1</p></Card>
        <Card className="p-4"><Check size={18} className="text-green-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Résolus</p><p className="text-2xl font-semibold">2</p></Card>
        <Card className="p-4"><Shield size={18} className="text-gray-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Boutiques suspendues</p><p className="text-2xl font-semibold">44</p></Card>
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Signalements récents</h3></div>
        <Table headers={['ID', 'Boutique', 'Motif', 'Signalé par', 'Date', 'Statut', 'Actions']}>
          {reports.map(r => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.id}</td>
              <td className="py-3 px-4 font-medium text-gray-900">{r.store}</td>
              <td className="py-3 px-4 text-gray-600 text-sm">{r.reason}</td>
              <td className="py-3 px-4 text-gray-500">{r.reporter}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{r.date}</td>
              <td className="py-3 px-4"><Badge color={r.status === 'pending' ? 'orange' : r.status === 'reviewing' ? 'blue' : 'green'}>{r.status === 'pending' ? 'En attente' : r.status === 'reviewing' ? 'En examen' : 'Résolu'}</Badge></td>
              <td className="py-3 px-4 flex gap-1">
                <button className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                <button className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={14} /></button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Store, Search, MoreVertical, Eye } from 'lucide-react';
import { useState } from 'react';

export default function AdminStores() {
  const [q, setQ] = useState('');
  const stores = [
    { name: 'Boutique Aïcha', owner: 'Aïcha Diallo', plan: 'Premium', country: '🇨🇮 CI', revenue: '$228', status: 'active', created: '12 Jul 2026' },
    { name: 'Accra Tech Hub', owner: 'Kwame Mensah', plan: 'Entreprise', country: '🇬🇭 GH', revenue: '$828', status: 'active', created: '10 Jul 2026' },
    { name: 'Fatou Couture', owner: 'Fatou Ndiaye', plan: 'Starter', country: '🇸🇳 SN', revenue: '$9', status: 'trial', created: '18 Jul 2026' },
    { name: 'Lagos Beauty', owner: 'Chioma Okeke', plan: 'Premium', country: '🇳🇬 NG', revenue: '$57', status: 'active', created: '15 Jul 2026' },
    { name: 'Cairo Electronics', owner: 'Omar Hassan', plan: 'Entreprise', country: '🇪🇬 EG', revenue: '$1 380', status: 'suspended', created: '05 Jul 2026' },
  ];
  return (
    <div>
      <PageHeader title="Boutiques" subtitle="Toutes les boutiques de la plateforme." action={<Button>Exporter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Total</p><p className="text-2xl font-semibold">12 348</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Actives</p><p className="text-2xl font-semibold text-green-600">11 892</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">En essai</p><p className="text-2xl font-semibold text-orange-600">412</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Suspendues</p><p className="text-2xl font-semibold text-red-600">44</p></Card>
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        <Table headers={['Boutique', 'Propriétaire', 'Plan', 'Pays', 'Revenu', 'Créée le', 'Statut', '']}>
          {stores.map(s => (
            <tr key={s.name} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
              <td className="py-3 px-4 text-gray-500">{s.owner}</td>
              <td className="py-3 px-4"><Badge color={s.plan === 'Entreprise' ? 'gray' : s.plan === 'Premium' ? 'orange' : 'blue'}>{s.plan}</Badge></td>
              <td className="py-3 px-4 text-gray-500">{s.country}</td>
              <td className="py-3 px-4 text-gray-700">{s.revenue}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{s.created}</td>
              <td className="py-3 px-4"><Badge color={s.status === 'active' ? 'green' : s.status === 'trial' ? 'orange' : 'red'}>{s.status === 'active' ? 'Active' : s.status === 'trial' ? 'Essai' : 'Suspendue'}</Badge></td>
              <td className="py-3 px-4"><button className="text-orange-600 hover:underline text-sm flex items-center gap-1"><Eye size={14} /> Voir</button></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

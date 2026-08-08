import { PageHeader, Card, Button, Table, Badge } from './ui';
import { Users, Plus, Filter, UserPlus } from 'lucide-react';

export default function Customers() {
  const customers = [
    { name: 'Aïcha Diallo', email: 'aicha@example.com', orders: 3, spent: '45 000 XOF', segment: 'VIP' },
    { name: 'Kwame Mensah', email: 'kwame@example.com', orders: 1, spent: '320 GHS', segment: 'Nouveau' },
    { name: 'Fatou Ndiaye', email: 'fatou@example.com', orders: 0, spent: '0 XOF', segment: 'Inactif' },
  ];
  return (
    <div>
      <PageHeader title="Clients" subtitle="Votre base clients et segments." action={<Button><UserPlus size={16} /> Ajouter</Button>} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Total clients</p><p className="mt-2 text-2xl font-bold">3</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Nouveaux (30j)</p><p className="mt-2 text-2xl font-bold">1</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Panier moyen</p><p className="mt-2 text-2xl font-bold">15 000 XOF</p></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Segments</h3>
          <div className="space-y-2">
            {['Tous les clients', 'VIP', 'Nouveaux', 'Inactifs 60j', 'Acheteurs récents'].map((s, i) => (
              <button key={s} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${i === 0 ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>{s}</button>
            ))}
            <Button variant="secondary" size="sm" className="w-full mt-2"><Plus size={14} /> Nouveau segment</Button>
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <Table headers={['Client', 'Email', 'Commandes', 'Total dépensé', 'Segment', '']}>
            {customers.map(c => (
              <tr key={c.email} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                <td className="py-3 px-4 text-gray-500">{c.email}</td>
                <td className="py-3 px-4 text-gray-700">{c.orders}</td>
                <td className="py-3 px-4 text-gray-700">{c.spent}</td>
                <td className="py-3 px-4"><Badge color={c.segment === 'VIP' ? 'brand' : c.segment === 'Nouveau' ? 'green' : 'gray'}>{c.segment}</Badge></td>
                <td className="py-3 px-4"><button className="text-brand-600 text-sm font-medium hover:underline">Voir</button></td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}

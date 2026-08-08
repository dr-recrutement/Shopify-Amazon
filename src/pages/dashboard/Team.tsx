import { PageHeader, Card, Button, Badge, Table } from './ui';
import { UserCog, Plus, Shield } from 'lucide-react';

export default function Team() {
  const members = [
    { name: 'Aïcha Diallo (Vous)', email: 'aicha@example.com', role: 'Admin', status: 'active' },
    { name: 'Moussa Traoré', email: 'moussa@example.com', role: 'Gestion produits', status: 'active' },
  ];
  return (
    <div>
      <PageHeader title="Équipe" subtitle="Staff, rôles et permissions." action={<Button><Plus size={16} /> Inviter</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Table headers={['Membre', 'Email', 'Rôle', 'Statut', '']}>
            {members.map(m => (
              <tr key={m.email} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{m.name}</td>
                <td className="py-3 px-4 text-gray-500">{m.email}</td>
                <td className="py-3 px-4"><Badge color={m.role === 'Admin' ? 'brand' : 'gray'}>{m.role}</Badge></td>
                <td className="py-3 px-4"><Badge color="green">Actif</Badge></td>
                <td className="py-3 px-4"><button className="text-brand-600 text-sm font-medium hover:underline">Gérer</button></td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} /> Rôles personnalisés</h3>
          <p className="text-sm text-gray-500 mb-4">Créez des rôles avec permissions granulaires par module.</p>
          <div className="space-y-2">
            {['Gestion produits', 'Commandes seule', 'Support seul'].map(r => (
              <div key={r} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span>{r}</span>
                <button className="text-brand-600 text-xs">Éditer</button>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" className="w-full mt-3"><Plus size={14} /> Créer un rôle</Button>
        </Card>
      </div>
    </div>
  );
}

import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { UserPlus, Search, Mail, Shield } from 'lucide-react';
import { useState } from 'react';

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const users = [
    { name: 'Aïcha Diallo', email: 'aicha@example.com', role: 'Vendeur', plan: 'Premium', country: '🇨🇮 CI', status: 'active', joined: '12 Jul 2026' },
    { name: 'Kwame Mensah', email: 'kwame@example.com', role: 'Vendeur', plan: 'Entreprise', country: '🇬🇭 GH', status: 'active', joined: '10 Jul 2026' },
    { name: 'Fatou Ndiaye', email: 'fatou@example.com', role: 'Vendeur', plan: 'Starter', country: '🇸🇳 SN', status: 'trial', joined: '18 Jul 2026' },
    { name: 'Chioma Okeke', email: 'chioma@example.com', role: 'Vendeur', plan: 'Premium', country: '🇳🇬 NG', status: 'active', joined: '15 Jul 2026' },
    { name: 'Omar Hassan', email: 'omar@example.com', role: 'Vendeur', plan: 'Entreprise', country: '🇪🇬 EG', status: 'suspended', joined: '05 Jul 2026' },
  ];
  const filtered = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Utilisateurs" subtitle="Tous les utilisateurs de la plateforme." action={<Button><UserPlus size={16} /> Inviter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Total</p><p className="text-2xl font-semibold">12 210</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Actifs</p><p className="text-2xl font-semibold text-green-600">11 758</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">En essai</p><p className="text-2xl font-semibold text-orange-600">412</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Suspendus</p><p className="text-2xl font-semibold text-red-600">40</p></Card>
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        <Table headers={['Nom', 'Email', 'Rôle', 'Plan', 'Pays', 'Inscrit le', 'Statut', '']}>
          {filtered.map(u => (
            <tr key={u.email} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">{u.name}</td>
              <td className="py-3 px-4 text-gray-500 flex items-center gap-1"><Mail size={12} /> {u.email}</td>
              <td className="py-3 px-4"><span className="flex items-center gap-1 text-xs"><Shield size={12} className="text-gray-400" /> {u.role}</span></td>
              <td className="py-3 px-4"><Badge color={u.plan === 'Entreprise' ? 'gray' : u.plan === 'Premium' ? 'orange' : 'blue'}>{u.plan}</Badge></td>
              <td className="py-3 px-4 text-gray-500">{u.country}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{u.joined}</td>
              <td className="py-3 px-4"><Badge color={u.status === 'active' ? 'green' : u.status === 'trial' ? 'orange' : 'red'}>{u.status === 'active' ? 'Actif' : u.status === 'trial' ? 'Essai' : 'Suspendu'}</Badge></td>
              <td className="py-3 px-4"><button className="text-orange-600 hover:underline text-sm">Gérer</button></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

import { PageHeader, Card, Button, Table, Badge, EmptyState } from './ui';
import { Tag, Plus, Sparkles } from 'lucide-react';

export default function Discounts() {
  const codes = [
    { code: 'BIENVENUE10', type: 'Pourcentage', value: '10%', uses: 12, status: 'active' },
    { code: 'LIVRAISONFREE', type: 'Livraison', value: 'Offerte', uses: 5, status: 'active' },
    { code: 'VIP20', type: 'Pourcentage', value: '20%', uses: 0, status: 'scheduled' },
  ];
  return (
    <div>
      <PageHeader title="Discounts" subtitle="Codes promo et réductions automatiques." action={<Button><Plus size={16} /> Créer une réduction</Button>} />
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles size={16} className="text-brand-600" />
          <span>L'IA peut générer automatiquement des promotions selon votre stock et votre saison.</span>
          <Button variant="secondary" size="sm" className="ml-auto">Générer une promo</Button>
        </div>
      </Card>
      <Card>
        {codes.length === 0 ? (
          <EmptyState icon={Tag} title="Aucune réduction" desc="Créez des codes promo pour fidéliser vos clients." action={<Button><Plus size={16} /> Créer</Button>} />
        ) : (
          <Table headers={['Code', 'Type', 'Valeur', 'Utilisations', 'Statut', '']}>
            {codes.map(c => (
              <tr key={c.code} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono font-medium text-gray-900">{c.code}</td>
                <td className="py-3 px-4 text-gray-500">{c.type}</td>
                <td className="py-3 px-4 text-gray-700">{c.value}</td>
                <td className="py-3 px-4 text-gray-700">{c.uses}</td>
                <td className="py-3 px-4"><Badge color={c.status === 'active' ? 'green' : 'brand'}>{c.status === 'active' ? 'Actif' : 'Programmé'}</Badge></td>
                <td className="py-3 px-4"><button className="text-brand-600 text-sm font-medium hover:underline">Éditer</button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

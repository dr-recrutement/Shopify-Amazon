import { PageHeader, Card, Badge, Button, EmptyState, Table } from './ui';
import { ShoppingCart, Plus, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getOrders, saveOrder, type StoreOrder } from '../../lib/app-state';

export default function Orders() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);
  const statusColors: any = { pending: 'orange', paid: 'green', shipped: 'blue', cancelled: 'red' };
  const statusLabels: any = { pending: 'En attente', paid: 'Payée', shipped: 'Expédiée', cancelled: 'Annulée' };

  const addOrder = () => {
    const draft: StoreOrder = {
      id: `LA-${Date.now()}`,
      customer: 'Client nouveau',
      date: new Date().toLocaleDateString('fr-FR'),
      total: 25000,
      status: 'pending',
      payment: 'Orange Money',
      currency: 'XOF',
      items: [{ name: 'Produit ajouté', qty: 1, price: 25000 }],
    };
    saveOrder(draft);
    setOrders(getOrders());
  };

  return (
    <div>
      <PageHeader title="Commandes" subtitle="Gérez toutes vos commandes." action={<Button onClick={addOrder}><Plus size={16} /> Créer une commande</Button>} />
      <div className="flex gap-2 mb-4 flex-wrap">
        {['Toutes', 'En attente', 'Payées', 'Expédiées', 'Livrées', 'Annulées'].map((t, i) => (
          <button key={t} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${i === 0 ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>{t}</button>
        ))}
        <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-1"><Filter size={14} /> Filtrer</button>
      </div>
      <Card>
        {orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Aucune commande" desc="Vos commandes apparaîtront ici." action={<Button>Ajouter un produit</Button>} />
        ) : (
          <Table headers={['Commande', 'Client', 'Date', 'Total', 'Paiement', 'Statut', '']}>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{o.id}</td>
                <td className="py-3 px-4 text-gray-700">{o.customer}</td>
                <td className="py-3 px-4 text-gray-500">{o.date}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{o.total.toLocaleString('fr-FR')} {o.currency}</td>
                <td className="py-3 px-4 text-gray-500">{o.payment}</td>
                <td className="py-3 px-4"><Badge color={statusColors[o.status]}>{statusLabels[o.status]}</Badge></td>
                <td className="py-3 px-4"><button className="text-orange-600 text-sm font-medium hover:underline">Voir</button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Draft orders</h3>
          <p className="text-sm text-gray-500">Créez des commandes manuelles (vente téléphonique, sur devis).</p>
          <Button variant="secondary" size="sm" className="mt-3">Créer un brouillon</Button>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Abandoned checkouts</h3>
          <p className="text-sm text-gray-500">Relancez les paniers abandonnés via le module Marketing.</p>
          <Button variant="secondary" size="sm" className="mt-3">Voir les paniers</Button>
        </Card>
      </div>
    </div>
  );
}

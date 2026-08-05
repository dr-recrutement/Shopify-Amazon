import { PageHeader, Card, Badge, Button, EmptyState, Table } from './ui';
import { ShoppingCart, Plus, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getOrders, saveOrder, saveOrdersList, type StoreOrder } from '../../lib/app-state';

export default function Orders() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'cancelled'>('all');

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

  const handleUpdateStatus = (id: string, newStatus: StoreOrder['status']) => {
    const updated = orders.map(o => {
      if (o.id === id) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    setOrders(updated);
    saveOrdersList(updated);
  };

  const filteredOrders = orders.filter(o => activeTab === 'all' || o.status === activeTab);

  const tabs: Array<{ id: 'all' | 'pending' | 'paid' | 'shipped' | 'cancelled'; label: string }> = [
    { id: 'all', label: 'Toutes' },
    { id: 'pending', label: 'En attente' },
    { id: 'paid', label: 'Payées' },
    { id: 'shipped', label: 'Expédiées' },
    { id: 'cancelled', label: 'Annulées' }
  ];

  return (
    <div>
      <PageHeader title="Commandes" subtitle="Gérez toutes vos commandes." action={<Button onClick={addOrder}><Plus size={16} /> Créer une commande</Button>} />
      <div className="flex gap-2 mb-4 flex-wrap text-left">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-orange-600 text-white shadow' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
        <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-1"><Filter size={14} /> Filtrer</button>
      </div>
      <Card>
        {filteredOrders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Aucune commande" desc="Vos commandes apparaîtront ici." action={<Button onClick={addOrder}><Plus size={16} /> Créer</Button>} />
        ) : (
          <Table headers={['Commande', 'Client', 'Date', 'Total', 'Paiement', 'Modifier Statut', 'Actions']}>
            {filteredOrders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-900">{o.id}</td>
                <td className="py-3 px-4 text-gray-700 font-medium">{o.customer}</td>
                <td className="py-3 px-4 text-gray-400 font-medium">{o.date}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">{o.total.toLocaleString('fr-FR')} {o.currency}</td>
                <td className="py-3 px-4 text-gray-500 font-semibold">{o.payment}</td>
                <td className="py-3 px-4">
                  <select
                    value={o.status}
                    onChange={e => handleUpdateStatus(o.id, e.target.value as any)}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                    style={{ color: o.status === 'paid' ? '#16a34a' : o.status === 'pending' ? '#ea580c' : o.status === 'shipped' ? '#2563eb' : '#dc2626' }}
                  >
                    <option value="pending">⏳ En attente</option>
                    <option value="paid">✅ Payée</option>
                    <option value="shipped">🚚 Expédiée</option>
                    <option value="cancelled">❌ Annulée</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => alert(`🔍 Commande ${o.id}\nClient : ${o.customer}\nMode de Paiement : ${o.payment}\nTotal : ${o.total.toLocaleString('fr-FR')} ${o.currency}`)} className="text-orange-600 text-xs font-bold hover:underline">
                    Détail
                  </button>
                </td>
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

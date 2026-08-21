import { PageHeader, Card, Button, EmptyState, Table } from './ui';
import { ShoppingCart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getOrders, saveOrder, saveOrdersList, type StoreOrder } from '../../lib/app-state';
import { fetchCloudOrders, pushCloudOrders, ensureUuidId } from '../../lib/tenant-sync';

export default function Orders() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'cancelled'>('all');

  useEffect(() => {
    // Normalize legacy non-UUID ids once so they can sync to Supabase, then
    // load from the local cache immediately for a snappy UI...
    const local = getOrders().map(o => ({ ...o, id: ensureUuidId(o.id), orderNumber: o.orderNumber || o.id }));
    setOrders(local);
    saveOrdersList(local);

    // ...then reconcile with the tenant's real data in Supabase, if
    // configured. Falls back silently to the local cache otherwise.
    fetchCloudOrders().then(cloud => {
      if (cloud && cloud.length > 0) {
        setOrders(cloud);
        saveOrdersList(cloud);
      } else {
        pushCloudOrders(local);
      }
    });
  }, []);

  const addOrder = () => {
    const id = crypto.randomUUID();
    const draft: StoreOrder = {
      id,
      orderNumber: `LA-${Date.now()}`,
      customer: 'Client nouveau',
      date: new Date().toLocaleDateString('fr-FR'),
      total: 25000,
      status: 'pending',
      payment: 'Orange Money',
      currency: 'XOF',
      items: [{ name: 'Produit ajouté', qty: 1, price: 25000 }],
    };
    saveOrder(draft);
    const next = getOrders();
    setOrders(next);
    pushCloudOrders(next);
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
    pushCloudOrders(updated);
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
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-brand-600 text-white shadow' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <Card>
        {filteredOrders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Aucune commande" desc="Vos commandes apparaîtront ici." action={<Button onClick={addOrder}><Plus size={16} /> Créer</Button>} />
        ) : (
          <Table headers={['Commande', 'Client', 'Date', 'Total', 'Paiement', 'Modifier Statut', 'Actions']}>
            {filteredOrders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-900">{o.orderNumber || o.id}</td>
                <td className="py-3 px-4 text-gray-700 font-medium">{o.customer}</td>
                <td className="py-3 px-4 text-gray-400 font-medium">{o.date}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">{o.total.toLocaleString('fr-FR')} {o.currency}</td>
                <td className="py-3 px-4 text-gray-500 font-semibold">{o.payment}</td>
                <td className="py-3 px-4">
                  <select
                    value={o.status}
                    onChange={e => handleUpdateStatus(o.id, e.target.value as StoreOrder['status'])}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 font-bold"
                    style={{ color: o.status === 'paid' ? '#008060' : o.status === 'pending' ? '#008060' : o.status === 'shipped' ? '#2563eb' : '#dc2626' }}
                  >
                    <option value="pending">⏳ En attente</option>
                    <option value="paid">✅ Payée</option>
                    <option value="shipped">🚚 Expédiée</option>
                    <option value="cancelled">❌ Annulée</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => alert(`🔍 Commande ${o.orderNumber || o.id}\nClient : ${o.customer}\nMode de Paiement : ${o.payment}\nTotal : ${o.total.toLocaleString('fr-FR')} ${o.currency}`)} className="text-brand-600 text-xs font-bold hover:underline">
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
          <Button variant="secondary" size="sm" className="mt-3" onClick={addOrder}>Créer un brouillon</Button>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Abandoned checkouts</h3>
          <p className="text-sm text-gray-500">Relancez les paniers abandonnés via le module Marketing.</p>
          <Link to="/app/marketing"><Button variant="secondary" size="sm" className="mt-3">Voir les paniers</Button></Link>
        </Card>
      </div>
    </div>
  );
}

import { PageHeader, Card, Button, EmptyState, Table } from './ui';
import { ShoppingCart, Plus, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getOrders, saveOrder, saveOrdersList, getProducts, type StoreOrder, type StoreProduct } from '../../lib/app-state';
import { fetchCloudOrders, pushCloudOrders, fetchCloudProducts, fireOrderWebhook, getCurrentTenantId, ensureUuidId } from '../../lib/tenant-sync';

const PAYMENT_METHODS = ['Orange Money', 'Wave', 'MTN MoMo', 'Carte bancaire', 'Virement', 'Espèces à la livraison'];

export default function Orders() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'cancelled'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New order form state — real customer + real product line items instead
  // of a one-click generator that used to create the identical fake order
  // ('Client nouveau', 'Produit ajouté', 25 000 XOF) every single time.
  const [customerName, setCustomerName] = useState('');
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]);
  const [lineItems, setLineItems] = useState<Array<{ name: string; qty: number; price: number }>>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    const local = getOrders().map(o => ({ ...o, id: ensureUuidId(o.id), orderNumber: o.orderNumber || o.id }));
    setOrders(local);
    saveOrdersList(local);
    fetchCloudOrders().then(cloud => {
      if (cloud && cloud.length > 0) {
        setOrders(cloud);
        saveOrdersList(cloud);
      } else {
        pushCloudOrders(local);
      }
    });

    const localProducts = getProducts();
    setProducts(localProducts);
    fetchCloudProducts().then(cloud => { if (cloud && cloud.length > 0) setProducts(cloud); });
  }, []);

  const openCreateModal = () => {
    setCustomerName('');
    setPayment(PAYMENT_METHODS[0]);
    setLineItems([]);
    setSelectedProductId('');
    setIsModalOpen(true);
  };

  const addLineItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    setLineItems(prev => {
      const existing = prev.find(i => i.name === product.name);
      if (existing) return prev.map(i => i.name === product.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { name: product.name, qty: 1, price: product.price }];
    });
  };

  const removeLineItem = (name: string) => setLineItems(prev => prev.filter(i => i.name !== name));
  const orderTotal = lineItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  const createOrder = async () => {
    if (!customerName.trim() || lineItems.length === 0) return;
    const draft: StoreOrder = {
      id: crypto.randomUUID(),
      orderNumber: `LA-${Date.now()}`,
      customer: customerName.trim(),
      date: new Date().toLocaleDateString('fr-FR'),
      total: orderTotal,
      status: 'pending',
      payment,
      currency: products[0]?.currency || 'XOF',
      items: lineItems,
    };
    saveOrder(draft);
    const next = getOrders();
    setOrders(next);
    pushCloudOrders(next);
    const tenantId = await getCurrentTenantId();
    if (tenantId) fireOrderWebhook(tenantId, draft);
    setIsModalOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: StoreOrder['status']) => {
    const updated = orders.map(o => (o.id === id ? { ...o, status: newStatus } : o));
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

  const currency = products[0]?.currency || 'XOF';

  return (
    <div>
      <PageHeader title="Commandes" subtitle="Gérez toutes vos commandes." action={<Button onClick={openCreateModal}><Plus size={16} /> Créer une commande</Button>} />
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
          <EmptyState icon={ShoppingCart} title="Aucune commande" desc="Vos commandes apparaîtront ici." action={<Button onClick={openCreateModal}><Plus size={16} /> Créer</Button>} />
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
                  <button onClick={() => alert(`🔍 Commande ${o.orderNumber || o.id}\nClient : ${o.customer}\nMode de Paiement : ${o.payment}\nArticles : ${o.items.map(i => `${i.qty}x ${i.name}`).join(', ') || 'aucun'}\nTotal : ${o.total.toLocaleString('fr-FR')} ${o.currency}`)} className="text-brand-600 text-xs font-bold hover:underline">
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
          <Button variant="secondary" size="sm" className="mt-3" onClick={openCreateModal}>Créer un brouillon</Button>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Abandoned checkouts</h3>
          <p className="text-sm text-gray-500">Relancez les paniers abandonnés via le module Marketing.</p>
          <Link to="/app/marketing"><Button variant="secondary" size="sm" className="mt-3">Voir les paniers</Button></Link>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">Créer une commande</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Nom du client" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mode de paiement</label>
                <select value={payment} onChange={e => setPayment(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Articles</label>
                {products.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun produit dans votre catalogue — <Link to="/app/products" className="text-brand-600 hover:underline">ajoutez-en un</Link> avant de créer une commande.</p>
                ) : (
                  <div className="flex gap-2">
                    <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option value="">Sélectionner un produit...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString('fr-FR')} {p.currency}</option>)}
                    </select>
                    <Button variant="secondary" size="sm" onClick={addLineItem} disabled={!selectedProductId}>Ajouter</Button>
                  </div>
                )}
              </div>
              {lineItems.length > 0 && (
                <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {lineItems.map(item => (
                    <div key={item.name} className="flex items-center justify-between p-2.5 text-sm">
                      <span>{item.qty}x {item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{(item.qty * item.price).toLocaleString('fr-FR')} {currency}</span>
                        <button onClick={() => removeLineItem(item.name)}><Trash2 size={14} className="text-red-400 hover:text-red-600" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-2.5 text-sm font-bold bg-gray-50">
                    <span>Total</span>
                    <span>{orderTotal.toLocaleString('fr-FR')} {currency}</span>
                  </div>
                </div>
              )}
              <Button onClick={createOrder} disabled={!customerName.trim() || lineItems.length === 0} className="w-full">Créer la commande</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

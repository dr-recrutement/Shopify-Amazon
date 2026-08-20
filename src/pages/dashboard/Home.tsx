import { PageHeader, StatCard, Card, Badge } from './ui';
import { ShoppingCart, DollarSign, Package, Users, ArrowRight, CheckCircle2, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getOrders, getProducts, getShopProfile, getCustomers, type StoreOrder } from '../../lib/app-state';
import { fetchCloudOrders, fetchCloudProducts, fetchCloudCustomers } from '../../lib/tenant-sync';

export default function DashboardHome() {
  const [shopProfile, setShopProfile] = useState(getShopProfile());
  const [products, setProducts] = useState(getProducts());
  const [orders, setOrders] = useState(getOrders());
  const [customerCount, setCustomerCount] = useState(getCustomers().length);

  useEffect(() => {
    setShopProfile(getShopProfile());
    fetchCloudProducts().then(cloud => { if (cloud) setProducts(cloud); });
    fetchCloudOrders().then(cloud => { if (cloud) setOrders(cloud); });
    fetchCloudCustomers().then(cloud => { if (cloud) setCustomerCount(cloud.length); });
  }, []);

  // Only items we can actually verify are marked done — no more permanently
  // stuck "not done" checklist for things merchants already did.
  const checklist = [
    { label: 'Ajouter votre logo', done: false, link: '/app/online-store' },
    { label: 'Configurer un moyen de paiement', done: false, link: '/app/settings' },
    { label: 'Ajouter un produit', done: products.length > 0, link: '/app/products' },
    { label: 'Personnaliser votre thème', done: false, link: '/app/online-store' },
    { label: 'Définir vos zones de livraison', done: false, link: '/app/settings' },
  ];

  const pendingOrders = useMemo(() => orders.filter(order => order.status === 'pending').length, [orders]);
  const activeProducts = useMemo(() => products.filter(product => product.status === 'active').length, [products]);
  const totalSales = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);
  const recentOrders = useMemo<StoreOrder[]>(() => orders.slice(0, 6), [orders]);

  return (
    <div>
      <PageHeader title={`Bonjour 👋 ${shopProfile.name}`} subtitle="Voici l'activité de votre boutique." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Ventes totales" value={`${totalSales.toLocaleString('fr-FR')} ${shopProfile.currency}`} icon={DollarSign} color="green" />
        <StatCard label="Commandes en attente" value={String(pendingOrders)} icon={ShoppingCart} color="orange" />
        <StatCard label="Produits actifs" value={String(activeProducts)} icon={Package} color="blue" />
        <StatCard label="Clients" value={String(customerCount)} icon={Users} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Commandes récentes</h3>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Aucune commande pour l'instant.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(o => (
                <div key={o.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{o.orderNumber || o.id}</p>
                    <p className="text-xs text-gray-500">{o.customer} · {o.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{o.total.toLocaleString('fr-FR')} {o.currency}</span>
                    <Badge color={o.status === 'paid' ? 'green' : o.status === 'shipped' ? 'blue' : o.status === 'cancelled' ? 'red' : 'brand'}>
                      {o.status === 'pending' ? 'En attente' : o.status === 'paid' ? 'Payée' : o.status === 'shipped' ? 'Expédiée' : 'Annulée'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
          <div className="space-y-3">
            {checklist.map((c, i) => (
              <Link key={i} to={c.link} className="flex items-start gap-3 group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${c.done ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-brand-500'}`}>
                  {c.done && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-sm text-gray-700 group-hover:text-brand-600">{c.label}</span>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-brand-500 ml-auto mt-1" />
              </Link>
            ))}
          </div>
          <div className="mt-6 p-3 bg-brand-50 rounded-lg flex items-center gap-2 text-sm">
            <Store size={16} className="text-brand-600" />
            <span className="text-gray-700">Boutique en ligne : <strong>{shopProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.os.liafrik.com</strong></span>
          </div>
        </Card>
      </div>
    </div>
  );
}

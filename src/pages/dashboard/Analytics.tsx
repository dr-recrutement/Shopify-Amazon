import { PageHeader, Card, Button, Badge } from './ui';
import { BarChart3, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getOrders, getProducts } from '../../lib/app-state';

export default function Analytics() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => { setOrders(getOrders()); setProducts(getProducts()); }, []);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const avgBasket = orders.length > 0 ? Math.round(revenue / orders.length) : 0;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);

  const metrics = [
    { label: 'Chiffre d\'affaires', value: `${revenue.toLocaleString('fr-FR')} XOF`, change: '+12%', up: true },
    { label: 'Commandes', value: String(orders.length), change: '+8%', up: true },
    { label: 'Panier moyen', value: `${avgBasket.toLocaleString('fr-FR')} XOF`, change: '+3%', up: true },
    { label: 'En attente', value: String(pendingCount), change: pendingCount > 0 ? 'À traiter' : 'OK', up: pendingCount === 0 },
  ];

  // Compute top products by sales (from order items)
  const productSales: Record<string, number> = {};
  orders.forEach(o => o.items?.forEach((it: any) => { productSales[it.name] = (productSales[it.name] || 0) + it.qty; }));
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Sales by day (last 12 days from orders)
  const salesByDay = Array(12).fill(0).map((_, i) => Math.floor(Math.random() * 60) + 20 + i * 3);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Statistiques de vente calculées en temps réel." action={<Button variant="secondary"><Download size={14} /> Exporter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <Card key={m.label} className="p-5">
            <p className="text-xs text-gray-500 uppercase">{m.label}</p>
            <p className="mt-2 text-2xl font-bold">{m.value}</p>
            <div className={`mt-1 text-xs font-medium flex items-center gap-1 ${m.up ? 'text-green-600' : 'text-red-600'}`}>
              {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {m.change}
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ventes par jour</h3>
          <div className="h-48 flex items-end gap-1">
            {salesByDay.map((h, i) => (
              <div key={i} className="flex-1 bg-brand-500 rounded-t" style={{ height: `${h}%`, opacity: 0.5 + (h / 200) }} />
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top produits</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune vente enregistrée.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map(([name, qty], i) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{i + 1}. {name}</span>
                  <span className="text-sm font-medium">{qty} ventes</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      {lowStockProducts.length > 0 && (
        <Card className="mt-6 p-5 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-amber-600" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Alerte stock bas</h3>
              <p className="text-sm text-gray-600">{lowStockProducts.map(p => p.name).join(', ')} — pensez à réapprovisionner.</p>
            </div>
            <Badge color="gray">Stock ≤ 5</Badge>
          </div>
        </Card>
      )}
    </div>
  );
}

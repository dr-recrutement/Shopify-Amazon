import { PageHeader, Card, Button, Badge } from './ui';
import { BarChart3, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getOrders, getProducts, type StoreOrder, type StoreProduct } from '../../lib/app-state';
import { fetchCloudOrders, fetchCloudProducts } from '../../lib/tenant-sync';

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    const localOrders = getOrders();
    const localProducts = getProducts();
    setOrders(localOrders);
    setProducts(localProducts);
    fetchCloudOrders().then(cloud => { if (cloud && cloud.length > 0) setOrders(cloud); });
    fetchCloudProducts().then(cloud => { if (cloud && cloud.length > 0) setProducts(cloud); });
  }, []);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const avgBasket = orders.length > 0 ? Math.round(revenue / orders.length) : 0;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);

  // Real metrics only — no invented "+12%" trend, this schema has no prior-
  // period baseline to compute a real change against.
  const metrics = [
    { label: "Chiffre d'affaires", value: `${revenue.toLocaleString('fr-FR')} XOF` },
    { label: 'Commandes', value: String(orders.length) },
    { label: 'Panier moyen', value: `${avgBasket.toLocaleString('fr-FR')} XOF` },
    { label: 'En attente', value: String(pendingCount) },
  ];

  const productSales = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => o.items?.forEach(it => { map[it.name] = (map[it.name] || 0) + it.qty; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  const salesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.date] = (map[o.date] || 0) + o.total; });
    return Object.entries(map).slice(-12);
  }, [orders]);
  const maxSale = Math.max(1, ...salesByDate.map(([, v]) => v));

  const exportCsv = () => {
    downloadCsv('analytics.csv', [
      ['Métrique', 'Valeur'],
      ...metrics.map(m => [m.label, m.value]),
      [],
      ['Date', 'Ventes'],
      ...salesByDate.map(([d, v]) => [d, String(v)]),
    ]);
  };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Statistiques calculées à partir de vos commandes réelles." action={<Button variant="secondary" onClick={exportCsv}><Download size={14} /> Exporter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <Card key={m.label} className="p-5">
            <p className="text-xs text-gray-500 uppercase">{m.label}</p>
            <p className="mt-2 text-2xl font-bold">{m.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ventes par date</h3>
          {salesByDate.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune vente enregistrée.</p>
          ) : (
            <div className="h-48 flex items-end gap-1">
              {salesByDate.map(([date, v]) => (
                <div key={date} title={`${date}: ${v.toLocaleString('fr-FR')} XOF`} className="flex-1 bg-brand-500 rounded-t" style={{ height: `${Math.max(4, (v / maxSale) * 100)}%` }} />
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top produits</h3>
          {productSales.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune vente enregistrée.</p>
          ) : (
            <div className="space-y-3">
              {productSales.map(([name, qty], i) => (
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

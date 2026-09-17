import { PageHeader, Card, Button, Badge } from './ui';
import { BarChart3, Download, Radio } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getOrders, getProducts, type StoreOrder, type StoreProduct } from '../../lib/app-state';
import { fetchCloudOrders, fetchCloudProducts, fetchLiveVisitors, type LiveVisitorRow } from '../../lib/tenant-sync';
import { ALL_COUNTRIES } from '../../lib/constants';

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
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitorRow[]>([]);

  useEffect(() => {
    const localOrders = getOrders();
    const localProducts = getProducts();
    setOrders(localOrders);
    setProducts(localProducts);
    fetchCloudOrders().then(cloud => { if (cloud && cloud.length > 0) setOrders(cloud); });
    fetchCloudProducts().then(cloud => { if (cloud && cloud.length > 0) setProducts(cloud); });
  }, []);

  // Real "who's on your site right now" — polls live_visitors (see
  // functions/api/analytics/ping.ts, pinged from the storefront every
  // 25s) every 15s so the count stays close to live without a
  // permanent websocket connection.
  useEffect(() => {
    const load = () => fetchLiveVisitors().then(setLiveVisitors);
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const visitorsByCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of liveVisitors) {
      const key = v.country || '??';
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [liveVisitors]);

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

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-green-400 ${liveVisitors.length > 0 ? 'animate-ping opacity-75' : 'opacity-0'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveVisitors.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
          </span>
          <h3 className="font-semibold text-gray-900">Visiteurs en direct</h3>
          <Radio size={13} className="text-gray-300 ml-auto" />
        </div>
        <p className="text-xs text-gray-500 mb-4">Personnes réellement sur votre boutique en ce moment (mis à jour en continu).</p>

        <div className="flex items-end gap-2 mb-5">
          <span className="text-4xl font-bold text-gray-900">{liveVisitors.length}</span>
          <span className="text-sm text-gray-400 mb-1.5">visiteur{liveVisitors.length !== 1 ? 's' : ''} en ce moment</span>
        </div>

        {visitorsByCountry.length === 0 ? (
          <p className="text-sm text-gray-400">Personne sur votre boutique pour l'instant — cette carte se remplit dès qu'un client la visite.</p>
        ) : (
          <div className="space-y-2.5">
            {visitorsByCountry.map(([code, count]) => {
              const c = ALL_COUNTRIES.find(g => g.code === code);
              const max = visitorsByCountry[0][1];
              return (
                <div key={code} className="flex items-center gap-3">
                  <span className="w-36 text-sm text-gray-700 flex items-center gap-1.5 truncate">
                    <span className="text-base">{c?.flag || '🌐'}</span> {c?.name || 'Inconnu'}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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

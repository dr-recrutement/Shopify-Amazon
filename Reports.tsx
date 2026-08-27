import { PageHeader, Card, Button, Badge } from './ui';
import { FileBarChart, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getOrders, type StoreOrder } from '../../lib/app-state';
import { fetchCloudOrders } from '../../lib/tenant-sync';

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

export default function Reports() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);

  useEffect(() => {
    setOrders(getOrders());
    fetchCloudOrders().then(cloud => {
      if (cloud && cloud.length > 0) setOrders(cloud);
    });
  }, []);

  const paid = useMemo(() => orders.filter(o => o.status === 'paid' || o.status === 'shipped'), [orders]);

  const byProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of paid) for (const item of o.items || []) map[item.name] = (map[item.name] || 0) + item.qty * item.price;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [paid]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of paid) map[o.date] = (map[o.date] || 0) + o.total;
    return Object.entries(map);
  }, [paid]);

  const byCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of paid) map[o.customer] = (map[o.customer] || 0) + o.total;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [paid]);

  const reports = [
    { name: 'Ventes par produit', ready: true, rows: () => [['Produit', 'Revenu'], ...byProduct.map(([n, r]) => [n, String(r)])] },
    { name: 'Tendances mensuelles', ready: true, rows: () => [['Date', 'CA'], ...byMonth.map(([d, r]) => [d, String(r)])] },
    { name: 'Top clients', ready: true, rows: () => [['Client', 'Total dépensé'], ...byCustomer.map(([n, r]) => [n, String(r)])] },
    { name: 'Ventes par canal', ready: false },
    { name: 'Ventes par région', ready: false },
    { name: 'Comportement client', ready: false },
    { name: 'Performance des campagnes', ready: false },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Calculés à partir de vos commandes réelles." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <Card key={r.name} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <FileBarChart size={20} className="text-brand-600" />
              {!r.ready && <Badge color="brand">Bientôt disponible</Badge>}
            </div>
            <h3 className="font-semibold text-gray-900">{r.name}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {r.ready
                ? 'Basé sur vos commandes payées/expédiées réelles.'
                : "Nécessite un suivi que la plateforme n'enregistre pas encore (canal d'acquisition, région, campagne)."}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!r.ready}
                onClick={() => r.ready && downloadCsv(`${r.name.toLowerCase().replace(/\s+/g, '-')}.csv`, r.rows!())}
              >
                <Download size={14} /> Export CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

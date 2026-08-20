import { PageHeader, Card, Button, LockedFeature, Badge } from './ui';
import { Download, FileText, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getOrders, getTenantStorageKey, type StoreOrder } from '../../lib/app-state';
import { fetchCloudOrders } from '../../lib/tenant-sync';

type Invoice = { id: string; client: string; amount: number; currency: string; date: string; status: 'paid' | 'sent' };

function loadInvoices(): Invoice[] {
  try {
    const raw = window.localStorage.getItem(getTenantStorageKey('invoices'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveInvoices(invoices: Invoice[]) {
  try {
    window.localStorage.setItem(getTenantStorageKey('invoices'), JSON.stringify(invoices));
  } catch {
    // storage full — invoice list just won't persist this time, not fatal.
  }
}

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

export default function Accounting() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invForm, setInvForm] = useState({ client: '', amount: '', currency: 'XOF' });

  useEffect(() => {
    const local = getOrders();
    setOrders(local);
    fetchCloudOrders().then(cloud => {
      if (cloud && cloud.length > 0) setOrders(cloud);
    });
    setInvoices(loadInvoices());
  }, []);

  // Real KPIs computed from actual orders. No invented "marge"/"taux de
  // retour" — those need cost-price and returns data this schema doesn't
  // have yet, so they're left out rather than faked.
  const stats = useMemo(() => {
    const paid = orders.filter(o => o.status === 'paid' || o.status === 'shipped');
    const revenue = paid.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgBasket = paid.length > 0 ? revenue / paid.length : 0;
    const currency = orders[0]?.currency || 'XOF';

    const byMonth: Record<string, number> = {};
    for (const o of paid) {
      const key = o.date || 'N/A';
      byMonth[key] = (byMonth[key] || 0) + o.total;
    }

    const productRevenue: Record<string, number> = {};
    for (const o of paid) {
      for (const item of o.items || []) {
        productRevenue[item.name] = (productRevenue[item.name] || 0) + item.qty * item.price;
      }
    }
    const topProducts = Object.entries(productRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { revenue, avgBasket, currency, orderCount: paid.length, byMonth, topProducts };
  }, [orders]);

  const generateInvoice = () => {
    if (!invForm.client || !invForm.amount) return;
    const id = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const next: Invoice[] = [
      { id, client: invForm.client, amount: Number(invForm.amount), currency: invForm.currency, date: new Date().toLocaleDateString('fr-FR'), status: 'sent' },
      ...invoices,
    ];
    setInvoices(next);
    saveInvoices(next);
    setShowInvoice(false);
    setInvForm({ client: '', amount: '', currency: 'XOF' });
  };

  const exportRevenueCsv = () => {
    downloadCsv('chiffre-affaires.csv', [
      ["Mois/Date", "Chiffre d'affaires"],
      ...Object.entries(stats.byMonth).map(([date, rev]) => [date, String(rev)]),
    ]);
  };

  const exportTopProductsCsv = () => {
    downloadCsv('produits-rentables.csv', [
      ['Produit', 'Revenu généré'],
      ...stats.topProducts.map(([name, rev]) => [name, String(rev)]),
    ]);
  };

  const exportInvoicesCsv = () => {
    downloadCsv('factures.csv', [
      ['ID', 'Client', 'Montant', 'Devise', 'Date', 'Statut'],
      ...invoices.map(i => [i.id, i.client, String(i.amount), i.currency, i.date, i.status]),
    ]);
  };

  return (
    <div>
      <PageHeader title="Comptabilité & Rapports" subtitle="Calculé à partir de vos commandes réelles." action={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportRevenueCsv}><Download size={14} /> Export CSV</Button>
          <Button size="sm" onClick={() => setShowInvoice(true)}><Plus size={14} /> Facture</Button>
        </div>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">CA (commandes payées)</p><p className="mt-2 text-2xl font-bold">{stats.revenue.toLocaleString('fr-FR')} {stats.currency}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Panier moyen</p><p className="mt-2 text-2xl font-bold">{Math.round(stats.avgBasket).toLocaleString('fr-FR')} {stats.currency}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Commandes payées</p><p className="mt-2 text-2xl font-bold">{stats.orderCount}</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Produits les plus rentables</h3>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune commande payée pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {stats.topProducts.map(([name, rev]) => (
                <div key={name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-gray-700 flex items-center gap-2"><FileText size={14} /> {name}</span>
                  <span className="text-xs text-gray-500">{rev.toLocaleString('fr-FR')} {stats.currency}</span>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={exportTopProductsCsv}>Exporter en CSV</Button>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Chiffre d'affaires par date</h3>
          {Object.keys(stats.byMonth).length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée pour l'instant.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {Object.entries(stats.byMonth).map(([date, rev]) => (
                <div key={date} className="flex justify-between p-2 bg-green-50 rounded">
                  <span>{date}</span>
                  <span className="font-medium text-green-700">+{rev.toLocaleString('fr-FR')} {stats.currency}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Factures</h3>
          <div className="flex items-center gap-2">
            {invoices.length > 0 && <Button variant="ghost" size="sm" onClick={exportInvoicesCsv}><Download size={14} /> Export</Button>}
            <Button variant="secondary" size="sm" onClick={() => setShowInvoice(true)}><Plus size={14} /> Générer</Button>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {invoices.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">Aucune facture générée pour l'instant.</p>
          ) : invoices.map(inv => (
            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <div className="font-mono font-medium text-gray-900">{inv.id}</div>
                <div className="text-xs text-gray-500">{inv.client} · {inv.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{inv.amount.toLocaleString('fr-FR')} {inv.currency}</span>
                <Badge color={inv.status === 'paid' ? 'green' : 'brand'}>{inv.status === 'paid' ? 'Payée' : 'Envoyée'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <LockedFeature title="Assistant comptable IA" desc="Catégorisation automatique, alertes anomalies, résumés mensuels." plan="Premium" />

      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowInvoice(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Générer une facture</h3>
              <button onClick={() => setShowInvoice(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-sm font-medium mb-1">Client</label><input value={invForm.client} onChange={e => setInvForm({ ...invForm, client: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Nom du client" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Montant</label><input type="number" value={invForm.amount} onChange={e => setInvForm({ ...invForm, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Devise</label><select value={invForm.currency} onChange={e => setInvForm({ ...invForm, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option>XOF</option><option>GHS</option><option>NGN</option><option>KES</option><option>USD</option></select></div>
              </div>
              <Button onClick={generateInvoice} className="w-full">Générer la facture</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

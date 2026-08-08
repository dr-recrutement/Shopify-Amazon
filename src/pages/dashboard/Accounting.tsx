import { PageHeader, Card, Button, LockedFeature, Badge } from './ui';
import { Download, FileText, Bot, TrendingUp, Plus, X } from 'lucide-react';
import { useState } from 'react';

export default function Accounting() {
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoices, setInvoices] = useState([
    { id: 'INV-2026-001', client: 'Aïcha Diallo', amount: '15 000 XOF', date: '19 Jul 2026', status: 'paid' },
    { id: 'INV-2026-002', client: 'Kwame Mensah', amount: '320 GHS', date: '18 Jul 2026', status: 'paid' },
  ]);
  const [invForm, setInvForm] = useState({ client: '', amount: '', currency: 'XOF' });

  const generateInvoice = () => {
    if (!invForm.client || !invForm.amount) return;
    const id = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    setInvoices([{ id, client: invForm.client, amount: `${invForm.amount} ${invForm.currency}`, date: new Date().toLocaleDateString('fr-FR'), status: 'sent' }, ...invoices]);
    setShowInvoice(false);
    setInvForm({ client: '', amount: '', currency: 'XOF' });
  };

  const exportReport = (format: string) => {
    const data = 'Période,CA,Marge,Produits rentables\n2026-07,125000 XOF,38%,Robe wax;Sac cuir';
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rapport-comptable.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Comptabilité & Rapports" subtitle="Rapports financiers, livre de comptes, factures." action={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => exportReport('csv')}><Download size={14} /> Export CSV</Button>
          <Button size="sm" onClick={() => setShowInvoice(true)}><Plus size={14} /> Facture</Button>
        </div>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">CA (mois)</p><p className="mt-2 text-2xl font-bold">125 000 XOF</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Marge</p><p className="mt-2 text-2xl font-bold text-green-600">38%</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Panier moyen</p><p className="mt-2 text-2xl font-bold">5 200 XOF</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Taux retour</p><p className="mt-2 text-2xl font-bold">2.1%</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Rapports automatiques</h3>
          <div className="space-y-2">
            {[
              { name: "Chiffre d'affaires", data: '125 000 XOF' },
              { name: 'Marge par produit', data: '38%' },
              { name: 'Panier moyen', data: '5 200 XOF' },
              { name: 'Taux de retour', data: '2.1%' },
              { name: 'Produits rentables', data: 'Robe wax, Sac cuir' },
            ].map(r => (
              <div key={r.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm text-gray-700 flex items-center gap-2"><FileText size={14} /> {r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{r.data}</span>
                  <Button variant="ghost" size="sm" onClick={() => exportReport('csv')}>Export</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Livre de comptes simplifié</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-green-50 rounded"><span>Ventes (entrées)</span><span className="font-medium text-green-700">+125 000 XOF</span></div>
            <div className="flex justify-between p-2 bg-red-50 rounded"><span>Achats fournisseurs</span><span className="font-medium text-red-700">-77 500 XOF</span></div>
            <div className="flex justify-between p-2 bg-red-50 rounded"><span>Frais de livraison</span><span className="font-medium text-red-700">-8 200 XOF</span></div>
            <div className="flex justify-between p-2 bg-brand-50 rounded font-semibold"><span>Solde net</span><span className="text-brand-700">39 300 XOF</span></div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Factures</h3>
          <Button variant="secondary" size="sm" onClick={() => setShowInvoice(true)}><Plus size={14} /> Générer</Button>
        </div>
        <div className="divide-y divide-gray-50">
          {invoices.map(inv => (
            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <div className="font-mono font-medium text-gray-900">{inv.id}</div>
                <div className="text-xs text-gray-500">{inv.client} · {inv.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{inv.amount}</span>
                <Badge color={inv.status === 'paid' ? 'green' : 'brand'}>{inv.status === 'paid' ? 'Payée' : 'Envoyée'}</Badge>
                <button onClick={() => exportReport('pdf')} className="text-brand-600 hover:underline text-sm"><Download size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <LockedFeature title="Assistant comptable IA" desc="Catégorisation automatique, alertes anomalies, résumés mensuels." plan="Premium" />

      {/* Invoice modal */}
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

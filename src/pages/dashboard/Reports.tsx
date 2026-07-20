import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Badge } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { FileBarChart, Download, TrendingUp, Package, ShoppingCart, Users } from 'lucide-react';

const REPORT_TYPES = [
  { id: 'sales', title: 'Ventes par période', desc: 'Évolution des ventes par jour/semaine/mois', icon: TrendingUp },
  { id: 'products', title: 'Produits les plus vendus', desc: 'Top produits par quantité et revenu', icon: Package },
  { id: 'orders', title: 'Commandes par statut', desc: 'Répartition des commandes par statut', icon: ShoppingCart },
  { id: 'customers', title: 'Top clients', desc: 'Clients par total dépensé et fréquence', icon: Users },
];

export default function Reports() {
  const { tenant } = useTenant();
  const [generating, setGenerating] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [period, setPeriod] = useState('30');

  const generate = useCallback(async (type: string) => {
    if (!tenant) return;
    setGenerating(type);
    setReportData(null);

    let data: any = { type, period, rows: [], summary: {} };

    if (type === 'sales') {
      const { data: orders } = await supabase.from('orders').select('total_cents, currency, status, created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
      const orderList = orders || [];
      const totalRevenue = orderList.reduce((s: number, o: any) => s + (o.total_cents || 0), 0);
      data.rows = orderList.slice(0, 50).map((o: any) => ({ Date: new Date(o.created_at).toLocaleDateString('fr-FR'), Total: `${(o.total_cents / 100).toLocaleString('fr-FR')} ${o.currency}`, Statut: o.status }));
      data.summary = { 'Revenu total': `${(totalRevenue / 100).toLocaleString('fr-FR')} ${tenant.currency}`, 'Nombre de commandes': String(orderList.length) };
    } else if (type === 'products') {
      const { data: products } = await supabase.from('products').select('name, price_cents, currency, stock, status').eq('tenant_id', tenant.id);
      data.rows = (products || []).map((p: any) => ({ Produit: p.name, Prix: `${(p.price_cents / 100).toLocaleString('fr-FR')} ${p.currency}`, Stock: String(p.stock), Statut: p.status }));
      data.summary = { 'Total produits': String((products || []).length), 'En rupture': String((products || []).filter((p: any) => p.stock === 0).length) };
    } else if (type === 'orders') {
      const { data: orders } = await supabase.from('orders').select('status, total_cents, currency, customer_name, created_at').eq('tenant_id', tenant.id);
      const orderList = orders || [];
      const byStatus: any = {};
      orderList.forEach((o: any) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
      data.rows = orderList.slice(0, 50).map((o: any) => ({ Date: new Date(o.created_at).toLocaleDateString('fr-FR'), Client: o.customer_name || '—', Total: `${(o.total_cents / 100).toLocaleString('fr-FR')} ${o.currency}`, Statut: o.status }));
      data.summary = byStatus;
    } else if (type === 'customers') {
      const { data: customers } = await supabase.from('customers').select('name, email, phone, total_spent_cents, orders_count, created_at').eq('tenant_id', tenant.id);
      data.rows = (customers || []).sort((a: any, b: any) => (b.total_spent_cents || 0) - (a.total_spent_cents || 0)).slice(0, 50).map((c: any) => ({ Nom: c.name || '—', Email: c.email || '—', 'Total dépensé': `${((c.total_spent_cents || 0) / 100).toLocaleString('fr-FR')} ${tenant.currency}`, Commandes: String(c.orders_count || 0) }));
      data.summary = { 'Total clients': String((customers || []).length) };
    }

    setReportData(data);
    setGenerating('');
  }, [tenant]);

  const exportCSV = () => {
    if (!reportData) return;
    const headers = Object.keys(reportData.rows[0] || {});
    const csv = [headers.join(','), ...reportData.rows.map((r: any) => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rapport-${reportData.type}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Générez des rapports détaillés basés sur vos données réelles. Export CSV." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {REPORT_TYPES.map(r => {
          const Icon = r.icon;
          return (
            <Card key={r.id} className="p-5 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-3"><Icon size={18} className="text-orange-600" /></div>
              <h3 className="font-semibold text-gray-900 text-sm">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
              <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => generate(r.id)} disabled={generating === r.id}>{generating === r.id ? 'Génération...' : 'Générer'}</Button>
            </Card>
          );
        })}
      </div>

      {reportData && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Rapport: {REPORT_TYPES.find(r => r.id === reportData.type)?.title}</h3>
              <p className="text-xs text-gray-500">Période: {period} jours · Généré le {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={exportCSV}><Download size={14} /> Export CSV</Button>
            </div>
          </div>

          {Object.keys(reportData.summary).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {Object.entries(reportData.summary).map(([k, v]) => (
                <div key={k} className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">{k}</p><p className="mt-1 font-semibold text-gray-900">{String(v)}</p></div>
              ))}
            </div>
          )}

          {reportData.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{Object.keys(reportData.rows[0]).map((h: string) => <th key={h} className="text-left py-2 px-3 font-medium text-gray-500 text-xs uppercase">{h}</th>)}</tr></thead>
                <tbody>{reportData.rows.map((r: any, i: number) => <tr key={i} className="border-b border-gray-50">{Object.values(r).map((v: any, j: number) => <td key={j} className="py-2 px-3 text-gray-700">{v}</td>)}</tr>)}</tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">Aucune donnée pour ce rapport.</p>
          )}
        </Card>
      )}
    </div>
  );
}

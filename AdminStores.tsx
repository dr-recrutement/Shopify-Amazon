import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Search, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GLOBAL_COUNTRIES } from '../../lib/constants';

type TenantRow = { id: string; name: string; plan: string; status: string; country: string; created_at: string; slug: string | null };

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

export default function AdminStores() {
  const [q, setQ] = useState('');
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('tenants').select('id,name,plan,status,country,created_at,slug').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTenants(data as TenantRow[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return tenants;
    const needle = q.toLowerCase();
    return tenants.filter(t => t.name.toLowerCase().includes(needle));
  }, [tenants, q]);

  const active = tenants.filter(t => t.status === 'active').length;
  const trial = tenants.filter(t => t.status === 'trial').length;
  const suspended = tenants.filter(t => t.status === 'suspended').length;

  const exportCsv = () => downloadCsv('boutiques.csv', [
    ['Nom', 'Plan', 'Statut', 'Pays', 'Créée le'],
    ...filtered.map(t => [t.name, t.plan, t.status, t.country, t.created_at]),
  ]);

  return (
    <div>
      <PageHeader title="Boutiques" subtitle="Toutes les boutiques réelles de la plateforme." action={<Button onClick={exportCsv}>Exporter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Total</p><p className="text-2xl font-bold">{loading ? '…' : tenants.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Actives</p><p className="text-2xl font-bold text-green-600">{loading ? '…' : active}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">En essai</p><p className="text-2xl font-bold text-brand-600">{loading ? '…' : trial}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Suspendues</p><p className="text-2xl font-bold text-red-600">{loading ? '…' : suspended}</p></Card>
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher une boutique..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">{tenants.length === 0 ? 'Aucune boutique inscrite pour l\'instant.' : 'Aucun résultat pour cette recherche.'}</p>
        ) : (
          <Table headers={['Boutique', 'Plan', 'Pays', 'Créée le', 'Statut', '']}>
            {filtered.map(s => {
              const c = GLOBAL_COUNTRIES.find(g => g.code === s.country);
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 px-4"><Badge color={s.plan === 'enterprise' ? 'gray' : s.plan === 'premium' ? 'brand' : 'blue'}>{s.plan}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{c ? `${c.flag} ${c.code}` : s.country || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4"><Badge color={s.status === 'active' ? 'green' : s.status === 'trial' ? 'brand' : 'red'}>{s.status === 'active' ? 'Active' : s.status === 'trial' ? 'Essai' : 'Suspendue'}</Badge></td>
                  <td className="py-3 px-4">
                    {s.slug ? (
                      <a href={`/s/${s.slug}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-sm flex items-center gap-1"><Eye size={14} /> Voir</a>
                    ) : (
                      <span className="text-gray-300 text-sm flex items-center gap-1" title="Pas encore de slug public"><Eye size={14} /> —</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}

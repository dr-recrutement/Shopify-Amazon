import { PageHeader, Card, Badge, Button, Table, EmptyState } from '../dashboard/ui';
import { AlertTriangle, Download, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useCallback } from 'react';

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    setLogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(l => (l.action || '').toLowerCase().includes(q.toLowerCase()) || (l.actor_id || '').toLowerCase().includes(q.toLowerCase()));

  const exportLogs = () => {
    const csv = 'Action,Cible,Type,Métadonnées,Date\n' + logs.map(l => `"${l.action}","${l.target_type || ''}","${l.target_id || ''}","${JSON.stringify(l.metadata || {})}","${new Date(l.created_at).toLocaleString('fr-FR')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Audit & Logs" subtitle="Traçabilité de toutes les actions — données réelles." action={<Button variant="secondary" onClick={exportLogs}><Download size={16} /> Exporter</Button>} />
      <Card className="mb-6 p-4 flex items-start gap-3 bg-gradient-to-r from-orange-50 to-white">
        <AlertTriangle className="text-orange-600 mt-0.5" size={20} />
        <div className="text-sm text-gray-700">
          <p className="font-medium">Toutes les actions sont tracées nominativement</p>
          <p className="text-xs text-gray-500 mt-0.5">Chaque action est horodatée et attribuée à un admin. Les logs ne peuvent pas être supprimés.</p>
        </div>
      </Card>
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Aucun log" desc="Les actions apparaîtront ici." />
        ) : (
          <Table headers={['Action', 'Cible', 'Type', 'Date']}>
            {filtered.map(l => (
              <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900 text-sm">{l.action}</td>
                <td className="py-3 px-4 text-gray-500 text-sm">{l.target_type || '—'}</td>
                <td className="py-3 px-4"><Badge color="gray">{l.target_id ? l.target_id.slice(0, 8) : '—'}</Badge></td>
                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

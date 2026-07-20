import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { AlertTriangle, Download, Search } from 'lucide-react';
import { useState } from 'react';

export default function AdminAudit() {
  const [q, setQ] = useState('');
  const logs = [
    { id: 1, admin: 'admin@liafrik.com', action: 'Suspendu boutique Cairo Electronics', target: 'Cairo Electronics', ip: '41.202.x.x', date: '19 Jul 14:32', severity: 'high' },
    { id: 2, admin: 'admin@liafrik.com', action: 'Modéré signalement RPT-003', target: 'Boutique Aïcha', ip: '41.202.x.x', date: '18 Jul 18:22', severity: 'medium' },
    { id: 3, admin: 'super2@liafrik.com', action: 'Promu super admin', target: 'super3@liafrik.com', ip: '154.112.x.x', date: '20 Feb 2026', severity: 'critical' },
    { id: 4, admin: 'admin@liafrik.com', action: 'Exporté rapport financier', target: 'Rapport SaaS', ip: '41.202.x.x', date: '19 Jul 10:00', severity: 'low' },
    { id: 5, admin: 'super2@liafrik.com', action: 'Modifié configuration plateforme', target: 'Settings', ip: '154.112.x.x', date: '15 Jul 2026', severity: 'medium' },
  ];
  const filtered = logs.filter(l => l.action.toLowerCase().includes(q.toLowerCase()) || l.admin.toLowerCase().includes(q.toLowerCase()));

  const exportLogs = () => {
    const csv = 'ID,Admin,Action,Cible,IP,Date,Severité\n' + logs.map(l => `${l.id},${l.admin},${l.action},${l.target},${l.ip},${l.date},${l.severity}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Audit & Logs" subtitle="Traçabilité de toutes les actions Super Admin." action={<Button variant="secondary" onClick={exportLogs}><Download size={16} /> Exporter</Button>} />
      <Card className="mb-6 p-4 flex items-start gap-3 bg-gradient-to-r from-orange-50 to-white">
        <AlertTriangle className="text-orange-600 mt-0.5" size={20} />
        <div className="text-sm text-gray-700">
          <p className="font-medium">Toutes les actions Super Admin sont tracées nominativement</p>
          <p className="text-xs text-gray-500 mt-0.5">Chaque action est horodatée, attribuée à un admin et enregistrée avec son IP. Les logs ne peuvent pas être supprimés.</p>
        </div>
      </Card>
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher dans les logs..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        <Table headers={['Admin', 'Action', 'Cible', 'IP', 'Date', 'Sévérité']}>
          {filtered.map(l => (
            <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900 text-sm">{l.admin}</td>
              <td className="py-3 px-4 text-gray-700 text-sm">{l.action}</td>
              <td className="py-3 px-4 text-gray-500 text-sm">{l.target}</td>
              <td className="py-3 px-4 text-gray-400 text-xs font-mono">{l.ip}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{l.date}</td>
              <td className="py-3 px-4"><Badge color={l.severity === 'critical' ? 'red' : l.severity === 'high' ? 'orange' : l.severity === 'medium' ? 'blue' : 'gray'}>{l.severity === 'critical' ? 'Critique' : l.severity === 'high' ? 'Haute' : l.severity === 'medium' ? 'Moyenne' : 'Basse'}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

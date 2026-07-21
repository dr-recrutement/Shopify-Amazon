import { PageHeader, Card, Button, Badge, Table, EmptyState } from '../dashboard/ui';
import { Tag, Plus, X, Trash2, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useCallback } from 'react';

export default function AdminCommercialCodes() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', agentName: '', agentEmail: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('commercial_codes').select('*').order('created_at', { ascending: false });
    setCodes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.code || !form.agentName) return;
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error: e } = await supabase.from('commercial_codes').insert({
      code: form.code.toUpperCase(), agent_name: form.agentName, agent_email: form.agentEmail || null,
      assigned_by: user?.id || null, is_active: true,
    });
    if (e) { setError(e.message); return; }
    setShowForm(false); setForm({ code: '', agentName: '', agentEmail: '' }); load();
  };

  const toggle = async (c: any) => {
    await supabase.from('commercial_codes').update({ is_active: !c.is_active }).eq('id', c.id); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce code ?')) return;
    await supabase.from('commercial_codes').delete().eq('id', id); load();
  };

  const exportCsv = () => {
    const csv = 'Code,Agent,Email,Ventes,Commissions,Statut\n' + codes.map(c => `${c.code},${c.agent_name},${c.agent_email || ''},${(c.total_sales_cents / 100).toLocaleString('fr-FR')},${(c.total_commissions_cents / 100).toLocaleString('fr-FR')},${c.is_active ? 'Actif' : 'Inactif'}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'codes-commerciaux.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Codes commerciaux" subtitle="Suivi des ventes par agent commercial — données réelles." action={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCsv}><Download size={16} /> Exporter</Button>
          <Button onClick={() => setShowForm(true)}><Plus size={16} /> Nouveau code</Button>
        </div>
      } />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4"><Tag size={18} className="text-orange-600 mb-2" /><p className="text-xs text-gray-500 uppercase">Codes actifs</p><p className="text-2xl font-semibold">{codes.filter(c => c.is_active).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Ventes totales</p><p className="text-2xl font-semibold">{codes.reduce((s, c) => s + c.total_sales_cents, 0).toLocaleString('fr-FR')} XOF</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Commissions</p><p className="text-2xl font-semibold">{codes.reduce((s, c) => s + c.total_commissions_cents, 0).toLocaleString('fr-FR')} XOF</p></Card>
      </div>
      <Card>
        {codes.length === 0 ? (
          <EmptyState icon={Tag} title="Aucun code" desc="Créez des codes commerciaux pour suivre les ventes par agent." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Nouveau code</Button>} />
        ) : (
          <Table headers={['Code', 'Agent', 'Email', 'Ventes', 'Commissions', 'Statut', '']}>
            {codes.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono font-medium text-gray-900">{c.code}</td>
                <td className="py-3 px-4 text-gray-700">{c.agent_name}</td>
                <td className="py-3 px-4 text-gray-500 text-sm">{c.agent_email || '—'}</td>
                <td className="py-3 px-4 text-gray-700">{(c.total_sales_cents / 100).toLocaleString('fr-FR')} XOF</td>
                <td className="py-3 px-4 text-gray-700">{(c.total_commissions_cents / 100).toLocaleString('fr-FR')} XOF</td>
                <td className="py-3 px-4"><Badge color={c.is_active ? 'green' : 'gray'}>{c.is_active ? 'Actif' : 'Inactif'}</Badge></td>
                <td className="py-3 px-4 flex gap-2">
                  <button onClick={() => toggle(c)} className="text-xs text-gray-600 hover:underline">{c.is_active ? 'Désactiver' : 'Activer'}</button>
                  <button onClick={() => remove(c.id)} className="text-red-600 text-xs hover:underline"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-md p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Nouveau code commercial</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Code *</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="AGENT001" className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono" /></div>
              <div><label className="block text-sm font-medium mb-1">Nom de l'agent *</label><input value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })} placeholder="Jean Kouassi" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.agentEmail} onChange={e => setForm({ ...form, agentEmail: e.target.value })} placeholder="jean@exemple.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <Button onClick={create} disabled={!form.code || !form.agentName} className="w-full">Créer</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

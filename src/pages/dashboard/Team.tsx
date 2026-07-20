import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Badge, Table, EmptyState } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { UserCog, Plus, Shield, X, Trash2, AlertCircle } from 'lucide-react';

export default function Team() {
  const { tenant } = useTenant();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'staff' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('team_members').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    setMembers(data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const invite = async () => {
    if (!tenant || !form.email) return;
    setError('');
    const { error: e } = await supabase.from('team_members').insert({
      tenant_id: tenant.id, email: form.email, role: form.role, status: 'pending', invited_by: String(tenant.owner_id),
    });
    if (e) { setError(e.message); return; }
    setShowForm(false); setForm({ email: '', role: 'staff' }); load();
  };

  const updateRole = async (id: string, role: string) => {
    await supabase.from('team_members').update({ role }).eq('id', id); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Retirer ce membre ?')) return;
    await supabase.from('team_members').delete().eq('id', id); load();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Équipe" subtitle="Staff, rôles et permissions." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Inviter</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          {members.length === 0 ? (
            <EmptyState icon={UserCog} title="Aucun membre" desc="Invitez des membres d'équipe pour gérer votre boutique." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Inviter</Button>} />
          ) : (
            <Table headers={['Email', 'Rôle', 'Statut', '']}>
              {members.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{m.email}</td>
                  <td className="py-3 px-4">
                    <select value={m.role} onChange={e => updateRole(m.id, e.target.value)} className="text-sm px-2 py-1 border border-gray-200 rounded">
                      <option value="admin">Admin</option><option value="staff">Staff</option><option value="orders">Commandes</option>
                    </select>
                  </td>
                  <td className="py-3 px-4"><Badge color={m.status === 'active' ? 'green' : 'orange'}>{m.status === 'active' ? 'Actif' : 'En attente'}</Badge></td>
                  <td className="py-3 px-4"><button onClick={() => remove(m.id)} className="text-red-600 text-sm hover:underline"><Trash2 size={12} /></button></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} /> Rôles & permissions</h3>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-gray-50 rounded"><p className="font-medium">Admin</p><p className="text-xs text-gray-500">Accès complet à tous les modules</p></div>
            <div className="p-2 bg-gray-50 rounded"><p className="font-medium">Staff</p><p className="text-xs text-gray-500">Catalogue, commandes, clients</p></div>
            <div className="p-2 bg-gray-50 rounded"><p className="font-medium">Commandes</p><p className="text-xs text-gray-500">Commandes et clients uniquement</p></div>
          </div>
        </Card>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Inviter un membre</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Rôle</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="admin">Admin (accès complet)</option><option value="staff">Staff (catalogue, commandes, clients)</option><option value="orders">Commandes uniquement</option></select></div>
              <Button onClick={invite} disabled={!form.email} className="w-full">Envoyer l'invitation</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import { PageHeader, Card, Button, Badge, Table, EmptyState } from '../dashboard/ui';
import { UsersRound, Plus, X, Trash2, AlertCircle, Shield, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useCallback } from 'react';

const ALL_PERMISSIONS = [
  'dashboard:view', 'products:view', 'products:edit', 'products:delete',
  'orders:view', 'orders:edit', 'customers:view', 'customers:edit',
  'marketing:view', 'marketing:edit', 'settings:view', 'settings:edit',
  'themes:edit', 'reports:view', 'team:manage',
];

export default function AdminCustomRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [rolesRes, teamRes] = await Promise.all([
      supabase.from('custom_roles').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('*, tenants(name)').order('created_at', { ascending: false }),
    ]);
    setRoles(rolesRes.data || []);
    setTeamMembers(teamRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRole = async () => {
    if (!form.name) return;
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error: e } = await supabase.from('custom_roles').insert({
      name: form.name, description: form.description || null,
      permissions, created_by: user?.id || null,
    });
    if (e) { setError(e.message); return; }
    setShowForm(false); setForm({ name: '', description: '' }); setPermissions([]); load();
  };

  const removeRole = async (id: string) => {
    if (!confirm('Supprimer ce rôle ?')) return;
    await supabase.from('custom_roles').delete().eq('id', id); load();
  };

  const togglePermission = (perm: string) => {
    setPermissions(permissions.includes(perm) ? permissions.filter(p => p !== perm) : [...permissions, perm]);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Rôles & Staff" subtitle="Créez des rôles personnalisés et assignez-les au staff — données réelles." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Nouveau rôle</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Rôles personnalisés</h3></div>
          {roles.length === 0 ? (
            <EmptyState icon={UsersRound} title="Aucun rôle" desc="Créez des rôles avec permissions précises." />
          ) : (
            <div className="divide-y divide-gray-50">
              {roles.map(r => (
                <div key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="font-medium text-gray-900">{r.name}</p><p className="text-xs text-gray-500">{r.description || '—'}</p></div>
                    <button onClick={() => removeRole(r.id)} className="text-red-600 text-xs hover:underline"><Trash2 size={12} /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(r.permissions || []).map((p: string) => <Badge key={p} color="gray">{p}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Membres du staff ({teamMembers.length})</h3></div>
          {teamMembers.length === 0 ? (
            <EmptyState icon={Shield} title="Aucun staff" desc="Les membres d'équipe des boutiques apparaîtront ici." />
          ) : (
            <Table headers={['Email', 'Rôle', 'Boutique', 'Statut']}>
              {teamMembers.map(m => (
                <tr key={m.id} className="border-b border-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900 text-sm">{m.email}</td>
                  <td className="py-3 px-4 text-gray-700 text-sm">{m.role}</td>
                  <td className="py-3 px-4 text-gray-500 text-sm">{m.tenants?.name || '—'}</td>
                  <td className="py-3 px-4"><Badge color={m.status === 'active' ? 'green' : 'orange'}>{m.status}</Badge></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Nouveau rôle personnalisé</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Nom du rôle *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Lecteur seule" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Accès lecture seule aux commandes" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                      <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePermission(p)} className="w-3.5 h-3.5" /> {p}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={createRole} disabled={!form.name} className="w-full">Créer le rôle</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

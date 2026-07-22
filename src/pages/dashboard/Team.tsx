import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Button, Input, Modal, Badge } from './ui';
import { Plus, UserCog, Trash2 } from 'lucide-react';

interface Member { id: string; email: string; role: string; status: string; }

export default function Team() {
  const { tenant } = useTenant();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const load = () => {
    if (!tenant) return;
    supabase.from('team_members').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => { setMembers((data as Member[]) || []); setLoading(false); });
  };
  useEffect(load, [tenant]);

  const invite = async () => {
    if (!tenant || !email) return;
    await supabase.from('team_members').insert({ tenant_id: tenant.id, email, role, status: 'invited' });
    setModal(false); setEmail(''); setRole('member'); load();
  };

  const remove = async (m: Member) => { await supabase.from('team_members').delete().eq('id', m.id); load(); };

  return (
    <div>
      <PageHeader title="Team" subtitle="Manage your team members and their permissions" action={<Button onClick={() => setModal(true)}><Plus size={16} /> Invite Member</Button>} />
      <Card className="p-5">
        {loading ? <div className="text-gray-400 text-sm py-8 text-center">Loading…</div> : members.length === 0 ? (
          <div className="text-center py-12"><UserCog size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No team members yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Email</th><th className="pb-3 font-medium">Role</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{m.email}</td>
                    <td className="py-3 text-gray-600 capitalize">{m.role}</td>
                    <td className="py-3"><Badge color={m.status === 'active' ? 'green' : 'orange'}>{m.status}</Badge></td>
                    <td className="py-3"><button onClick={() => remove(m)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="colleague@example.com" />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400">
              <option value="admin">Admin</option><option value="member">Member</option><option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={invite} disabled={!email}>Send Invite</Button></div>
        </div>
      </Modal>
    </div>
  );
}

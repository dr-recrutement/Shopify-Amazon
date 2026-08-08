import { PageHeader, Card, Button, Badge, Table, EmptyState } from './ui';
import { UserCog, Plus, Shield, X, Trash2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStaff, saveStaff, type StaffMember, type StaffRole } from '../../lib/app-state';

const ROLE_LABELS: Record<StaffRole, string> = { admin: 'Admin', manager: 'Gestionnaire', staff: 'Personnel', support: 'Support' };
const ROLE_COLORS: Record<StaffRole, string> = { admin: 'brand', manager: 'green', staff: 'gray', support: 'gray' };
const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  admin: ['all'],
  manager: ['products', 'orders', 'customers', 'discounts', 'analytics'],
  staff: ['products', 'orders'],
  support: ['customers', 'chat'],
};

export default function Team() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sRole, setSRole] = useState<StaffRole>('manager');

  useEffect(() => { setStaff(getStaff()); }, []);

  const openAdd = () => { setSName(''); setSEmail(''); setSRole('manager'); setIsModalOpen(true); };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim() || !sEmail.trim()) return;
    const newMember: StaffMember = { id: `s-${Date.now()}`, name: sName, email: sEmail, role: sRole, status: 'invited', permissions: ROLE_PERMISSIONS[sRole], createdAt: new Date().toISOString().slice(0, 10) };
    const updated = [...staff, newMember];
    setStaff(updated); saveStaff(updated);
    setIsModalOpen(false);
  };

  const handleRemove = (id: string) => {
    if (confirm('Retirer ce membre de l\'équipe ?')) {
      const updated = staff.filter(s => s.id !== id);
      setStaff(updated); saveStaff(updated);
    }
  };

  const toggleRole = (id: string, role: StaffRole) => {
    const updated = staff.map(s => s.id === id ? { ...s, role, permissions: ROLE_PERMISSIONS[role] } : s);
    setStaff(updated); saveStaff(updated);
  };

  return (
    <div>
      <PageHeader title="Équipe" subtitle="Staff, rôles et permissions." action={<Button onClick={openAdd}><Plus size={16} /> Inviter</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          {staff.length === 0 ? (
            <EmptyState icon={UserCog} title="Aucun membre" desc="Invitez des membres à votre équipe." action={<Button onClick={openAdd}><Plus size={16} /> Inviter</Button>} />
          ) : (
            <Table headers={['Membre', 'Email', 'Rôle', 'Statut', 'Dernière activité', 'Actions']}>
              {staff.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{m.name}</td>
                  <td className="py-3 px-4 text-gray-500">{m.email}</td>
                  <td className="py-3 px-4">
                    <select value={m.role} onChange={e => toggleRole(m.id, e.target.value as StaffRole)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-brand-500">
                      <option value="admin">Admin</option><option value="manager">Gestionnaire</option><option value="staff">Personnel</option><option value="support">Support</option>
                    </select>
                  </td>
                  <td className="py-3 px-4"><Badge color={m.status === 'active' ? 'green' : 'gray'}>{m.status === 'active' ? 'Actif' : m.status === 'invited' ? 'Invité' : 'Suspendu'}</Badge></td>
                  <td className="py-3 px-4 text-gray-500 text-sm">{m.lastActive || '—'}</td>
                  <td className="py-3 px-4">
                    {m.role !== 'admin' && <button onClick={() => handleRemove(m.id)} className="text-red-500 text-sm hover:underline"><Trash2 size={12} /></button>}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} /> Rôles & permissions</h3>
          <p className="text-sm text-gray-500 mb-4">Chaque rôle donne accès à des modules spécifiques.</p>
          <div className="space-y-3">
            {(Object.keys(ROLE_LABELS) as StaffRole[]).map(r => (
              <div key={r} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{ROLE_LABELS[r]}</span>
                  <Badge color={ROLE_COLORS[r] as any}>{staff.filter(s => s.role === r).length}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ROLE_PERMISSIONS[r].map(p => <span key={p} className="text-[9px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500">{p}</span>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Inviter un membre</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nom complet *</label><input required value={sName} onChange={e => setSName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email *</label><input required type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Rôle</label>
                <select value={sRole} onChange={e => setSRole(e.target.value as StaffRole)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500">
                  <option value="manager">Gestionnaire (produits, commandes, clients)</option><option value="staff">Personnel (produits, commandes)</option><option value="support">Support (clients, chat)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit"><Mail size={14} /> Envoyer l'invitation</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

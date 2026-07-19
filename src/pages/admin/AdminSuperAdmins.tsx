import { PageHeader, Card, Button, Badge, Table } from '../dashboard/ui';
import { UserPlus, Crown, Mail } from 'lucide-react';
import { SUPER_ADMIN_EMAILS } from '../../lib/constants';

export default function AdminSuperAdmins() {
  const admins = SUPER_ADMIN_EMAILS.map((email, i) => ({
    email,
    promotedAt: ['01 Jan 2026', '15 Feb 2026', '20 Feb 2026'][i],
    invitedBy: i === 0 ? 'Système' : SUPER_ADMIN_EMAILS[0],
    status: 'active',
  }));
  return (
    <div>
      <PageHeader title="Super Admins" subtitle="Gestion des Super Admins — LIYAH GROUP. Privilèges identiques, sans hiérarchie." action={<Button><UserPlus size={16} /> Inviter</Button>} />
      <Card className="mb-6 p-4 flex items-start gap-3 bg-gradient-to-r from-orange-50 to-white">
        <Crown className="text-orange-600 mt-0.5" size={20} />
        <div className="text-sm text-gray-700">
          <p className="font-medium">Règles de sécurité</p>
          <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
            <li>• Tout Super Admin actif peut inviter d'autres Super Admins</li>
            <li>• Tout Super Admin peut révoquer un autre — aucun compte protégé</li>
            <li>• Toutes les actions sont tracées nominativement dans les logs d'audit</li>
          </ul>
        </div>
      </Card>
      <Card>
        <Table headers={['Email', 'Promu le', 'Invité par', 'Statut', '']}>
          {admins.map(a => (
            <tr key={a.email} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {a.email}</td>
              <td className="py-3 px-4 text-gray-500">{a.promotedAt}</td>
              <td className="py-3 px-4 text-gray-500">{a.invitedBy}</td>
              <td className="py-3 px-4"><Badge color="green">Actif</Badge></td>
              <td className="py-3 px-4"><button className="text-red-600 hover:underline text-sm">Révoquer</button></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

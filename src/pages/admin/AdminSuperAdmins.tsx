import { PageHeader, Card, Badge, Table } from '../dashboard/ui';
import { Mail, Info } from 'lucide-react';
import { SUPER_ADMIN_EMAILS } from '../../lib/constants';

export default function AdminSuperAdmins() {
  return (
    <div>
      <PageHeader title="Super Admins" subtitle="Gestion des Super Admins — LiAfrik. Privilèges identiques, sans hiérarchie." />
      <Card className="mb-6 p-4 flex items-start gap-3 bg-blue-50">
        <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="text-sm text-gray-700">
          <p className="font-medium">Comment ça marche actuellement</p>
          <p className="mt-1 text-xs text-gray-600">La liste ci-dessous est codée en dur dans <code className="bg-white px-1 rounded">src/lib/constants.ts</code> (SUPER_ADMIN_EMAILS) — c'est ce qui donne réellement les accès illimités, pas la table <code className="bg-white px-1 rounded">super_admins</code> en base. Ajouter ou retirer un super admin se fait en modifiant ce fichier puis en déployant, pas depuis cette page.</p>
        </div>
      </Card>
      <Card>
        <Table headers={['Email', 'Statut']}>
          {SUPER_ADMIN_EMAILS.map(email => (
            <tr key={email} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {email}</td>
              <td className="py-3 px-4"><Badge color="green">Actif</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

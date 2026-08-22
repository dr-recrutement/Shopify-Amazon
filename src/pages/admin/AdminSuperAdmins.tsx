import { PageHeader, Card, Button, Badge, Table } from '../dashboard/ui';
import { Mail, Info } from 'lucide-react';
import { SUPER_ADMIN_EMAILS } from '../../lib/constants';

export default function AdminSuperAdmins() {
  return (
    <div>
      <PageHeader title="Super Admins" subtitle="Gestion des Super Admins — LiAfrik. Privilèges identiques, sans hiérarchie." action={<Button disabled title="Voir la note ci-dessous">Inviter</Button>} />
      <Card className="mb-6 p-4 flex items-start gap-3 bg-blue-50">
        <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="text-sm text-gray-700">
          <p className="font-medium">Comment ça marche actuellement</p>
          <p className="mt-1 text-xs text-gray-600">La liste ci-dessous est codée en dur dans <code className="bg-white px-1 rounded">src/lib/constants.ts</code> (SUPER_ADMIN_EMAILS) — c'est ce qui donne réellement les accès illimités, pas la table <code className="bg-white px-1 rounded">super_admins</code> en base. Ajouter/retirer un super admin nécessite donc une modification du code + un déploiement, pas un clic ici. Les boutons ci-dessous sont désactivés pour ne pas laisser croire qu'un clic suffit.</p>
        </div>
      </Card>
      <Card>
        <Table headers={['Email', 'Statut', '']}>
          {SUPER_ADMIN_EMAILS.map(email => (
            <tr key={email} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {email}</td>
              <td className="py-3 px-4"><Badge color="green">Actif</Badge></td>
              <td className="py-3 px-4"><button disabled title="Modifier SUPER_ADMIN_EMAILS dans le code" className="text-gray-300 cursor-not-allowed text-sm">Révoquer</button></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

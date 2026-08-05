import { PageHeader, Card, Button, Badge, Table, LockedFeature } from '../dashboard/ui';
import { Palette, Plus, Upload, Eye, Star } from 'lucide-react';

export default function AdminThemes() {
  const themes = [
    { name: 'Template Universel', category: 'Universel', stores: 8421, status: 'published', universal: true },
    { name: 'Mode & Lifestyle', category: 'Mode', stores: 1240, status: 'published' },
    { name: 'High-Tech Store', category: 'High-tech', stores: 892, status: 'published' },
    { name: 'Resto Pro', category: 'Restauration', stores: 654, status: 'published' },
    { name: 'Artisanat', category: 'Artisanat', stores: 421, status: 'draft' },
  ];
  return (
    <div>
      <PageHeader title="Thèmes" subtitle="Bibliothèque globale de thèmes — gestion Super Admin." action={<Button><Upload size={16} /> Uploader un thème</Button>} />
      <Card className="mb-6 p-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-center gap-3">
          <Star className="text-orange-600" size={20} />
          <div>
            <p className="text-sm font-medium text-gray-900">Tous les thèmes sont gratuits en V1</p>
            <p className="text-xs text-gray-500">Champ "premium" prévu pour évolution future.</p>
          </div>
        </div>
      </Card>
      <Card>
        <Table headers={['Thème', 'Catégorie', 'Boutiques utilisatrices', 'Statut', '']}>
          {themes.map(t => (
            <tr key={t.name} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                {t.universal && <Star size={14} className="text-orange-500" />}
                {t.name}
                {t.universal && <Badge color="orange">Universel</Badge>}
              </td>
              <td className="py-3 px-4 text-gray-500">{t.category}</td>
              <td className="py-3 px-4 text-gray-700">{t.stores.toLocaleString()}</td>
              <td className="py-3 px-4"><Badge color={t.status === 'published' ? 'green' : 'gray'}>{t.status === 'published' ? 'Publié' : 'Brouillon'}</Badge></td>
              <td className="py-3 px-4 flex gap-2">
                <button className="text-orange-600 hover:underline text-sm flex items-center gap-1"><Eye size={14} /> Aperçu</button>
                <button className="text-gray-600 hover:underline text-sm">Éditer</button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Sources acceptées</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Thèmes WordPress (convertis au format Os)</li>
          <li>• Thèmes Shopify (dans le respect des licences)</li>
          <li>• Thèmes conçus directement dans l'éditeur Os</li>
        </ul>
      </Card>
      <LockedFeature title="Accès éditeur visuel via impersonation" desc="Super Admin peut éditer visuellement n'importe quelle boutique via impersonation sécurisée et tracée." plan="Super Admin" />
    </div>
  );
}

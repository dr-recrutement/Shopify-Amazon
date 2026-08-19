import { PageHeader, Card, Button, Badge, Table, LockedFeature } from '../dashboard/ui';
import { Upload, Eye, Star, Check } from 'lucide-react';

// Official Shopify Theme Store catalog — all free Shopify themes are built on
// the Dawn (Online Store 2.0) codebase and share the same sections/blocks.
export default function AdminThemes() {
  const themes = [
    { name: 'Dawn', category: 'Référence OS 2.0', stores: 268000, status: 'published', universal: true, industry: 'Polyvalent', free: true },
    { name: 'Refresh', category: 'Dawn-based', stores: 41200, status: 'published', industry: 'Petits catalogues', free: true },
    { name: 'Spotlight', category: 'Dawn-based', stores: 28900, status: 'published', industry: 'Mise en avant produit', free: true },
    { name: 'Sense', category: 'Dawn-based', stores: 18750, status: 'published', industry: 'Beauté & bien-être', free: true },
    { name: 'Taste', category: 'Dawn-based', stores: 14200, status: 'published', industry: 'Spécialités alimentaires', free: true },
    { name: 'Craft', category: 'Dawn-based', stores: 11600, status: 'published', industry: 'Artisanat & fait main', free: true },
    { name: 'Colorblock', category: 'Dawn-based', stores: 21300, status: 'published', industry: 'Mode & prêt-à-porter', free: true },
    { name: 'Crave', category: 'Dawn-based', stores: 19800, status: 'published', industry: 'Alimentaire & boissons', free: true },
    { name: 'Studio', category: 'Dawn-based', stores: 9400, status: 'published', industry: 'Design & créatif', free: true },
    { name: 'Origin', category: 'Dawn-based', stores: 8100, status: 'published', industry: 'Éco-responsable', free: true },
    { name: 'Publisher', category: 'Dawn-based', stores: 6700, status: 'published', industry: 'Éditorial & contenu', free: true },
    { name: 'Trade', category: 'Dawn-based', stores: 7300, status: 'published', industry: 'B2B & wholesale', free: true },
    { name: 'Ride', category: 'Dawn-based', stores: 5200, status: 'published', industry: 'Sport & outdoor', free: true },
    { name: 'Dawn — African Vibrant', category: 'Variante panafricaine', stores: 1240, status: 'published', industry: 'Commerce panafricain', free: true },
  ];
  return (
    <div>
      <PageHeader title="Thèmes" subtitle="Bibliothèque de thèmes — Shopify Theme Store (Online Store 2.0) — gestion Super Admin." action={<Button><Upload size={16} /> Uploader un thème</Button>} />
      <Card className="mb-6 p-4 flex items-center justify-between bg-gradient-to-r from-brand-50 to-white">
        <div className="flex items-center gap-3">
          <Star className="text-brand-600" size={20} />
          <div>
            <p className="text-sm font-medium text-gray-900">Tous les thèmes sont basés sur Dawn (Shopify OS 2.0)</p>
            <p className="text-xs text-gray-500">Même codebase, sections et blocs — chaque thème est un preset de couleurs & typographie.</p>
          </div>
        </div>
        <Badge color="green">14 thèmes · 100% Shopify</Badge>
      </Card>
      <Card>
        <Table headers={['Thème', 'Industrie', 'Boutiques utilisatrices', 'Statut', '']}>
          {themes.map(t => (
            <tr key={t.name} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                {t.universal && <Star size={14} className="text-brand-500" />}
                {t.name}
                {t.universal && <Badge color="orange">Référence</Badge>}
              </td>
              <td className="py-3 px-4 text-gray-700">{t.industry}</td>
              <td className="py-3 px-4 text-gray-700">{t.stores.toLocaleString()}</td>
              <td className="py-3 px-4"><Badge color={t.status === 'published' ? 'green' : 'gray'}>{t.status === 'published' ? 'Publié' : 'Brouillon'}</Badge></td>
              <td className="py-3 px-4 flex gap-2">
                <button className="text-brand-600 hover:underline text-sm flex items-center gap-1"><Eye size={14} /> Aperçu</button>
                <button className="text-gray-600 hover:underline text-sm">Éditer</button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Architecture Online Store 2.0</h3>
        <ul className="text-sm text-gray-600 space-y-1.5">
          <li className="flex items-start gap-2"><Check size={14} className="text-green-600 mt-0.5 shrink-0" /> Templates JSON (index.json, product.json, collection.json, cart.json, blog.json, list-collections.json)</li>
          <li className="flex items-start gap-2"><Check size={14} className="text-green-600 mt-0.5 shrink-0" /> Sections partout — ajout, réordonnancement et suppression sans code</li>
          <li className="flex items-start gap-2"><Check size={14} className="text-green-600 mt-0.5 shrink-0" /> Blocs répétables et réordonnables dans chaque section</li>
          <li className="flex items-start gap-2"><Check size={14} className="text-green-600 mt-0.5 shrink-0" /> App blocks (theme app extensions) pour les intégrations tierces</li>
          <li className="flex items-start gap-2"><Check size={14} className="text-green-600 mt-0.5 shrink-0" /> Metafields & dynamic sources pour lier contenu aux produits</li>
          <li className="flex items-start gap-2"><Check size={14} className="text-green-600 mt-0.5 shrink-0" /> Thèmes convertibles depuis Shopify (respect des licences) et WordPress</li>
        </ul>
      </Card>
      <LockedFeature title="Accès éditeur visuel via impersonation" desc="Super Admin peut éditer visuellement n'importe quelle boutique via impersonation sécurisée et tracée." plan="Super Admin" />
    </div>
  );
}

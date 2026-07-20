import { PageHeader, Card, Button, Badge } from '../dashboard/ui';
import { FileText, Edit, Plus, Globe } from 'lucide-react';

export default function AdminContent() {
  const pages = [
    { name: 'Page d\'accueil', slug: '/', status: 'published', updated: '19 Jul 2026' },
    { name: 'Fonctionnalités', slug: '/features', status: 'published', updated: '19 Jul 2026' },
    { name: 'Tarifs', slug: '/pricing', status: 'published', updated: '18 Jul 2026' },
    { name: 'À propos', slug: '/about', status: 'published', updated: '19 Jul 2026' },
    { name: 'Blog', slug: '/blog', status: 'published', updated: '15 Jul 2026' },
    { name: 'Académie vendeur', slug: '/academy', status: 'published', updated: '12 Jul 2026' },
    { name: 'Centre d\'aide', slug: '/help', status: 'published', updated: '10 Jul 2026' },
    { name: 'Contact', slug: '/contact', status: 'published', updated: '19 Jul 2026' },
    { name: 'CGU', slug: '/legal/terms', status: 'published', updated: '19 Jul 2026' },
    { name: 'Confidentialité', slug: '/legal/privacy', status: 'published', updated: '19 Jul 2026' },
    { name: 'Mentions légales', slug: '/legal/legal', status: 'published', updated: '19 Jul 2026' },
  ];
  return (
    <div>
      <PageHeader title="CMS Plateforme" subtitle="Gestion du contenu des pages institutionnelles." action={<Button><Plus size={16} /> Nouvelle page</Button>} />
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Pages institutionnelles</h3>
          <span className="text-xs text-gray-500">{pages.length} pages</span>
        </div>
        <div className="divide-y divide-gray-50">
          {pages.map(p => (
            <div key={p.slug} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Globe size={10} /> {p.slug}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{p.updated}</span>
                <Badge color={p.status === 'published' ? 'green' : 'orange'}>{p.status === 'published' ? 'Publiée' : 'Brouillon'}</Badge>
                <button className="text-orange-600 hover:underline text-sm flex items-center gap-1"><Edit size={12} /> Éditer</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

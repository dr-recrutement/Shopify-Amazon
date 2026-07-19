import { PageHeader, Card, Button, EmptyState } from './ui';
import { FileText, Plus, Layout } from 'lucide-react';

export default function Content() {
  const pages = [
    { title: 'À propos', slug: 'about', status: 'published' },
    { title: 'Contact', slug: 'contact', status: 'published' },
    { title: 'FAQ', slug: 'faq', status: 'draft' },
  ];
  return (
    <div>
      <PageHeader title="Content" subtitle="Pages personnalisées et blocs de contenu de votre boutique." action={<Button><Plus size={16} /> Nouvelle page</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Pages</h3></div>
          {pages.length === 0 ? (
            <EmptyState icon={FileText} title="Aucune page" desc="Créez des pages personnalisées pour votre boutique." />
          ) : (
            <div className="divide-y divide-gray-50">
              {pages.map(p => (
                <div key={p.slug} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{p.title}</div>
                    <div className="text-xs text-gray-500">/{p.slug}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status === 'published' ? 'Publiée' : 'Brouillon'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Metaobjects</h3>
          <p className="text-sm text-gray-500 mb-4">Créez des types de contenu personnalisés (témoignages, partenaires, carrousel).</p>
          <Button variant="secondary" size="sm" className="w-full"><Layout size={14} /> Créer un metaobject</Button>
        </Card>
      </div>
    </div>
  );
}

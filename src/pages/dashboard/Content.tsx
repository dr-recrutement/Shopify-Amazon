import { PageHeader, Card, Button, EmptyState } from './ui';
import { FileText, Plus, Layout, Edit3, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createCmsPage, getCmsPages, saveCmsPage, type CmsPage } from '../../lib/cms';

export default function Content() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CmsPage | null>(null);

  useEffect(() => {
    const initial = getCmsPages();
    setPages(initial);
    setSelectedPageId(initial[0]?.id ?? null);
    setDraft(initial[0] ?? null);
  }, []);

  const createPage = () => {
    const newPage = createCmsPage();
    const next = saveCmsPage(newPage);
    setPages(next);
    setSelectedPageId(newPage.id);
    setDraft(newPage);
  };

  const savePage = () => {
    if (!draft) return;
    const next = saveCmsPage(draft);
    setPages(next);
  };

  const selectPage = (page: CmsPage) => {
    setSelectedPageId(page.id);
    setDraft(page);
  };

  return (
    <div>
      <PageHeader title="Content" subtitle="CMS interne pro — pages, contenus, blocs, templates éditables." action={<Button onClick={createPage}><Plus size={16} /> Nouvelle page</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Pages</h3></div>
          {pages.length === 0 ? (
            <EmptyState icon={FileText} title="Aucune page" desc="Créez des pages personnalisées pour votre boutique." />
          ) : (
            <div className="divide-y divide-gray-50">
              {pages.map(p => (
                <button key={p.id} onClick={() => selectPage(p)} className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 ${selectedPageId === p.id ? 'bg-orange-50' : ''}`}>
                  <div>
                    <div className="font-medium text-gray-900">{p.title}</div>
                    <div className="text-xs text-gray-500">/{p.slug}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status === 'published' ? 'Publiée' : 'Brouillon'}</span>
                </button>
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

      {draft && (
        <Card className="mt-6 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Éditeur de page</h3>
              <p className="text-sm text-gray-500">Modifiez le titre, le slug, le statut et les blocs de contenu.</p>
            </div>
            <Button onClick={savePage}><Save size={14} /> Enregistrer</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
              <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
              <input value={draft.slug} onChange={e => setDraft({ ...draft, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Template</label>
              <select value={draft.template} onChange={e => setDraft({ ...draft, template: e.target.value as CmsPage['template'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {['landing', 'about', 'contact', 'faq', 'custom'].map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
              <select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as CmsPage['status'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-900">Blocs</h4>
            {draft.sections.map((section, index) => (
              <div key={section.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{section.title}</div>
                    <div className="text-xs text-gray-500">{section.type}</div>
                  </div>
                  <button onClick={() => {
                    const nextSections = draft.sections.filter(item => item.id !== section.id);
                    setDraft({ ...draft, sections: nextSections });
                  }} className="text-xs text-gray-500 hover:text-red-600">Supprimer</button>
                </div>
                <textarea value={section.content} onChange={e => {
                  const nextSections = draft.sections.map(item => item.id === section.id ? { ...item, content: e.target.value } : item);
                  setDraft({ ...draft, sections: nextSections });
                }} rows={3} className="mt-3 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            ))}
            <button onClick={() => {
              setDraft({
                ...draft,
                sections: [...draft.sections, { id: `block-${Date.now()}`, type: 'text', title: 'Nouveau bloc', content: 'Contenu du bloc' }],
              });
            }} className="flex items-center gap-2 text-sm text-orange-600 font-medium"><Edit3 size={14} /> Ajouter un bloc</button>
          </div>
        </Card>
      )}
    </div>
  );
}

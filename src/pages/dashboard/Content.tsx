import { PageHeader, Card, Button, EmptyState, Badge } from './ui';
import { FileText, Plus, Layout, Edit3, Save, Sparkles, Eye, Globe2, GripVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { createCmsPage, getCmsPages, saveCmsPage, type CmsPage } from '../../lib/cms';
import { SHOPIFY_TEMPLATES, SHOPIFY_BLOCK_TYPES } from '../../lib/cms';

export default function Content() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CmsPage | null>(null);
  // Drag-and-drop state for CMS blocks
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

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
      <PageHeader title="Content" subtitle="CMS Shopify Online Store 2.0 — templates JSON, sections, blocs réordonnables et metaobjects." action={<Button onClick={createPage}><Plus size={16} /> Nouvelle page</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">Pages</h3>
                <p className="text-xs text-gray-500">Structurez votre contenu comme une vraie plateforme éditoriale.</p>
              </div>
              <div className="flex items-center gap-2 text-brand-600 text-xs font-medium"><Sparkles size={14} /> Pro</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
              <div className="relative">
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Rechercher une page" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⌕</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <span>{pages.length} pages</span>
                <Badge color="green">{pages.filter(p => p.status === 'published').length} publiées</Badge>
              </div>
            </div>
          </div>
          {pages.length === 0 ? (
            <EmptyState icon={FileText} title="Aucune page" desc="Créez des pages personnalisées pour votre boutique." />
          ) : (
            <div className="divide-y divide-gray-50">
              {pages.map(p => (
                <button key={p.id} onClick={() => selectPage(p)} className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 ${selectedPageId === p.id ? 'bg-brand-50' : ''}`}>
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
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Globe2 size={14} /> Metaobjects</h3>
          <p className="text-sm text-gray-500 mb-4">Créez des types de contenu personnalisés (témoignages, partenaires, carrousel, collections).</p>
          <Button variant="secondary" size="sm" className="w-full"><Layout size={14} /> Créer un metaobject</Button>
        </Card>
      </div>

      {draft && (
        <Card className="mt-6 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Éditeur de page</h3>
              <p className="text-sm text-gray-500">Modifiez le titre, le slug, le statut, le template et les blocs de contenu.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge color={draft?.status === 'published' ? 'green' : 'brand'}>{draft?.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
              <span className="text-xs text-gray-500">Mis à jour le {draft?.updatedAt}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={14} /> {draft?.template === 'custom' ? 'Template Libre' : `Template ${draft?.template}`}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm"><Eye size={14} /> Prévisualiser</Button>
              <Button onClick={savePage}><Save size={14} /> Enregistrer</Button>
            </div>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Template (JSON Shopify)</label>
              <select value={draft.template} onChange={e => setDraft({ ...draft, template: e.target.value as CmsPage['template'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {SHOPIFY_TEMPLATES.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">{SHOPIFY_TEMPLATES.find(t => t.id === draft.template)?.desc}</p>
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
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Blocs</h4>
              <span className="text-xs text-gray-500">{draft.sections.length} blocs</span>
            </div>
            <p className="text-[10px] text-gray-400 flex items-center gap-1"><GripVertical size={11} /> Glissez les blocs pour réordonner (drag & drop)</p>
            {draft.sections.map((section, index) => {
              const isDragging = draggedBlockId === section.id;
              const isDragOver = dragOverBlockId === section.id && draggedBlockId !== section.id;
              return (
              <div
                key={section.id}
                draggable
                onDragStart={() => setDraggedBlockId(section.id)}
                onDragOver={(e) => { e.preventDefault(); if (section.id !== dragOverBlockId) setDragOverBlockId(section.id); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedBlockId || draggedBlockId === section.id) { setDraggedBlockId(null); setDragOverBlockId(null); return; }
                  const from = draft.sections.findIndex(s => s.id === draggedBlockId);
                  const to = draft.sections.findIndex(s => s.id === section.id);
                  if (from === -1 || to === -1) { setDraggedBlockId(null); setDragOverBlockId(null); return; }
                  const next = [...draft.sections];
                  const [moved] = next.splice(from, 1);
                  next.splice(to, 0, moved);
                  setDraft({ ...draft, sections: next });
                  setDraggedBlockId(null); setDragOverBlockId(null);
                }}
                onDragEnd={() => { setDraggedBlockId(null); setDragOverBlockId(null); }}
                className={`border rounded-lg p-3 transition-all ${isDragging ? 'opacity-40' : 'border-gray-100'} ${isDragOver ? 'border-brand-500 ring-2 ring-brand-200' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical size={14} className="text-gray-400 cursor-grab active:cursor-grabbing" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{section.title}</div>
                      <div className="text-xs text-gray-500">{section.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => {
                      if (index === 0) return;
                      const next = [...draft.sections];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      setDraft({ ...draft, sections: next });
                    }} disabled={index === 0} className="p-1 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded disabled:opacity-30" title="Monter">
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => {
                      if (index === draft.sections.length - 1) return;
                      const next = [...draft.sections];
                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                      setDraft({ ...draft, sections: next });
                    }} disabled={index === draft.sections.length - 1} className="p-1 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded disabled:opacity-30" title="Descendre">
                      <ArrowDown size={13} />
                    </button>
                    <button onClick={() => {
                      const nextSections = draft.sections.filter(item => item.id !== section.id);
                      setDraft({ ...draft, sections: nextSections });
                    }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_180px]">
                  <textarea value={section.content} onChange={e => {
                    const nextSections = draft.sections.map(item => item.id === section.id ? { ...item, content: e.target.value } : item);
                    setDraft({ ...draft, sections: nextSections });
                  }} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-200 focus:outline-none" />
                  <div className="space-y-2">
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" defaultValue={section.type}>
                      {SHOPIFY_BLOCK_TYPES.map(bt => <option key={bt.type} value={bt.type}>{bt.label}</option>)}
                    </select>
                    <input value={section.title} onChange={e => {
                      const nextSections = draft.sections.map(item => item.id === section.id ? { ...item, title: e.target.value } : item);
                      setDraft({ ...draft, sections: nextSections });
                    }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-200 focus:outline-none" />
                  </div>
                </div>
              </div>
              );
            })}
            <button onClick={() => {
              setDraft({
                ...draft,
                sections: [...draft.sections, { id: `block-${Date.now()}`, type: 'text', title: 'Nouveau bloc', content: 'Contenu du bloc' }],
              });
            }} className="flex items-center gap-2 text-sm text-brand-600 font-medium"><Edit3 size={14} /> Ajouter un bloc</button>
          </div>

          <Card className="mt-5 border border-gray-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Aperçu de la page</p>
                <h4 className="mt-2 text-lg font-semibold text-gray-900">{draft.title}</h4>
                <p className="text-sm text-gray-600">/{draft.slug} · {draft.sections.length} blocs</p>
              </div>
              <Badge color="blue">{draft.template}</Badge>
            </div>
          </Card>
        </Card>
      )}
    </div>
  );
}

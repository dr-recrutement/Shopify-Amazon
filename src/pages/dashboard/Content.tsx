import { PageHeader, Card, Button, EmptyState, Badge } from './ui';
import {
  FileText, Plus, Layout, Edit3, Save, Sparkles, Eye, Globe2, GripVertical, Trash2,
  ChevronDown, ChevronRight, Settings as SettingsIcon, MousePointerClick, PanelLeft,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createCmsPage, getCmsPages, saveCmsPage, type CmsPage, type CmsBlockType,
  SHOPIFY_TEMPLATES, SHOPIFY_BLOCK_TYPES, SECTION_PALETTE,
  addOsSection, removeOsSection, reorderOsSections, updateOsSectionSettings,
  addOsBlock, removeBlock, updateOsBlockSettings, reorderOsBlocks,
} from '../../lib/cms';

export default function Content() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CmsPage | null>(null);
  // Selection in the theme editor tree: either a section or a block.
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Expanded sections in the tree view.
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  // Show the "add section" palette.
  const [showSectionPalette, setShowSectionPalette] = useState(false);
  // Drag-and-drop state.
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [dragOverSectionIdx, setDragOverSectionIdx] = useState<number | null>(null);

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
    setSelectedNodeId(null);
  };

  const savePage = () => {
    if (!draft) return;
    const next = saveCmsPage(draft);
    setPages(next);
  };

  const selectPage = (page: CmsPage) => {
    setSelectedPageId(page.id);
    setDraft(page);
    setSelectedNodeId(null);
  };

  const osSections = draft?.osSections || [];
  const selectedSection = osSections.find(s => s.id === selectedNodeId);
  const selectedBlock = selectedSection?.blocks.find(b => b.id === selectedNodeId);

  const toggleExpand = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSection = (type: string) => {
    if (!draft) return;
    const updated = addOsSection(draft, type);
    setDraft(updated);
    setShowSectionPalette(false);
    setSelectedNodeId(updated.osSections![updated.osSections!.length - 1].id);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!draft) return;
    setDraft(removeOsSection(draft, sectionId));
    if (selectedNodeId === sectionId) setSelectedNodeId(null);
  };

  const handleSectionDrop = (targetIdx: number) => {
    if (draft === null || draggedSectionIdx === null || draggedSectionIdx === targetIdx) {
      setDraggedSectionIdx(null); setDragOverSectionIdx(null); return;
    }
    setDraft(reorderOsSections(draft, draggedSectionIdx, targetIdx));
    setDraggedSectionIdx(null); setDragOverSectionIdx(null);
  };

  const handleAddBlock = (sectionId: string, type: CmsBlockType) => {
    if (!draft) return;
    setDraft(addOsBlock(draft, sectionId, type));
    setExpandedSections(prev => new Set(prev).add(sectionId));
  };

  const handleRemoveBlock = (sectionId: string, blockId: string) => {
    if (!draft) return;
    setDraft(removeBlock(draft, sectionId, blockId));
    if (selectedNodeId === blockId) setSelectedNodeId(null);
  };

  return (
    <div>
      <PageHeader title="Content" subtitle="CMS Shopify Online Store 2.0 — éditeur de thème drag-and-drop, sections et blocs réordonnables." action={<Button onClick={createPage}><Plus size={16} /> Nouvelle page</Button>} />

      {/* Page list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">Pages</h3>
                <p className="text-xs text-gray-500">Sélectionnez une page pour ouvrir l'éditeur de thème.</p>
              </div>
              <div className="flex items-center gap-2 text-brand-600 text-xs font-medium"><Sparkles size={14} /> Online Store 2.0</div>
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
                    <div className="text-xs text-gray-500">/{p.slug} · {(p.osSections || []).length} sections</div>
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

      {/* Theme editor — 3-pane Shopify-style layout */}
      {draft && (
        <Card className="p-0 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <PanelLeft size={16} className="text-brand-600" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Éditeur de thème — {draft.title}</h3>
                <p className="text-xs text-gray-500">Arborescence · Canvas · Réglages — glissez pour réordonner</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={draft.template} onChange={e => setDraft({ ...draft, template: e.target.value as CmsPage['template'] })} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
                {SHOPIFY_TEMPLATES.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <Badge color={draft.status === 'published' ? 'green' : 'brand'}>{draft.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
              <Button variant="secondary" size="sm"><Eye size={14} /> Aperçu</Button>
              <Button onClick={savePage} size="sm"><Save size={14} /> Enregistrer</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] min-h-[480px]">
            {/* LEFT — Tree view sidebar */}
            <div className="border-r border-gray-100 bg-white p-3 overflow-y-auto max-h-[600px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Sections</span>
                <span className="text-[10px] text-gray-400">{osSections.length}</span>
              </div>

              {/* Section tree */}
              <div className="space-y-0.5">
                {osSections.map((sec, idx) => {
                  const isSelected = selectedNodeId === sec.id;
                  const isExpanded = expandedSections.has(sec.id);
                  const isDragOver = dragOverSectionIdx === idx && draggedSectionIdx !== idx;
                  const palette = SECTION_PALETTE.find(p => p.type === sec.type);
                  return (
                    <div key={sec.id}>
                      <div
                        draggable
                        onDragStart={() => setDraggedSectionIdx(idx)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverSectionIdx(idx); }}
                        onDrop={() => handleSectionDrop(idx)}
                        onDragEnd={() => { setDraggedSectionIdx(null); setDragOverSectionIdx(null); }}
                        onClick={() => { setSelectedNodeId(sec.id); if (!isExpanded) toggleExpand(sec.id); }}
                        className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${isSelected ? 'bg-brand-50 text-brand-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'} ${draggedSectionIdx === idx ? 'opacity-40' : ''} ${isDragOver ? 'ring-2 ring-brand-300' : ''}`}
                      >
                        <GripVertical size={12} className="text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0" />
                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(sec.id); }} className="flex-shrink-0">
                          {isExpanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                        </button>
                        <span className="text-sm flex-shrink-0">{palette?.icon || '📦'}</span>
                        <span className="truncate flex-1">{sec.settings?.title || palette?.label || sec.type}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveSection(sec.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 flex-shrink-0">
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* Blocks under section */}
                      {isExpanded && (
                        <div className="ml-7 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                          {sec.blocks.map((blk, bIdx) => {
                            const isBlkSelected = selectedNodeId === blk.id;
                            const blkLabel = SHOPIFY_BLOCK_TYPES.find(b => b.type === blk.type)?.label || blk.type;
                            return (
                              <div
                                key={blk.id}
                                onClick={() => setSelectedNodeId(blk.id)}
                                className={`group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-[11px] transition-colors ${isBlkSelected ? 'bg-brand-50 text-brand-700 font-semibold' : 'hover:bg-gray-50 text-gray-500'}`}
                              >
                                <GripVertical size={10} className="text-gray-300 flex-shrink-0" />
                                <span className="truncate flex-1">{blkLabel}: {blk.settings?.text || blk.settings?.heading || '—'}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveBlock(sec.id, blk.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 flex-shrink-0">
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            );
                          })}
                          {/* Add block dropdown */}
                          <div className="py-1">
                            <select
                              value=""
                              onChange={e => { if (e.target.value) handleAddBlock(sec.id, e.target.value as CmsBlockType); }}
                              className="w-full text-[10px] px-2 py-1 border border-gray-200 rounded text-gray-500 bg-white"
                            >
                              <option value="">+ Ajouter un bloc</option>
                              {SHOPIFY_BLOCK_TYPES.map(bt => <option key={bt.type} value={bt.type}>{bt.label}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add section button / palette */}
              {showSectionPalette ? (
                <div className="mt-2 p-2 border border-brand-200 rounded-lg bg-brand-50/30 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1 mb-1">Ajouter une section</div>
                  {SECTION_PALETTE.map(p => (
                    <button key={p.type} onClick={() => handleAddSection(p.type)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white text-left text-xs text-gray-700 transition-colors">
                      <span className="text-sm">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p.label}</div>
                        <div className="text-[9px] text-gray-400 truncate">{p.desc}</div>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => setShowSectionPalette(false)} className="w-full text-[10px] text-gray-400 hover:text-gray-600 py-1">Annuler</button>
                </div>
              ) : (
                <button onClick={() => setShowSectionPalette(true)} className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                  <Plus size={14} /> Ajouter une section
                </button>
              )}
            </div>

            {/* CENTER — Canvas preview */}
            <div className="bg-gray-100 p-4 overflow-y-auto max-h-[600px]">
              <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Page header bar */}
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                  <MousePointerClick size={12} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">Cliquez une section dans la barre latérale pour l'éditer</span>
                </div>
                {/* Rendered sections */}
                {osSections.map(sec => {
                  const palette = SECTION_PALETTE.find(p => p.type === sec.type);
                  const isSelected = selectedNodeId === sec.id;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => { setSelectedNodeId(sec.id); if (!expandedSections.has(sec.id)) toggleExpand(sec.id); }}
                      className={`relative border-2 ${isSelected ? 'border-brand-400' : 'border-transparent hover:border-gray-200'} cursor-pointer transition-colors group`}
                    >
                      {/* Section label overlay */}
                      <div className={`absolute top-1 left-1 z-10 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isSelected ? 'bg-brand-500 text-white' : 'bg-gray-200/80 text-gray-600 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        {palette?.label || sec.type}
                      </div>
                      {/* Section visual */}
                      <CanvasSection sec={sec} />
                    </div>
                  );
                })}
                {osSections.length === 0 && (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    <Layout size={32} className="mx-auto mb-2 opacity-40" />
                    Aucune section. Cliquez « Ajouter une section » dans la barre latérale.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Settings panel */}
            <div className="border-l border-gray-100 bg-white p-4 overflow-y-auto max-h-[600px]">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5"><SettingsIcon size={12} /> Réglages</h4>
              {!selectedNodeId && (
                <div className="text-center text-gray-400 text-xs py-8">
                  <MousePointerClick size={24} className="mx-auto mb-2 opacity-40" />
                  Sélectionnez une section ou un bloc pour voir ses réglages.
                </div>
              )}
              {selectedSection && selectedNodeId === selectedSection.id && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Type de section</label>
                    <div className="px-2 py-1.5 bg-gray-50 rounded text-xs text-gray-700 font-mono">{selectedSection.type}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Titre</label>
                    <input
                      value={selectedSection.settings?.title || ''}
                      onChange={e => setDraft(updateOsSectionSettings(draft, selectedSection.id, { title: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-brand-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Texte d'en-tête</label>
                    <input
                      value={selectedSection.settings?.heading || ''}
                      onChange={e => setDraft(updateOsSectionSettings(draft, selectedSection.id, { heading: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-brand-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Sous-texte</label>
                    <textarea
                      value={selectedSection.settings?.subtext || ''}
                      onChange={e => setDraft(updateOsSectionSettings(draft, selectedSection.id, { subtext: e.target.value }))}
                      rows={2}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-brand-200 focus:outline-none"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-[10px] text-gray-400">{selectedSection.blocks.length} bloc(s) dans cette section</div>
                  </div>
                </div>
              )}
              {selectedBlock && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Type de bloc</label>
                    <div className="px-2 py-1.5 bg-gray-50 rounded text-xs text-gray-700 font-mono">{selectedBlock.type}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Contenu</label>
                    <textarea
                      value={selectedBlock.settings?.text || selectedBlock.settings?.heading || ''}
                      onChange={e => {
                        const key = selectedBlock.settings?.heading !== undefined ? 'heading' : 'text';
                        setDraft(updateOsBlockSettings(draft, selectedSection!.id, selectedBlock.id, { [key]: e.target.value }));
                      }}
                      rows={4}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-brand-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/** Renders a visual approximation of a section in the canvas. */
function CanvasSection({ sec }: { sec: { type: string; settings: Record<string, any>; blocks: any[] } }) {
  const heading = sec.settings?.heading || sec.settings?.title;
  const subtext = sec.settings?.subtext;
  switch (sec.type) {
    case 'image-banner':
    case 'slideshow':
      return (
        <div className="h-40 bg-gradient-to-br from-brand-600 to-brand-900 flex flex-col items-center justify-center text-white p-4">
          {heading && <div className="text-lg font-bold">{heading}</div>}
          {subtext && <div className="text-xs opacity-80 mt-1">{subtext}</div>}
        </div>
      );
    case 'featured-collection':
      return (
        <div className="p-4">
          {heading && <div className="text-sm font-bold mb-2 text-gray-900">{heading}</div>}
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map(i => <div key={i} className="aspect-square rounded bg-gradient-to-br from-gray-100 to-gray-200" />)}
          </div>
        </div>
      );
    case 'collection-list':
      return (
        <div className="p-4">
          {heading && <div className="text-sm font-bold mb-2 text-gray-900">{heading}</div>}
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(i => <div key={i} className="aspect-[4/3] rounded bg-gradient-to-br from-brand-100 to-brand-300" />)}
          </div>
        </div>
      );
    case 'multicolumn':
      return (
        <div className="p-4">
          {heading && <div className="text-sm font-bold mb-2 text-center text-gray-900">{heading}</div>}
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map(i => <div key={i} className="text-center"><div className="w-8 h-8 mx-auto rounded-full bg-brand-50 mb-1" /><div className="h-1.5 bg-gray-200 rounded" /></div>)}
          </div>
        </div>
      );
    case 'image-with-text':
      return (
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="aspect-[4/3] rounded bg-gradient-to-br from-gray-100 to-gray-200" />
          <div className="flex flex-col justify-center">
            {heading && <div className="text-sm font-bold text-gray-900">{heading}</div>}
            {subtext && <div className="text-[10px] text-gray-500 mt-1">{subtext}</div>}
          </div>
        </div>
      );
    case 'rich-text':
      return (
        <div className="p-6 text-center">
          {heading && <div className="text-sm font-bold text-gray-900">{heading}</div>}
          {subtext && <div className="text-[10px] text-gray-500 mt-1 max-w-xs mx-auto">{subtext}</div>}
        </div>
      );
    case 'collapsible-content':
      return (
        <div className="p-4">
          {heading && <div className="text-sm font-bold mb-2 text-gray-900">{heading}</div>}
          {[0, 1, 2].map(i => <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50"><ChevronRight size={12} className="text-gray-400" /><div className="h-2 bg-gray-200 rounded flex-1 max-w-[60%]" /></div>)}
        </div>
      );
    case 'contact-form':
      return (
        <div className="p-4">
          {heading && <div className="text-sm font-bold mb-2 text-gray-900">{heading}</div>}
          <div className="space-y-1.5"><div className="h-6 bg-gray-100 rounded" /><div className="h-6 bg-gray-100 rounded" /><div className="h-12 bg-gray-100 rounded" /><div className="h-6 w-24 bg-brand-600 rounded" /></div>
        </div>
      );
    case 'email-signup':
      return (
        <div className="p-6 text-center bg-brand-50/30">
          {heading && <div className="text-sm font-bold text-gray-900">{heading}</div>}
          {subtext && <div className="text-[10px] text-gray-500 mt-1">{subtext}</div>}
          <div className="flex gap-1 mt-2 max-w-[200px] mx-auto"><div className="h-7 flex-1 bg-white border border-gray-200 rounded" /><div className="h-7 w-16 bg-brand-600 rounded" /></div>
        </div>
      );
    case 'video':
      return <div className="h-32 bg-gray-900 flex items-center justify-center"><div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center"><span className="text-gray-900 text-xs">▶</span></div></div>;
    case 'spacer':
      return <div className="h-12 flex items-center justify-center text-[9px] text-gray-300">— espacement —</div>;
    default:
      return (
        <div className="p-4">
          {heading && <div className="text-sm font-bold text-gray-900">{heading}</div>}
          {subtext && <div className="text-[10px] text-gray-500 mt-1">{subtext}</div>}
          {sec.blocks.length === 0 && <div className="text-[10px] text-gray-300 mt-2">Section vide</div>}
        </div>
      );
  }
}

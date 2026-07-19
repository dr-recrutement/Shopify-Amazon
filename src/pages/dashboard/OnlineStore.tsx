import { PageHeader, Card, Button, Badge } from './ui';
import { Store, Smartphone, Tablet, Monitor, Palette, Eye, History, Layers, Plus, Trash2, GripVertical, Upload, FileText, Settings as SettingsIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY, defaultThemeForType, renderSection } from '../../lib/theme-engine';

export default function OnlineStore() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<ThemeConfig>(() => defaultThemeForType('ecommerce'));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [panel, setPanel] = useState<'sections' | 'design' | 'pages' | 'settings'>('sections');
  const [showCustomize, setShowCustomize] = useState(true);

  const setSiteType = (t: SiteType) => setTheme(defaultThemeForType(t));

  const addSection = (type: ThemeSection['type']) => {
    setTheme({
      ...theme,
      sections: [...theme.sections, { id: `s${Date.now()}`, type, visible: true, props: {} }],
    });
  };

  const removeSection = (id: string) => {
    setTheme({ ...theme, sections: theme.sections.filter(s => s.id !== id) });
  };

  const toggleSection = (id: string) => {
    setTheme({ ...theme, sections: theme.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s) });
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    const idx = theme.sections.findIndex(s => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= theme.sections.length) return;
    const sections = [...theme.sections];
    [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
    setTheme({ ...theme, sections });
  };

  const updateColor = (key: keyof ThemeConfig['colors'], value: string) => {
    setTheme({ ...theme, colors: { ...theme.colors, [key]: value } });
  };

  const publish = () => setTheme({ ...theme, isPublished: true });
  const saveDraft = () => setTheme({ ...theme, isPublished: false });

  const deviceWidth = device === 'mobile' ? 'max-w-[280px]' : device === 'tablet' ? 'max-w-[500px]' : 'max-w-full';

  return (
    <div>
      <PageHeader
        title="Online Store"
        subtitle="Moteur de thème universel — drag & drop, édition en direct, dépassez Shopify."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={saveDraft}><History size={14} /> Brouillon</Button>
            <Button size="sm" onClick={publish}><Eye size={14} /> Publier</Button>
          </div>
        }
      />

      {/* Site type selector */}
      <Card className="mb-4 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Type de site</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SITE_TYPES.map(st => (
            <button
              key={st.id}
              onClick={() => setSiteType(st.id)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${theme.siteType === st.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="text-sm font-semibold text-gray-900">{st.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{st.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left panel */}
        <div className="space-y-3">
          <Card className="p-2">
            <div className="flex gap-1">
              {([['sections', Layers], ['design', Palette], ['pages', FileText], ['settings', SettingsIcon]] as const).map(([p, Icon]) => (
                <button key={p} onClick={() => setPanel(p)} className={`flex-1 p-2 rounded-lg flex items-center justify-center ${panel === p ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </Card>

          {panel === 'sections' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Sections ({theme.sections.length})</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
                {theme.sections.map((s, i) => {
                  const lib = SECTION_LIBRARY.find(l => l.type === s.type);
                  return (
                    <div key={s.id} className={`flex items-center gap-1 p-2 rounded-lg border ${selectedSection === s.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
                      <GripVertical size={12} className="text-gray-300" />
                      <button onClick={() => setSelectedSection(s.id)} className="flex-1 text-left text-xs font-medium text-gray-700">
                        {lib?.icon} {lib?.label || s.type}
                      </button>
                      <button onClick={() => moveSection(s.id, -1)} className="p-0.5 text-gray-400 hover:text-gray-700"><ArrowUp size={12} /></button>
                      <button onClick={() => moveSection(s.id, 1)} className="p-0.5 text-gray-400 hover:text-gray-700"><ArrowDown size={12} /></button>
                      <button onClick={() => toggleSection(s.id)} className={`p-0.5 ${s.visible ? 'text-green-600' : 'text-gray-300'}`}>●</button>
                      <button onClick={() => removeSection(s.id)} className="p-0.5 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Ajouter un bloc</p>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto scrollbar-thin">
                  {SECTION_LIBRARY.map(lib => (
                    <button key={lib.type} onClick={() => addSection(lib.type)} className="text-left p-1.5 rounded text-xs hover:bg-gray-50 border border-gray-100">
                      {lib.icon} {lib.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {panel === 'design' && (
            <Card className="p-3 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Couleurs</h3>
              {([
                ['primary', 'Primaire'], ['secondary', 'Secondaire'], ['accent', 'Accent'], ['background', 'Fond'], ['text', 'Texte'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex gap-2">
                    <input type="color" value={theme.colors[key]} onChange={e => updateColor(key, e.target.value)} className="w-10 h-8 rounded border border-gray-200" />
                    <input value={theme.colors[key]} onChange={e => updateColor(key, e.target.value)} className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs font-mono" />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Espacement</label>
                <div className="flex gap-1">
                  {(['compact', 'comfortable', 'spacious'] as const).map(s => (
                    <button key={s} onClick={() => setTheme({ ...theme, spacing: s })} className={`flex-1 py-1.5 rounded text-xs ${theme.spacing === s ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {panel === 'pages' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Pages personnalisées</h3>
              <Button variant="secondary" size="sm" className="w-full"><Plus size={14} /> Nouvelle page</Button>
              <div className="mt-2 space-y-1 text-xs">
                {['À propos', 'Contact', 'FAQ'].map(p => <div key={p} className="p-2 hover:bg-gray-50 rounded">{p}</div>)}
              </div>
            </Card>
          )}

          {panel === 'settings' && (
            <Card className="p-3 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Préférences</h3>
              <div><label className="text-xs">Titre boutique</label><input className="w-full px-2 py-1 border border-gray-200 rounded text-xs" defaultValue="Ma Boutique" /></div>
              <div><label className="text-xs">Description SEO</label><textarea className="w-full px-2 py-1 border border-gray-200 rounded text-xs" rows={2} /></div>
              <div><label className="text-xs">Favicon</label><Button variant="secondary" size="sm" className="w-full"><Upload size={12} /> Téléverser</Button></div>
              <Button variant="secondary" size="sm" className="w-full"><Upload size={12} /> Importer un thème personnalisé</Button>
            </Card>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge color={theme.isPublished ? 'green' : 'orange'}>{theme.isPublished ? 'Publié' : 'Brouillon'}</Badge>
                <span className="text-xs text-gray-500 capitalize">{theme.siteType}</span>
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
                  <button key={d} onClick={() => setDevice(d)} className={`p-1.5 rounded ${device === d ? 'bg-white shadow-sm' : ''}`}><Icon size={16} /></button>
                ))}
              </div>
            </div>

            <div className={`mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden transition-all ${deviceWidth}`} style={{ backgroundColor: theme.colors.background }}>
              {theme.sections.filter(s => s.visible).map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSection(s.id)}
                  className={`cursor-pointer ${selectedSection === s.id ? 'ring-2 ring-orange-500' : ''}`}
                >
                  {renderSection(s, theme.colors)}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Layers size={14} /> {theme.sections.length} sections · drag & drop
              </div>
              <Badge color="green">Score performance: 92/100</Badge>
            </div>
          </Card>

          {/* Theme library */}
          <Card className="mt-4 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Store size={16} /> Bibliothèque de thèmes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Template Universel', type: 'ecommerce', universal: true },
                { name: 'Mode & Lifestyle', type: 'ecommerce' },
                { name: 'Landing Pro', type: 'landing' },
                { name: 'Business Vitrine', type: 'business' },
                { name: 'Marketplace Africa', type: 'marketplace' },
                { name: 'Resto Pro', type: 'business' },
                { name: 'High-Tech Store', type: 'ecommerce' },
                { name: 'Blank Theme', type: 'landing' },
              ].map(t => (
                <button key={t.name} onClick={() => setSiteType(t.type as SiteType)} className="text-left p-3 rounded-lg border border-gray-100 hover:border-orange-300 hover:shadow-sm transition-all">
                  <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-orange-50 rounded mb-2 flex items-center justify-center">
                    <Store size={20} className="text-orange-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-900">{t.name}</div>
                  {t.universal && <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">Universel</span>}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Floating Customize button */}
      {showCustomize && (
        <button
          onClick={() => setPanel('sections')}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-orange-600 text-white rounded-full shadow-xl hover:bg-orange-700 transition-all hover:scale-105 flex items-center gap-2 text-sm font-semibold"
        >
          <Palette size={16} /> Customize
        </button>
      )}
    </div>
  );
}

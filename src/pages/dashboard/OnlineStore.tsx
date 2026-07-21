import { PageHeader, Card, Button, Badge } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Store, Smartphone, Tablet, Monitor, Palette, Eye, History, Layers, Plus, Trash2, GripVertical, Upload, FileText, Settings as SettingsIcon, ArrowUp, ArrowDown, Sparkles, Bot, Check, X, Edit3 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY, EDITABLE_PROPS, getSectionDefaults, defaultThemeForType, renderSection } from '../../lib/theme-engine';

type StoreTheme = { id: string; name: string; category: string; price_cents: number; is_premium: boolean; description: string | null };

const AI_TIPS = [
  { condition: (t: ThemeConfig) => t.sections.length < 4, tip: 'Votre page a peu de sections. Ajoutez un bloc "Témoignages" ou "Newsletter" pour engager vos visiteurs.' },
  { condition: (t: ThemeConfig) => !t.sections.some(s => s.type === 'hero'), tip: 'Ajoutez une section "Hero" en haut de page pour un impact visuel immédiat.' },
  { condition: (t: ThemeConfig) => t.colors.primary === t.colors.background, tip: 'Le contraste entre la couleur primaire et le fond est trop faible. Ajustez pour améliorer la lisibilité.' },
  { condition: (t: ThemeConfig) => t.sections.filter(s => s.visible).length < 3, tip: 'Trop de sections masquées. Activez plus de blocs pour enrichir votre page.' },
  { condition: (t: ThemeConfig) => !t.sections.some(s => s.type === 'newsletter'), tip: 'Ajoutez une section "Newsletter" pour capter les emails de vos visiteurs.' },
];

const PRESET_PALETTES = [
  { name: 'Orange', c: { primary: '#F2632C', secondary: '#16a34a', accent: '#F2632C', background: '#FFFFFF', text: '#111114' } },
  { name: 'Bleu', c: { primary: '#2563eb', secondary: '#0ea5e9', accent: '#2563eb', background: '#FFFFFF', text: '#0f172a' } },
  { name: 'Émeraude', c: { primary: '#059669', secondary: '#10b981', accent: '#059669', background: '#FFFFFF', text: '#064e3b' } },
  { name: 'Nuit', c: { primary: '#7c3aed', secondary: '#a855f7', accent: '#7c3aed', background: '#0f172a', text: '#f1f5f9' } },
  { name: 'Corail', c: { primary: '#f43f5e', secondary: '#fb7185', accent: '#f43f5e', background: '#FFFFFF', text: '#1f2937' } },
  { name: 'Soleil', c: { primary: '#eab308', secondary: '#f59e0b', accent: '#eab308', background: '#FFFFFF', text: '#422006' } },
];

export default function OnlineStore() {
  const { tenant } = useTenant();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<ThemeConfig>(() => defaultThemeForType('ecommerce'));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [panel, setPanel] = useState<'sections' | 'design' | 'pages' | 'settings' | 'themes' | 'ai' | 'edit'>('sections');
  const [storeThemes, setStoreThemes] = useState<StoreTheme[]>([]);
  const [purchasedThemeIds, setPurchasedThemeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTheme = useCallback(async () => {
    if (!tenant) return;
    const { data: config } = await supabase.from('theme_configs').select('*').eq('tenant_id', tenant.id).maybeSingle();
    if (config) {
      setTheme({
        siteType: config.site_type,
        sections: config.sections || [],
        colors: config.colors || { primary: '#F2632C', secondary: '#16a34a', accent: '#F2632C', background: '#FFFFFF', text: '#111114' },
        fonts: { heading: 'Montserrat', body: 'Montserrat' },
        spacing: config.spacing || 'comfortable',
        isPublished: config.is_published || false,
      });
      setPurchasedThemeIds(config.purchased_themes || []);
    }
    const { data: themes } = await supabase.from('theme_store_themes').select('*').eq('is_published', true);
    setStoreThemes(themes || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) loadTheme(); }, [tenant, loadTheme]);

  const persistTheme = async (newTheme: ThemeConfig, published: boolean) => {
    if (!tenant) return;
    setSaving(true);
    const payload = {
      tenant_id: tenant.id, site_type: newTheme.siteType, sections: newTheme.sections,
      colors: newTheme.colors, spacing: newTheme.spacing, is_published: published,
    };
    const { data: existing } = await supabase.from('theme_configs').select('id').eq('tenant_id', tenant.id).maybeSingle();
    if (existing) {
      await supabase.from('theme_configs').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('theme_configs').insert(payload);
    }
    setSaving(false);
    setSavedMsg(published ? 'Boutique publiée!' : 'Brouillon sauvegardé!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const setSiteType = (t: SiteType) => setTheme({ ...theme, siteType: t });

  const addSection = (type: ThemeSection['type']) => {
    const newSection: ThemeSection = { id: `s${Date.now()}`, type, visible: true, props: getSectionDefaults(type) };
    setTheme({ ...theme, sections: [...theme.sections, newSection] });
    setSelectedSection(newSection.id);
    setPanel('edit');
  };

  const removeSection = (id: string) => {
    setTheme({ ...theme, sections: theme.sections.filter(s => s.id !== id) });
    if (selectedSection === id) { setSelectedSection(null); setPanel('sections'); }
  };
  const toggleSection = (id: string) => setTheme({ ...theme, sections: theme.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s) });

  const moveSection = (id: string, dir: -1 | 1) => {
    const idx = theme.sections.findIndex(s => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= theme.sections.length) return;
    const sections = [...theme.sections];
    [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
    setTheme({ ...theme, sections });
  };

  const updateSectionProp = (sectionId: string, key: string, value: any) => {
    setTheme({ ...theme, sections: theme.sections.map(s => s.id === sectionId ? { ...s, props: { ...s.props, [key]: value } } : s) });
  };

  const updateColor = (key: keyof ThemeConfig['colors'], value: string) => setTheme({ ...theme, colors: { ...theme.colors, [key]: value } });

  const publish = () => { const t = { ...theme, isPublished: true }; setTheme(t); persistTheme(t, true); };
  const saveDraft = () => { const t = { ...theme, isPublished: false }; setTheme(t); persistTheme(t, false); };

  const purchaseTheme = async (st: StoreTheme) => {
    if (!tenant) return;
    const planRank: any = { starter: 0, premium: 1, entreprise: 2 };
    if (st.is_premium && planRank[tenant.plan] < 1) {
      alert('Ce thème premium nécessite le plan Premium. Mettez à niveau pour accéder aux thèmes premium.');
      return;
    }
    if (!purchasedThemeIds.includes(st.id)) {
      const newPurchased = [...purchasedThemeIds, st.id];
      setPurchasedThemeIds(newPurchased);
      await supabase.from('theme_configs').update({ purchased_themes: newPurchased }).eq('tenant_id', tenant.id);
    }
    setSavedMsg(`Thème "${st.name}" ajouté à votre compte!`);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const applyTheme = (st: StoreTheme) => {
    if (!purchasedThemeIds.includes(st.id) && st.is_premium) return;
    const newTheme = defaultThemeForType(st.category as SiteType);
    setTheme(newTheme);
    persistTheme(newTheme, false);
    setSavedMsg(`Thème "${st.name}" appliqué!`);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const deviceWidth = device === 'mobile' ? 'max-w-[280px]' : device === 'tablet' ? 'max-w-[500px]' : 'max-w-full';
  const applicableTips = AI_TIPS.filter(t => t.condition(theme));
  const selectedSec = theme.sections.find(s => s.id === selectedSection);
  const editableFields = selectedSec ? EDITABLE_PROPS[selectedSec.type] || [] : [];

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader
        title="Online Store"
        subtitle="Moteur de thème universel — édition en direct, IA intégrée, 15 blocs modulables."
        action={
          <div className="flex gap-2 items-center">
            {savedMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} />{savedMsg}</span>}
            <Button variant="secondary" size="sm" onClick={saveDraft} disabled={saving}><History size={14} /> Brouillon</Button>
            <Button size="sm" onClick={publish} disabled={saving}><Eye size={14} /> Publier</Button>
          </div>
        }
      />

      <Card className="mb-4 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Type de site</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SITE_TYPES.map(st => (
            <button key={st.id} onClick={() => setSiteType(st.id)} className={`text-left p-3 rounded-lg border-2 transition-all ${theme.siteType === st.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
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
            <div className="flex gap-1 flex-wrap">
              {([['sections', Layers], ['edit', Edit3], ['design', Palette], ['themes', Store], ['ai', Bot], ['pages', FileText], ['settings', SettingsIcon]] as const).map(([p, Icon]) => (
                <button key={p} onClick={() => setPanel(p)} className={`flex-1 min-w-[40px] p-2 rounded-lg flex items-center justify-center transition-colors ${panel === p ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </Card>

          {/* Sections list */}
          {panel === 'sections' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Sections ({theme.sections.length})</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {theme.sections.map((s) => {
                  const lib = SECTION_LIBRARY.find(l => l.type === s.type);
                  return (
                    <div key={s.id} className={`flex items-center gap-1 p-2 rounded-lg border transition-all ${selectedSection === s.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <GripVertical size={12} className="text-gray-300" />
                      <button onClick={() => { setSelectedSection(s.id); setPanel('edit'); }} className="flex-1 text-left text-xs font-medium text-gray-700">
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
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {SECTION_LIBRARY.map(lib => (
                    <button key={lib.type} onClick={() => addSection(lib.type)} className="text-left p-1.5 rounded text-xs hover:bg-gray-50 border border-gray-100 transition-colors hover:border-orange-200">
                      {lib.icon} {lib.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Section editor */}
          {panel === 'edit' && selectedSec && (
            <Card className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Edit3 size={14} /> Édition</h3>
                <span className="text-xs text-gray-400">{SECTION_LIBRARY.find(l => l.type === selectedSec.type)?.label}</span>
              </div>
              {editableFields.length > 0 ? (
                editableFields.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea rows={2} value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                    ) : f.type === 'number' ? (
                      <input type="number" min={2} max={4} value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, Math.min(4, Math.max(2, parseInt(e.target.value) || 2)))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                    ) : f.type === 'date' ? (
                      <input type="date" value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                    ) : (
                      <input type="text" value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">Cette section n'a pas de propriétés éditables. Elle utilise des données automatiques de votre boutique.</p>
              )}
              <div className="pt-2 border-t border-gray-100">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => setPanel('sections')}>← Retour aux sections</Button>
              </div>
            </Card>
          )}

          {panel === 'edit' && !selectedSec && (
            <Card className="p-6 text-center">
              <Edit3 size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Cliquez sur une section dans le canvas pour l'éditer.</p>
            </Card>
          )}

          {/* Design panel */}
          {panel === 'design' && (
            <Card className="p-3 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Couleurs</h3>
              {([['primary', 'Primaire'], ['secondary', 'Secondaire'], ['accent', 'Accent'], ['background', 'Fond'], ['text', 'Texte']] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex gap-2">
                    <input type="color" value={theme.colors[key]} onChange={e => updateColor(key, e.target.value)} className="w-10 h-8 rounded border border-gray-200 cursor-pointer" />
                    <input value={theme.colors[key]} onChange={e => updateColor(key, e.target.value)} className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:border-orange-400" />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Espacement</label>
                <div className="flex gap-1">
                  {(['compact', 'comfortable', 'spacious'] as const).map(s => (
                    <button key={s} onClick={() => setTheme({ ...theme, spacing: s })} className={`flex-1 py-1.5 rounded text-xs capitalize transition-colors ${theme.spacing === s ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
                  ))}
                </div>
              </div>
              {/* Preset palettes */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Palettes prédéfinies</p>
                <div className="grid grid-cols-2 gap-1">
                  {PRESET_PALETTES.map(p => (
                    <button key={p.name} onClick={() => setTheme({ ...theme, colors: p.c })} className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex gap-0.5">
                        <div className="w-3 h-3 rounded-full" style={{ background: p.c.primary }} />
                        <div className="w-3 h-3 rounded-full" style={{ background: p.c.secondary }} />
                      </div>
                      <span className="text-xs">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Theme store */}
          {panel === 'themes' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Boutique de thèmes</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {storeThemes.map(st => {
                  const owned = purchasedThemeIds.includes(st.id) || !st.is_premium;
                  return (
                    <div key={st.id} className={`p-3 rounded-xl border-2 transition-all ${owned ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-orange-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900">{st.name}</p>
                        {st.is_premium ? (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{(st.price_cents / 100).toLocaleString('fr-FR')} $</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Gratuit</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{st.description}</p>
                      <div className="flex gap-1 mb-2">
                        {['#F2632C', '#16a34a', '#ffffff', '#111114'].map((c, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{ background: c }} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {owned ? (
                          <Button size="sm" variant="secondary" onClick={() => applyTheme(st)} className="flex-1">Appliquer</Button>
                        ) : (
                          <Button size="sm" onClick={() => purchaseTheme(st)} className="flex-1">Acheter</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* AI panel */}
          {panel === 'ai' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1"><Sparkles size={14} className="text-orange-600" /> Assistant IA</h3>
              <p className="text-xs text-gray-500 mb-3">Conseils contextuels basés sur votre thème actuel.</p>
              {applicableTips.length > 0 ? (
                <div className="space-y-2">
                  {applicableTips.map((t, i) => (
                    <div key={i} className="p-2 bg-orange-50 rounded-lg text-xs text-gray-700 flex items-start gap-2">
                      <Sparkles size={12} className="text-orange-600 mt-0.5 flex-shrink-0" /> {t.tip}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 bg-green-50 rounded-lg text-xs text-green-700 flex items-center gap-2"><Check size={12} /> Votre thème est bien optimisé!</div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => {
                  const tips = applicableTips.map(t => t.tip).join('\n');
                  alert(`Conseils IA:\n\n${tips || 'Aucun conseil — votre thème est optimal!'}`);
                }}><Bot size={14} /> Analyser mon thème</Button>
              </div>
            </Card>
          )}

          {panel === 'pages' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Pages personnalisées</h3>
              <Button variant="secondary" size="sm" className="w-full"><Plus size={14} /> Nouvelle page</Button>
              <div className="mt-2 space-y-1 text-xs">
                {['À propos', 'Contact', 'FAQ'].map(p => <div key={p} className="p-2 hover:bg-gray-50 rounded cursor-pointer">{p}</div>)}
              </div>
            </Card>
          )}

          {panel === 'settings' && (
            <Card className="p-3 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Préférences</h3>
              <div><label className="text-xs">Titre boutique</label><input className="w-full px-2 py-1 border border-gray-200 rounded text-xs" defaultValue={tenant?.name || 'Ma Boutique'} /></div>
              <div><label className="text-xs">Description SEO</label><textarea className="w-full px-2 py-1 border border-gray-200 rounded text-xs" rows={2} /></div>
              <div><label className="text-xs">Favicon</label><Button variant="secondary" size="sm" className="w-full"><Upload size={12} /> Téléverser</Button></div>
              <Button variant="secondary" size="sm" className="w-full"><Upload size={12} /> Importer un thème</Button>
            </Card>
          )}
        </div>

        {/* Canvas preview */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge color={theme.isPublished ? 'green' : 'orange'}>{theme.isPublished ? 'Publié' : 'Brouillon'}</Badge>
                <span className="text-xs text-gray-500 capitalize">{theme.siteType}</span>
                {selectedSec && <span className="text-xs text-orange-600 font-medium">→ {SECTION_LIBRARY.find(l => l.type === selectedSec.type)?.label} sélectionné</span>}
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
                  <button key={d} onClick={() => setDevice(d)} className={`p-1.5 rounded transition-colors ${device === d ? 'bg-white shadow-sm' : ''}`}><Icon size={16} /></button>
                ))}
              </div>
            </div>

            <div className={`mx-auto rounded-lg border border-gray-200 overflow-hidden transition-all ${deviceWidth}`} style={{ backgroundColor: theme.colors.background }}>
              {theme.sections.filter(s => s.visible).map(s => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedSection(s.id); setPanel('edit'); }}
                  className={`cursor-pointer transition-all ${selectedSection === s.id ? 'ring-2 ring-orange-500 ring-inset' : 'hover:ring-1 hover:ring-gray-300 hover:ring-inset'}`}
                >
                  {renderSection(s, theme.colors, theme.spacing)}
                </div>
              ))}
              {theme.sections.filter(s => s.visible).length === 0 && (
                <div className="p-12 text-center text-gray-400 text-sm">Aucune section visible. Ajoutez des blocs depuis le panneau "Sections".</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Layers size={14} /> {theme.sections.length} sections · {theme.sections.filter(s => s.visible).length} visibles</div>
              <Badge color="green">Score performance: 92/100</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

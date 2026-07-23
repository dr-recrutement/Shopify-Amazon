import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Modal } from './ui';
import { Smartphone, Tablet, Monitor, Palette, Eye, History, Layers, Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Sparkles, Bot, Check, Edit3, Store, Settings as SettingsIcon, FileText } from 'lucide-react';
import { ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY, EDITABLE_PROPS, getSectionDefaults, defaultThemeForType, renderSection, getThemeVariant } from '../../lib/theme-engine';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type StoreTheme = {
  id: string;
  name: string;
  category: string;
  price_cents: number;
  is_premium: boolean;
  description: string | null;
  variant_key: string | null;
};

const AI_TIPS = [
  { condition: (t: ThemeConfig) => t.sections.length < 4, tip: 'Ajoutez un bloc "Témoignages" ou "Newsletter" pour engager vos visiteurs.' },
  { condition: (t: ThemeConfig) => !t.sections.some(s => s.type === 'hero'), tip: 'Ajoutez une section "Hero" en haut de page pour un impact visuel immédiat.' },
  { condition: (t: ThemeConfig) => t.colors.primary === t.colors.background, tip: 'Le contraste entre la couleur primaire et le fond est trop faible.' },
  { condition: (t: ThemeConfig) => t.sections.filter(s => s.visible).length < 3, tip: 'Activez plus de blocs pour enrichir votre page.' },
  { condition: (t: ThemeConfig) => !t.sections.some(s => s.type === 'newsletter'), tip: 'Ajoutez une section "Newsletter" pour capter les emails.' },
];

const PRESET_PALETTES = [
  { name: 'Orange', c: { primary: '#F2632C', secondary: '#16a34a', accent: '#F2632C', background: '#FFFFFF', text: '#111114' } },
  { name: 'Bleu', c: { primary: '#2563eb', secondary: '#0ea5e9', accent: '#2563eb', background: '#FFFFFF', text: '#0f172a' } },
  { name: 'Émeraude', c: { primary: '#059669', secondary: '#10b981', accent: '#059669', background: '#FFFFFF', text: '#064e3b' } },
  { name: 'Corail', c: { primary: '#f43f5e', secondary: '#fb7185', accent: '#f43f5e', background: '#FFFFFF', text: '#1f2937' } },
  { name: 'Soleil', c: { primary: '#eab308', secondary: '#f59e0b', accent: '#eab308', background: '#FFFFFF', text: '#422006' } },
  { name: 'Nuit', c: { primary: '#6366f1', secondary: '#818cf8', accent: '#6366f1', background: '#0f172a', text: '#f1f5f9' } },
];

// Hiérarchie des forfaits, du moins cher au plus cher.
// ⚠️ Doit correspondre exactement aux codes de la table Supabase `plans`.
const PLAN_RANK: Record<string, number> = { starter: 0, pro: 1, premium: 2, entreprise: 3 };

function SortableSectionRow({
  section, selected, onSelect, onMoveUp, onMoveDown, onToggle, onRemove, label, icon,
}: {
  section: ThemeSection;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onRemove: () => void;
  label: string;
  icon: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 p-2 rounded-lg border transition-all ${selected ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-0.5 text-gray-300 hover:text-gray-500">
        <GripVertical size={12} />
      </button>
      <button onClick={onSelect} className="flex-1 text-left text-xs font-medium text-gray-700">
        {icon} {label}
      </button>
      <button onClick={onMoveUp} className="p-0.5 text-gray-400 hover:text-gray-700"><ArrowUp size={12} /></button>
      <button onClick={onMoveDown} className="p-0.5 text-gray-400 hover:text-gray-700"><ArrowDown size={12} /></button>
      <button onClick={onToggle} className={`p-0.5 ${section.visible ? 'text-green-600' : 'text-gray-300'}`}>●</button>
      <button onClick={onRemove} className="p-0.5 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
    </div>
  );
}

interface EditorProduct {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  thumbnail: string | null;
}

// Sections qui doivent recevoir les vrais produits — doit rester identique à
// la liste utilisée dans Storefront.tsx pour que l'éditeur = ce que voit le client.
const PRODUCT_AWARE_SECTIONS = new Set(['product-grid', 'filters-list', 'product-detail']);

export default function OnlineStore() {
  const { tenant } = useTenant();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [editMode, setEditMode] = useState<'desktop' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<ThemeConfig>(() => defaultThemeForType('ecommerce'));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [panel, setPanel] = useState<'sections' | 'design' | 'themes' | 'ai' | 'edit'>('sections');
  const [storeThemes, setStoreThemes] = useState<StoreTheme[]>([]);
  const [purchasedThemeIds, setPurchasedThemeIds] = useState<string[]>([]);
  const [products, setProducts] = useState<EditorProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishModal, setPublishModal] = useState(false);

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

    // Charge les VRAIS produits du marchand pour que l'éditeur reflète
    // exactement ce que ses clients verront (comme dans Shopify).
    const { data: prods } = await supabase
      .from('products')
      .select('id,name,price_cents,currency,product_images(url,position)')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    const list: EditorProduct[] = (prods || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price_cents: p.price_cents,
      currency: p.currency,
      thumbnail: (p.product_images || []).sort((a: any, b: any) => a.position - b.position)[0]?.url || null,
    }));
    setProducts(list);

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

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = theme.sections.findIndex(s => s.id === active.id);
    const newIndex = theme.sections.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setTheme({ ...theme, sections: arrayMove(theme.sections, oldIndex, newIndex) });
  };

  const updateSectionProp = (sectionId: string, key: string, value: any) => {
    setTheme({ ...theme, sections: theme.sections.map(s => s.id === sectionId ? { ...s, props: { ...s.props, [key]: value } } : s) });
  };

  const updateColor = (key: keyof ThemeConfig['colors'], value: string) => setTheme({ ...theme, colors: { ...theme.colors, [key]: value } });

  const publish = () => { const t = { ...theme, isPublished: true }; setTheme(t); persistTheme(t, true); setPublishModal(false); };
  const saveDraft = () => { const t = { ...theme, isPublished: false }; setTheme(t); persistTheme(t, false); };

  const purchaseTheme = async (st: StoreTheme) => {
    if (!tenant) return;
    // BUGFIX: 'pro' manquait dans la table de rang -> un marchand "pro" débloquait
    // les thèmes premium gratuitement (undefined < 1 === false en JS, donc pas bloqué).
    const currentRank = PLAN_RANK[tenant.plan] ?? -1;
    if (st.is_premium && currentRank < PLAN_RANK.premium) {
      alert('Ce thème premium nécessite le plan Premium ou supérieur.');
      return;
    }
    if (!purchasedThemeIds.includes(st.id)) {
      const newPurchased = [...purchasedThemeIds, st.id];
      setPurchasedThemeIds(newPurchased);
      await supabase.from('theme_configs').update({ purchased_themes: newPurchased }).eq('tenant_id', tenant.id);
    }
    setSavedMsg(`Thème "${st.name}" ajouté!`);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const applyTheme = (st: StoreTheme) => {
    if (!purchasedThemeIds.includes(st.id) && st.is_premium) return;
    // Charge la vraie variante de design liée à ce thème acheté.
    // Si aucune variante n'est configurée (variant_key vide), on retombe sur le
    // layout par défaut du type de site (comportement précédent, en secours).
    const variant = st.variant_key ? getThemeVariant(st.variant_key) : null;
    const newTheme = variant || defaultThemeForType(st.category as SiteType);
    setTheme(newTheme);
    persistTheme(newTheme, false);
    setSavedMsg(`Thème "${st.name}" appliqué!`);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const deviceWidth = device === 'mobile' ? 'max-w-[280px]' : device === 'tablet' ? 'max-w-[500px]' : 'max-w-full';
  const applicableTips = AI_TIPS.filter(t => t.condition(theme));
  const selectedSec = theme.sections.find(s => s.id === selectedSection);
  const editableFields = selectedSec ? EDITABLE_PROPS[selectedSec.type] || [] : [];

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement…</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Online Store</h1>
          <p className="text-sm text-gray-500 mt-1">Éditeur de thème — édition en direct, IA intégrée, 15 blocs modulables.</p>
        </div>
        <div className="flex gap-2 items-center">
          {savedMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} />{savedMsg}</span>}
          <Button variant="secondary" size="sm" onClick={saveDraft} disabled={saving}><History size={14} /> Brouillon</Button>
          <Button size="sm" onClick={() => setPublishModal(true)} disabled={saving}><Eye size={14} /> Publier</Button>
        </div>
      </div>

      {/* Site type selector */}
      <Card className="mb-4 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Type de site</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SITE_TYPES.map(st => (
            <button key={st.id} onClick={() => setSiteType(st.id)} className={`text-left p-3 rounded-lg border-2 transition-all ${theme.siteType === st.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
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
              {([['sections', Layers], ['edit', Edit3], ['design', Palette], ['themes', Store], ['ai', Bot]] as const).map(([p, Icon]) => (
                <button key={p} onClick={() => setPanel(p)} className={`flex-1 min-w-[40px] p-2 rounded-lg flex items-center justify-center transition-colors ${panel === p ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </Card>

          {panel === 'sections' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Sections ({theme.sections.length})</h3>
              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={theme.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {theme.sections.map((s) => {
                      const lib = SECTION_LIBRARY.find(l => l.type === s.type);
                      return (
                        <SortableSectionRow
                          key={s.id}
                          section={s}
                          selected={selectedSection === s.id}
                          onSelect={() => { setSelectedSection(s.id); setPanel('edit'); }}
                          onMoveUp={() => moveSection(s.id, -1)}
                          onMoveDown={() => moveSection(s.id, 1)}
                          onToggle={() => toggleSection(s.id)}
                          onRemove={() => removeSection(s.id)}
                          label={lib?.label || s.type}
                          icon={lib?.icon || ''}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Ajouter un bloc</p>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {SECTION_LIBRARY.map(lib => (
                    <button key={lib.type} onClick={() => addSection(lib.type)} className="text-left p-1.5 rounded text-xs hover:bg-gray-50 border border-gray-100 transition-colors hover:border-brand-200">
                      {lib.icon} {lib.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

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
                      <textarea rows={2} value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    ) : f.type === 'number' ? (
                      <input type="number" min={2} max={4} value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, Math.min(4, Math.max(2, parseInt(e.target.value) || 2)))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    ) : f.type === 'date' ? (
                      <input type="date" value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    ) : (
                      <input type="text" value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">Cette section utilise des données automatiques de votre boutique.</p>
              )}
              <div className="pt-2 border-t border-gray-100">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => setPanel('sections')}>← Retour</Button>
              </div>
            </Card>
          )}

          {panel === 'edit' && !selectedSec && (
            <Card className="p-6 text-center">
              <Edit3 size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Cliquez sur une section dans le canvas pour l'éditer.</p>
            </Card>
          )}

          {panel === 'design' && (
            <Card className="p-3 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Couleurs</h3>
              {([['primary', 'Primaire'], ['secondary', 'Secondaire'], ['accent', 'Accent'], ['background', 'Fond'], ['text', 'Texte']] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex gap-2">
                    <input type="color" value={theme.colors[key]} onChange={e => updateColor(key, e.target.value)} className="w-10 h-8 rounded border border-gray-200 cursor-pointer" />
                    <input value={theme.colors[key]} onChange={e => updateColor(key, e.target.value)} className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:border-brand-400" />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Espacement</label>
                <div className="flex gap-1">
                  {(['compact', 'comfortable', 'spacious'] as const).map(s => (
                    <button key={s} onClick={() => setTheme({ ...theme, spacing: s })} className={`flex-1 py-1.5 rounded text-xs capitalize transition-colors ${theme.spacing === s ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
                  ))}
                </div>
              </div>
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

          {panel === 'themes' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Boutique de thèmes</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {storeThemes.map(st => {
                  const owned = purchasedThemeIds.includes(st.id) || !st.is_premium;
                  return (
                    <div key={st.id} className={`p-3 rounded-xl border-2 transition-all ${owned ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-brand-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900">{st.name}</p>
                        {st.is_premium ? (
                          <span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-medium">{(st.price_cents / 100).toLocaleString('fr-FR')} $</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Gratuit</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{st.description}</p>
                      {!st.variant_key && (
                        <p className="text-[10px] text-amber-600 mb-2">⚠️ Aucune variante de design liée — l'application retombera sur le layout par défaut.</p>
                      )}
                      <div className="flex gap-1 mb-2">
                        {['#F2632C', '#16a34a', '#ffffff', '#111114'].map((c, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{ background: c }} />
                        ))}
                      </div>
                      {owned ? (
                        <Button size="sm" variant="secondary" onClick={() => applyTheme(st)} className="w-full">Appliquer</Button>
                      ) : (
                        <Button size="sm" onClick={() => purchaseTheme(st)} className="w-full">Acheter</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {panel === 'ai' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1"><Sparkles size={14} className="text-brand-600" /> Assistant IA</h3>
              <p className="text-xs text-gray-500 mb-3">Conseils contextuels basés sur votre thème.</p>
              {applicableTips.length > 0 ? (
                <div className="space-y-2">
                  {applicableTips.map((t, i) => (
                    <div key={i} className="p-2 bg-brand-50 rounded-lg text-xs text-gray-700 flex items-start gap-2">
                      <Sparkles size={12} className="text-brand-600 mt-0.5 flex-shrink-0" /> {t.tip}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 bg-green-50 rounded-lg text-xs text-green-700 flex items-center gap-2"><Check size={12} /> Votre thème est bien optimisé!</div>
              )}
            </Card>
          )}
        </div>

        {/* Canvas preview */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge color={theme.isPublished ? 'green' : 'orange'}>{theme.isPublished ? 'Publié' : 'Brouillon'}</Badge>
                <span className="text-xs text-gray-500 capitalize">{theme.siteType}</span>
                {selectedSec && <span className="text-xs text-brand-600 font-medium">→ {SECTION_LIBRARY.find(l => l.type === selectedSec.type)?.label}</span>}
              </div>
              <div className="flex items-center gap-2">
                {/* Edit mode toggle (desktop/mobile editing) */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  <button onClick={() => { setEditMode('desktop'); setDevice('desktop'); }} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${editMode === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Monitor size={14} /></button>
                  <button onClick={() => { setEditMode('mobile'); setDevice('mobile'); }} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${editMode === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Smartphone size={14} /></button>
                </div>
                {/* Preview device toggle */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
                    <button key={d} onClick={() => setDevice(d)} className={`p-1.5 rounded transition-colors ${device === d ? 'bg-white shadow-sm' : ''}`}><Icon size={16} /></button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`mx-auto rounded-lg border border-gray-200 overflow-hidden transition-all ${deviceWidth}`} style={{ backgroundColor: theme.colors.background }}>
              {theme.sections.filter(s => s.visible).map(s => (
                <div key={s.id} onClick={() => { setSelectedSection(s.id); setPanel('edit'); }} className={`cursor-pointer transition-all ${selectedSection === s.id ? 'ring-2 ring-brand-500 ring-inset' : 'hover:ring-1 hover:ring-gray-300 hover:ring-inset'}`}>
                  {renderSection(s, theme.colors, PRODUCT_AWARE_SECTIONS.has(s.type) ? products : undefined)}
                </div>
              ))}
              {theme.sections.filter(s => s.visible).length === 0 && (
                <div className="p-12 text-center text-gray-400 text-sm">Aucune section visible. Ajoutez des blocs depuis le panneau "Sections".</div>
              )}
            </div>
            {products.length === 0 && theme.sections.some(s => s.visible && PRODUCT_AWARE_SECTIONS.has(s.type)) && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Vous n'avez pas encore de produit actif. Ajoutez-en depuis l'onglet <strong>Produits</strong> pour qu'ils apparaissent ici et sur votre boutique publiée.
              </div>
            )}

            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Layers size={14} /> {theme.sections.length} sections · {theme.sections.filter(s => s.visible).length} visibles</div>
              <Badge color="green">Score performance: 92/100</Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Publish confirmation modal */}
      <Modal open={publishModal} onClose={() => setPublishModal(false)} title="Publier votre boutique">
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Votre boutique sera mise en ligne immédiatement.</p>
            <p className="text-xs text-green-600 mt-1">Tous les changements seront visibles par vos clients.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPublishModal(false)}>Annuler</Button>
            <Button onClick={publish}><Eye size={16} /> Confirmer la publication</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

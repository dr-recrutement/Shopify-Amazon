import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Smartphone, Monitor, Eye, EyeOff, ChevronUp, ChevronDown, Plus, Trash2, Save,
} from 'lucide-react';
import { Button, Badge } from './ui';
import { TemplateRenderer } from '../../lib/theme-system/TemplateRenderer';
import { withLiveProducts } from '../../lib/theme-system/liveData';
import { fromLegacyTheme } from '../../lib/theme-system/fromLegacyTheme';
import type {
  ThemeConfig as NewThemeConfig, Section, SectionType,
  HeaderContent, HeroContent, FeaturesContent, ProductGridContent, SocialProofContent, TestimonialsContent, CTAContent, FooterContent,
} from '../../lib/theme-system/types';
import { defaultThemeForType, getVariantStyles, type ThemeConfig as LegacyThemeConfig } from '../../lib/theme-engine';
import { fetchCloudTheme, fetchCloudSettings, pushCloudSettings } from '../../lib/tenant-sync';
import { getShopProfile, getTenantStorageKey, getProducts, type StoreProduct } from '../../lib/app-state';

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  header: 'En-tête', hero: 'Bannière principale', features: 'Fonctionnalités',
  productGrid: 'Grille de produits', socialProof: 'Preuve sociale', testimonials: 'Témoignages',
  cta: "Appel à l'action", footer: 'Pied de page',
};

function newSectionDefaults(type: SectionType, id: string): Section {
  switch (type) {
    case 'header': return { id, type, active: true, styles: {}, content: { logoType: 'text', logoText: 'Ma boutique', navLinks: [], showCart: true } as HeaderContent };
    case 'hero': return { id, type, active: true, styles: { alignment: 'center', paddingTop: 'xl', paddingBottom: 'lg' }, content: { layout: 'centered', title: 'Nouveau titre', subtitle: 'Nouveau sous-titre', buttons: [] } as HeroContent };
    case 'features': return { id, type, active: true, styles: { paddingTop: 'lg', paddingBottom: 'lg' }, content: { title: 'Nos points forts', columns: 3, items: [] } as FeaturesContent };
    case 'productGrid': return { id, type, active: true, styles: { paddingTop: 'lg', paddingBottom: 'lg' }, content: { title: 'Nos produits', columns: 3, products: [] } as ProductGridContent };
    case 'socialProof': return { id, type, active: true, styles: { paddingTop: 'lg', paddingBottom: 'lg' }, content: { title: 'Ils nous font confiance', stats: [], logos: [] } as SocialProofContent };
    case 'testimonials': return { id, type, active: true, styles: { paddingTop: 'lg', paddingBottom: 'lg' }, content: { title: 'Avis clients', items: [] } as TestimonialsContent };
    case 'cta': return { id, type, active: true, styles: { alignment: 'center', paddingTop: 'lg', paddingBottom: 'lg' }, content: { title: 'Prêt à commander ?', buttonLabel: 'Voir la boutique', buttonHref: '/store' } as CTAContent };
    case 'footer': return { id, type, active: true, styles: {}, content: { logoText: 'Ma boutique', columns: [], socialLinks: [], copyright: `© ${new Date().getFullYear()}` } as FooterContent };
  }
}

function useLegacyTheme(): LegacyThemeConfig {
  const [theme, setTheme] = useState<LegacyThemeConfig>(() => {
    const saved = localStorage.getItem(getTenantStorageKey('liafrikos_theme_config'));
    if (saved) { try { return JSON.parse(saved); } catch { /* fall through */ } }
    return defaultThemeForType('ecommerce');
  });
  useEffect(() => { fetchCloudTheme<LegacyThemeConfig>().then(cloud => { if (cloud) setTheme(cloud); }); }, []);
  return theme;
}

function TextField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      {textarea ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
      ) : (
        <input value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
      )}
    </div>
  );
}

/** Property panel — a real form per section type, not a generic JSON blob
 *  editor. Product grids intentionally have no product-editing fields
 *  here: their content comes from the real catalog (Products page), shown
 *  as-is rather than letting someone type fake products into a theme. */
function PropertyPanel({ section, onChange }: { section: Section; onChange: (content: any) => void }) {
  const c = section.content as any;
  const set = (patch: object) => onChange({ ...c, ...patch });

  switch (section.type) {
    case 'header':
      return (
        <div className="space-y-3">
          <TextField label="Texte du logo" value={c.logoText} onChange={v => set({ logoText: v })} />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Afficher le panier</span>
            <input type="checkbox" checked={!!c.showCart} onChange={e => set({ showCart: e.target.checked })} />
          </div>
          <TextField label="Bouton (texte)" value={c.ctaLabel} onChange={v => set({ ctaLabel: v })} />
          <TextField label="Bouton (lien)" value={c.ctaHref} onChange={v => set({ ctaHref: v })} />
        </div>
      );
    case 'hero':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Disposition</label>
            <select value={c.layout} onChange={e => set({ layout: e.target.value })} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
              <option value="centered">Centrée</option>
              <option value="split">Deux colonnes</option>
              <option value="full-bg">Image plein fond</option>
            </select>
          </div>
          <TextField label="Titre" value={c.title} onChange={v => set({ title: v })} />
          <TextField label="Sous-titre" value={c.subtitle} onChange={v => set({ subtitle: v })} textarea />
          <TextField label="Bouton principal (texte)" value={c.buttons?.[0]?.label} onChange={v => set({ buttons: [{ ...(c.buttons?.[0] || { href: '/store', variant: 'primary' }), label: v }, ...(c.buttons?.slice(1) || [])] })} />
          <TextField label="Bouton principal (lien)" value={c.buttons?.[0]?.href} onChange={v => set({ buttons: [{ ...(c.buttons?.[0] || { label: 'En savoir plus', variant: 'primary' }), href: v }, ...(c.buttons?.slice(1) || [])] })} />
        </div>
      );
    case 'features':
      return (
        <div className="space-y-3">
          <TextField label="Titre" value={c.title} onChange={v => set({ title: v })} />
          <TextField label="Sous-titre" value={c.subtitle} onChange={v => set({ subtitle: v })} />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-600">Points forts</span>
              <button onClick={() => set({ items: [...(c.items || []), { icon: 'Sparkles', title: 'Nouveau point', description: '' }] })} className="text-brand-600 text-xs font-bold flex items-center gap-0.5"><Plus size={12} /> Ajouter</button>
            </div>
            <div className="space-y-2">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="p-2 border border-gray-150 rounded-lg space-y-1.5 bg-gray-50">
                  <div className="flex justify-end"><button onClick={() => set({ items: c.items.filter((_: any, j: number) => j !== i) })}><Trash2 size={12} className="text-gray-400 hover:text-red-500" /></button></div>
                  <input value={item.title} onChange={e => { const items = [...c.items]; items[i] = { ...item, title: e.target.value }; set({ items }); }} placeholder="Titre" className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                  <input value={item.description} onChange={e => { const items = [...c.items]; items[i] = { ...item, description: e.target.value }; set({ items }); }} placeholder="Description" className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'productGrid':
      return (
        <div className="space-y-3">
          <TextField label="Titre" value={c.title} onChange={v => set({ title: v })} />
          <TextField label="Sous-titre" value={c.subtitle} onChange={v => set({ subtitle: v })} />
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Colonnes</label>
            <select value={c.columns} onChange={e => set({ columns: parseInt(e.target.value, 10) })} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
              <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
            </select>
          </div>
          <p className="text-[10px] text-gray-400">Les produits affichés viennent automatiquement de votre catalogue (page Produits) — rien à configurer ici.</p>
        </div>
      );
    case 'socialProof':
      return (
        <div className="space-y-3">
          <TextField label="Titre" value={c.title} onChange={v => set({ title: v })} />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-600">Statistiques</span>
              <button onClick={() => set({ stats: [...(c.stats || []), { value: '0', label: 'Nouvelle statistique' }] })} className="text-brand-600 text-xs font-bold flex items-center gap-0.5"><Plus size={12} /> Ajouter</button>
            </div>
            <div className="space-y-2">
              {(c.stats || []).map((s: any, i: number) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input value={s.value} onChange={e => { const stats = [...c.stats]; stats[i] = { ...s, value: e.target.value }; set({ stats }); }} placeholder="Valeur" className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" />
                  <input value={s.label} onChange={e => { const stats = [...c.stats]; stats[i] = { ...s, label: e.target.value }; set({ stats }); }} placeholder="Libellé" className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs" />
                  <button onClick={() => set({ stats: c.stats.filter((_: any, j: number) => j !== i) })}><Trash2 size={12} className="text-gray-400 hover:text-red-500" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="space-y-3">
          <TextField label="Titre" value={c.title} onChange={v => set({ title: v })} />
          <TextField label="Sous-titre" value={c.subtitle} onChange={v => set({ subtitle: v })} />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-600">Avis</span>
              <button onClick={() => set({ items: [...(c.items || []), { id: `t${Date.now()}`, quote: '', authorName: 'Client', authorRole: '', rating: 5 }] })} className="text-brand-600 text-xs font-bold flex items-center gap-0.5"><Plus size={12} /> Ajouter</button>
            </div>
            <div className="space-y-2">
              {(c.items || []).map((t: any, i: number) => (
                <div key={t.id || i} className="p-2 border border-gray-150 rounded-lg space-y-1.5 bg-gray-50">
                  <div className="flex justify-end"><button onClick={() => set({ items: c.items.filter((_: any, j: number) => j !== i) })}><Trash2 size={12} className="text-gray-400 hover:text-red-500" /></button></div>
                  <textarea value={t.quote} onChange={e => { const items = [...c.items]; items[i] = { ...t, quote: e.target.value }; set({ items }); }} placeholder="Citation" rows={2} className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                  <input value={t.authorName} onChange={e => { const items = [...c.items]; items[i] = { ...t, authorName: e.target.value }; set({ items }); }} placeholder="Nom du client" className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                  <input value={t.authorRole} onChange={e => { const items = [...c.items]; items[i] = { ...t, authorRole: e.target.value }; set({ items }); }} placeholder="Rôle / ville" className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'cta':
      return (
        <div className="space-y-3">
          <TextField label="Titre" value={c.title} onChange={v => set({ title: v })} />
          <TextField label="Sous-titre" value={c.subtitle} onChange={v => set({ subtitle: v })} />
          <TextField label="Bouton (texte)" value={c.buttonLabel} onChange={v => set({ buttonLabel: v })} />
          <TextField label="Bouton (lien)" value={c.buttonHref} onChange={v => set({ buttonHref: v })} />
        </div>
      );
    case 'footer':
      return (
        <div className="space-y-3">
          <TextField label="Texte du logo" value={c.logoText} onChange={v => set({ logoText: v })} />
          <TextField label="Description" value={c.description} onChange={v => set({ description: v })} textarea />
          <TextField label="Copyright" value={c.copyright} onChange={v => set({ copyright: v })} />
          <p className="text-[10px] text-gray-400">Les liens CGU / Confidentialité / Remboursement viennent de Réglages → Politiques légales.</p>
        </div>
      );
    default:
      return null;
  }
}

export default function OnlineStoreCustomize() {
  const legacyTheme = useLegacyTheme();
  const shopProfile = getShopProfile();
  const [products] = useState<StoreProduct[]>(() => getProducts());
  const [config, setConfig] = useState<NewThemeConfig | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState<'idle' | 'draft' | 'publish'>('idle');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchCloudSettings().then(settings => {
      if (settings?.newThemeConfig) {
        setConfig(settings.newThemeConfig);
        setIsPublished(!!settings.useNewThemeEngine);
      }
    });
  }, []);

  // Bootstrap from the merchant's current look the first time they open
  // Customize (before any explicit save under the new schema exists).
  useEffect(() => {
    if (config) return;
    const { radius } = getVariantStyles(legacyTheme.layoutVariant);
    const base = fromLegacyTheme(legacyTheme, { shopName: shopProfile.name, countryCode: shopProfile.country, radiusClass: radius, storeUrl: '/store', supportUrl: '/support' });
    setConfig(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyTheme]);

  const renderedConfig = useMemo(() => config ? withLiveProducts(config, products) : null, [config, products]);
  const selectedSection = config?.sections.find(s => s.id === selectedId) || null;

  const updateSection = (id: string, patch: Partial<Section>) => {
    setConfig(prev => prev ? { ...prev, sections: prev.sections.map(s => s.id === id ? ({ ...s, ...patch } as Section) : s) } : prev);
  };
  const updateContent = (id: string, content: any) => {
    setConfig(prev => prev ? { ...prev, sections: prev.sections.map(s => s.id === id ? ({ ...s, content } as Section) : s) } : prev);
  };
  const moveSection = (id: string, dir: -1 | 1) => {
    setConfig(prev => {
      if (!prev) return prev;
      const idx = prev.sections.findIndex(s => s.id === id);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      [sections[idx], sections[swapWith]] = [sections[swapWith], sections[idx]];
      return { ...prev, sections };
    });
  };
  const addSection = (type: SectionType) => {
    setConfig(prev => prev ? { ...prev, sections: [...prev.sections, newSectionDefaults(type, `${type}-${Date.now()}`)] } : prev);
  };
  const removeSection = (id: string) => {
    setConfig(prev => prev ? { ...prev, sections: prev.sections.filter(s => s.id !== id) } : prev);
    if (selectedId === id) setSelectedId(null);
  };

  const persist = async (publish: boolean) => {
    if (!config) return;
    setSaving(publish ? 'publish' : 'draft');
    const current = (await fetchCloudSettings()) || {};
    await pushCloudSettings({
      ...current,
      newThemeConfig: config,
      newThemeConfigSavedAt: new Date().toISOString(),
      useNewThemeEngine: publish ? true : !!current.useNewThemeEngine,
    });
    setIsPublished(publish ? true : !!current.useNewThemeEngine);
    setSaving('idle');
    setSavedMsg(publish ? 'Publié sur votre boutique en ligne ✓' : 'Brouillon enregistré ✓');
    setTimeout(() => setSavedMsg(null), 2500);
  };

  const availableTypes = (Object.keys(SECTION_TYPE_LABELS) as SectionType[]).filter(t => !config?.sections.some(s => s.type === t) || t === 'features' || t === 'testimonials');

  if (!config || !renderedConfig) {
    return <div className="p-10 text-center text-gray-400 text-sm">Chargement de l'éditeur…</div>;
  }

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/app/online-store/themes" className="text-gray-500 hover:text-gray-900"><ArrowLeft size={18} /></Link>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Sellia Pro</p>
            <p className="text-[10px] text-gray-400 leading-tight">Page d'accueil</p>
          </div>
          <Badge color={isPublished ? 'green' : 'gray'}>{isPublished ? 'En ligne' : 'Brouillon'}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-xs text-green-600 font-semibold">{savedMsg}</span>}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg mr-2">
            <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-md ${device === 'desktop' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}><Monitor size={14} /></button>
            <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-md ${device === 'mobile' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}><Smartphone size={14} /></button>
          </div>
          <Button variant="secondary" size="sm" onClick={() => persist(false)} disabled={saving !== 'idle'}>
            <Save size={14} /> {saving === 'draft' ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button size="sm" className="bg-gray-950 hover:bg-gray-800 text-white" onClick={() => persist(true)} disabled={saving !== 'idle'}>
            {saving === 'publish' ? 'Publication…' : 'Publier'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: section list */}
        <div className="w-64 border-r border-gray-200 overflow-y-auto shrink-0 p-2">
          {config.sections.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`group flex items-center gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold ${selectedId === s.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <button onClick={e => { e.stopPropagation(); updateSection(s.id, { active: !s.active }); }} className="text-gray-400 hover:text-gray-700 shrink-0">
                {s.active ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <span className={`flex-1 truncate ${!s.active ? 'opacity-40' : ''}`}>{SECTION_TYPE_LABELS[s.type]}</span>
              <button onClick={e => { e.stopPropagation(); moveSection(s.id, -1); }} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-0 shrink-0"><ChevronUp size={13} /></button>
              <button onClick={e => { e.stopPropagation(); moveSection(s.id, 1); }} disabled={i === config.sections.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-0 shrink-0"><ChevronDown size={13} /></button>
              <button onClick={e => { e.stopPropagation(); removeSection(s.id); }} className="text-gray-300 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Ajouter une section</p>
            {availableTypes.map(t => (
              <button key={t} onClick={() => addSection(t)} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-1.5">
                <Plus size={12} /> {SECTION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Center: live preview */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div className={`mx-auto bg-white shadow-xl transition-all ${device === 'mobile' ? 'max-w-[380px]' : 'max-w-full'}`}>
            <TemplateRenderer config={renderedConfig} />
          </div>
        </div>

        {/* Right: property panel */}
        <div className="w-72 border-l border-gray-200 overflow-y-auto shrink-0 p-4">
          {selectedSection ? (
            <>
              <p className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">{SECTION_TYPE_LABELS[selectedSection.type]}</p>
              <PropertyPanel section={selectedSection} onChange={content => updateContent(selectedSection.id, content)} />
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center mt-8">Sélectionnez une section à gauche pour la modifier.</p>
          )}
        </div>
      </div>
    </div>
  );
}

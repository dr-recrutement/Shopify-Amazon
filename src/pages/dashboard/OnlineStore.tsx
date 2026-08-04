import { PageHeader, Card, Button, Badge } from './ui';
import {
  Store, Smartphone, Tablet, Monitor, Palette, Eye, History, Layers, Plus,
  Trash2, GripVertical, Upload, FileText, Settings as SettingsIcon, ArrowUp,
  ArrowDown, ArrowLeft, Check, Sparkles, Globe, RefreshCw, AlertCircle, Info
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY,
  defaultThemeForType, renderSection, THEME_PRESETS, FONT_OPTIONS, ThemePreset
} from '../../lib/theme-engine';

export default function OnlineStore() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Theme state persisted to localStorage
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const cached = localStorage.getItem('liafrikos_theme_config');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached theme", e);
      }
    }
    return defaultThemeForType('ecommerce');
  });

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [panel, setPanel] = useState<'sections' | 'themes' | 'design' | 'pages' | 'settings'>('sections');

  // Custom alerts and status feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Auto-save theme changes
  useEffect(() => {
    localStorage.setItem('liafrikos_theme_config', JSON.stringify(theme));
  }, [theme]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setSiteType = (t: SiteType) => {
    const defaultTheme = defaultThemeForType(t);
    setTheme(defaultTheme);
    setSelectedSection(null);
    showToast(`Type de site changé pour : ${t}`, 'info');
  };

  const selectPreset = (p: ThemePreset) => {
    const presetConfig = THEME_PRESETS[p];
    if (presetConfig) {
      setTheme({
        ...theme,
        preset: p,
        colors: { ...presetConfig.colors },
        fonts: { ...presetConfig.fonts }
      });
      showToast(`Thème appliqué : ${presetConfig.label}`);
    }
  };

  const addSection = (type: ThemeSection['type']) => {
    const defaultProps: Record<string, any> = {};

    // Assign sensible defaults based on type
    if (type === 'header') {
      defaultProps.logoText = 'Ma Boutique';
      defaultProps.nav = ['Accueil', 'Boutique', 'Contact'];
    } else if (type === 'hero') {
      defaultProps.title = 'Nouveau Titre Accrocheur';
      defaultProps.subtitle = 'Description de votre collection phare.';
      defaultProps.cta = 'Acheter';
    } else if (type === 'product-grid') {
      defaultProps.title = 'Nouveaux Produits';
      defaultProps.columns = 4;
      defaultProps.showPrice = true;
    } else if (type === 'countdown') {
      defaultProps.title = 'Offre Spéciale';
      defaultProps.endDate = '2026-12-31';
    } else if (type === 'testimonials') {
      defaultProps.title = 'Avis Clients';
      defaultProps.items = 'Superbe boutique ! - Marie;Excellent accueil - Jean';
    } else if (type === 'newsletter') {
      defaultProps.title = 'Restez Informé';
      defaultProps.subtitle = 'Inscrivez-vous pour obtenir des réductions.';
      defaultProps.buttonText = "M'abonner";
    } else if (type === 'about') {
      defaultProps.title = 'Notre Histoire';
      defaultProps.content = 'Nous créons des produits uniques depuis 2020.';
    } else if (type === 'faq') {
      defaultProps.title = 'Foire Aux Questions';
      defaultProps.items = 'Livrez-vous partout ? - Oui, partout en Afrique;Puis-je retourner un article ? - Sous 14 jours';
    }

    const newSec: ThemeSection = {
      id: `s${Date.now()}`,
      type,
      visible: true,
      props: defaultProps
    };

    setTheme({
      ...theme,
      sections: [...theme.sections, newSec]
    });
    setSelectedSection(newSec.id);
    showToast(`Section "${type}" ajoutée !`);
  };

  const removeSection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTheme({ ...theme, sections: theme.sections.filter(s => s.id !== id) });
    if (selectedSection === id) setSelectedSection(null);
    showToast('Section supprimée');
  };

  const toggleSection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTheme({
      ...theme,
      sections: theme.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s),
    });
  };

  const moveSection = (id: string, dir: -1 | 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idx = theme.sections.findIndex(s => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= theme.sections.length) return;
    const sections = [...theme.sections];
    [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
    setTheme({ ...theme, sections });
  };

  const updateSectionProp = (sectionId: string, key: string, value: any) => {
    setTheme({
      ...theme,
      sections: theme.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            props: {
              ...s.props,
              [key]: value
            }
          };
        }
        return s;
      })
    });
  };

  const updateColor = (key: keyof ThemeConfig['colors'], value: string) => {
    setTheme({ ...theme, colors: { ...theme.colors, [key]: value } });
  };

  const updateFont = (key: keyof ThemeConfig['fonts'], value: string) => {
    setTheme({ ...theme, fonts: { ...theme.fonts, [key]: value } });
  };

  const publish = () => {
    setTheme({ ...theme, isPublished: true });
    showToast("Votre boutique est publiée en ligne sur ma-boutique.liafrikos.com !", 'success');
  };

  const saveDraft = () => {
    setTheme({ ...theme, isPublished: false });
    showToast("Brouillon enregistré avec succès !", 'info');
  };

  const deviceWidth = device === 'mobile' ? 'max-w-[340px] h-[550px]' : device === 'tablet' ? 'max-w-[650px] h-[750px]' : 'max-w-full min-h-[600px]';

  // Find the selected section in the configuration
  const currentEditingSection = theme.sections.find(s => s.id === selectedSection);

  return (
    <div className="relative">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border bg-white animate-slide-in text-xs font-semibold text-gray-800"
          style={{ borderColor: toast.type === 'success' ? '#10B981' : '#3B82F6' }}>
          <span className={toast.type === 'success' ? 'text-green-500' : 'text-blue-500'}>●</span>
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Boutique en ligne (CMS Professionnel)"
        subtitle="Éditeur de thèmes ultra-moderne inspiré de Shopify. Modifiez tout en temps réel, sans code."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={saveDraft}>
              <History size={14} className="mr-1" /> Brouillon
            </Button>
            <Button size="sm" onClick={publish} className="bg-orange-600 hover:bg-orange-700">
              <Eye size={14} className="mr-1" /> Publier la boutique
            </Button>
          </div>
        }
      />

      {/* Main CMS Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN: Sidebar controllers (CMS Panel) */}
        <div className="xl:col-span-4 space-y-4">

          {/* Main Navigation tabs for the editor */}
          <Card className="p-1.5 shadow-sm bg-gray-50/50">
            <div className="flex gap-1">
              {[
                { id: 'sections', label: 'Blocs', icon: Layers },
                { id: 'themes', label: 'Thèmes', icon: Store },
                { id: 'design', label: 'Style', icon: Palette },
                { id: 'pages', label: 'Pages', icon: FileText },
                { id: 'settings', label: 'Paramètres', icon: SettingsIcon }
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setPanel(t.id as any); setSelectedSection(null); }}
                    className={`flex-1 py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                      panel === t.id && !selectedSection
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={15} />
                    <span className="text-[10px] font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* DYNAMIC SIDEBAR CONTENT */}

          {/* 1. Dynamic Section Property Editor (Show if a section is selected) */}
          {selectedSection && currentEditingSection ? (
            <Card className="p-4 border-2 border-orange-500 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b mb-4">
                <button
                  onClick={() => setSelectedSection(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  <ArrowLeft size={14} /> Retour aux blocs
                </button>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {currentEditingSection.type}
                </span>
              </div>

              <h4 className="text-xs font-black uppercase text-gray-400 mb-3 tracking-wider">
                Configuration de la section
              </h4>

              {/* Dynamic properties form matching the section type */}
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">

                {/* Header Section Editing */}
                {currentEditingSection.type === 'header' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Nom ou logo de la boutique</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.logoText || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'logoText', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">URL Image Logo (optionnel)</label>
                      <input
                        type="text"
                        placeholder="https://ex.com/logo.png"
                        value={currentEditingSection.props.logoImage || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'logoImage', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Menu de navigation (séparé par virgules)</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.nav ? currentEditingSection.props.nav.join(', ') : ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'nav', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-[11px] font-medium text-gray-700">Activer le Méga Menu</span>
                      <input
                        type="checkbox"
                        checked={currentEditingSection.props.megaMenu || false}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'megaMenu', e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                      />
                    </div>
                  </>
                )}

                {/* Hero Banner Section Editing */}
                {currentEditingSection.type === 'hero' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre principal</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.title || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Sous-titre descriptif</label>
                      <textarea
                        rows={3}
                        value={currentEditingSection.props.subtitle || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'subtitle', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Texte du bouton d'action (CTA)</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.cta || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'cta', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Image d'arrière-plan (URL)</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={currentEditingSection.props.image || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'image', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Alignement du texte</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['left', 'center', 'right'].map(align => (
                          <button
                            key={align}
                            onClick={() => updateSectionProp(currentEditingSection.id, 'alignment', align)}
                            className={`py-1 rounded text-[10px] font-bold capitalize transition-all ${
                              currentEditingSection.props.alignment === align
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Product Grid Section Editing */}
                {currentEditingSection.type === 'product-grid' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de la grille</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.title || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Nombre de colonnes (Max 4)</label>
                      <select
                        value={currentEditingSection.props.columns || 4}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'columns', parseInt(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      >
                        {[2, 3, 4].map(c => <option key={c} value={c}>{c} colonnes</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-[11px] font-medium text-gray-700">Afficher le prix des articles</span>
                      <input
                        type="checkbox"
                        checked={currentEditingSection.props.showPrice !== false}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'showPrice', e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                      />
                    </div>
                  </>
                )}

                {/* Category Grid Section Editing */}
                {currentEditingSection.type === 'category-grid' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de la section</label>
                    <input
                      type="text"
                      value={currentEditingSection.props.title || ''}
                      onChange={e => updateSectionProp(currentEditingSection.id, 'title', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                )}

                {/* Countdown Timer Section Editing */}
                {currentEditingSection.type === 'countdown' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de l'offre flash</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.title || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Date d'expiration</label>
                      <input
                        type="date"
                        value={currentEditingSection.props.endDate || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'endDate', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Testimonials Section Editing */}
                {currentEditingSection.type === 'testimonials' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre des avis</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.title || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Avis clients (formule: avis - nom; avis - nom)</label>
                      <textarea
                        rows={4}
                        placeholder="Le tissu est magnifique - Amina; Livraison rapide - Koffi"
                        value={currentEditingSection.props.items || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'items', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Newsletter Section Editing */}
                {currentEditingSection.type === 'newsletter' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre d'inscription</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.title || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Texte de description</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.subtitle || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'subtitle', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Texte du bouton</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.buttonText || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'buttonText', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </>
                )}

                {/* About Section Editing */}
                {currentEditingSection.type === 'about' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.title || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Contenu textuel</label>
                      <textarea
                        rows={4}
                        value={currentEditingSection.props.content || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'content', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </>
                )}

                {/* FAQ Section Editing */}
                {currentEditingSection.type === 'faq' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de la FAQ</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.title || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Questions/Réponses (format: Q - R; Q - R)</label>
                      <textarea
                        rows={4}
                        placeholder="Quels sont les délais ? - 2 jours; Où livrez-vous ? - Partout"
                        value={currentEditingSection.props.items || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'items', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Footer Section Editing */}
                {currentEditingSection.type === 'footer' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Texte de copyright</label>
                      <input
                        type="text"
                        value={currentEditingSection.props.copyright || ''}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'copyright', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-[11px] font-medium text-gray-700">Afficher les réseaux sociaux</span>
                      <input
                        type="checkbox"
                        checked={currentEditingSection.props.showSocials !== false}
                        onChange={e => updateSectionProp(currentEditingSection.id, 'showSocials', e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                      />
                    </div>
                  </>
                )}

                {/* Chat Float Editing */}
                {currentEditingSection.type === 'chat-float' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Message d'accroche chat</label>
                    <input
                      type="text"
                      value={currentEditingSection.props.message || ''}
                      onChange={e => updateSectionProp(currentEditingSection.id, 'message', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                )}

                {/* Default text if no specific inputs */}
                {!['header', 'hero', 'product-grid', 'category-grid', 'countdown', 'testimonials', 'newsletter', 'about', 'faq', 'footer', 'chat-float'].includes(currentEditingSection.type) && (
                  <p className="text-xs text-gray-500 italic">Cette section ne requiert aucun paramètre d'édition.</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex justify-end">
                <Button variant="danger" size="sm" onClick={(e: React.MouseEvent) => removeSection(currentEditingSection.id, e)} className="flex items-center gap-1">
                  <Trash2 size={12} /> Supprimer ce bloc
                </Button>
              </div>
            </Card>
          ) : null}


          {/* 2. Normal View Panel: Blocks/Sections */}
          {panel === 'sections' && !selectedSection && (
            <Card className="p-4 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-gray-400 mb-1 tracking-wider">
                  Type de vitrine active
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {SITE_TYPES.map(st => (
                    <button
                      key={st.id}
                      onClick={() => setSiteType(st.id)}
                      className={`text-left p-2.5 rounded-xl border-2 transition-all ${
                        theme.siteType === st.id
                          ? 'border-orange-500 bg-orange-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-gray-900 leading-tight">{st.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                    Structure de la page ({theme.sections.length})
                  </h3>
                  <Badge color="orange">Drag & Drop visual</Badge>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {theme.sections.map((s, i) => {
                    const lib = SECTION_LIBRARY.find(l => l.type === s.type);
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSection(s.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border cursor-pointer hover:border-orange-300 transition-all ${
                          selectedSection === s.id
                            ? 'border-orange-500 bg-orange-50/60 font-semibold'
                            : 'border-gray-100 bg-white'
                        }`}
                      >
                        <GripVertical size={13} className="text-gray-300 cursor-grab" />
                        <span className="text-[11px] text-gray-400 font-mono w-4">{i + 1}</span>
                        <div className="flex-1 text-left text-xs text-gray-700">
                          {lib?.icon} <span className="ml-1 font-semibold">{lib?.label || s.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            disabled={i === 0}
                            onClick={(e) => moveSection(s.id, -1, e)}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            disabled={i === theme.sections.length - 1}
                            onClick={(e) => moveSection(s.id, 1, e)}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSection(s.id); }}
                            className={`p-1 text-[10px] font-black leading-none ${s.visible ? 'text-green-500' : 'text-gray-300'}`}
                            title={s.visible ? 'Masquer la section' : 'Afficher la section'}
                          >
                            ●
                          </button>
                          <button
                            onClick={(e) => removeSection(s.id, e)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">
                  Ajouter une section
                </p>
                <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {SECTION_LIBRARY.map(lib => (
                    <button
                      key={lib.type}
                      onClick={() => addSection(lib.type)}
                      className="text-left p-1.5 rounded-xl text-[11px] hover:bg-orange-50 hover:border-orange-200 transition-all border border-gray-100 flex items-center gap-1 bg-white font-medium text-gray-700"
                    >
                      <span className="text-xs">{lib.icon}</span>
                      <span className="truncate">{lib.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* 3. Normal View Panel: Premium Theme Presets */}
          {panel === 'themes' && !selectedSection && (
            <Card className="p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-400 mb-1 tracking-wider">
                <Store size={14} className="text-orange-500" />
                Bibliothèque de Thèmes Officiels
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {(Object.keys(THEME_PRESETS) as ThemePreset[]).map(key => {
                  const preset = THEME_PRESETS[key];
                  const isSelected = theme.preset === key;
                  return (
                    <div
                      key={key}
                      onClick={() => selectPreset(key)}
                      className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{preset.label}</span>
                        {isSelected && <Badge color="orange">Actif</Badge>}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        {preset.desc}
                      </p>

                      {/* Color Preview Swatch */}
                      <div className="flex items-center gap-1 mt-2.5">
                        <span className="text-[9px] font-semibold text-gray-400 mr-1">Palette:</span>
                        <div className="flex -space-x-1">
                          {[preset.colors.primary, preset.colors.accent, preset.colors.background, preset.colors.text].map((c, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-white shadow-sm inline-block"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-gray-400 font-mono ml-auto">
                          {preset.fonts.heading} / {preset.fonts.body}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 4. Normal View Panel: Design/Styling */}
          {panel === 'design' && !selectedSection && (
            <Card className="p-4 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-gray-400 mb-2.5 tracking-wider">
                  Couleurs Personnalisées
                </h3>
                <div className="space-y-2.5">
                  {[
                    { key: 'primary' as const, label: 'Couleur Primaire (Boutons, Accent)' },
                    { key: 'secondary' as const, label: 'Couleur Secondaire (Tags, Badges)' },
                    { key: 'accent' as const, label: 'Couleur d\'Accentuation (Bannières)' },
                    { key: 'background' as const, label: 'Couleur d\'Arrière-plan' },
                    { key: 'text' as const, label: 'Couleur du Texte' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-3 p-1 bg-gray-50 rounded-xl px-2">
                      <div className="text-[11px] font-medium text-gray-700 truncate">{label}</div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="color"
                          value={theme.colors[key]}
                          onChange={e => updateColor(key, e.target.value)}
                          className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer overflow-hidden p-0"
                        />
                        <input
                          type="text"
                          value={theme.colors[key]}
                          onChange={e => updateColor(key, e.target.value)}
                          className="w-14 px-1.5 py-0.5 border border-gray-200 rounded text-[9px] font-mono text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">
                  Typographie de la marque
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Police des Titres</label>
                    <select
                      value={theme.fonts.heading}
                      onChange={e => updateFont('heading', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    >
                      {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Police du Corps de texte</label>
                    <select
                      value={theme.fonts.body}
                      onChange={e => updateFont('body', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    >
                      {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Espacement global</label>
                <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
                  {([
                    { id: 'compact', label: 'Compact' },
                    { id: 'comfortable', label: 'Normal' },
                    { id: 'spacious', label: 'Spacieux' }
                  ] as const).map(s => (
                    <button
                      key={s.id}
                      onClick={() => setTheme({ ...theme, spacing: s.id })}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        theme.spacing === s.id
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* 5. Normal View Panel: Custom Pages */}
          {panel === 'pages' && !selectedSection && (
            <Card className="p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Pages Personnalisées</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-[10px] py-1 px-2 flex items-center gap-1"
                  onClick={() => showToast("Création d'une nouvelle page personnalisée...", "info")}
                >
                  <Plus size={11} /> Créer
                </Button>
              </div>

              <div className="space-y-1.5">
                {[
                  { n: 'À propos de nous', path: '/about', status: 'Publié' },
                  { n: 'Formulaire de Contact', path: '/contact', status: 'Publié' },
                  { n: 'Foire Aux Questions', path: '/faq', status: 'Brouillon' }
                ].map(p => (
                  <div key={p.n} className="p-2.5 hover:bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-gray-800">{p.n}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{p.path}</div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                      p.status === 'Publié' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 6. Normal View Panel: Preferences/Settings */}
          {panel === 'settings' && !selectedSection && (
            <Card className="p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-gray-400 mb-1 tracking-wider">Préférences SEO & Médias</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre d'onglet SEO de la boutique</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    defaultValue="Ma Boutique Artisanal - Mode & Deco"
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Méta-description SEO pour Google</label>
                  <textarea
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    rows={2}
                    defaultValue="Créations de mode traditionnelles et artisanat haut de gamme livrés directement chez vous."
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Favicon officiel de la boutique (.ico ou .png)</label>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs flex items-center justify-center gap-1"
                      onClick={() => showToast("Téléversement du favicon démarré...", "info")}
                    >
                      <Upload size={13} /> Choisir une icône
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs flex items-center justify-center gap-1"
                    onClick={() => showToast("Importation du fichier JSON de thème...", "info")}
                  >
                    <Upload size={13} /> Importer un thème externe (.json)
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Realtime visual preview simulator */}
        <div className="xl:col-span-8">
          <Card className="p-4 shadow-md bg-gray-100/50">

            {/* Preview device header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-orange-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-700">Aperçu en temps réel:</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 font-extrabold tracking-tight">
                  {theme.isPublished ? 'ma-boutique.liafrikos.com' : 'Mode Brouillon'}
                </span>
              </div>

              {/* Responsive buttons switcher */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shrink-0">
                {([
                  { id: 'desktop', icon: Monitor, label: 'Ordinateur' },
                  { id: 'tablet', icon: Tablet, label: 'Tablette' },
                  { id: 'mobile', icon: Smartphone, label: 'Mobile' }
                ] as const).map(d => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDevice(d.id)}
                      className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                        device === d.id
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-500 hover:bg-gray-200'
                      }`}
                      title={d.label}
                    >
                      <Icon size={14} />
                      <span className="text-[10px] font-bold hidden md:inline">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated browser window with URL bar */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/80 transition-all duration-300">

              {/* Browser chrome header bar */}
              <div className="bg-gray-100/80 px-4 py-2 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                </div>

                {/* Simulated URL Bar */}
                <div className="mx-auto max-w-md w-full bg-white rounded-lg px-3 py-1 border text-[10px] text-gray-400 font-mono flex items-center justify-between shadow-inner">
                  <span className="truncate">https://ma-boutique.liafrikos.com</span>
                  <RefreshCw size={10} className="text-gray-300 cursor-pointer hover:text-gray-600" />
                </div>
              </div>

              {/* The Rendered Preview Area */}
              <div className="bg-gray-50 flex items-center justify-center p-4 overflow-y-auto scrollbar-thin min-h-[500px]">

                <div
                  className={`w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 ${deviceWidth}`}
                  style={{ backgroundColor: theme.colors.background }}
                >

                  {/* Visual components mapping */}
                  {theme.sections.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center h-48">
                      <AlertCircle size={32} className="mb-2 text-gray-300" />
                      <p className="text-xs font-semibold">Aucun bloc configuré sur la page.</p>
                      <button
                        onClick={() => addSection('hero')}
                        className="mt-3 text-xs text-orange-600 font-bold hover:underline"
                      >
                        Ajouter un bloc d'accueil
                      </button>
                    </div>
                  ) : (
                    theme.sections
                      .filter(s => s.visible)
                      .map(s => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSection(s.id)}
                          className={`cursor-pointer group relative transition-all duration-200 ${
                            selectedSection === s.id
                              ? 'ring-2 ring-orange-500 ring-offset-1 z-10'
                              : 'hover:ring-2 hover:ring-orange-300 hover:ring-offset-1'
                          }`}
                        >
                          {/* Floating Indicator when editing */}
                          {selectedSection === s.id && (
                            <span className="absolute top-1 right-2 z-20 text-[9px] bg-orange-500 text-white font-extrabold px-2 py-0.5 rounded-md shadow-sm">
                              En cours d'édition
                            </span>
                          )}

                          {/* Render the engine component */}
                          {renderSection(s, theme)}
                        </div>
                      ))
                  )}
                </div>

              </div>

            </div>

            {/* Bottom metadata */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Info size={13} className="text-orange-500" />
                <span>Cliquez sur n'importe quel bloc de l'aperçu pour modifier son contenu.</span>
              </div>
              <Badge color="green">Indexé SEO & Mobile Responsive</Badge>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}

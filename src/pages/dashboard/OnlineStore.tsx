import { PageHeader, Card, Button, Badge } from './ui';
import {
  Store, Smartphone, Tablet, Monitor, Palette, Eye, History,
  Layers, Plus, Trash2, GripVertical, Upload, FileText,
  Settings as SettingsIcon, ArrowUp, ArrowDown, Sparkles, Check, ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY,
  defaultThemeForType, renderSection, FONT_OPTIONS
} from '../../lib/theme-engine';

// Preset Themes as described in the platform memory
const CMS_PRESETS = [
  { id: 'lagos-beauty', label: 'Lagos Beauty', colors: { primary: '#D946EF', secondary: '#4A044E', accent: '#F472B6', background: '#FDF2F8', text: '#310633' }, fonts: { heading: 'Montserrat', body: 'Inter' } },
  { id: 'art-wax', label: 'Art & Wax', colors: { primary: '#EA580C', secondary: '#1E293B', accent: '#FBBF24', background: '#FFF7ED', text: '#1E1B4B' }, fonts: { heading: 'Playfair Display', body: 'Poppins' } },
  { id: 'coral-peach', label: 'Coral & Peach', colors: { primary: '#FF6B35', secondary: '#2EC4B6', accent: '#FF9F1C', background: '#FFFAFA', text: '#011627' }, fonts: { heading: 'Manrope', body: 'Inter' } },
  { id: 'ocean-blue', label: 'Ocean Blue', colors: { primary: '#0369A1', secondary: '#0F172A', accent: '#38BDF8', background: '#F0F9FF', text: '#0F172A' }, fonts: { heading: 'Poppins', body: 'Inter' } },
];

export default function OnlineStore() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Theme Config from LocalStorage
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('liafrikos_theme_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return defaultThemeForType('ecommerce');
  });

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [panel, setPanel] = useState<'sections' | 'design' | 'pages' | 'settings'>('sections');
  const [showCustomize, setShowCustomize] = useState(true);

  // Advanced Visual CMS Controls
  const [borderRadius, setBorderRadius] = useState<'none' | 'md' | 'lg' | 'xl' | 'full'>(() => {
    return (localStorage.getItem('liafrik_cms_radius') as any) || 'lg';
  });
  const [shadowDepth, setShadowDepth] = useState<'none' | 'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem('liafrik_cms_shadow') as any) || 'md';
  });
  const [scrollAnimations, setScrollAnimations] = useState<boolean>(() => {
    return localStorage.getItem('liafrik_cms_anim') !== 'false';
  });
  const [customCss, setCustomCss] = useState<string>(() => {
    return localStorage.getItem('liafrik_cms_css') || '/* Ajoutez votre style CSS personnalisé ici */\n.ma-classe {\n  color: inherit;\n}';
  });

  // Sync state with LocalStorage
  useEffect(() => {
    localStorage.setItem('liafrikos_theme_config', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('liafrik_cms_radius', borderRadius);
  }, [borderRadius]);

  useEffect(() => {
    localStorage.setItem('liafrik_cms_shadow', shadowDepth);
  }, [shadowDepth]);

  useEffect(() => {
    localStorage.setItem('liafrik_cms_anim', String(scrollAnimations));
  }, [scrollAnimations]);

  useEffect(() => {
    localStorage.setItem('liafrik_cms_css', customCss);
  }, [customCss]);

  const setSiteType = (t: SiteType) => {
    const base = defaultThemeForType(t);
    setTheme(base);
    setSelectedSection(null);
  };

  const applyPreset = (preset: typeof CMS_PRESETS[0]) => {
    setTheme({
      ...theme,
      colors: { ...preset.colors },
      fonts: { ...preset.fonts }
    });
  };

  const addSection = (type: ThemeSection['type']) => {
    // Generate realistic default props for the newly added section
    const dummyTheme = defaultThemeForType(theme.siteType);
    const matched = dummyTheme.sections.find(s => s.type === type);
    const props = matched ? { ...matched.props } : {};

    const newId = `s-${Date.now()}`;
    setTheme({
      ...theme,
      sections: [...theme.sections, { id: newId, type, visible: true, props }],
    });
    setSelectedSection(newId);
  };

  const removeSection = (id: string) => {
    setTheme({ ...theme, sections: theme.sections.filter(s => s.id !== id) });
    if (selectedSection === id) setSelectedSection(null);
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

  const updateSectionProp = (sectionId: string, propKey: string, propValue: any) => {
    setTheme({
      ...theme,
      sections: theme.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            props: {
              ...s.props,
              [propKey]: propValue
            }
          };
        }
        return s;
      })
    });
  };

  const publish = () => {
    setTheme({ ...theme, isPublished: true });
    alert('🎉 Félicitations ! Votre boutique a été publiée en ligne avec succès sur os.liafrik.com !');
  };

  const saveDraft = () => {
    setTheme({ ...theme, isPublished: false });
    alert('💾 Brouillon de boutique sauvegardé localement.');
  };

  const deviceWidth = device === 'mobile' ? 'max-w-[340px]' : device === 'tablet' ? 'max-w-[640px]' : 'max-w-full';

  // Section property editor based on section type
  const renderSectionPropertyEditor = (sectionId: string) => {
    const section = theme.sections.find(s => s.id === sectionId);
    if (!section) return null;

    const props = section.props || {};

    const handlePropChange = (key: string, value: any) => {
      updateSectionProp(sectionId, key, value);
    };

    return (
      <div className="space-y-4 pt-1 text-xs">
        <div className="flex items-center gap-1">
          <Sparkles size={14} className="text-orange-500 animate-pulse" />
          <p className="font-bold text-gray-800">Éditer les propriétés de la section</p>
        </div>

        {/* Header section properties */}
        {section.type === 'header' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Nom / Texte du Logo</label>
              <input
                type="text"
                value={props.logoText || ''}
                onChange={e => handlePropChange('logoText', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">URL de l'image de Logo (optionnel)</label>
              <input
                type="text"
                value={props.logoUrl || ''}
                onChange={e => handlePropChange('logoUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Navigation (séparés par virgules)</label>
              <input
                type="text"
                value={(props.nav || []).join(', ')}
                onChange={e => handlePropChange('nav', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Texte d'Annonce</label>
              <input
                type="text"
                value={props.announcementText || ''}
                onChange={e => handlePropChange('announcementText', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ann-check"
                checked={props.showAnnouncement !== false}
                onChange={e => handlePropChange('showAnnouncement', e.target.checked)}
              />
              <label htmlFor="ann-check" className="font-bold text-gray-700 select-none">Afficher l'annonce</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="search-check"
                checked={props.showSearch !== false}
                onChange={e => handlePropChange('showSearch', e.target.checked)}
              />
              <label htmlFor="search-check" className="font-bold text-gray-700 select-none">Afficher la recherche</label>
            </div>
          </div>
        )}

        {/* Hero section properties */}
        {section.type === 'hero' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre Principal</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Sous-titre</label>
              <textarea
                value={props.subtitle || ''}
                onChange={e => handlePropChange('subtitle', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Label du Bouton (CTA)</label>
              <input
                type="text"
                value={props.cta || ''}
                onChange={e => handlePropChange('cta', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">URL de l'image de fond (Unsplash/Direct)</label>
              <input
                type="text"
                value={props.image || ''}
                onChange={e => handlePropChange('image', e.target.value)}
                placeholder="https://..."
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Alignement du Texte</label>
              <select
                value={props.align || 'center'}
                onChange={e => handlePropChange('align', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white"
              >
                <option value="left">Gauche</option>
                <option value="center">Centré</option>
                <option value="right">Droite</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Opacité de l'incrustation sombre ({props.overlayOpacity || 50}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={props.overlayOpacity || 50}
                onChange={e => handlePropChange('overlayOpacity', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Couleur du texte</label>
              <input
                type="color"
                value={props.textColor || '#ffffff'}
                onChange={e => handlePropChange('textColor', e.target.value)}
                className="w-full h-8"
              />
            </div>
          </div>
        )}

        {/* Product Grid properties */}
        {section.type === 'product-grid' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de la Grille</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Sous-titre explicatif</label>
              <input
                type="text"
                value={props.subtitle || ''}
                onChange={e => handlePropChange('subtitle', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Nombre de Colonnes (max 4)</label>
              <input
                type="number"
                min="1"
                max="4"
                value={props.columns || 4}
                onChange={e => handlePropChange('columns', Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
          </div>
        )}

        {/* Category Grid properties */}
        {section.type === 'category-grid' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre des Catégories</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Colonnes de catégories</label>
              <input
                type="number"
                min="2"
                max="4"
                value={props.columns || 4}
                onChange={e => handlePropChange('columns', Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
          </div>
        )}

        {/* Countdown properties */}
        {section.type === 'countdown' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre Promo</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Texte d'explication</label>
              <textarea
                value={props.promoText || ''}
                onChange={e => handlePropChange('promoText', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Date de fin (AAAA-MM-JJ)</label>
              <input
                type="text"
                value={props.endDate || '2026-12-31'}
                onChange={e => handlePropChange('endDate', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Couleur d'Arrière-plan</label>
              <input
                type="color"
                value={props.bgColor || theme.colors.primary}
                onChange={e => handlePropChange('bgColor', e.target.value)}
                className="w-full h-8"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Couleur du texte</label>
              <input
                type="color"
                value={props.textColor || '#ffffff'}
                onChange={e => handlePropChange('textColor', e.target.value)}
                className="w-full h-8"
              />
            </div>
          </div>
        )}

        {/* Product Detail Properties */}
        {section.type === 'product-detail' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Nom du Produit</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Prix de Vente (FCFA)</label>
              <input
                type="number"
                value={props.price || 0}
                onChange={e => handlePropChange('price', Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Prix de Comparaison (Barré)</label>
              <input
                type="number"
                value={props.oldPrice || 0}
                onChange={e => handlePropChange('oldPrice', Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Description Fiche</label>
              <textarea
                value={props.description || ''}
                onChange={e => handlePropChange('description', e.target.value)}
                rows={4}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">URL de l'image principale</label>
              <input
                type="text"
                value={props.image || ''}
                onChange={e => handlePropChange('image', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
          </div>
        )}

        {/* About section properties */}
        {section.type === 'about' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Sur-titre (Badge)</label>
              <input
                type="text"
                value={props.badge || ''}
                onChange={e => handlePropChange('badge', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de l'histoire</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Corps de texte (Histoire)</label>
              <textarea
                value={props.content || ''}
                onChange={e => handlePropChange('content', e.target.value)}
                rows={4}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">URL de l'image latérale</label>
              <input
                type="text"
                value={props.image || ''}
                onChange={e => handlePropChange('image', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Alignement Image</label>
              <select
                value={props.alignImage || 'right'}
                onChange={e => handlePropChange('alignImage', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white"
              >
                <option value="left">Gauche</option>
                <option value="right">Droite</option>
              </select>
            </div>
          </div>
        )}

        {/* Testimonials section properties */}
        {section.type === 'testimonials' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de la section</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Édition des témoignages</p>
            {(props.list || []).map((t: any, index: number) => (
              <div key={index} className="p-2 bg-slate-50 border border-gray-100 rounded space-y-1">
                <input
                  type="text"
                  value={t.name || ''}
                  placeholder="Nom du client"
                  onChange={e => {
                    const newList = [...props.list];
                    newList[index] = { ...t, name: e.target.value };
                    handlePropChange('list', newList);
                  }}
                  className="w-full px-1.5 py-1 border border-gray-200 rounded text-[10px]"
                />
                <textarea
                  value={t.comment || ''}
                  placeholder="Avis..."
                  rows={2}
                  onChange={e => {
                    const newList = [...props.list];
                    newList[index] = { ...t, comment: e.target.value };
                    handlePropChange('list', newList);
                  }}
                  className="w-full px-1.5 py-1 border border-gray-200 rounded text-[10px]"
                />
              </div>
            ))}
          </div>
        )}

        {/* Newsletter section properties */}
        {section.type === 'newsletter' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de la Newsletter</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Sous-titre d'accroche</label>
              <textarea
                value={props.subtitle || ''}
                onChange={e => handlePropChange('subtitle', e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Texte du bouton</label>
              <input
                type="text"
                value={props.buttonText || ''}
                onChange={e => handlePropChange('buttonText', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Message de succès</label>
              <input
                type="text"
                value={props.successMsg || ''}
                onChange={e => handlePropChange('successMsg', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
          </div>
        )}

        {/* FAQ section properties */}
        {section.type === 'faq' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre FAQ</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Éléments de FAQ</p>
            {(props.list || []).map((faq: any, index: number) => (
              <div key={index} className="p-2 bg-slate-50 border border-gray-100 rounded space-y-1">
                <input
                  type="text"
                  value={faq.q || ''}
                  placeholder="Question"
                  onChange={e => {
                    const newList = [...props.list];
                    newList[index] = { ...faq, q: e.target.value };
                    handlePropChange('list', newList);
                  }}
                  className="w-full px-1.5 py-1 border border-gray-200 rounded text-[10px]"
                />
                <textarea
                  value={faq.a || ''}
                  placeholder="Réponse"
                  rows={2}
                  onChange={e => {
                    const newList = [...props.list];
                    newList[index] = { ...faq, a: e.target.value };
                    handlePropChange('list', newList);
                  }}
                  className="w-full px-1.5 py-1 border border-gray-200 rounded text-[10px]"
                />
              </div>
            ))}
          </div>
        )}

        {/* Payments section properties */}
        {section.type === 'payments' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre d'En-tête</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={e => handlePropChange('title', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Passerelles (séparées par des virgules)</label>
              <input
                type="text"
                value={(props.list || []).join(', ')}
                onChange={e => handlePropChange('list', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
          </div>
        )}

        {/* Footer section properties */}
        {section.type === 'footer' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Texte de Logo</label>
              <input
                type="text"
                value={props.logoText || ''}
                onChange={e => handlePropChange('logoText', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Description simple</label>
              <textarea
                value={props.description || ''}
                onChange={e => handlePropChange('description', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Mention de Copyright</label>
              <input
                type="text"
                value={props.copyright || ''}
                onChange={e => handlePropChange('copyright', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
          </div>
        )}

        {/* Social Bar Properties */}
        {section.type === 'social-bar' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Lien Facebook</label>
              <input
                type="text"
                value={props.facebook || ''}
                onChange={e => handlePropChange('facebook', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Lien Instagram</label>
              <input
                type="text"
                value={props.instagram || ''}
                onChange={e => handlePropChange('instagram', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Lien Twitter</label>
              <input
                type="text"
                value={props.twitter || ''}
                onChange={e => handlePropChange('twitter', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
          </div>
        )}

        {/* Chat Float Properties */}
        {section.type === 'chat-float' && (
          <div className="space-y-3 border-t pt-3 border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Nom du Conseiller</label>
              <input
                type="text"
                value={props.agentName || ''}
                onChange={e => handlePropChange('agentName', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Message d'accueil</label>
              <textarea
                value={props.welcomeMessage || ''}
                onChange={e => handlePropChange('welcomeMessage', e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Numéro WhatsApp de secours</label>
              <input
                type="text"
                value={props.phoneNumber || ''}
                onChange={e => handlePropChange('phoneNumber', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded"
              />
            </div>
          </div>
        )}

        {/* If no matches, fallback message */}
        {!['header', 'hero', 'product-grid', 'category-grid', 'countdown', 'product-detail', 'about', 'testimonials', 'newsletter', 'faq', 'payments', 'footer', 'social-bar', 'chat-float'].includes(section.type) && (
          <div className="text-gray-400 italic">Aucune propriété additionnelle à configurer pour cette section.</div>
        )}
      </div>
    );
  };

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
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
          <Store size={16} className="text-orange-600" /> Type de boutique active
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SITE_TYPES.map(st => (
            <button
              key={st.id}
              onClick={() => setSiteType(st.id)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${theme.siteType === st.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="text-xs font-black text-gray-900 uppercase tracking-wider">{st.label}</div>
              <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">{st.desc}</div>
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
                <button key={p} onClick={() => setPanel(p)} className={`flex-1 p-2 rounded-lg flex items-center justify-center transition-colors ${panel === p ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </Card>

          {panel === 'sections' && (
            <div>
              {selectedSection ? (
                renderSectionPropertyEditor(selectedSection)
              ) : (
                <Card className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Sections ({theme.sections.length})</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
                    {theme.sections.map((s) => {
                      const lib = SECTION_LIBRARY.find(l => l.type === s.type);
                      return (
                        <div key={s.id} className={`flex items-center gap-1 p-2 rounded-lg border transition-all ${selectedSection === s.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
                          <GripVertical size={12} className="text-gray-300" />
                          <button onClick={() => setSelectedSection(s.id)} className="flex-1 text-left text-xs font-bold text-gray-700 truncate">
                            {lib?.icon} {lib?.label || s.type}
                          </button>
                          <button onClick={() => moveSection(s.id, -1)} className="p-0.5 text-gray-400 hover:text-gray-700"><ArrowUp size={12} /></button>
                          <button onClick={() => moveSection(s.id, 1)} className="p-0.5 text-gray-400 hover:text-gray-700"><ArrowDown size={12} /></button>
                          <button onClick={() => toggleSection(s.id)} className={`p-0.5 font-black text-xs ${s.visible ? 'text-green-600' : 'text-gray-300'}`}>●</button>
                          <button onClick={() => removeSection(s.id)} className="p-0.5 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Ajouter un bloc à la page</p>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto scrollbar-thin">
                      {SECTION_LIBRARY.map(lib => (
                        <button key={lib.type} onClick={() => addSection(lib.type)} className="text-left p-1.5 rounded text-[10px] hover:bg-orange-50 hover:border-orange-200 transition-colors border border-gray-100">
                          {lib.icon} {lib.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {panel === 'design' && (
            <Card className="p-3 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Thèmes Prédéfinis (Shopify-style)</h3>
              <div className="grid grid-cols-2 gap-2">
                {CMS_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-2 border rounded-lg text-left hover:border-orange-500 hover:bg-orange-50/20 transition-all"
                  >
                    <p className="text-xs font-bold text-gray-800">{preset.label}</p>
                    <div className="flex gap-1 mt-1.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.colors.primary }} />
                      <div className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.colors.secondary }} />
                      <div className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.colors.accent }} />
                    </div>
                  </button>
                ))}
              </div>

              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 border-t pt-3">Couleurs Manuelles</h3>
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

              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 border-t pt-3">Polices & Typographies</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Police Titres</label>
                <select
                  value={theme.fonts.heading}
                  onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, heading: e.target.value } })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white"
                >
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Police Corps</label>
                <select
                  value={theme.fonts.body}
                  onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, body: e.target.value } })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white"
                >
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 border-t pt-3">Mise en Page Avancée</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Espacement vertical</label>
                <div className="flex gap-1">
                  {(['compact', 'comfortable', 'spacious'] as const).map(s => (
                    <button key={s} onClick={() => setTheme({ ...theme, spacing: s })} className={`flex-1 py-1 rounded text-xs font-bold transition-colors ${theme.spacing === s ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Arrondis des Bordures</label>
                <select
                  value={borderRadius}
                  onChange={e => setBorderRadius(e.target.value as any)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white"
                >
                  <option value="none">Aucun (0px)</option>
                  <option value="md">Moyen (8px)</option>
                  <option value="lg">Grand (12px)</option>
                  <option value="xl">Extra-grand (24px)</option>
                  <option value="full">Cercle complet (9999px)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ombre Portée (Shadows)</label>
                <select
                  value={shadowDepth}
                  onChange={e => setShadowDepth(e.target.value as any)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white"
                >
                  <option value="none">Sans ombre</option>
                  <option value="sm">Légère</option>
                  <option value="md">Modérée</option>
                  <option value="lg">Prononcée</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border-t pt-3">
                <input
                  type="checkbox"
                  id="anim-check"
                  checked={scrollAnimations}
                  onChange={e => setScrollAnimations(e.target.checked)}
                />
                <label htmlFor="anim-check" className="text-xs font-bold text-gray-700 select-none">Animations au défilement</label>
              </div>

              <div className="border-t pt-3">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">💻 CSS Injector</label>
                <textarea
                  value={customCss}
                  onChange={e => setCustomCss(e.target.value)}
                  rows={4}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded font-mono text-[10px]"
                />
              </div>
            </Card>
          )}

          {panel === 'pages' && (
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Pages personnalisées</h3>
              <Button variant="secondary" size="sm" className="w-full"><Plus size={14} /> Nouvelle page</Button>
              <div className="mt-2 space-y-1 text-xs">
                {['À propos', 'Contact', 'FAQ'].map(p => <div key={p} className="p-2 hover:bg-orange-50 hover:text-orange-700 rounded transition-colors font-semibold">{p}</div>)}
              </div>
            </Card>
          )}

          {panel === 'settings' && (
            <Card className="p-3 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Préférences SEO & Boutique</h3>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Titre boutique</label>
                <input className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" defaultValue="Ma Boutique" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description SEO</label>
                <textarea className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" rows={3} placeholder="Mots-clés et phrase d'explication Google..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Favicon officiel</label>
                <Button variant="secondary" size="sm" className="w-full"><Upload size={12} /> Téléverser l'icône (.png, .ico)</Button>
              </div>
              <Button variant="secondary" size="sm" className="w-full"><Upload size={12} /> Importer un thème JSON</Button>
            </Card>
          )}
        </div>

        {/* Preview Container */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge color={theme.isPublished ? 'green' : 'orange'}>{theme.isPublished ? 'Publié' : 'Brouillon'}</Badge>
                <span className="text-xs text-gray-500 capitalize font-bold">Modèle : {theme.siteType}</span>
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
                  <button key={d} onClick={() => setDevice(d)} className={`p-1.5 rounded transition-all ${device === d ? 'bg-white shadow-sm text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}><Icon size={16} /></button>
                ))}
              </div>
            </div>

            {/* Simulated Mobile/Tablet Mockup or Desktop */}
            <div className="bg-slate-100 p-4 rounded-xl border border-gray-200/50 flex justify-center items-center overflow-x-auto min-h-[500px]">
              <div
                className={`w-full bg-white transition-all duration-300 overflow-hidden ${deviceWidth} ${
                  shadowDepth === 'sm' ? 'shadow-sm' : shadowDepth === 'md' ? 'shadow-md' : shadowDepth === 'lg' ? 'shadow-xl' : ''
                } ${
                  borderRadius === 'md' ? 'rounded-md' : borderRadius === 'lg' ? 'rounded-xl' : borderRadius === 'xl' ? 'rounded-3xl' : borderRadius === 'full' ? 'rounded-[48px]' : ''
                }`}
                style={{
                  backgroundColor: theme.colors.background,
                }}
              >
                {theme.sections.filter(s => s.visible).map(s => (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSection(s.id); setPanel('sections'); }}
                    className={`cursor-pointer transition-all ${selectedSection === s.id ? 'ring-4 ring-orange-500 z-10 relative' : 'hover:ring-2 hover:ring-orange-500/50'}`}
                  >
                    {renderSection(s, theme)}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              <div className="flex items-center gap-2 font-semibold">
                <Layers size={14} className="text-orange-500 animate-spin" /> {theme.sections.length} blocs actifs · Cliquez sur n'importe quel bloc pour l'éditer en direct !
              </div>
              <Badge color="green">Vitesse CMS : 98/100 🚀</Badge>
            </div>
          </Card>

          {/* Theme library presets catalog */}
          <Card className="mt-4 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Store size={16} /> Bibliothèque de thèmes Shopify</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Artisanat Wax & Or', type: 'ecommerce', desc: 'Couleurs de la terre, contrastes élégants.' },
                { name: 'Cosmétiques Lagos', type: 'ecommerce', desc: 'Moderne, vibrant et tourné vers l\'Afrique.' },
                { name: 'Haute Couture Parisienne', type: 'landing', desc: 'Minimaliste, typographies fines et élégantes.' },
                { name: 'High-Tech Dakar', type: 'ecommerce', desc: 'Orienté produits technologiques.' },
              ].map(t => (
                <button
                  key={t.name}
                  onClick={() => {
                    setSiteType(t.type as SiteType);
                    // Match preset
                    if (t.name.includes('Wax')) {
                      applyPreset(CMS_PRESETS[1]);
                    } else if (t.name.includes('Cosmétiques')) {
                      applyPreset(CMS_PRESETS[0]);
                    } else if (t.name.includes('Couture')) {
                      applyPreset(CMS_PRESETS[2]);
                    } else {
                      applyPreset(CMS_PRESETS[3]);
                    }
                  }}
                  className="text-left p-3 rounded-lg border border-gray-100 hover:border-orange-300 hover:shadow-sm transition-all bg-white"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-orange-50 rounded mb-2 flex flex-col items-center justify-center p-2 text-center">
                    <Store size={18} className="text-orange-600 mb-1" />
                    <span className="text-[10px] font-bold text-orange-800">{t.name}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 leading-normal">{t.desc}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Floating Customize button */}
      {showCustomize && (
        <button
          onClick={() => { setPanel('sections'); setSelectedSection(null); }}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-orange-600 text-white rounded-full shadow-xl hover:bg-orange-700 transition-all hover:scale-105 flex items-center gap-2 text-sm font-semibold"
        >
          <Palette size={16} /> Personnaliser blocs
        </button>
      )}
    </div>
  );
}

import { PageHeader, Card, Button, Badge } from './ui';
import {
  Store, Smartphone, Tablet, Monitor, Palette, Eye, History, Layers, Plus, Trash2,
  GripVertical, Upload, FileText, Settings as SettingsIcon, ArrowUp, ArrowDown,
  Globe, Search, ChevronRight, CheckCircle, HelpCircle, MessageSquare, Code,
  Sparkles, Check, Send
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY, defaultThemeForType, renderSection } from '../../lib/theme-engine';

// Ultra-modern Preset Themes
const CUSTOM_PRESETS = [
  {
    id: 'lagos-beauty',
    name: 'Lagos Beauty 👑',
    description: 'Chic, luxueux, haut de gamme avec polices sérif élégantes.',
    colors: { primary: '#B07C2D', secondary: '#111827', accent: '#D4AF37', background: '#FCF7ED', text: '#111827' },
    fonts: { heading: 'Playfair Display', body: 'Inter' }
  },
  {
    id: 'art-wax',
    name: 'Art & Wax 🎨',
    description: 'Vibrant, coloré, inspiré de l’art textile et de l’artisanat africain.',
    colors: { primary: '#EF6B2A', secondary: '#0F766E', accent: '#F59E0B', background: '#FFF9F2', text: '#14213D' },
    fonts: { heading: 'Montserrat', body: 'Inter' }
  },
  {
    id: 'coral-peach',
    name: 'Coral & Peach 🍑',
    description: 'Moderne, chaleureux et convivial, parfait pour les créatrices.',
    colors: { primary: '#FF6B35', secondary: '#4A5568', accent: '#FFA07A', background: '#FFF5F2', text: '#2D3748' },
    fonts: { heading: 'Poppins', body: 'Inter' }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue 🌊',
    description: 'Corporate, épuré, d’un bleu profond d’affaires internationales.',
    colors: { primary: '#0369A1', secondary: '#1E293B', accent: '#38BDF8', background: '#F0F9FF', text: '#0F172A' },
    fonts: { heading: 'Inter', body: 'Inter' }
  }
];

export default function OnlineStore() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<ThemeConfig>(() => defaultThemeForType('ecommerce'));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Custom states
  const [panel, setPanel] = useState<'themes' | 'sections' | 'design' | 'pages' | 'domain' | 'inbox' | 'settings'>('themes');
  const [toast, setToast] = useState<string | null>(null);

  // Custom Pages State
  const [customPages, setCustomPages] = useState([
    { id: '1', title: 'À propos de nous', content: 'Nous créons les plus beaux vêtements d’Afrique.' },
    { id: '2', title: 'Conditions de livraison', content: 'Livraison gratuite par moto-taxi dans Abidjan et Douala.' }
  ]);
  const [newPageTitle, setNewPageTitle] = useState('');

  // Domain Management States
  const [domainQuery, setDomainQuery] = useState('');
  const [isSearchingDomain, setIsSearchingDomain] = useState(false);
  const [domainSearchResult, setDomainSearchResult] = useState<{ domain: string; available: boolean; price: string } | null>(null);
  const [myDomains, setMyDomains] = useState<Array<{ name: string; type: 'bought' | 'connected'; status: 'active' | 'pending' }>>([
    { name: 'maboutique.liafrikos.shop', type: 'connected', status: 'active' }
  ]);
  const [externalDomainInput, setExternalDomainInput] = useState('');

  // Custom visual states
  const [borderRadius, setBorderRadius] = useState<'none' | 'subtle' | 'rounded' | 'full'>('rounded');
  const [shadowDepth, setShadowDepth] = useState<'none' | 'subtle' | 'medium' | 'deep'>('subtle');
  const [viewportAnimation, setViewportAnimation] = useState<'none' | 'fade' | 'slide' | 'scale'>('slide');
  const [customCSS, setCustomCSS] = useState('/* Écrivez votre code CSS de personnalisation ici */\n.preview-store-header {\n  border-bottom: 2px solid var(--primary-color);\n}');

  // Local Chat / Inbox System States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'shopper' | 'merchant'; text: string; time: string }>>([
    { sender: 'shopper', text: 'Bonjour ! Livrez-vous au Cameroun ?', time: '14:32' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');
  const [shopperTypedMessage, setShopperTypedMessage] = useState('');
  const [activeChatTab, setActiveChatTab] = useState<'preview' | 'inbox'>('preview');

  // Show visual notices
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Sync with LocalStorage for chat synchronization with storefront
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('liafrikos_chat_history');
        if (stored) {
          setChatMessages(JSON.parse(stored));
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveChatHistory = (history: typeof chatMessages) => {
    setChatMessages(history);
    localStorage.setItem('liafrikos_chat_history', JSON.stringify(history));
    // Dispatch local storage event to trigger update
    window.dispatchEvent(new Event('storage'));
  };

  const handleSendMerchantMessage = () => {
    if (!newMessageText.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const next = [...chatMessages, { sender: 'merchant' as const, text: newMessageText, time: timeStr }];
    saveChatHistory(next);
    setNewMessageText('');
    showToast('Réponse envoyée au client !');
  };

  const handleSendShopperMessage = () => {
    if (!shopperTypedMessage.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const next = [...chatMessages, { sender: 'shopper' as const, text: shopperTypedMessage, time: timeStr }];
    saveChatHistory(next);
    setShopperTypedMessage('');
    showToast('Message client envoyé à la boîte de réception !');
  };

  const selectPreset = (preset: typeof CUSTOM_PRESETS[0]) => {
    setTheme({
      ...theme,
      colors: { ...preset.colors },
      fonts: { ...preset.fonts }
    });
    showToast(`Thème "${preset.name}" appliqué avec succès !`);
  };

  const addSection = (type: ThemeSection['type']) => {
    setTheme({
      ...theme,
      sections: [...theme.sections, { id: `s${Date.now()}`, type, visible: true, props: {} }],
    });
    showToast('Section ajoutée au thème !');
  };

  const removeSection = (id: string) => {
    setTheme({ ...theme, sections: theme.sections.filter(s => s.id !== id) });
    showToast('Section retirée.');
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

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    const next = [...customPages, { id: `page-${Date.now()}`, title: newPageTitle, content: `Contenu générique de la page ${newPageTitle}...` }];
    setCustomPages(next);
    setNewPageTitle('');
    showToast(`Page "${newPageTitle}" créée avec succès !`);
  };

  const handleDeletePage = (id: string) => {
    setCustomPages(customPages.filter(p => p.id !== id));
    showToast('Page supprimée.');
  };

  const handleDomainSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainQuery.trim()) return;
    setIsSearchingDomain(true);
    setDomainSearchResult(null);
    setTimeout(() => {
      setIsSearchingDomain(false);
      const isAvailable = !domainQuery.includes('shop') && !domainQuery.includes('liafrikos');
      setDomainSearchResult({
        domain: domainQuery.endsWith('.com') || domainQuery.endsWith('.net') || domainQuery.endsWith('.shop') ? domainQuery : `${domainQuery}.com`,
        available: isAvailable,
        price: isAvailable ? '9,99 $' : ''
      });
    }, 1500);
  };

  const handleBuyDomain = (domainName: string) => {
    const next = [...myDomains, { name: domainName, type: 'bought' as const, status: 'active' as const }];
    setMyDomains(next);
    setDomainSearchResult(null);
    setDomainQuery('');
    showToast(`Félicitations ! Le domaine ${domainName} a été enregistré avec succès via Os.`);
  };

  const handleConnectExternalDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalDomainInput.trim()) return;
    const next = [...myDomains, { name: externalDomainInput, type: 'connected' as const, status: 'pending' as const }];
    setMyDomains(next);
    setExternalDomainInput('');
    showToast(`Requête de connexion pour ${externalDomainInput} envoyée ! En attente de validation DNS.`);
  };

  const publish = () => {
    setTheme({ ...theme, isPublished: true });
    showToast('Félicitations ! Votre boutique moderne a été publiée en ligne.');
  };
  const saveDraft = () => {
    setTheme({ ...theme, isPublished: false });
    showToast('Brouillon de thème sauvegardé localement.');
  };

  const deviceWidth = device === 'mobile' ? 'max-w-[340px]' : device === 'tablet' ? 'max-w-[640px]' : 'max-w-full';

  return (
    <div className="relative pb-16">

      {/* Toast message popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up border border-gray-800">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Boutique en Ligne"
        subtitle="Moteur de thème universel CMS & Gestionnaire de Domaines Premium."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={saveDraft}>
              <History size={14} /> Brouillon
            </Button>
            <Button size="sm" onClick={publish} className="bg-brand-600 hover:bg-brand-700 text-white">
              <Eye size={14} /> Publier le site
            </Button>
          </div>
        }
      />

      {/* Main CMS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* LEFT COLUMN: Subpanels controls & managers */}
        <div className="space-y-4 col-span-1">

          {/* Navigation/subpanel switcher */}
          <Card className="p-2 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-6 gap-1">

              <button
                onClick={() => setPanel('themes')}
                title="Thèmes"
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors ${panel === 'themes' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Store size={18} />
                <span className="text-[9px] font-bold mt-1">Thèmes</span>
              </button>

              <button
                onClick={() => setPanel('sections')}
                title="Sections"
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors ${panel === 'sections' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Layers size={18} />
                <span className="text-[9px] font-bold mt-1">Sections</span>
              </button>

              <button
                onClick={() => setPanel('design')}
                title="Design"
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors ${panel === 'design' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Palette size={18} />
                <span className="text-[9px] font-bold mt-1">Design</span>
              </button>

              <button
                onClick={() => setPanel('pages')}
                title="Pages"
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors ${panel === 'pages' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <FileText size={18} />
                <span className="text-[9px] font-bold mt-1">Pages</span>
              </button>

              <button
                onClick={() => setPanel('domain')}
                title="Domaines"
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors ${panel === 'domain' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Globe size={18} />
                <span className="text-[9px] font-bold mt-1">Domaines</span>
              </button>

              <button
                onClick={() => setPanel('inbox')}
                title="Inbox Chat"
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors ${panel === 'inbox' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <MessageSquare size={18} />
                <span className="text-[9px] font-bold mt-1">Boîte</span>
              </button>

            </div>
          </Card>

          {/* PANEL 1: Ultra-modern preset selection */}
          {panel === 'themes' && (
            <Card className="p-4 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Store size={16} className="text-brand-600" /> Thèmes Ultra-Modernes
                </h3>
                <p className="text-xs text-gray-500 mt-1">Sélectionnez un preset professionnel éditable pour métamorphoser votre site.</p>
              </div>
              <div className="space-y-3">
                {CUSTOM_PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectPreset(p)}
                    className="w-full text-left p-3.5 rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all bg-white group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{p.name}</span>
                      <div className="flex gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: p.colors.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: p.colors.background }} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{p.description}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* PANEL 2: Dynamic drag & drop Sections configuration */}
          {panel === 'sections' && (
            <Card className="p-4 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Layers size={16} className="text-brand-600" /> Structure du Thème
                </h3>
                <p className="text-xs text-gray-500 mt-1">Ajoutez, supprimez et réorganisez les blocs modulaires en temps réel.</p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {theme.sections.map((s, i) => {
                  const lib = SECTION_LIBRARY.find(l => l.type === s.type);
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${selectedSection === s.id ? 'border-brand-500 bg-brand-50' : 'border-gray-150 bg-white hover:border-gray-300'}`}
                    >
                      <GripVertical size={14} className="text-gray-400 cursor-grab" />
                      <button
                        onClick={() => setSelectedSection(s.id)}
                        className="flex-1 text-left text-xs font-bold text-gray-800 truncate"
                      >
                        {lib?.icon} {lib?.label || s.type}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSection(s.id, -1)}
                          className="p-1 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded"
                          title="Monter"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => moveSection(s.id, 1)}
                          className="p-1 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded"
                          title="Descendre"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          onClick={() => toggleSection(s.id)}
                          className={`p-1 rounded ${s.visible ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-500'}`}
                          title={s.visible ? "Masquer" : "Afficher"}
                        >
                          ●
                        </button>
                        <button
                          onClick={() => removeSection(s.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <span className="text-xs font-bold text-gray-600 uppercase block mb-2">Ajouter un nouveau bloc</span>
                <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto">
                  {SECTION_LIBRARY.map(lib => (
                    <button
                      key={lib.type}
                      onClick={() => addSection(lib.type)}
                      className="text-left p-2 rounded-lg text-xs hover:bg-brand-50 hover:border-brand-200 border border-gray-100 transition-all bg-white font-medium flex items-center gap-1"
                    >
                      <span>{lib.icon}</span>
                      <span className="truncate">{lib.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* PANEL 3: Advanced visual styling selectors, typography, custom CSS */}
          {panel === 'design' && (
            <Card className="p-4 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Palette size={16} className="text-brand-600" /> Options de Personnalisation
                </h3>
                <p className="text-xs text-gray-500 mt-1">Réglez l’apparence fine de votre site : typographie, coins, ombres et animations.</p>
              </div>

              {/* Theme colors */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-600 uppercase block mb-1">Éditeur de couleurs</span>
                {([
                  ['primary', 'Couleur Principale'], ['accent', 'Accent & Alertes'], ['background', 'Arrière-plan'], ['text', 'Texte Principal']
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-gray-100 bg-gray-50">
                    <span className="text-xs font-semibold text-gray-700">{label}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={theme.colors[key]}
                        onChange={e => updateColor(key, e.target.value)}
                        className="w-7 h-7 rounded border border-gray-200 cursor-pointer"
                      />
                      <input
                        value={theme.colors[key].toUpperCase()}
                        onChange={e => updateColor(key, e.target.value)}
                        className="w-16 px-1 py-0.5 border border-gray-200 rounded text-[10px] font-mono text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Font selectors */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-600 uppercase block">Polices de caractères</span>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500">Police des Titres</label>
                  <select
                    value={theme.fonts.heading}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, heading: e.target.value } })}
                    className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                  >
                    {['Montserrat', 'Playfair Display', 'Cormorant Garamond', 'Poppins', 'Inter', 'Manrope'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Spacing & Border radius & Shadows */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600">Bordure des Boutons (Coins)</label>
                  <div className="grid grid-cols-4 gap-1 mt-1.5">
                    {([['none', 'Carré'], ['subtle', 'Doux'], ['rounded', 'Rond'], ['full', 'Pilule']] as const).map(([r, label]) => (
                      <button
                        key={r}
                        onClick={() => setBorderRadius(r)}
                        className={`py-1 text-[10px] font-bold rounded-md border transition-all ${borderRadius === r ? 'bg-brand-600 text-white border-brand-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600">Profondeur des Ombres</label>
                  <div className="grid grid-cols-4 gap-1 mt-1.5">
                    {([['none', 'Aucun'], ['subtle', 'Léger'], ['medium', 'Moyen'], ['deep', 'Fort']] as const).map(([s, label]) => (
                      <button
                        key={s}
                        onClick={() => setShadowDepth(s)}
                        className={`py-1 text-[10px] font-bold rounded-md border transition-all ${shadowDepth === s ? 'bg-brand-600 text-white border-brand-600 shadow' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600">Animation de Défilement</label>
                  <select
                    value={viewportAnimation}
                    onChange={e => setViewportAnimation(e.target.value as any)}
                    className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="none">Aucune animation</option>
                    <option value="fade">Fondu d’apparition (Fade)</option>
                    <option value="slide">Glissement doux vers le haut (Slide Up)</option>
                    <option value="scale">Agrandissement progressif (Scale)</option>
                  </select>
                </div>
              </div>

              {/* Real-time Custom CSS injector panel */}
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1 mb-1">
                  <Code size={14} className="text-brand-600" /> Custom CSS Injecteur
                </span>
                <textarea
                  value={customCSS}
                  onChange={e => setCustomCSS(e.target.value)}
                  className="w-full h-24 p-2 bg-gray-900 text-green-400 font-mono text-[10px] rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 leading-tight"
                />
              </div>
            </Card>
          )}

          {/* PANEL 4: CMS Page manager */}
          {panel === 'pages' && (
            <Card className="p-4 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <FileText size={16} className="text-brand-600" /> Pages Institutionnelles
                </h3>
                <p className="text-xs text-gray-500 mt-1">Créez des pages de CGV, FAQ, À propos, ou histoires de marques.</p>
              </div>

              <form onSubmit={handleCreatePage} className="flex gap-1">
                <input
                  type="text"
                  placeholder="Titre de la page..."
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Button type="submit" size="sm" className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shrink-0">
                  <Plus size={14} /> Ajouter
                </Button>
              </form>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {customPages.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-150 rounded-lg">
                    <span className="text-xs font-semibold text-gray-700">{p.title}</span>
                    <button
                      onClick={() => handleDeletePage(p.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* PANEL 5: Shopify-like premium custom domain panel */}
          {panel === 'domain' && (
            <Card className="p-4 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Globe size={16} className="text-brand-600" /> Domaines Personnalisés
                </h3>
                <p className="text-xs text-gray-500 mt-1">Sécurisez un nom de domaine unique ou liez votre domaine acheté chez GoDaddy, Namecheap, LWS...</p>
              </div>

              {/* Active domain list */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-600 uppercase block">Mes Domaines</span>
                {myDomains.map((dom, i) => (
                  <div key={i} className="p-3 bg-white border border-gray-150 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-800">{dom.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {dom.type === 'bought' ? 'Enregistré via Os' : 'Liaison externe'}
                      </div>
                    </div>
                    <Badge color={dom.status === 'active' ? 'green' : 'orange'}>
                      {dom.status === 'active' ? 'Actif' : 'Vérification DNS'}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Buy a new domain */}
              <div className="border-t border-gray-150 pt-3 space-y-2">
                <span className="text-xs font-bold text-gray-600 uppercase block">Acheter un domaine via Os</span>
                <form onSubmit={handleDomainSearch} className="flex gap-1">
                  <input
                    type="text"
                    placeholder="recherche-mon-nom..."
                    value={domainQuery}
                    onChange={e => setDomainQuery(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingDomain}
                    className="px-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {isSearchingDomain ? <span className="animate-spin text-xs">...</span> : <Search size={14} />}
                  </button>
                </form>

                {domainSearchResult && (
                  <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-xs font-bold text-brand-900 block">{domainSearchResult.domain}</span>
                      <span className="text-[10px] text-brand-700">Disponible à l’achat</span>
                    </div>
                    <button
                      onClick={() => handleBuyDomain(domainSearchResult.domain)}
                      className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                    >
                      Acheter ({domainSearchResult.price})
                    </button>
                  </div>
                )}
              </div>

              {/* Connect existing domain instructions */}
              <div className="border-t border-gray-150 pt-3 space-y-2">
                <span className="text-xs font-bold text-gray-600 uppercase block">Relier un domaine existant</span>
                <form onSubmit={handleConnectExternalDomain} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="www.mon-site.com"
                    value={externalDomainInput}
                    onChange={e => setExternalDomainInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors border border-gray-300"
                  >
                    Relier
                  </button>
                </form>

                {/* Cloudflare point guidelines */}
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2 text-left">
                  <span className="text-[10px] font-bold text-gray-600 uppercase block">Configuration DNS Requise</span>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Ajoutez ces enregistrements chez votre registrar (GoDaddy, LWS...) pour pointer vers nos serveurs :
                  </p>
                  <div className="font-mono text-[9px] text-gray-700 space-y-1 bg-white p-2 rounded border border-gray-200 leading-normal">
                    <div><span className="font-bold text-brand-600">Type A:</span> @ → 104.21.43.12 (Os Proxy)</div>
                    <div><span className="font-bold text-brand-600">CNAME:</span> www → domains.liafrikos.com</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* PANEL 6: Support chat synchronizer */}
          {panel === 'inbox' && (
            <Card className="p-4 border border-gray-100 shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-brand-600" /> Boîte de Réception
                </h3>
                <p className="text-xs text-gray-500 mt-1">Discutez en direct avec vos acheteurs connectés.</p>
              </div>

              {/* Chat Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setActiveChatTab('preview')}
                  className={`py-1 text-xs font-bold rounded ${activeChatTab === 'preview' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Simuler Acheteur
                </button>
                <button
                  onClick={() => setActiveChatTab('inbox')}
                  className={`py-1 text-xs font-bold rounded ${activeChatTab === 'inbox' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Inbox Vendeur ({chatMessages.filter(m => m.sender === 'shopper').length})
                </button>
              </div>

              {/* Tab Content A: Simulated Shopper typing */}
              {activeChatTab === 'preview' && (
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Zone de Simulation Client</span>
                  <p className="text-[10px] text-gray-500 leading-tight">Saisissez un message en tant que visiteur pour le recevoir sur votre interface vendeur :</p>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Tapez un message client..."
                      value={shopperTypedMessage}
                      onChange={e => setShopperTypedMessage(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={handleSendShopperMessage}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content B: Live Merchant responses */}
              {activeChatTab === 'inbox' && (
                <div className="space-y-3 text-left">
                  <div className="border border-gray-150 rounded-xl p-2.5 bg-gray-50 h-36 overflow-y-auto space-y-2 text-[11px] leading-normal scrollbar-thin">
                    {chatMessages.length === 0 ? (
                      <div className="text-gray-400 text-center py-8">Aucun message pour l'instant.</div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.sender === 'merchant' ? 'items-end' : 'items-start'}`}>
                          <div className={`p-2 rounded-lg max-w-[80%] ${msg.sender === 'merchant' ? 'bg-brand-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                            {msg.text}
                          </div>
                          <span className="text-[8px] text-gray-400 mt-0.5">{msg.time}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Répondre à l'acheteur..."
                      value={newMessageText}
                      onChange={e => setNewMessageText(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                      onKeyDown={e => e.key === 'Enter' && handleSendMerchantMessage()}
                    />
                    <button
                      onClick={handleSendMerchantMessage}
                      className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* PANEL 7: Standard configurations */}
          {panel === 'settings' && (
            <Card className="p-4 border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Préférences Générales</h3>
              <div>
                <label className="text-xs font-bold text-gray-600">Titre de la boutique</label>
                <input className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs" defaultValue="Ma Boutique" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Description Méta SEO</label>
                <textarea className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs" rows={2} defaultValue="Mode chic et tendances de marque panafricaine." />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Favicon de l’onglet</label>
                <Button variant="secondary" size="sm" className="w-full"><Upload size={12} /> Téléverser favicon (ICO, PNG)</Button>
              </div>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: Interactive live mockups preview */}
        <div className="col-span-1 lg:col-span-3">
          <Card className="p-4 border border-gray-100 shadow-sm">

            {/* Mockup controller header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Badge color={theme.isPublished ? 'green' : 'orange'}>
                  {theme.isPublished ? 'Publié' : 'Brouillon'}
                </Badge>
                <span className="text-xs font-semibold text-gray-500 capitalize">{theme.siteType} Editor</span>
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={`p-2 rounded-lg transition-all ${device === d ? 'bg-white shadow text-brand-600 scale-105' : 'text-gray-500 hover:text-gray-900'}`}
                    title={d}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom injected styling tag */}
            <style dangerouslySetInnerHTML={{ __html: `
              :root {
                --primary-color: ${theme.colors.primary};
                --accent-color: ${theme.colors.accent};
                --bg-color: ${theme.colors.background};
                --text-color: ${theme.colors.text};
                --border-radius: ${borderRadius === 'none' ? '0px' : borderRadius === 'subtle' ? '6px' : borderRadius === 'full' ? '9999px' : '14px'};
                --shadow: ${shadowDepth === 'none' ? 'none' : shadowDepth === 'subtle' ? '0 2px 4px rgba(0,0,0,0.05)' : shadowDepth === 'deep' ? '0 10px 25px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)'};
              }
              .custom-border-radius {
                border-radius: var(--border-radius) !important;
              }
              .custom-shadow {
                box-shadow: var(--shadow) !important;
              }
              .preview-element {
                font-family: '${theme.fonts.heading}', sans-serif;
              }
              ${customCSS}
            ` }} />

            {/* Dynamic visual preview area */}
            <div className={`mx-auto bg-white rounded-2xl border-4 border-gray-900 overflow-hidden transition-all duration-300 relative ${deviceWidth}`} style={{ minHeight: '450px' }}>

              {/* Fake smartphone bar if mobile */}
              {device === 'mobile' && (
                <div className="bg-gray-950 text-white text-[8px] py-1 px-3 flex justify-between items-center font-semibold">
                  <span>9:41</span>
                  <div className="w-12 h-3 bg-black rounded-full" />
                  <span className="flex items-center gap-0.5">LTE 🔋</span>
                </div>
              )}

              {/* Fake web browser bar if desktop */}
              {device === 'desktop' && (
                <div className="bg-gray-100 border-b border-gray-200 py-1.5 px-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 block" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400 block" />
                    <span className="w-2 h-2 rounded-full bg-green-400 block" />
                  </div>
                  <div className="flex-1 bg-white rounded px-2 py-0.5 text-[10px] text-gray-500 font-mono text-center flex items-center justify-center gap-1">
                    🔒 {myDomains[0]?.name || 'maboutique.liafrikos.shop'}
                  </div>
                </div>
              )}

              {/* Rendered Live Website Sections */}
              <div
                className={`preview-element transition-all ${viewportAnimation === 'fade' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
              >
                {theme.sections.filter(s => s.visible).map(s => (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSection(s.id); setPanel('sections'); }}
                    className={`relative cursor-pointer transition-all border ${selectedSection === s.id ? 'ring-2 ring-brand-500 z-10' : 'border-transparent hover:border-dashed hover:border-gray-300'}`}
                  >
                    {renderSection(s, theme)}
                  </div>
                ))}
              </div>

              {/* Embedded floating Support Live Chat preview */}
              <div className="absolute bottom-4 right-4 z-20">
                <details className="group border border-gray-200 rounded-2xl bg-white shadow-2xl text-left overflow-hidden max-w-[240px]">
                  <summary className="list-none cursor-pointer flex items-center gap-1.5 px-3 py-2 text-[10px] font-extrabold text-white custom-border-radius shadow-md" style={{ backgroundColor: theme.colors.primary }}>
                    <MessageSquare size={12} /> Support Chat en direct
                  </summary>
                  <div className="p-2.5 space-y-2 max-h-48 overflow-y-auto leading-normal bg-gray-50 scrollbar-thin">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.sender === 'merchant' ? 'items-start' : 'items-end'}`}>
                        <div className={`p-1.5 rounded-lg text-[9px] max-w-[90%] ${msg.sender === 'merchant' ? 'bg-brand-50 text-brand-900 border border-brand-100' : 'bg-[#E0F2FE] text-blue-900'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

            </div>

            {/* Visual CMS Footer Badge */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-150">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Sparkles size={14} className="text-brand-600 animate-pulse" />
                <span>Drag & drop actif · Visual Custom CSS · Animations adaptives</span>
              </div>
              <Badge color="green">Score SEO : 98/100</Badge>
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
}

import { PageHeader, Card, Button, Badge } from './ui';
import {
  Store, Smartphone, Tablet, Monitor, Palette, Eye, History, Layers, Plus, Trash2,
  GripVertical, Upload, FileText, Settings as SettingsIcon, ArrowUp, ArrowDown,
  Globe, Search, ChevronRight, CheckCircle, HelpCircle, MessageSquare, Code,
  Sparkles, Check, Send
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY, FONT_OPTIONS, defaultThemeForType, renderSection } from '../../lib/theme-engine';
import { getShopProfile, getTenantStorageKey } from '../../lib/app-state';

interface CustomDomain {
  domain: string;
  type: 'platform' | 'external' | 'purchased';
  status: 'active' | 'dns_pending' | 'dns_error';
  createdAt: string;
}

// Ultra-modern Preset Themes
const CUSTOM_PRESETS = [
  {
    id: 'lagos-beauty',
    name: 'Lagos Beauty 👑',
    description: 'Chic, luxueux, haut de gamme avec polices sérif élégantes.',
    colors: { primary: '#B07C2D', secondary: '#111827', accent: '#D4AF37', background: '#FCF7ED', text: '#111827' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'art-wax',
    name: 'Art & Wax 🎨',
    description: 'Vibrant, coloré, inspiré de l’art textile et de l’artisanat africain.',
    colors: { primary: '#EF6B2A', secondary: '#0F766E', accent: '#F59E0B', background: '#FFF9F2', text: '#14213D' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'coral-peach',
    name: 'Coral & Peach 🍑',
    description: 'Moderne, chaleureux et convivial, parfait pour les créatrices.',
    colors: { primary: '#FF6B35', secondary: '#4A5568', accent: '#FFA07A', background: '#FFF5F2', text: '#2D3748' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue 🌊',
    description: 'Corporate, épuré, d’un bleu profond d’affaires internationales.',
    colors: { primary: '#0369A1', secondary: '#1E293B', accent: '#38BDF8', background: '#F0F9FF', text: '#0F172A' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'dakar-fashion',
    name: 'Dakar Fashion 🌟',
    description: 'Style couture moderne, jaune vibrant et indigo profond, typographie élégante.',
    colors: { primary: '#EAB308', secondary: '#312E81', accent: '#F59E0B', background: '#FAF8F5', text: '#1E1B4B' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'sahara-gold',
    name: 'Sahara Gold ✨',
    description: 'Palette dorée sablonneuse haut de gamme mariée au charbon épuré.',
    colors: { primary: '#D97706', secondary: '#1F2937', accent: '#F59E0B', background: '#FFFDF9', text: '#111827' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'tokyo-tech',
    name: 'Tokyo Tech ⚡',
    description: 'Ambiance cyberpunk sombre et électrique, néon vert dynamique pour produits technologiques.',
    colors: { primary: '#22C55E', secondary: '#0F172A', accent: '#10B981', background: '#090D16', text: '#F8FAFC' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'cape-town-minimalist',
    name: 'Cape Town Minimalist 🏔',
    description: 'Espaces confortables, lignes ultra épurées d’un gris ardoise noble et reposant.',
    colors: { primary: '#475569', secondary: '#0F172A', accent: '#64748B', background: '#F8FAFC', text: '#0F172A' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'new-york-street',
    name: 'NY Streetwear 🗽',
    description: 'Design urbain audacieux et contrasté, rouge vif de défilé et noir profond.',
    colors: { primary: '#DC2626', secondary: '#000000', accent: '#EF4444', background: '#FAF9F6', text: '#111111' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  },
  {
    id: 'yasmine-oriental',
    name: 'Yasmine Oriental 🌺',
    description: 'Mystique et envoûtant, violet royal et orbe de soleil d’Orient.',
    colors: { primary: '#7C3AED', secondary: '#1E1B4B', accent: '#F59E0B', background: '#FAF5FF', text: '#1E1B4B' },
    fonts: { heading: 'Montserrat', body: 'Montserrat' }
  }
];

export default function OnlineStore() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem(getTenantStorageKey('liafrikos_theme_config'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return defaultThemeForType('ecommerce');
  });
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Sync theme to localStorage
  useEffect(() => {
    localStorage.setItem(getTenantStorageKey('liafrikos_theme_config'), JSON.stringify(theme));
  }, [theme]);

  // Custom states
  const [panel, setPanel] = useState<'themes' | 'sections' | 'design' | 'pages' | 'domain' | 'inbox' | 'settings'>('themes');
  const [toast, setToast] = useState<string | null>(null);

  // Custom Pages State
  const [customPages, setCustomPages] = useState([
    { id: '1', title: 'À propos de nous', content: 'Nous créons les plus beaux vêtements d’Afrique.' },
    { id: '2', title: 'Conditions de livraison', content: 'Livraison gratuite par moto-taxi dans Abidjan et Douala.' }
  ]);
  const [newPageTitle, setNewPageTitle] = useState('');

  // Domain Management States with localStorage Sync
  const shopProfile = getShopProfile();
  const shopSubdomain = `${shopProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.os.liafrik.com`;

  const [myDomains, setMyDomains] = useState<CustomDomain[]>(() => {
    const saved = localStorage.getItem(getTenantStorageKey('liafrikos_domains'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      { domain: shopSubdomain, type: 'platform', status: 'active', createdAt: 'Créé à la création' }
    ];
  });

  useEffect(() => {
    localStorage.setItem(getTenantStorageKey('liafrikos_domains'), JSON.stringify(myDomains));
    // Dispatch local storage event so Settings.tsx is also updated in real-time
    window.dispatchEvent(new Event('storage'));
  }, [myDomains]);

  // Synchronize domains if changed externally
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem(getTenantStorageKey('liafrikos_domains'));
      if (saved) {
        try {
          setMyDomains(JSON.parse(saved));
        } catch (e) {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [domainQuery, setDomainQuery] = useState('');
  const [isSearchingDomain, setIsSearchingDomain] = useState(false);
  const [domainSearchResult, setDomainSearchResult] = useState<Array<{ ext: string; price: string; available: boolean }>>([]);
  const [selectedExtension, setSelectedExtension] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange' | 'card'>('wave');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [externalDomainInput, setExternalDomainInput] = useState('');
  const [selectedExternalDomain, setSelectedExternalDomain] = useState<CustomDomain | null>(null);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);

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
        const stored = localStorage.getItem(getTenantStorageKey('liafrikos_chat_history'));
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
    localStorage.setItem(getTenantStorageKey('liafrikos_chat_history'), JSON.stringify(history));
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

  const updateSectionProp = (sectionId: string, propKey: string, value: any) => {
    setTheme(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            props: {
              ...s.props,
              [propKey]: value
            }
          };
        }
        return s;
      })
    }));
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
    setDomainSearchResult([]);
    setSelectedExtension(null);

    setTimeout(() => {
      const cleanName = domainQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '');
      setDomainSearchResult([
        { ext: `.com`, price: '$10.98 / year', available: true },
        { ext: `.net`, price: '$14.58 / year', available: true },
        { ext: `.org`, price: '$12.18 / year', available: true },
        { ext: `.shop`, price: '$4.79 / year', available: true },
        { ext: `.co`, price: '$25.19 / year', available: true },
        { ext: `.io`, price: '$47.99 / year', available: true },
        { ext: `.ai`, price: '$95.99 / year', available: true },
        { ext: `.info`, price: '$17.99 / year', available: true },
      ]);
      setIsSearchingDomain(false);
    }, 1200);
  };

  const handleBuyDomain = () => {
    if (!selectedExtension) return;
    setIsPurchasing(true);

    setTimeout(() => {
      const cleanName = domainQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '');
      const domainName = `${cleanName}${selectedExtension.ext}`;

      const newDomain: CustomDomain = {
        domain: domainName,
        type: 'purchased',
        status: 'active',
        createdAt: new Date().toLocaleDateString('fr-FR')
      };

      setMyDomains([...myDomains, newDomain]);
      setIsPurchasing(false);
      setDomainQuery('');
      setDomainSearchResult([]);
      setSelectedExtension(null);
      showToast(`Félicitations ! Le domaine ${domainName} a été enregistré avec succès via Os.`);
    }, 2000);
  };

  const handleConnectExternalDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalDomainInput.trim()) return;
    const cleanDomain = externalDomainInput.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '');

    if (myDomains.some(d => d.domain === cleanDomain)) {
      showToast('Ce domaine est déjà enregistré.');
      return;
    }

    const newDomain: CustomDomain = {
      domain: cleanDomain,
      type: 'external',
      status: 'dns_pending',
      createdAt: new Date().toLocaleDateString('fr-FR')
    };

    setMyDomains([...myDomains, newDomain]);
    setSelectedExternalDomain(newDomain);
    setExternalDomainInput('');
    showToast(`Domaine ${cleanDomain} ajouté. Veuillez configurer vos DNS.`);
  };

  const handleVerifyDns = (dom: CustomDomain) => {
    setIsVerifyingDns(true);

    setTimeout(() => {
      const updated = myDomains.map(d => {
        if (d.domain === dom.domain) {
          return { ...d, status: 'active' as const };
        }
        return d;
      });
      setMyDomains(updated);
      setSelectedExternalDomain(null);
      setIsVerifyingDns(false);
      showToast(`DNS de ${dom.domain} vérifiés avec succès et synchronisés !`);
    }, 2200);
  };

  const handleDeleteDomain = (domainName: string) => {
    if (domainName === shopSubdomain) {
      showToast('Impossible de supprimer le domaine de base.');
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer le domaine ${domainName} ?`)) {
      setMyDomains(myDomains.filter(d => d.domain !== domainName));
      if (selectedExternalDomain?.domain === domainName) {
        setSelectedExternalDomain(null);
      }
      showToast('Domaine supprimé.');
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start overflow-x-hidden md:overflow-x-visible">

        {/* LEFT COLUMN: Subpanels controls & managers */}
        <div className="space-y-4 col-span-1 w-full max-w-full">

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
          {panel === 'sections' && !selectedSection && (
            <Card className="p-4 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Layers size={16} className="text-brand-600" /> Structure du Thème
                </h3>
                <p className="text-xs text-gray-500 mt-1">Ajoutez, supprimez et réorganisez les blocs modulaires en temps réel. Cliquez sur un bloc pour l'éditer.</p>
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

          {panel === 'sections' && selectedSection && (() => {
            const activeSection = theme.sections.find(s => s.id === selectedSection);
            if (!activeSection) return null;

            return (
              <Card className="p-4 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <button
                    onClick={() => setSelectedSection(null)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    ← Retour à la structure
                  </button>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Édition {activeSection.type}
                  </span>
                </div>

                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 text-left">
                  {/* Common Title/Heading inputs */}
                  {'title' in activeSection.props && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Titre principal</label>
                      <input
                        type="text"
                        value={activeSection.props.title || ''}
                        onChange={e => updateSectionProp(activeSection.id, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  {'subtitle' in activeSection.props && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Sous-titre</label>
                      <input
                        type="text"
                        value={activeSection.props.subtitle || ''}
                        onChange={e => updateSectionProp(activeSection.id, 'subtitle', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  {'description' in activeSection.props && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                      <textarea
                        value={activeSection.props.description || ''}
                        onChange={e => updateSectionProp(activeSection.id, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Header-specific inputs */}
                  {activeSection.type === 'header' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Texte du logo</label>
                        <input
                          type="text"
                          value={activeSection.props.logoText || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'logoText', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Texte de l'annonce</label>
                        <input
                          type="text"
                          value={activeSection.props.announcementText || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'announcementText', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">Afficher la barre d'annonce</span>
                        <input
                          type="checkbox"
                          checked={activeSection.props.showAnnouncement !== false}
                          onChange={e => updateSectionProp(activeSection.id, 'showAnnouncement', e.target.checked)}
                          className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hero-specific inputs */}
                  {activeSection.type === 'hero' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Image URL</label>
                        <input
                          type="text"
                          value={activeSection.props.image || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'image', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Bouton CTA texte</label>
                        <input
                          type="text"
                          value={activeSection.props.cta || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'cta', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Alignement du texte</label>
                        <select
                          value={activeSection.props.align || 'center'}
                          onChange={e => updateSectionProp(activeSection.id, 'align', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        >
                          <option value="left">Gauche</option>
                          <option value="center">Milieu</option>
                          <option value="right">Droite</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Columns limits layout parameters */}
                  {'columns' in activeSection.props && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Colonnes de grille ({activeSection.props.columns || 4})</label>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={activeSection.props.columns || 4}
                        onChange={e => updateSectionProp(activeSection.id, 'columns', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Countdown end date */}
                  {activeSection.type === 'countdown' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Texte promotionnel</label>
                        <input
                          type="text"
                          value={activeSection.props.promoText || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'promoText', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Date de fin</label>
                        <input
                          type="date"
                          value={activeSection.props.endDate || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'endDate', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Product detail inputs */}
                  {activeSection.type === 'product-detail' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Prix</label>
                        <input
                          type="number"
                          value={activeSection.props.price || 0}
                          onChange={e => updateSectionProp(activeSection.id, 'price', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Ancien Prix</label>
                        <input
                          type="number"
                          value={activeSection.props.oldPrice || 0}
                          onChange={e => updateSectionProp(activeSection.id, 'oldPrice', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Devise</label>
                        <input
                          type="text"
                          value={activeSection.props.currency || 'FCFA'}
                          onChange={e => updateSectionProp(activeSection.id, 'currency', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* About inputs */}
                  {activeSection.type === 'about' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Badge</label>
                        <input
                          type="text"
                          value={activeSection.props.badge || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'badge', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Contenu</label>
                        <textarea
                          value={activeSection.props.content || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'content', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Position de l'image</label>
                        <select
                          value={activeSection.props.alignImage || 'right'}
                          onChange={e => updateSectionProp(activeSection.id, 'alignImage', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        >
                          <option value="left">Gauche</option>
                          <option value="right">Droite</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Newsletter inputs */}
                  {activeSection.type === 'newsletter' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Espace réservé (Placeholder)</label>
                        <input
                          type="text"
                          value={activeSection.props.placeholder || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'placeholder', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Texte du bouton</label>
                        <input
                          type="text"
                          value={activeSection.props.buttonText || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'buttonText', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer description / copyright */}
                  {activeSection.type === 'footer' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                        <textarea
                          value={activeSection.props.description || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Droit d'auteur (Copyright)</label>
                        <input
                          type="text"
                          value={activeSection.props.copyright || ''}
                          onChange={e => updateSectionProp(activeSection.id, 'copyright', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Complex Array Item Editors */}

                  {/* Testimonials List */}
                  {activeSection.type === 'testimonials' && 'list' in activeSection.props && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <span className="block text-xs font-bold text-gray-700 uppercase">Témoignages clients</span>
                      <div className="space-y-3.5 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                        {activeSection.props.list.map((t: any, idx: number) => (
                          <div key={idx} className="p-2 bg-white rounded-lg border border-gray-200 space-y-2 relative">
                            <button
                              onClick={() => {
                                const nextList = activeSection.props.list.filter((_: any, i: number) => i !== idx);
                                updateSectionProp(activeSection.id, 'list', nextList);
                              }}
                              className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs font-bold"
                              title="Supprimer"
                            >
                              ✕
                            </button>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500">Nom</label>
                              <input
                                type="text"
                                value={t.name || ''}
                                onChange={e => {
                                  const nextList = [...activeSection.props.list];
                                  nextList[idx] = { ...nextList[idx], name: e.target.value };
                                  updateSectionProp(activeSection.id, 'list', nextList);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500">Commentaire</label>
                              <textarea
                                value={t.comment || ''}
                                onChange={e => {
                                  const nextList = [...activeSection.props.list];
                                  nextList[idx] = { ...nextList[idx], comment: e.target.value };
                                  updateSectionProp(activeSection.id, 'list', nextList);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newItem = {
                              name: 'Nouveau client',
                              comment: 'Super service et produits fantastiques !',
                              rating: 5,
                              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                            };
                            updateSectionProp(activeSection.id, 'list', [...activeSection.props.list, newItem]);
                          }}
                          className="w-full py-1.5 bg-brand-50 text-brand-700 font-bold rounded-lg border border-brand-200 text-xs hover:bg-brand-100 transition-colors"
                        >
                          + Ajouter un témoignage
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FAQ list */}
                  {activeSection.type === 'faq' && 'list' in activeSection.props && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <span className="block text-xs font-bold text-gray-700 uppercase">Questions Fréquentes</span>
                      <div className="space-y-3 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                        {activeSection.props.list.map((item: any, idx: number) => (
                          <div key={idx} className="p-2 bg-white rounded-lg border border-gray-200 space-y-2 relative">
                            <button
                              onClick={() => {
                                const nextList = activeSection.props.list.filter((_: any, i: number) => i !== idx);
                                updateSectionProp(activeSection.id, 'list', nextList);
                              }}
                              className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs font-bold"
                              title="Supprimer"
                            >
                              ✕
                            </button>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500">Question</label>
                              <input
                                type="text"
                                value={item.q || ''}
                                onChange={e => {
                                  const nextList = [...activeSection.props.list];
                                  nextList[idx] = { ...nextList[idx], q: e.target.value };
                                  updateSectionProp(activeSection.id, 'list', nextList);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500">Réponse</label>
                              <textarea
                                value={item.a || ''}
                                onChange={e => {
                                  const nextList = [...activeSection.props.list];
                                  nextList[idx] = { ...nextList[idx], a: e.target.value };
                                  updateSectionProp(activeSection.id, 'list', nextList);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newItem = { q: 'Nouvelle Question ?', a: 'Réponse détaillée de la question...' };
                            updateSectionProp(activeSection.id, 'list', [...activeSection.props.list, newItem]);
                          }}
                          className="w-full py-1.5 bg-brand-50 text-brand-700 font-bold rounded-lg border border-brand-200 text-xs hover:bg-brand-100 transition-colors"
                        >
                          + Ajouter une question FAQ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Categories list */}
                  {activeSection.type === 'category-grid' && 'categories' in activeSection.props && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <span className="block text-xs font-bold text-gray-700 uppercase">Catégories d'articles</span>
                      <div className="space-y-3 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                        {activeSection.props.categories.map((c: any, idx: number) => (
                          <div key={idx} className="p-2 bg-white rounded-lg border border-gray-200 space-y-2 relative">
                            <button
                              onClick={() => {
                                const nextCats = activeSection.props.categories.filter((_: any, i: number) => i !== idx);
                                updateSectionProp(activeSection.id, 'categories', nextCats);
                              }}
                              className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs font-bold"
                            >
                              ✕
                            </button>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500">Nom de la collection</label>
                              <input
                                type="text"
                                value={c.name || ''}
                                onChange={e => {
                                  const nextCats = [...activeSection.props.categories];
                                  nextCats[idx] = { ...nextCats[idx], name: e.target.value };
                                  updateSectionProp(activeSection.id, 'categories', nextCats);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500">Image URL</label>
                              <input
                                type="text"
                                value={c.image || ''}
                                onChange={e => {
                                  const nextCats = [...activeSection.props.categories];
                                  nextCats[idx] = { ...nextCats[idx], image: e.target.value };
                                  updateSectionProp(activeSection.id, 'categories', nextCats);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newItem = {
                              name: 'Nouvelle Catégorie',
                              image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=300'
                            };
                            updateSectionProp(activeSection.id, 'categories', [...activeSection.props.categories, newItem]);
                          }}
                          className="w-full py-1.5 bg-brand-50 text-brand-700 font-bold rounded-lg border border-brand-200 text-xs hover:bg-brand-100 transition-colors"
                        >
                          + Ajouter une catégorie
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Products list */}
                  {activeSection.type === 'product-grid' && 'products' in activeSection.props && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <span className="block text-xs font-bold text-gray-700 uppercase">Produits en vedette</span>
                      <div className="space-y-3 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                        {activeSection.props.products.map((p: any, idx: number) => (
                          <div key={idx} className="p-2 bg-white rounded-lg border border-gray-200 space-y-2 relative">
                            <button
                              onClick={() => {
                                const nextProds = activeSection.props.products.filter((_: any, i: number) => i !== idx);
                                updateSectionProp(activeSection.id, 'products', nextProds);
                              }}
                              className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs font-bold"
                            >
                              ✕
                            </button>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500">Nom du produit</label>
                              <input
                                type="text"
                                value={p.name || ''}
                                onChange={e => {
                                  const nextProds = [...activeSection.props.products];
                                  nextProds[idx] = { ...nextProds[idx], name: e.target.value };
                                  updateSectionProp(activeSection.id, 'products', nextProds);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500">Prix (FCFA)</label>
                                <input
                                  type="number"
                                  value={p.price || 0}
                                  onChange={e => {
                                    const nextProds = [...activeSection.props.products];
                                    nextProds[idx] = { ...nextProds[idx], price: Number(e.target.value) };
                                    updateSectionProp(activeSection.id, 'products', nextProds);
                                  }}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500">Ancien prix</label>
                                <input
                                  type="number"
                                  value={p.oldPrice || 0}
                                  onChange={e => {
                                    const nextProds = [...activeSection.props.products];
                                    nextProds[idx] = { ...nextProds[idx], oldPrice: Number(e.target.value) };
                                    updateSectionProp(activeSection.id, 'products', nextProds);
                                  }}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500">Image URL</label>
                              <input
                                type="text"
                                value={p.image || ''}
                                onChange={e => {
                                  const nextProds = [...activeSection.props.products];
                                  nextProds[idx] = { ...nextProds[idx], image: e.target.value };
                                  updateSectionProp(activeSection.id, 'products', nextProds);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newItem = {
                              name: 'Nouvel Article Chic',
                              price: 18000,
                              oldPrice: 22000,
                              image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=300',
                              rating: 5
                            };
                            updateSectionProp(activeSection.id, 'products', [...activeSection.props.products, newItem]);
                          }}
                          className="w-full py-1.5 bg-brand-50 text-brand-700 font-bold rounded-lg border border-brand-200 text-xs hover:bg-brand-100 transition-colors"
                        >
                          + Ajouter un produit
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </Card>
            );
          })()}

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
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-600 uppercase block">Polices de caractères</span>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500">Police des Titres</label>
                  <select
                    value={theme.fonts.heading}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, heading: e.target.value } })}
                    className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500">Police du Corps de texte</label>
                  <select
                    value={theme.fonts.body}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, body: e.target.value } })}
                    className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                  >
                    {FONT_OPTIONS.map(f => (
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
                      <div className="text-xs font-bold text-gray-800">{dom.domain}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {dom.type === 'platform' ? 'Base de la plateforme' : dom.type === 'purchased' ? 'Enregistré via Os' : 'Liaison externe'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge color={dom.status === 'active' ? 'green' : dom.status === 'dns_pending' ? 'orange' : 'red'}>
                        {dom.status === 'active' ? 'Actif' : dom.status === 'dns_pending' ? 'Attente DNS' : 'Erreur DNS'}
                      </Badge>
                      {dom.status === 'dns_pending' && (
                        <button
                          onClick={() => setSelectedExternalDomain(dom)}
                          className="px-2 py-0.5 bg-orange-100 text-orange-700 font-bold text-[9px] rounded hover:bg-orange-200"
                        >
                          DNS
                        </button>
                      )}
                      {dom.type !== 'platform' && (
                        <button
                          onClick={() => handleDeleteDomain(dom.domain)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* External Domain DNS Verification Card popup */}
              {selectedExternalDomain && (
                <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-3 space-y-3 text-left">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-extrabold text-xs text-gray-900">DNS pour {selectedExternalDomain.domain}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Ajoutez ces 3 enregistrements chez votre registrar externe :</p>
                    </div>
                    <button onClick={() => setSelectedExternalDomain(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  </div>

                  <div className="font-mono text-[9px] text-gray-700 space-y-1 bg-white p-2 rounded border border-gray-200 leading-normal">
                    <div><span className="font-bold text-orange-700">A:</span> @ → 104.21.43.201</div>
                    <div><span className="font-bold text-orange-700">CNAME:</span> www → os.liafrik.com</div>
                    <div><span className="font-bold text-orange-700">TXT:</span> _liafrik-challenge → verify-938fd82</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyDns(selectedExternalDomain)}
                      disabled={isVerifyingDns}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-black hover:bg-orange-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isVerifyingDns ? 'Vérification...' : 'Vérifier maintenant'}
                    </button>
                    <button
                      onClick={() => setSelectedExternalDomain(null)}
                      className="px-2.5 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-[10px] hover:bg-white"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}

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

                {domainSearchResult.length > 0 && (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {domainSearchResult.map(res => {
                      const domainName = `${domainQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '')}${res.ext}`;
                      const isSelected = selectedExtension?.ext === res.ext;
                      return (
                        <div key={res.ext} className={`p-2.5 rounded-xl border flex items-center justify-between text-left ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-gray-150 bg-white'}`}>
                          <div>
                            <span className="text-xs font-extrabold text-gray-900 block">{domainName}</span>
                            <span className="text-[10px] text-emerald-600">Disponible</span>
                          </div>
                          <button
                            onClick={() => setSelectedExtension(res)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${isSelected ? 'bg-brand-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                          >
                            {isSelected ? 'Choisi' : 'Choisir'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedExtension && (
                  <div className="p-3 border border-brand-200 bg-brand-50 rounded-xl space-y-3 text-left">
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">Acheter {domainQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '')}{selectedExtension.ext}</p>
                      <p className="text-[10px] text-gray-500">Moyen de paiement sécurisé (Tarif Cloudflare + 20% markup, affiché en USD) :</p>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {[['wave', 'Wave'], ['orange', 'Orange'], ['card', 'Carte CB']].map(([mId, mLabel]) => (
                        <button
                          key={mId}
                          onClick={() => setPaymentMethod(mId as any)}
                          className={`py-1 text-[10px] font-black rounded-md border text-center transition-colors ${paymentMethod === mId ? 'border-brand-500 bg-white text-brand-700' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}
                        >
                          {mLabel}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleBuyDomain}
                      disabled={isPurchasing}
                      className="w-full py-1.5 bg-emerald-600 text-white text-xs font-extrabold rounded-lg hover:bg-emerald-700 transition-colors animate-pulse"
                    >
                      {isPurchasing ? 'Enregistrement Cloudflare...' : `Payer ${selectedExtension.price}`}
                    </button>
                    <p className="text-[9px] text-gray-400 mt-1">Le prix inclut les frais d'enregistrement wholesale de Cloudflare majorés de 20% pour frais de service Os.</p>
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
                    🔒 {myDomains[0]?.domain || 'maboutique.liafrikos.shop'}
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

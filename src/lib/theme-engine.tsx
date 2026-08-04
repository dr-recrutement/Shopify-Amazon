import { useState } from 'react';

export type SiteType = 'landing' | 'ecommerce' | 'business' | 'marketplace';

export interface ThemeSection {
  id: string;
  type: 'header' | 'hero' | 'product-grid' | 'category-grid' | 'countdown' | 'filters-list' | 'product-detail' | 'payments' | 'testimonials' | 'about' | 'footer' | 'social-bar' | 'chat-float' | 'newsletter' | 'faq' | 'custom-blocks';
  visible: boolean;
  props: Record<string, any>;
}

export type FreeBlockType = 'text' | 'image' | 'button' | 'spacer';

export interface FreeBlock {
  id: string;
  type: FreeBlockType;
  props: Record<string, any>;
}

export function ChatFloatWidget({
  colors,
  radius,
  whatsappNumber,
  welcomeMsg,
}: {
  colors: ThemeConfig['colors'];
  radius: string;
  whatsappNumber?: string;
  welcomeMsg?: string;
}) {
  const [open, setOpen] = useState(false);
  const [chatType, setChatType] = useState<'none' | 'whatsapp' | 'liafrik'>('none');
  const [messages, setMessages] = useState<{ sender: 'user' | 'agent'; text: string; time: string }[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  const primary = colors.primary;
  const secondary = colors.secondary;

  // Initialize session and sync with localStorage
  import('react').then(({ useEffect }) => {
    useEffect(() => {
      let activeSessId = localStorage.getItem('os_chat_session_id') || '';
      if (!activeSessId) {
        activeSessId = `os_sess_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('os_chat_session_id', activeSessId);
      }
      setSessionId(activeSessId);

      const storedMsgs = localStorage.getItem(`os_chat_messages_${activeSessId}`);
      if (storedMsgs) {
        setMessages(JSON.parse(storedMsgs));
      } else {
        const initial = [
          { sender: 'agent' as const, text: welcomeMsg || 'Bonjour ! Comment puis-je vous aider aujourd’hui ?', time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
        ];
        setMessages(initial);
        localStorage.setItem(`os_chat_messages_${activeSessId}`, JSON.stringify(initial));

        // Register session globally
        const registry = JSON.parse(localStorage.getItem('os_active_chat_sessions') || '[]');
        if (!registry.some((s: any) => s.id === activeSessId)) {
          registry.push({
            id: activeSessId,
            customerName: `Client de ${window.location.hostname}`,
            currentPage: window.location.pathname,
            lastMessage: initial[0].text,
            updatedAt: new Date().toISOString(),
          });
          localStorage.setItem('os_active_chat_sessions', JSON.stringify(registry));
        }
      }
    }, [welcomeMsg]);

    // Live update checker for replies from merchant dashboard
    useEffect(() => {
      if (!sessionId) return;
      const interval = setInterval(() => {
        const storedMsgs = localStorage.getItem(`os_chat_messages_${sessionId}`);
        if (storedMsgs) {
          const parsed = JSON.parse(storedMsgs);
          if (parsed.length !== messages.length) {
            setMessages(parsed);
          }
        }
      }, 800);
      return () => clearInterval(interval);
    }, [sessionId, messages.length]);
  });

  const handleSend = () => {
    if (!input.trim() || !sessionId) return;
    const userText = input;
    setInput('');

    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const updated = [...messages, { sender: 'user' as const, text: userText, time: timeStr }];
    setMessages(updated);
    localStorage.setItem(`os_chat_messages_${sessionId}`, JSON.stringify(updated));

    // Update session list registry
    const registry = JSON.parse(localStorage.getItem('os_active_chat_sessions') || '[]');
    const idx = registry.findIndex((s: any) => s.id === sessionId);
    if (idx !== -1) {
      registry[idx].lastMessage = userText;
      registry[idx].updatedAt = new Date().toISOString();
      registry[idx].currentPage = window.location.pathname;
    } else {
      registry.push({
        id: sessionId,
        customerName: `Client de ${window.location.hostname}`,
        currentPage: window.location.pathname,
        lastMessage: userText,
        updatedAt: new Date().toISOString(),
      });
    }
    localStorage.setItem('os_active_chat_sessions', JSON.stringify(registry));

    // Automated fallback response if no quick reply is given by merchant within 1.5 seconds
    setTimeout(() => {
      const currentMsgs = JSON.parse(localStorage.getItem(`os_chat_messages_${sessionId}`) || '[]');
      // Only reply if last message was from the user (i.e. merchant didn't reply yet)
      if (currentMsgs.length > 0 && currentMsgs[currentMsgs.length - 1].sender === 'user') {
        const replyTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const finalMsgs = [...currentMsgs, {
          sender: 'agent' as const,
          text: "Votre message a bien été transmis au gérant de la boutique. Nous vous répondons très rapidement !",
          time: replyTime,
        }];
        setMessages(finalMsgs);
        localStorage.setItem(`os_chat_messages_${sessionId}`, JSON.stringify(finalMsgs));

        const reg = JSON.parse(localStorage.getItem('os_active_chat_sessions') || '[]');
        const sIdx = reg.findIndex((s: any) => s.id === sessionId);
        if (sIdx !== -1) {
          reg[sIdx].lastMessage = "En attente d'agent...";
          reg[sIdx].updatedAt = new Date().toISOString();
          localStorage.setItem('os_active_chat_sessions', JSON.stringify(reg));
        }
      }
    }, 1500);
  };

  const startWhatsApp = () => {
    const num = whatsappNumber || '2250700000000';
    const text = encodeURIComponent("Bonjour ! Je vous contacte depuis votre boutique en ligne Os.");
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      {open ? (
        <div className="w-80 h-96 bg-white shadow-2xl flex flex-col mb-4 overflow-hidden border border-gray-100 transition-all duration-300 transform scale-100 origin-bottom-right" style={{ borderRadius: radius }}>
          {/* Header */}
          <div className="p-4 text-white flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
              <p className="font-bold text-sm tracking-tight">Support Client & Chat</p>
            </div>
            <button onClick={() => { setOpen(false); setChatType('none'); }} className="text-white hover:opacity-80 text-lg">×</button>
          </div>

          {chatType === 'none' ? (
            <div className="flex-1 p-6 flex flex-col justify-center gap-3 bg-gray-50">
              <p className="text-xs text-gray-500 text-center mb-2">Choisissez votre canal de discussion préféré :</p>

              <button
                onClick={() => {
                  if (whatsappNumber) {
                    startWhatsApp();
                  } else {
                    setChatType('whatsapp');
                  }
                }}
                className="w-full py-3 px-4 bg-[#25D366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm animate-pulse"
              >
                <span>💬</span> WhatsApp Direct
              </button>

              <button
                onClick={() => setChatType('liafrik')}
                className="w-full py-3 px-4 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                <span>🚀</span> Live Chat Privé
              </button>
            </div>
          ) : chatType === 'whatsapp' ? (
            <div className="flex-1 p-6 flex flex-col justify-between bg-gray-50">
              <div className="space-y-3 text-center">
                <span className="text-4xl">📞</span>
                <p className="font-bold text-sm text-gray-800">Discuter sur WhatsApp</p>
                <p className="text-xs text-gray-500">Vous allez être redirigé vers l'application officielle WhatsApp pour échanger directement avec le marchand.</p>
              </div>
              <button
                onClick={startWhatsApp}
                className="w-full py-3 px-4 bg-[#25D366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                Ouvrir WhatsApp
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between bg-gray-50 overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs flex flex-col">
                {messages.map((m, i) => (
                  <div key={i} className={`max-w-[80%] p-2.5 rounded-xl ${m.sender === 'user' ? 'bg-indigo-50 text-gray-800 self-end ml-auto' : 'bg-white text-gray-800 self-start mr-auto shadow-sm'}`}>
                    <p>{m.text}</p>
                    <span className="text-[9px] text-gray-400 block text-right mt-1">{m.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 bg-white border-t border-gray-100 flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs focus:outline-none border border-gray-200"
                />
                <button
                  onClick={handleSend}
                  className="p-2 text-white rounded-lg flex items-center justify-center"
                  style={{ background: primary }}
                >
                  ➤
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl cursor-pointer shadow-2xl transition-all duration-300 hover:scale-110 relative animate-bounce"
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      >
        💬
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
          1
        </span>
      </button>
    </div>
  );
}

export function getFreeBlockDefaults(type: FreeBlockType): Record<string, any> {
  switch (type) {
    case 'text': return { text: 'Votre texte ici', size: 'md', align: 'left' };
    case 'image': return { url: '', alt: '' };
    case 'button': return { label: 'Cliquez ici', url: '#', style: 'primary' };
    case 'spacer': return { height: 32 };
  }
}

export interface ThemeConfig {
  siteType: SiteType;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  fonts: { heading: string; body: string };
  spacing: 'compact' | 'comfortable' | 'spacious';
  radius: 'sharp' | 'soft' | 'round';
  shadow: 'none' | 'subtle' | 'bold';
  sections: ThemeSection[];
  isPublished: boolean;
  scrollAnimation?: 'none' | 'fade' | 'slide' | 'zoom';
  customCss?: string;
}

export const RADIUS_MAP: Record<ThemeConfig['radius'], string> = { sharp: '4px', soft: '16px', round: '28px' };

export const FONT_OPTIONS = [
  'Montserrat', 'Poppins', 'Inter', 'Playfair Display', 'Roboto',
  'Lato', 'Raleway', 'Open Sans', 'Space Grotesk',
] as const;

export function googleFontsHref(fonts: { heading: string; body: string }): string {
  const families = Array.from(new Set([fonts.heading, fonts.body]))
    .map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
export const SHADOW_MAP: Record<ThemeConfig['shadow'], string> = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)',
  bold: '0 8px 24px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
};

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceCents: number | null;
  stock: number;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  thumbnail: string | null;
  variants?: ProductVariant[];
}

export const SITE_TYPES: { id: SiteType; label: string; desc: string }[] = [
  { id: 'landing', label: 'Landing page', desc: 'Page de présentation produit/service unique' },
  { id: 'ecommerce', label: 'E-commerce complet', desc: 'Catalogue, panier, checkout, filtres' },
  { id: 'business', label: 'Site vitrine', desc: 'À propos + services + contact' },
  { id: 'marketplace', label: 'Marketplace', desc: 'Multi-vendeurs, multi-catégories' },
];

export const SECTION_LIBRARY: { type: ThemeSection['type']; label: string; icon: string }[] = [
  { type: 'header', label: 'Header', icon: '☰' },
  { type: 'hero', label: 'Hero', icon: '✦' },
  { type: 'product-grid', label: 'Grille produits', icon: '▦' },
  { type: 'category-grid', label: 'Catégories', icon: '▤' },
  { type: 'countdown', label: 'Compte à rebours', icon: '⏱' },
  { type: 'filters-list', label: 'Filtres + liste', icon: '⇕' },
  { type: 'product-detail', label: 'Fiche produit', icon: '⬚' },
  { type: 'payments', label: 'Paiements', icon: '💳' },
  { type: 'testimonials', label: 'Témoignages', icon: '★' },
  { type: 'about', label: 'À propos', icon: 'ℹ' },
  { type: 'newsletter', label: 'Newsletter', icon: '✉' },
  { type: 'faq', label: 'FAQ', icon: '?' },
  { type: 'footer', label: 'Footer', icon: '▭' },
  { type: 'social-bar', label: 'Barre sociale', icon: '◎' },
  { type: 'chat-float', label: 'Chat flottant', icon: '💬' },
  { type: 'custom-blocks', label: 'Bloc libre', icon: '🧩' },
];

export const EDITABLE_PROPS: Record<string, { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'list' | 'select'; options?: string[] }[]> = {
  header: [
    { key: 'logo', label: 'Afficher le logo', type: 'boolean' },
    { key: 'nav', label: 'Liens du menu (séparés par des virgules)', type: 'list' },
    { key: 'megaMenu', label: 'Méga-menu catégories', type: 'boolean' },
  ],
  hero: [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'subtitle', label: 'Sous-titre', type: 'textarea' },
    { key: 'cta', label: 'Bouton (CTA)', type: 'text' },
    { key: 'image', label: 'Image URL', type: 'text' },
    { key: 'layout', label: 'Disposition', type: 'select', options: ['centered', 'split', 'fullbleed'] },
  ],
  'product-grid': [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'columns', label: 'Colonnes (2-4)', type: 'number' },
  ],
  'category-grid': [{ key: 'title', label: 'Titre', type: 'text' }],
  countdown: [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'endDate', label: 'Date de fin', type: 'date' },
  ],
  'filters-list': [{ key: 'filters', label: 'Filtres (séparés par virgules)', type: 'text' }],
  'product-detail': [
    { key: 'title', label: 'Nom du produit', type: 'text' },
    { key: 'price', label: 'Prix', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  about: [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'text', label: 'Texte', type: 'textarea' },
  ],
  newsletter: [
    { key: 'title', label: 'Titre', type: 'text' },
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
  ],
};

export function getSectionDefaults(type: ThemeSection['type']): Record<string, any> {
  const d: Record<string, Record<string, any>> = {
    header: { logo: true, nav: ['Accueil', 'Boutique', 'Contact'], megaMenu: false },
    hero: { title: 'Nouveau titre', subtitle: 'Sous-titre descriptif', cta: 'Découvrir', image: '', layout: 'centered' },
    'product-grid': { columns: 4, title: 'Nos produits' },
    'category-grid': { title: 'Catégories' },
    countdown: { title: 'Offre limitée', endDate: '2026-12-31' },
    'filters-list': { filters: ['Marque', 'Prix', 'Couleur', 'Taille'] },
    'product-detail': { title: 'Nom du produit', price: '25 000 XOF', description: 'Description du produit' },
    payments: {},
    testimonials: {},
    about: { title: 'À propos de nous', text: 'Notre histoire, notre mission.' },
    newsletter: { title: 'Restez connecté', placeholder: 'Votre email' },
    faq: {},
    footer: {},
    'social-bar': {},
    'chat-float': {},
    'custom-blocks': { blocks: [{ id: `b${Date.now()}`, type: 'text', props: getFreeBlockDefaults('text') }] },
  };
  return d[type] || {};
}

// Default colors: Ocean Blue (#0369A1) as the principal theme color
export function defaultThemeForType(siteType: SiteType): ThemeConfig {
  const baseColors = { primary: '#0369A1', secondary: '#0284C7', accent: '#3B82F6', background: '#FFFFFF', text: '#0F172A' };
  const baseFonts = { heading: 'Montserrat', body: 'Montserrat' };

  if (siteType === 'landing') {
    return {
      siteType, colors: baseColors, fonts: baseFonts, spacing: 'comfortable', radius: 'soft', shadow: 'subtle', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Produit', 'Contact'] } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Mon produit phare', subtitle: 'Une description percutante qui captive vos visiteurs', cta: 'Acheter maintenant', image: '', layout: 'centered' } },
        { id: 's3', type: 'countdown', visible: true, props: { title: 'Offre de lancement', endDate: '2026-12-31' } },
        { id: 's4', type: 'testimonials', visible: true, props: {} },
        { id: 's5', type: 'payments', visible: true, props: {} },
        { id: 's6', type: 'newsletter', visible: true, props: { title: 'Restez connecté', placeholder: 'Votre email' } },
        { id: 's7', type: 'footer', visible: true, props: {} },
      ],
    };
  }
  if (siteType === 'ecommerce') {
    return {
      siteType, colors: baseColors, fonts: baseFonts, spacing: 'comfortable', radius: 'soft', shadow: 'subtle', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Boutique', 'Best Seller', 'À propos', 'Contact'], megaMenu: true } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Bienvenue sur notre boutique', subtitle: 'Découvrez des sélections d\'exception pour sublimer votre quotidien.', cta: 'Acheter maintenant', image: '', layout: 'centered' } },
        { id: 's3', type: 'category-grid', visible: true, props: { title: 'Catégories' } },
        { id: 's4', type: 'countdown', visible: true, props: { title: 'Promo flash', endDate: '2026-12-31' } },
        { id: 's5', type: 'filters-list', visible: true, props: { filters: ['Marque', 'Prix', 'Couleur', 'Taille'] } },
        { id: 's6', type: 'product-grid', visible: true, props: { columns: 4, title: 'Nos produits' } },
        { id: 's7', type: 'product-detail', visible: true, props: { title: 'Nom du produit', price: '25 000 XOF', description: 'Description du produit' } },
        { id: 's8', type: 'testimonials', visible: true, props: {} },
        { id: 's9', type: 'payments', visible: true, props: {} },
        { id: 's10', type: 'footer', visible: true, props: {} },
        { id: 's11', type: 'social-bar', visible: true, props: {} },
        { id: 's12', type: 'chat-float', visible: true, props: {} },
      ],
    };
  }
  if (siteType === 'business') {
    return {
      siteType, colors: baseColors, fonts: baseFonts, spacing: 'spacious', radius: 'soft', shadow: 'subtle', isPublished: false,
      sections: [
        { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Services', 'À propos', 'Contact'] } },
        { id: 's2', type: 'hero', visible: true, props: { title: 'Notre entreprise', subtitle: 'Au service de votre réussite', cta: 'Nous contacter', image: '', layout: 'centered' } },
        { id: 's3', type: 'about', visible: true, props: { title: 'À propos de nous', text: 'Notre histoire, notre mission, nos valeurs.' } },
        { id: 's4', type: 'testimonials', visible: true, props: {} },
        { id: 's5', type: 'newsletter', visible: true, props: { title: 'Restez connecté', placeholder: 'Votre email' } },
        { id: 's6', type: 'footer', visible: true, props: {} },
      ],
    };
  }
  return {
    siteType: 'marketplace', colors: baseColors, fonts: baseFonts, spacing: 'comfortable', radius: 'soft', shadow: 'subtle', isPublished: false,
    sections: [
      { id: 's1', type: 'header', visible: true, props: { logo: true, nav: ['Accueil', 'Shop', 'Best Seller', 'À propos', 'Contact'], megaMenu: true } },
      { id: 's2', type: 'hero', visible: true, props: { title: "Tout l'Afrique, une marketplace", subtitle: 'Des milliers de vendeurs réunit au même endroit.', cta: 'Parcourir', image: '', layout: 'centered' } },
      { id: 's3', type: 'category-grid', visible: true, props: { title: 'Catégories Populaires' } },
      { id: 's4', type: 'countdown', visible: true, props: { title: 'Offres du jour', endDate: '2026-12-31' } },
      { id: 's5', type: 'product-grid', visible: true, props: { columns: 4, title: 'Produits populaires' } },
      { id: 's6', type: 'testimonials', visible: true, props: {} },
      { id: 's7', type: 'payments', visible: true, props: {} },
      { id: 's8', type: 'footer', visible: true, props: {} },
      { id: 's9', type: 'social-bar', visible: true, props: {} },
      { id: 's10', type: 'chat-float', visible: true, props: {} },
    ],
  };
}

const sampleProducts = [
  { name: 'Robe Wax Premium', price: '25 000', img: 'https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&w=400', tag: 'Nouveau' },
  { name: 'Sac cuir artisanal', price: '45 000', img: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&w=400', tag: '' },
  { name: 'Montre classique', price: '60 000', img: 'https://images.pexels.com/photos/9978722/pexels-photo-9978722.jpeg?auto=compress&w=400', tag: 'Best' },
  { name: 'Chaussures stylish', price: '35 000', img: 'https://images.pexels.com/photos/2589653/pexels-photo-2589653.jpeg?auto=compress&w=400', tag: '' },
];

const sampleCategories = [
  { name: 'Mode', icon: '👗', count: 248 },
  { name: 'Électronique', icon: '📱', count: 156 },
  { name: 'Maison', icon: '🏠', count: 89 },
  { name: 'Beauté', icon: '💄', count: 134 },
];

const sampleTestimonials = [
  { name: 'Awa K.', text: 'Service impeccable, livraison rapide à Abidjan!', rating: 5, role: 'Cliente' },
  { name: 'Mamadou S.', text: 'Produits de qualité, je recommande vivement.', rating: 5, role: 'Client' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  XOF: 'FCFA', XAF: 'FCFA', NGN: '₦', GHS: '₵', GNF: 'FG', CDF: 'FC',
  USD: '$', EUR: '€', GBP: '£', MAD: 'DH', KES: 'KSh', ZAR: 'R',
};

export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ProductDetailBlock({
  section, colors, image, cartProduct, r, onAddToCart,
}: {
  section: ThemeSection;
  colors: ThemeConfig['colors'];
  image: string | null;
  cartProduct: StorefrontProduct | null;
  r: string;
  onAddToCart?: (item: AddToCartPayload) => void;
}) {
  const primary = colors.primary;
  const secondary = colors.secondary;
  const txt = colors.text;

  const variantGroups: Record<string, ProductVariant[]> = {};
  (cartProduct?.variants || []).forEach(v => {
    if (!variantGroups[v.name]) variantGroups[v.name] = [];
    variantGroups[v.name].push(v);
  });
  const groupNames = Object.keys(variantGroups);

  const [selected, setSelected] = useState<Record<string, string>>({});

  const hasVariants = groupNames.length > 0;
  const matchedVariant = hasVariants
    ? groupNames.length === 1
      ? variantGroups[groupNames[0]].find(v => v.value === selected[groupNames[0]])
      : undefined
    : undefined;

  const effectivePriceCents = matchedVariant?.priceCents ?? cartProduct?.price_cents ?? 0;
  const outOfStock = hasVariants && matchedVariant && matchedVariant.stock <= 0;
  const needsSelection = hasVariants && groupNames.some(g => !selected[g]);

  return (
    <div className="px-6 py-8" style={{ background: colors.background }}>
      <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
        <div className="w-full md:w-1/2 aspect-square overflow-hidden flex items-center justify-center" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.12)', background: hexToRgba(primary, 0.03), borderRadius: r }}>
          {image
            ? <img src={image} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs" style={{ color: hexToRgba(txt, 0.3) }}>Pas d'image</span>}
        </div>
        <div className="flex-1 flex flex-col justify-center font-sans">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-md font-bold text-white" style={{ background: outOfStock ? '#ef4444' : '#16a34a' }}>{outOfStock ? 'Épuisé' : 'En stock'}</span>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: txt, letterSpacing: '-0.02em' }}>{cartProduct?.name || section.props.title || 'Nom du produit'}</h2>
          <p className="text-3xl font-bold mb-3" style={{ color: 'var(--theme-primary, ' + primary + ')' }}>
            {cartProduct ? formatPrice(effectivePriceCents, cartProduct.currency) : (section.props.price || '25 000 XOF')}
          </p>
          <p className="text-sm mb-4" style={{ color: hexToRgba(txt, 0.6) }}>{section.props.description || 'Description du produit'}</p>

          {hasVariants ? (
            groupNames.map(g => (
              <div key={g} className="mb-4">
                <p className="text-xs font-semibold mb-2" style={{ color: hexToRgba(txt, 0.6) }}>{g}</p>
                <div className="flex flex-wrap gap-2">
                  {variantGroups[g].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelected({ ...selected, [g]: v.value })}
                      disabled={v.stock <= 0}
                      className="px-3 h-10 flex items-center justify-center text-sm font-medium cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed font-sans"
                      style={selected[g] === v.value ? { background: 'var(--theme-primary, ' + primary + ')', color: 'white', borderRadius: r } : { border: `1.5px solid ${hexToRgba(txt, 0.15)}`, color: txt, borderRadius: r }}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : null}

          <div className="flex gap-3">
            {onAddToCart && cartProduct ? (
              <button
                onClick={() => {
                  if (needsSelection) return;
                  onAddToCart({
                    productId: cartProduct.id,
                    name: cartProduct.name,
                    priceCents: effectivePriceCents,
                    currency: cartProduct.currency,
                    thumbnail: cartProduct.thumbnail,
                    variantId: matchedVariant?.id,
                    variantLabel: hasVariants ? Object.values(selected).join(' / ') : undefined,
                  });
                }}
                disabled={needsSelection || outOfStock}
                className="flex-1 px-5 py-3 text-white text-sm font-semibold text-center transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 font-sans cursor-pointer"
                style={{ background: `linear-gradient(135deg, var(--theme-primary, ${primary}), var(--theme-secondary, ${secondary}))`, boxShadow: `0 4px 14px ${hexToRgba(primary, 0.35)}`, borderRadius: r }}
              >
                {outOfStock ? 'Épuisé' : needsSelection ? 'Choisissez une option' : 'Ajouter au panier'}
              </button>
            ) : (
              <div className="flex-1 px-5 py-3 text-white text-sm font-semibold text-center font-sans" style={{ background: `linear-gradient(135deg, var(--theme-primary, ${primary}), var(--theme-secondary, ${secondary}))`, boxShadow: `0 4px 14px ${hexToRgba(primary, 0.35)}`, borderRadius: r }}>Ajouter au panier</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface AddToCartPayload {
  productId: string;
  name: string;
  priceCents: number;
  currency: string;
  thumbnail: string | null;
  variantId?: string;
  variantLabel?: string;
}

export interface StorefrontCategory {
  id: string;
  name: string;
  count: number;
  imageUrl?: string | null;
}

export interface StorefrontReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
}

export function renderSection(
  section: ThemeSection,
  colors: ThemeConfig['colors'],
  realProducts?: StorefrontProduct[],
  radius: ThemeConfig['radius'] = 'soft',
  shadow: ThemeConfig['shadow'] = 'subtle',
  realCategories?: StorefrontCategory[],
  onAddToCart?: (item: AddToCartPayload) => void,
  cartItemCount = 0,
  realReviews?: StorefrontReview[],
  themeScrollAnimation?: ThemeConfig['scrollAnimation'],
): React.ReactNode {
  const primary = colors.primary;
  const secondary = colors.secondary;
  const bg = section.props.__bgOverride || colors.background;
  const txt = section.props.__textOverride || colors.text;
  const subtleBg = hexToRgba(primary, 0.04);
  const r = RADIUS_MAP[radius];
  const cardShadow = SHADOW_MAP[shadow];
  const isLiveContext = realProducts !== undefined;
  const isLiveCategoryContext = realCategories !== undefined;
  const isLiveReviewContext = realReviews !== undefined;

  // Render CSS variable dictionary for full Shopify color customization compliance
  const cssVars = {
    '--theme-primary': colors.primary,
    '--theme-secondary': colors.secondary,
    '--theme-accent': colors.accent,
    '--theme-bg': bg,
    '--theme-text': txt,
  } as React.CSSProperties;

  switch (section.type) {
    case 'header':
      return (
        <div className="flex items-center justify-between px-6 py-3 border-b-2" style={{ ...cssVars, borderBottomColor: hexToRgba(primary, 0.1), background: 'var(--theme-bg)' }}>
          <div className="flex items-center gap-2">
            {section.props.logo !== false && (
              <span className="font-bold text-base tracking-tight font-sans" style={{ color: 'var(--theme-primary)' }}>Os Boutique</span>
            )}
          </div>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium font-sans" style={{ color: 'var(--theme-text)' }}>
            {(section.props.nav || []).map((n: string) => (
              <span key={n} className="hover:opacity-60 transition-opacity cursor-pointer">{n}</span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {section.props.megaMenu && (
              <span className="text-xs px-3 py-1.5 font-medium text-white transition-transform hover:scale-105 font-sans cursor-pointer" style={{ background: 'var(--theme-primary)', borderRadius: r }}>Catégories ▾</span>
            )}
            <a href={onAddToCart ? '/cart' : undefined} className="relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: subtleBg }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {onAddToCart && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--theme-primary)' }}>
                  {cartItemCount}
                </span>
              )}
            </a>
          </div>
        </div>
      );

    case 'hero': {
      const img = section.props.image;
      const layout = section.props.layout || 'centered';

      if (layout === 'split') {
        return (
          <div className="grid md:grid-cols-2 items-center font-sans" style={{ ...cssVars, background: 'var(--theme-bg)' }}>
            <div className="px-8 py-16 md:py-24 order-2 md:order-1">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: hexToRgba(primary, 0.1), color: 'var(--theme-primary)' }}>
                ✨ Nouvelle collection Os
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight leading-tight" style={{ color: 'var(--theme-text)' }}>
                {section.props.title || 'Hero'}
              </h1>
              <p className="text-lg mb-6 text-gray-500">{section.props.subtitle || ''}</p>
              <div className="flex gap-3">
                <div className="inline-block px-6 py-3 text-white text-sm font-semibold transition-transform hover:scale-105 cursor-pointer" style={{ background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`, borderRadius: r, boxShadow: `0 4px 14px ${hexToRgba(primary, 0.35)}` }}>
                  {section.props.cta || 'Découvrir'}
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 aspect-[4/3] md:aspect-auto md:h-full min-h-[240px]" style={{ background: img ? `url(${img}) center/cover` : `linear-gradient(135deg, ${hexToRgba(primary, 0.15)}, ${hexToRgba(secondary, 0.1)})` }} />
          </div>
        );
      }

      if (layout === 'fullbleed') {
        return (
          <div className="relative min-h-[420px] md:min-h-[520px] flex items-end font-sans" style={{ background: img ? `url(${img}) center/cover` : `linear-gradient(160deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 65%)' }} />
            <div className="relative z-10 px-8 md:px-10 pb-12 md:pb-16 text-white max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight leading-tight">{section.props.title || 'Hero'}</h1>
              <p className="text-base md:text-lg mb-6 text-white/80">{section.props.subtitle || ''}</p>
              <div className="inline-block px-6 py-3 text-sm font-semibold bg-white text-gray-900 cursor-pointer" style={{ borderRadius: r }}>{section.props.cta || 'Découvrir'}</div>
            </div>
          </div>
        );
      }

      return (
        <div className="relative overflow-hidden font-sans" style={{ ...cssVars, background: img ? `url(${img}) center/cover` : `linear-gradient(135deg, ${hexToRgba(primary, 0.1)}, ${hexToRgba(secondary, 0.06)})` }}>
          <div className="px-8 py-16 text-center relative z-10">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: hexToRgba(primary, 0.1), color: 'var(--theme-primary)' }}>
              ✨ Exclusivités d'Afrique & d'Ailleurs
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight leading-tight" style={{ color: 'var(--theme-text)' }}>
              {section.props.title || 'Hero'}
            </h1>
            <p className="text-lg mb-6 max-w-xl mx-auto text-gray-600">
              {section.props.subtitle || ''}
            </p>
            <div className="flex gap-3 justify-center">
              <div className="inline-block px-6 py-3 text-white text-sm font-semibold transition-transform hover:scale-105 cursor-pointer" style={{ background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`, borderRadius: r, boxShadow: `0 4px 14px ${hexToRgba(primary, 0.35)}` }}>
                {section.props.cta || 'Découvrir'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'product-grid': {
      const cols = section.props.columns || 4;
      const gridCols = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4';

      const displayProducts = isLiveContext
        ? (realProducts as StorefrontProduct[]).map(p => ({
            id: p.id,
            name: p.name,
            priceLabel: formatPrice(p.price_cents, p.currency),
            price_cents: p.price_cents,
            currency: p.currency,
            img: p.thumbnail || null,
            tag: '',
          }))
        : sampleProducts.map((p, i) => ({
            id: `sample-${i}`,
            name: p.name,
            priceLabel: `${p.price} XOF`,
            price_cents: 2500000,
            currency: 'XOF',
            img: p.img,
            tag: p.tag,
          }));

      const showEmptyState = isLiveContext && displayProducts.length === 0;

      return (
        <div className="px-6 py-8 font-sans" style={{ ...cssVars, background: 'var(--theme-bg)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--theme-text)' }}>{section.props.title || 'Nos produits'}</h3>
            {!showEmptyState && <span className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--theme-primary)' }}>Voir tout →</span>}
          </div>
          {showEmptyState ? (
            <div className="text-center py-12" style={{ background: subtleBg, borderRadius: r }}>
              <p className="text-sm text-gray-400">Aucun produit disponible pour le moment.</p>
            </div>
          ) : (
            <div className={`grid ${gridCols} gap-6`}>
              {displayProducts.map((p) => (
                <div key={p.id} className="group overflow-hidden transition-all hover:-translate-y-1 bg-white border border-gray-100" style={{ boxShadow: cardShadow, borderRadius: r }}>
                  <div className="relative aspect-square overflow-hidden flex items-center justify-center" style={{ background: hexToRgba(primary, 0.03) }}>
                    {p.img
                      ? <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                      : <span className="text-xs text-gray-300">Pas d'image</span>}
                    {p.tag && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold text-white" style={{ background: 'var(--theme-primary)' }}>{p.tag}</span>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate text-gray-900">{p.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>{p.priceLabel}</p>
                    </div>
                    {onAddToCart && (
                      <button
                        onClick={() => onAddToCart({ productId: p.id, name: p.name, priceCents: p.price_cents, currency: p.currency, thumbnail: p.img })}
                        className="mt-3 w-full py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:opacity-90"
                        style={{ background: 'var(--theme-primary)', borderRadius: r }}
                      >
                        Ajouter au panier
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'category-grid': {
      const displayCategories = isLiveCategoryContext
        ? (realCategories as StorefrontCategory[])
        : sampleCategories;
      const showEmptyCats = isLiveCategoryContext && displayCategories.length === 0;
      return (
        <div className="px-6 py-8 font-sans" style={{ ...cssVars, background: 'var(--theme-bg)' }}>
          <h3 className="text-xl font-extrabold tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>{section.props.title || 'Catégories'}</h3>
          {showEmptyCats ? (
            <div className="text-center py-8 rounded-2xl" style={{ background: subtleBg }}>
              <p className="text-sm text-gray-400">Aucune catégorie créée pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayCategories.map((c: any, i: number) => (
                <div key={c.id || i} className="group flex items-center gap-3 p-4 transition-all hover:shadow-md cursor-pointer border border-gray-100 bg-white" style={{ borderRadius: r }}>
                  <div className="w-12 h-12 flex items-center justify-center text-xl shrink-0 overflow-hidden bg-gray-50" style={{ borderRadius: r }}>
                    {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" /> : (c.icon || '🏷️')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{c.name}</p>
                    <p className="text-[11px] text-gray-400">{c.count} article{c.count > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'countdown': {
      const endDate = section.props.endDate;
      let units = [{ label: 'Jours', value: '07' }, { label: 'Heures', value: '14' }, { label: 'Minutes', value: '32' }, { label: 'Secondes', value: '45' }];
      if (isLiveContext && endDate) {
        const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        units = [
          { label: 'Jours', value: String(days).padStart(2, '0') },
          { label: 'Heures', value: String(hours).padStart(2, '0') },
          { label: 'Minutes', value: String(minutes).padStart(2, '0') },
          { label: 'Secondes', value: String(seconds).padStart(2, '0') },
        ];
      }
      return (
        <div className="px-6 py-10 text-center relative overflow-hidden font-sans" style={{ ...cssVars, background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{section.props.title || 'Promo Limitée'}</h3>
            <p className="text-white/80 text-sm mb-6 max-w-sm mx-auto">Profitez de tarifs d'exception sur toute notre gamme.</p>
            <div className="flex justify-center gap-4">
              {units.map(u => (
                <div key={u.label} className="text-center">
                  <div className="w-14 h-14 flex items-center justify-center text-2xl font-bold font-mono text-white shadow-sm" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', borderRadius: r }}>{u.value}</div>
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider mt-1.5">{u.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'filters-list': {
      const displayProducts = isLiveContext
        ? (realProducts as StorefrontProduct[]).slice(0, 3).map(p => ({ id: p.id, name: p.name, priceLabel: formatPrice(p.price_cents, p.currency), img: p.thumbnail }))
        : sampleProducts.slice(0, 3).map((p, i) => ({ id: `sample-${i}`, name: p.name, priceLabel: `${p.price} XOF`, img: p.img }));
      const showEmptyState = isLiveContext && displayProducts.length === 0;

      return (
        <div className="px-6 py-8 flex flex-col md:flex-row gap-6 font-sans" style={{ ...cssVars, background: 'var(--theme-bg)' }}>
          <div className="w-full md:w-56 shrink-0 space-y-4">
            <div className="p-4 border border-gray-100 bg-gray-50/50" style={{ borderRadius: r }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Filtres de tri</p>
              {(section.props.filters || []).map((f: string) => (
                <div key={f} className="mb-3">
                  <p className="text-xs font-bold text-gray-700 mb-1.5">{f}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Tous', 'A', 'B'].map((v, i) => (
                      <span key={v} className="text-[11px] px-2.5 py-1 font-semibold cursor-pointer transition-colors" style={i === 0 ? { background: 'var(--theme-primary)', color: 'white', borderRadius: r } : { background: 'white', color: 'var(--theme-text)', border: '1px solid #f3f4f6', borderRadius: r }}>{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {showEmptyState ? (
            <div className="flex-1 flex items-center justify-center py-12 border border-dashed border-gray-100 rounded-2xl">
              <p className="text-sm text-gray-400">Aucun produit disponible.</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayProducts.map((p) => (
                <div key={p.id} className="group overflow-hidden bg-white border border-gray-100" style={{ boxShadow: cardShadow, borderRadius: r }}>
                  <div className="relative aspect-square overflow-hidden flex items-center justify-center bg-gray-50">
                    {p.img
                      ? <img src={p.img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                      : <span className="text-xs text-gray-300">Pas d'image</span>}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold truncate text-gray-900">{p.name}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: 'var(--theme-primary)' }}>{p.priceLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'product-detail': {
      const cartProduct = isLiveContext ? (realProducts as StorefrontProduct[])[0] : null;
      const fallbackImg = isLiveContext ? cartProduct?.thumbnail : sampleProducts[0].img;
      const image = section.props.image || fallbackImg || sampleProducts[0].img;
      return (
        <ProductDetailBlock
          section={section}
          colors={colors}
          image={image}
          cartProduct={isLiveContext ? cartProduct : null}
          r={r}
          onAddToCart={isLiveContext ? onAddToCart : undefined}
        />
      );
    }

    case 'payments':
      return (
        <div className="px-6 py-6 text-center font-sans" style={{ ...cssVars, background: 'var(--theme-bg)', borderTop: `1px solid ${hexToRgba(txt, 0.06)}`, borderBottom: `1px solid ${hexToRgba(txt, 0.06)}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Moyens de paiement acceptés</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Flutterwave', 'Orange Money', 'MTN MoMo', 'CinetPay', 'Wave', 'Stripe'].map(p => (
              <span key={p} className="text-xs px-4 py-2 font-semibold transition-transform hover:scale-105 shadow-sm border border-gray-100 bg-white text-gray-700" style={{ borderRadius: r }}>{p}</span>
            ))}
          </div>
        </div>
      );

    case 'testimonials': {
      const displayReviews = isLiveReviewContext
        ? (realReviews as StorefrontReview[]).map(r => ({ name: r.customerName, role: 'Client vérifié', rating: r.rating, text: r.comment || '' }))
        : sampleTestimonials.map(t => ({ name: t.name, role: t.role, rating: t.rating, text: t.text }));
      const showEmptyReviews = isLiveReviewContext && displayReviews.length === 0;
      return (
        <div className="px-6 py-10 font-sans" style={{ ...cssVars, background: 'var(--theme-bg)' }}>
          <h3 className="text-xl font-extrabold text-center mb-8 tracking-tight" style={{ color: 'var(--theme-text)' }}>Ils adorent Os Boutique</h3>
          {showEmptyReviews ? (
            <p className="text-center text-sm text-gray-400">Aucun avis client pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {displayReviews.map((t, i) => (
                <div key={i} className="p-5 transition-all hover:shadow-md bg-white border border-gray-100" style={{ borderRadius: r }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))` }}>{t.name[0]}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2 text-sm" style={{ color: '#eab308' }}>{'★'.repeat(t.rating)}</div>
                  {t.text && <p className="text-xs text-gray-600 leading-relaxed">"{t.text}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'about':
      return (
        <div className="px-6 py-10 font-sans" style={{ ...cssVars, background: 'var(--theme-bg)' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-3 tracking-tight" style={{ color: 'var(--theme-text)' }}>{section.props.title || 'À propos de nous'}</h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">{section.props.text || 'Notre histoire, notre mission, nos valeurs d\'excellence.'}</p>
          </div>
        </div>
      );

    case 'newsletter':
      return (
        <div className="px-6 py-10 text-center font-sans" style={{ ...cssVars, background: `linear-gradient(135deg, ${hexToRgba(primary, 0.05)}, ${hexToRgba(secondary, 0.03)})` }}>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-extrabold mb-1 tracking-tight" style={{ color: 'var(--theme-text)' }}>{section.props.title || 'Inscrivez-vous à la Newsletter'}</h3>
            <p className="text-xs text-gray-400 mb-4">Soyez informés de toutes les ventes privées et nouvelles collections d'exception.</p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input type="email" placeholder={section.props.placeholder || 'Votre email'} className="flex-1 px-4 py-2 text-xs focus:outline-none bg-white border border-gray-100" style={{ borderRadius: r }} />
              <div className="px-5 py-2 text-white text-xs font-bold cursor-pointer hover:opacity-90 flex items-center justify-center shadow-md shrink-0" style={{ background: 'var(--theme-primary)', borderRadius: r }}>S'abonner</div>
            </div>
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="px-6 py-10 font-sans" style={{ ...cssVars, background: 'var(--theme-bg)' }}>
          <h3 className="text-xl font-extrabold text-center mb-6 tracking-tight" style={{ color: 'var(--theme-text)' }}>Questions Fréquentes</h3>
          <div className="max-w-xl mx-auto space-y-3">
            {[
              { q: 'Quels sont les délais de livraison?', a: 'Livraison express sous 24-48h selon votre région d\'Afrique.' },
              { q: 'Comment s\'effectue le paiement?', a: 'Par Mobile Money direct (Orange, MTN, Wave) ou carte bancaire.' },
            ].map((f, i) => (
              <div key={i} className="p-4 bg-white border border-gray-100" style={{ borderRadius: r }}>
                <p className="text-xs font-bold text-gray-900 mb-1">{f.q}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="px-6 py-8 font-sans" style={{ background: '#0F172A', color: 'rgba(255,255,255,0.7)' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div>
              <span className="font-extrabold text-white text-sm">Os Store</span>
              <p className="text-[10px] text-white/40 mt-1">L'e-commerce d'excellence nouvelle génération.</p>
            </div>
            {[
              { title: 'Boutique', links: ['Nouveautés', 'Promotions'] },
              { title: 'Aide', links: ['Contact', 'Retours'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-[10px] font-bold uppercase text-white/40 mb-2">{col.title}</p>
                {col.links.map(l => <p key={l} className="text-xs text-white/60 hover:text-white cursor-pointer transition-colors mb-1">{l}</p>)}
              </div>
            ))}
          </div>
          <div className="max-w-4xl mx-auto mt-6 pt-4 flex justify-between items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] text-white/30">© 2026 Os Corp. Tous droits réservés.</p>
          </div>
        </div>
      );

    case 'social-bar':
      return (
        <div className="fixed right-3 top-1/2 -translate-y-1/2 space-y-2 z-30 font-sans">
          {[
            { bg: '#1877F2', icon: 'FB' }, { bg: '#E4405F', icon: 'IG' },
          ].map(s => (
            <div key={s.icon} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-transform hover:scale-110 shadow-lg" style={{ background: s.bg }}>{s.icon}</div>
          ))}
        </div>
      );

    case 'chat-float':
      return (
        <ChatFloatWidget
          colors={colors}
          radius={r}
          whatsappNumber={section.props.whatsappNumber}
          welcomeMsg={section.props.welcomeMsg}
        />
      );

    case 'custom-blocks': {
      const blocks: FreeBlock[] = section.props.blocks || [];
      return (
        <div className="px-6 py-8 font-sans" style={{ ...cssVars, background: 'var(--theme-bg)' }}>
          <div className="max-w-xl mx-auto space-y-4">
            {blocks.map(b => {
              if (b.type === 'text') {
                const sizeClass = b.props.size === 'lg' ? 'text-2xl font-bold' : b.props.size === 'sm' ? 'text-sm' : 'text-base';
                const alignClass = b.props.align === 'center' ? 'text-center' : b.props.align === 'right' ? 'text-right' : 'text-left';
                return <p key={b.id} className={`${sizeClass} ${alignClass}`} style={{ color: 'var(--theme-text)' }}>{b.props.text}</p>;
              }
              if (b.type === 'image') {
                return b.props.url ? (
                  <img key={b.id} src={b.props.url} alt={b.props.alt || ''} className="w-full object-cover" style={{ borderRadius: r }} />
                ) : (
                  <div key={b.id} className="w-full aspect-video flex items-center justify-center text-xs text-gray-300 bg-gray-50" style={{ borderRadius: r }}>Pas d'image</div>
                );
              }
              if (b.type === 'button') {
                const isPrimary = b.props.style !== 'outline';
                return (
                  <a
                    key={b.id}
                    href={b.props.url || '#'}
                    className="inline-block px-6 py-2 text-xs font-bold transition-transform hover:scale-105 cursor-pointer shadow-sm"
                    style={isPrimary
                      ? { background: 'var(--theme-primary)', color: 'white', borderRadius: r }
                      : { border: `1.5px solid ${hexToRgba(txt, 0.2)}`, color: 'var(--theme-text)', borderRadius: r }}
                  >
                    {b.props.label}
                  </a>
                );
              }
              if (b.type === 'spacer') {
                return <div key={b.id} style={{ height: b.props.height || 32 }} />;
              }
              return null;
            })}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

// Pre-configured Premium & Beautiful Themes
export interface ThemeVariant {
  key: string;
  label: string;
  siteType: SiteType;
  build: () => ThemeConfig;
}

const v = (id: string, type: ThemeSection['type'], props: Record<string, any> = {}): ThemeSection =>
  ({ id, type, visible: true, props: { ...getSectionDefaults(type), ...props } });

export const THEME_VARIANTS: ThemeVariant[] = [
  {
    key: 'ocean-blue-default',
    label: '🌊 Ocean Blue (Default Standard Theme)',
    siteType: 'ecommerce',
    build: () => ({
      siteType: 'ecommerce',
      spacing: 'comfortable',
      radius: 'soft',
      shadow: 'subtle',
      isPublished: false,
      colors: {
        primary: '#0369A1', // Ocean Blue
        secondary: '#0284C7',
        accent: '#3B82F6',
        background: '#FFFFFF',
        text: '#0F172A',
      },
      fonts: { heading: 'Montserrat', body: 'Montserrat' },
      sections: [
        v('s1', 'header', { megaMenu: true }),
        v('s2', 'hero', { layout: 'centered', title: 'Découvrez l’élégance de l’Eau', subtitle: 'Une collection d\'exception inspirée par l\'océan et la pureté.', cta: 'Découvrir la gamme' }),
        v('s3', 'product-grid', { columns: 4, title: 'Tendances d’Aujourd’hui' }),
        v('s4', 'testimonials'),
        v('s5', 'footer'),
      ],
    }),
  },
  {
    key: 'coral-alternative',
    label: '✨ Coral & Peach (Alternate Beautiful Theme)',
    siteType: 'ecommerce',
    build: () => ({
      siteType: 'ecommerce',
      spacing: 'comfortable',
      radius: 'round',
      shadow: 'subtle',
      isPublished: false,
      colors: {
        primary: '#FF6B35', // Gorgeous Coral
        secondary: '#F7B267',
        accent: '#E76F51',
        background: '#FFFDF9',
        text: '#1D1E2C',
      },
      fonts: { heading: 'Poppins', body: 'Inter' },
      sections: [
        v('s1', 'header', { megaMenu: false }),
        v('s2', 'hero', { layout: 'split', title: 'La Chaleur du Corail', subtitle: 'Éveillez vos sens avec nos nouveautés pleines de vie et de peps.', cta: 'Parcourir' }),
        v('s3', 'category-grid'),
        v('s4', 'product-grid', { columns: 3 }),
        v('s5', 'testimonials'),
        v('s6', 'footer'),
      ],
    }),
  },
  {
    key: 'premium-afrik-art-wax',
    label: '✨ Afrik Art & Wax (Premium Edition)',
    siteType: 'ecommerce',
    build: () => ({
      siteType: 'ecommerce',
      spacing: 'comfortable',
      radius: 'soft',
      shadow: 'subtle',
      isPublished: false,
      scrollAnimation: 'slide',
      colors: {
        primary: '#D97706',
        secondary: '#9D174D',
        accent: '#065F46',
        background: '#FFFDF9',
        text: '#1F2937',
      },
      fonts: { heading: 'Space Grotesk', body: 'Space Grotesk' },
      sections: [
        v('s1', 'header', { logo: true, nav: ['Collection Wax', 'Robes', 'Accessoires', 'À Propos', 'Contact'], megaMenu: true }),
        v('s2', 'hero', {
          layout: 'split',
          title: 'L’Art du Wax Africain Moderne',
          subtitle: 'Une fusion unique de motifs ancestraux et de coupes haute couture contemporaines pour illuminer votre style.',
          cta: 'Découvrir la Collection',
          image: 'https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&w=800',
        }),
        v('s3', 'category-grid', { title: 'Sélections d’Afrique' }),
        v('s4', 'countdown', { title: 'Vente Privée d’Exception - Éditions Limitées', endDate: '2026-12-31' }),
        v('s5', 'product-grid', { columns: 4, title: 'Créations Exclusives' }),
        v('s6', 'testimonials'),
        v('s7', 'payments'),
        v('s8', 'chat-float', { whatsappNumber: '2250700000000', welcomeMsg: 'Bienvenue chez Afrik Art ! Discutons sur WhatsApp pour des conseils personnalisés.' }),
        v('s9', 'footer'),
      ],
    }),
  },
  {
    key: 'premium-lagos-beauty',
    label: '✨ Lagos Beauty & Cosmetics (Premium)',
    siteType: 'ecommerce',
    build: () => ({
      siteType: 'ecommerce',
      spacing: 'comfortable',
      radius: 'round',
      shadow: 'bold',
      isPublished: false,
      scrollAnimation: 'fade',
      colors: {
        primary: '#BE185D',
        secondary: '#F472B6',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#111827',
      },
      fonts: { heading: 'Poppins', body: 'Inter' },
      sections: [
        v('s1', 'header', { logo: true, nav: ['Nouveautés', 'Maquillage', 'Soins de la Peau', 'Blog', 'Contact'], megaMenu: false }),
        v('s2', 'hero', {
          layout: 'fullbleed',
          title: 'Sublimez Votre Éclat Naturel',
          subtitle: 'Des formules de cosmétiques premium spécialement conçues pour sublimer toutes les teintes de peau avec des ingrédients naturels.',
          cta: 'Acheter Maintenant',
          image: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&w=1200',
        }),
        v('s3', 'product-grid', { columns: 3, title: 'Nos Best-Sellers Éclat' }),
        v('s4', 'about', { title: 'Inspiré par Lagos, Formulé pour le Monde', text: 'Chaque produit célèbre la diversité de la beauté en mariant la science moderne aux huiles précieuses africaines comme le karité et l’argan.' }),
        v('s5', 'testimonials'),
        v('s6', 'newsletter'),
        v('s7', 'chat-float', { whatsappNumber: '2348000000000', welcomeMsg: 'Hello Glow Getter! Discutez avec nos experts beauté sur WhatsApp.' }),
        v('s8', 'footer'),
      ],
    }),
  },
];

export function getThemeVariant(key: string): ThemeConfig | null {
  const found = THEME_VARIANTS.find(t => t.key === key);
  return found ? found.build() : null;
}

export function ThemePreviewSVG({ variantKey }: { variantKey: string | null }) {
  const theme = variantKey ? getThemeVariant(variantKey) : null;
  const c = theme?.colors || { primary: '#0369A1', secondary: '#0284C7', accent: '#3B82F6', background: '#FFFFFF', text: '#0F172A' };
  const radiusPx = theme ? (theme.radius === 'sharp' ? 2 : theme.radius === 'round' ? 14 : 7) : 6;

  return (
    <svg viewBox="0 0 200 110" className="w-full rounded-lg border border-gray-100" style={{ background: c.background }}>
      <rect x="0" y="0" width="200" height="16" fill={c.primary} opacity="0.1" />
      <circle cx="12" cy="8" r="3.5" fill={c.primary} />
      <rect x="22" y="5.5" width="26" height="5" rx="1.5" fill={c.text} opacity="0.4" />
      <rect x="152" y="5.5" width="36" height="5" rx="1.5" fill={c.text} opacity="0.2" />

      <rect x="8" y="22" width="184" height="30" rx={radiusPx} fill={c.primary} opacity="0.08" />
      <rect x="16" y="30" width="80" height="6" rx="2" fill={c.text} opacity="0.7" />
      <rect x="16" y="40" width="46" height="5" rx="2" fill={c.secondary} />

      {[0, 1, 2, 3].map(i => (
        <rect key={i} x={8 + i * 46} y="58" width="40" height="40" rx={radiusPx} fill={c.primary} opacity={i % 2 === 0 ? 0.16 : 0.26} />
      ))}
    </svg>
  );
}

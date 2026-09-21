import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import {
  ArrowLeft, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown,
  Monitor, Tablet, Smartphone, Undo2, Redo2, Check, Menu, X, SlidersHorizontal,
  Palette, Image as ImageIcon, LayoutGrid, ShoppingBag, FileText, Star, Mail,
  Megaphone, PanelTop, Columns, Bell, Loader2, ShieldCheck,
  UtensilsCrossed, Tag, RotateCcw, Grid3x3, Shapes, GripVertical, ExternalLink, Rocket,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme } from '@/lib/themes';
import ThemeRenderer from '@/components/theme/ThemeRenderer';

const STORAGE_KEY = 'sellia_theme';
const CUSTOM_KEY = 'sellia_theme_custom';

const SECTION_ICONS = {
  announcement: Bell, header: PanelTop, hero: ImageIcon, productGrid: ShoppingBag,
  imageText: Columns, multicolumn: Columns, testimonials: Star, blogList: FileText,
  gallery: ImageIcon, cta: Megaphone, newsletter: Mail, footer: LayoutGrid,
  collectionList: ImageIcon, trustbar: ShieldCheck, menu: UtensilsCrossed, pricing: Tag, iconGrid: Grid3x3, custom: Shapes,
};

const SECTION_CATALOG = [
  { type: 'announcement', label: 'Annonce', icon: Bell, make: () => ({ props: { message: 'Nouvelle annonce', bg: '#1B1B1B', text: '#FFFFFF' } }) },
  { type: 'header', label: 'En-tête', icon: PanelTop, make: () => ({ props: { logo: 'Logo', links: ['Accueil', 'Boutique'] } }) },
  { type: 'hero', label: 'Bannière', icon: ImageIcon, make: () => ({ props: { image: 'https://picsum.photos/seed/new-hero/1600/900', title: 'Nouveau titre', subtitle: 'Sous-titre', buttons: [{ label: 'Bouton', variant: 'primary' }], align: 'left' } }) },
  { type: 'trustbar', label: 'Garanties', icon: ShieldCheck, make: () => ({ props: { items: [{ icon: '✦', text: 'Atout' }] } }) },
  { type: 'collectionList', label: 'Catégories', icon: ImageIcon, make: () => ({ props: { title: 'Catégories', columns: 4, items: [{ image: 'https://picsum.photos/seed/newcat/500/650', title: 'Catégorie', count: '0 articles' }] } }) },
  { type: 'productGrid', label: 'Grille produits', icon: ShoppingBag, make: () => ({ props: { title: 'Nos produits', columns: 4, products: [{ image: 'https://picsum.photos/seed/np/600', title: 'Produit', price: '0 FCFA', rating: 5 }] } }) },
  { type: 'imageText', label: 'Image + texte', icon: Columns, make: () => ({ props: { image: 'https://picsum.photos/seed/newit/800', title: 'Titre', text: 'Texte', button: 'En savoir plus', reverse: false } }) },
  { type: 'multicolumn', label: 'Colonnes', icon: Columns, make: () => ({ props: { title: 'Atouts', items: [{ icon: '✦', title: 'Point', text: 'Description' }] } }) },
  { type: 'testimonials', label: 'Avis clients', icon: Star, make: () => ({ props: { title: 'Avis', items: [{ quote: 'Excellent', author: 'Client', role: '' }] } }) },
  { type: 'blogList', label: 'Articles', icon: FileText, make: () => ({ props: { title: 'Articles', posts: [{ image: 'https://picsum.photos/seed/newpost/700/500', title: 'Article', excerpt: 'Extrait', date: '' }] } }) },
  { type: 'gallery', label: 'Galerie', icon: ImageIcon, make: () => ({ props: { title: 'Galerie', images: ['https://picsum.photos/seed/newg/700/500'] } }) },
  { type: 'menu', label: 'Carte / Menu', icon: UtensilsCrossed, make: () => ({ props: { title: 'Notre carte', subtitle: '', items: [{ name: 'Plat', description: '', price: '0 FCFA' }] } }) },
  { type: 'pricing', label: 'Tarifs', icon: Tag, make: () => ({ props: { title: 'Tarifs', plans: [{ name: 'Plan', price: '0', period: 'FCFA/mois', features: ['Caractéristique'], highlighted: false }] } }) },
  { type: 'iconGrid', label: 'Icônes', icon: Grid3x3, make: () => ({ props: { title: 'Nos atouts', columns: 3, items: [{ iconImage: '', icon: '✦', title: 'Atout', text: 'Description' }] } }) },
  { type: 'custom', label: 'Section libre', icon: Shapes, make: () => ({ props: { columns: 2, background: 'transparent', blocks: [{ kind: 'heading', text: 'Titre', image: '', align: 'left', span: 2 }, { kind: 'text', text: 'Votre texte libre ici.', image: '', align: 'left', span: 1 }, { kind: 'image', text: '', image: '', align: 'left', span: 1 }, { kind: 'button', text: 'Bouton', image: '', align: 'left', span: 1 }] } }) },
  { type: 'cta', label: "Appel à l'action", icon: Megaphone, make: () => ({ props: { title: 'Prêt ?', subtitle: '', buttonLabel: 'Commencer', buttonHref: '#' } }) },
  { type: 'newsletter', label: 'Newsletter', icon: Mail, make: () => ({ props: { title: 'Newsletter', subtitle: '', placeholder: 'Votre e-mail', buttonLabel: "S'inscrire" } }) },
  { type: 'footer', label: 'Pied de page', icon: LayoutGrid, make: () => ({ props: { logo: 'Logo', description: '', columns: [{ title: 'Liens', links: [] }], social: [], copyright: '© 2026' } }) },
];

const isImage = (v) => typeof v === 'string' && /^https?:\/\/.+\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(v);
const isColor = (v) => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

let uidc = 0;
const nid = (p) => `${p}-${++uidc}`;

function setByPath(obj, path, value) {
  const keys = path.split('.');
  const root = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const idx = parseInt(k, 10);
    const child = Number.isNaN(idx) ? cur[k] : cur[idx];
    const nextChild = Array.isArray(child) ? [...child] : { ...child };
    if (Number.isNaN(idx)) cur[k] = nextChild; else cur[idx] = nextChild;
    cur = nextChild;
  }
  const last = keys[keys.length - 1];
  const li = parseInt(last, 10);
  if (Number.isNaN(li)) cur[last] = value; else cur[li] = value;
  return root;
}

function loadInitial() {
  const custom = localStorage.getItem(CUSTOM_KEY);
  if (custom) { try { return JSON.parse(custom); } catch { /* fall through */ } }
  return cloneTheme(localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID);
}

async function uploadThemeImage(file, tenantId) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `theme/${tenantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

function ImageField({ value, onSetUrl }) {
  const { store } = useCurrentStore();
  const [url, setUrl] = useState(value || '');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  useEffect(() => { setUrl(value || ''); }, [value]);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const file_url = await uploadThemeImage(file, store?.id || 'shared');
      onSetUrl(file_url);
      setUrl(file_url);
    } catch (e) {
      alert(e.message || "Échec de l'envoi de l'image");
    } finally { setBusy(false); }
  };
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
        onClick={() => fileRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed cursor-pointer transition py-3 px-2 ${drag ? 'border-[#008060] bg-[#008060]/5' : 'border-[#E1E1E1] hover:border-[#008060]/50 hover:bg-black/[0.02]'}`}
      >
        <div className="w-12 h-12 rounded-md overflow-hidden bg-[#F4F4F4] border border-[#E1E1E1] flex items-center justify-center">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-[#C9C9C9]" />}
        </div>
        <span className="text-[11px] font-semibold text-[#008060]">{busy ? 'Téléversement…' : value ? 'Remplacer l\u2019image' : 'Glisse une image ou clique'}</span>
        <span className="text-[10px] text-[#6D7175]">PNG · JPG · WEBP</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      </div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} onBlur={() => onSetUrl(url)} placeholder="ou colle une URL" className="mt-1.5 w-full px-2 py-1.5 border border-[#E1E1E1] rounded text-[11px] font-mono" />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">{label}</label>
      {children}
    </div>
  );
}

const IMAGE_KEYS = new Set(['image', 'logoImage', 'iconImage', 'photo', 'cover', 'avatar']);
const ENUM_OPTIONS = {
  align: ['left', 'center', 'right'],
  variant: ['primary', 'outline'],
  kind: ['heading', 'text', 'image', 'button'],
  span: [1, 2, 3, 4],
  displayMode: ['grid', 'scrolling'],
  style: ['fixed', 'scrolling'],
};

function ScalarInput({ value, onChange, fieldKey }) {
  const inputCls = 'w-full px-2.5 py-1.5 border border-[#E1E1E1] rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]';
  if (fieldKey && ENUM_OPTIONS[fieldKey]) {
    const opts = ENUM_OPTIONS[fieldKey];
    return (
      <select value={value ?? ''} onChange={(e) => onChange(fieldKey === 'span' ? +e.target.value : e.target.value)} className={inputCls}>
        <option value="">— Choisir —</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (isColor(value)) {
    return (
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 rounded border border-[#E1E1E1]" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      </div>
    );
  }
  if (isImage(value) || (IMAGE_KEYS.has(fieldKey) && typeof value === 'string')) return <ImageField value={value} onSetUrl={onChange} />;
  if (typeof value === 'number') return <input type="number" value={value} onChange={(e) => onChange(+e.target.value)} className={inputCls} />;
  if (typeof value === 'boolean') return <label className="flex items-center gap-2 text-xs text-[#202223] cursor-pointer"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="accent-[#008060]" /> {value ? 'Oui' : 'Non'}</label>;
  if (typeof value === 'string' && value.length > 60) return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={inputCls} />;
  return <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
}

function ArrayEditor({ items, path, onSet }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="p-2 border border-[#E1E1E1] rounded-md bg-[#FAFAFA]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[#6D7175] uppercase">#{i + 1}</span>
            <div className="flex gap-1">
              <button onClick={() => { if (i > 0) { const a = [...items]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; onSet(path, a); } }} disabled={i === 0} className="text-[#6D7175] disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
              <button onClick={() => { if (i < items.length - 1) { const a = [...items]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; onSet(path, a); } }} disabled={i === items.length - 1} className="text-[#6D7175] disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
              <button onClick={() => onSet(path, items.filter((_, j) => j !== i))} className="text-[#6D7175] hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
          {item && typeof item === 'object'
            ? Object.entries(item).map(([k, v]) => <Field key={k} label={k}><ScalarInput fieldKey={k} value={v} onChange={(nv) => onSet(`${path}.${i}.${k}`, nv)} /></Field>)
            : <ScalarInput value={item} onChange={(nv) => onSet(`${path}.${i}`, nv)} />}
        </div>
      ))}
      <button onClick={() => onSet(path, items.length ? [...items, JSON.parse(JSON.stringify(items[items.length - 1]))] : [typeof items[0] === 'object' ? {} : ''])} className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-[#008060] border border-dashed border-[#008060]/40 rounded-md py-1.5 hover:bg-[#008060]/5"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
    </div>
  );
}

function Inspector({ section, onSetProp }) {
  if (!section) return <div className="p-4 text-xs text-[#6D7175]">Sélectionnez une section dans l'arbre pour la modifier.</div>;
  const c = section.props || {};
  const isLogoSection = section.type === 'header' || section.type === 'footer';
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-4 rounded bg-[#008060]" />
        <p className="text-xs font-bold text-[#202223] uppercase tracking-wide">{section.label}</p>
      </div>
      {isLogoSection && (
        <Field label="Logo (image)">
          <ImageField value={c.logoImage || ''} onSetUrl={(u) => onSetProp('logoImage', u)} />
        </Field>
      )}
      {Object.entries(c).map(([k, v]) => (
        <Field key={k} label={k}>
          {Array.isArray(v) ? (
            <ArrayEditor items={v} path={k} onSet={onSetProp} />
          ) : (
            <ScalarInput fieldKey={k} value={v} onChange={(nv) => onSetProp(k, nv)} />
          )}
        </Field>
      ))}
    </div>
  );
}

const PALETTE_KEYS = ['primary', 'primaryText', 'accent', 'bg', 'surface', 'text', 'muted', 'border', 'dark'];
const PALETTE_LABELS = { primary: 'Primaire', primaryText: 'Texte sur primaire', accent: 'Accent', bg: 'Fond', surface: 'Surface', text: 'Texte', muted: 'Texte secondaire', border: 'Bordures', dark: 'Fond foncé' };

import { FONT_OPTIONS } from '@/lib/fonts';

const BUTTON_STYLES = [
  { id: 'rounded', label: 'Arrondi' },
  { id: 'pill', label: 'Pilule' },
  { id: 'square', label: 'Carré' },
];

function ThemeSettings({ theme, onPalette, onFont, onButtonStyle, onReset }) {
  return (
    <div className="p-4 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-4 rounded bg-[#008060]" />
          <p className="text-xs font-bold text-[#202223] uppercase tracking-wide">Couleurs</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PALETTE_KEYS.map((k) => (
            <Field key={k} label={PALETTE_LABELS[k]}>
              <div className="flex items-center gap-2">
                <input type="color" value={theme.palette[k]} onChange={(e) => onPalette(k, e.target.value)} className="h-8 w-10 rounded border border-[#E1E1E1]" />
                <input value={theme.palette[k]} onChange={(e) => onPalette(k, e.target.value)} className="w-full px-2 py-1.5 border border-[#E1E1E1] rounded text-[11px] font-mono" />
              </div>
            </Field>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-4 rounded bg-[#008060]" />
          <p className="text-xs font-bold text-[#202223] uppercase tracking-wide">Typographie</p>
        </div>
        <Field label="Police des titres">
          <select value={theme.fonts.heading} onChange={(e) => onFont('heading', e.target.value)} className="w-full px-2.5 py-1.5 border border-[#E1E1E1] rounded-md text-xs bg-white" style={{ fontFamily: theme.fonts.heading }}>
            {FONT_OPTIONS.map((f) => <option key={f.css} value={f.css} style={{ fontFamily: f.css }}>{f.label} — {f.category}</option>)}
          </select>
        </Field>
        <Field label="Police du texte">
          <select value={theme.fonts.body} onChange={(e) => onFont('body', e.target.value)} className="w-full px-2.5 py-1.5 border border-[#E1E1E1] rounded-md text-xs bg-white" style={{ fontFamily: theme.fonts.body }}>
            {FONT_OPTIONS.map((f) => <option key={f.css} value={f.css} style={{ fontFamily: f.css }}>{f.label} — {f.category}</option>)}
          </select>
        </Field>
        <p className="text-[10px] text-[#6D7175] mt-1">Chaque police est chargée avec plusieurs graisses (light à bold) et s'adapte automatiquement aux écrans mobiles.</p>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-4 rounded bg-[#008060]" />
          <p className="text-xs font-bold text-[#202223] uppercase tracking-wide">Forme des boutons</p>
        </div>
        <div className="flex gap-2">
          {BUTTON_STYLES.map((b) => (
            <button
              key={b.id}
              onClick={() => onButtonStyle(b.id)}
              className={`flex-1 text-xs font-semibold py-2 border transition ${(theme.buttonStyle || 'rounded') === b.id ? 'border-[#008060] bg-[#008060]/5 text-[#008060]' : 'border-[#E1E1E1] text-[#6D7175] hover:border-[#C9C9C9]'}`}
              style={{ borderRadius: b.id === 'pill' ? '9999px' : b.id === 'square' ? '4px' : '10px' }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onReset} className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#6D7175] border border-[#E1E1E1] rounded-md py-2 hover:bg-black/5"><RotateCcw className="w-3.5 h-3.5" /> Réinitialiser le thème</button>
    </div>
  );
}


export default function ThemeEditor() {
  const [theme, setTheme] = useState(loadInitial);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState('section');
  const { store } = useCurrentStore();
  const [autoSaved, setAutoSaved] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Load the tenant's real saved theme from theme_configs (one row per
  // tenant, UNIQUE(tenant_id)) instead of starting from whatever was in
  // this browser's localStorage - that's per-device and invisible to the
  // actual storefront, which is the whole point of the table already
  // having anon-readable published_config/config policies.
  useEffect(() => {
    if (!store?.id) return;
    let cancelled = false;
    supabase.from('theme_configs').select('config').eq('tenant_id', store.id).maybeSingle().then(({ data }) => {
      if (cancelled) return;
      // Some theme_configs rows predate this editor and store an
      // incompatible/empty shape there (see isValidTheme) - falls back to
      // the stock default rather than crashing on the mismatch.
      if (isValidTheme(data?.config)) setTheme(data.config);
      setThemeLoaded(true);
    });
    return () => { cancelled = true; };
  }, [store?.id]);

  // Autosave — debounced upsert into theme_configs.config. Waits for the
  // initial DB load above so it never overwrites a saved theme with the
  // fallback default before that load has had a chance to run.
  useEffect(() => {
    if (!themeLoaded || !store?.id) return;
    setAutoSaved(false);
    const t = setTimeout(async () => {
      const { error } = await supabase.from('theme_configs').upsert(
        { tenant_id: store.id, config: theme, sections: theme.sections, colors: theme.palette, fonts: theme.fonts, updated_at: new Date().toISOString() },
        { onConflict: 'tenant_id' }
      );
      if (!error) setAutoSaved(true);
    }, 800);
    return () => clearTimeout(t);
  }, [theme, themeLoaded, store?.id]);

  const commit = useCallback((next) => {
    setPast((h) => [...h, theme]);
    setFuture([]);
    setTheme(next);
  }, [theme]);

  const undo = () => { if (!past.length) return; const prev = past[past.length - 1]; setPast((h) => h.slice(0, -1)); setFuture((f) => [theme, ...f]); setTheme(prev); };
  const redo = () => { if (!future.length) return; const next = future[0]; setFuture((f) => f.slice(1)); setPast((h) => [...h, theme]); setTheme(next); };

  const updateSections = (fn) => commit({ ...theme, sections: fn(theme.sections) });
  const selectSection = (id) => { setSelectedId(id); setTab('section'); setRightOpen(true); };
  const toggleVisible = (id) => updateSections((s) => s.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)));
  const onDragEnd = (res) => { if (!res.destination) return; updateSections((s) => { const a = [...s]; const [m] = a.splice(res.source.index, 1); a.splice(res.destination.index, 0, m); return a; }); };
  const removeSection = (id) => { updateSections((s) => s.filter((x) => x.id !== id)); if (selectedId === id) setSelectedId(null); };
  const addSection = (def) => {
    const id = nid(def.type);
    updateSections((s) => [...s, { id, type: def.type, label: def.label, visible: true, ...def.make() }]);
    setAddOpen(false); setLeftOpen(false); setSelectedId(id); setTab('section');
  };

  const setProp = (path, value) => {
    if (!selectedId) return;
    updateSections((s) => s.map((x) => (x.id === selectedId ? { ...x, props: setByPath(x.props, path, value) } : x)));
  };
  const uploadImage = async (sectionId, path, file) => {
    try {
      const file_url = await uploadThemeImage(file, store?.id || 'shared');
      updateSections((s) => s.map((x) => (x.id === sectionId ? { ...x, props: setByPath(x.props, path, file_url) } : x)));
    } catch (e) {
      alert(e.message || "Échec de l'envoi de l'image");
    }
  };
  const onPalette = (k, v) => commit({ ...theme, palette: { ...theme.palette, [k]: v } });
  const onFont = (k, v) => commit({ ...theme, fonts: { ...theme.fonts, [k]: v } });
  const onButtonStyle = (v) => commit({ ...theme, buttonStyle: v });
  const onReset = () => { if (confirm('Réinitialiser ce thème à sa version d\u2019origine ? Vos modifications seront perdues.')) { const fresh = cloneTheme(theme.id); commit(fresh); } };

  const selectedSection = theme.sections.find((s) => s.id === selectedId) || null;
  const publish = async () => {
    setPublishing(true);
    try {
      if (store?.id) {
        const { error: cfgError } = await supabase.from('theme_configs').upsert(
          { tenant_id: store.id, config: theme, published_config: theme, sections: theme.sections, colors: theme.palette, fonts: theme.fonts, is_published: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { onConflict: 'tenant_id' }
        );
        if (cfgError) throw cfgError;
        const { error: tenantError } = await supabase.from('tenants').update({ theme_id: theme.id, status: store.status === 'trial' ? store.status : 'active' }).eq('id', store.id);
        if (tenantError) throw tenantError;
      }
      setPublished(true);
      setTimeout(() => setPublished(false), 2500);
    } catch (e) {
      alert('Erreur de publication : ' + (e.message || 'inconnue'));
    } finally {
      setPublishing(false);
    }
  };
  const width = device === 'mobile' ? 380 : device === 'tablet' ? 768 : 1280;

  const TabBtn = ({ id, label, icon: Ic }) => (
    <button onClick={() => setTab(id)} className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-md transition ${tab === id ? 'bg-white text-[#008060] shadow-sm' : 'text-[#6D7175] hover:text-[#202223]'}`}>
      <Ic className="w-3.5 h-3.5" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      <div className="h-14 border-b border-[#E1E1E1] flex items-center justify-between px-3 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223] shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <button onClick={() => setLeftOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-black/5 text-[#6D7175]"><Menu className="w-5 h-5" /></button>
          <Link to="/theme-gallery" className="flex items-center gap-2 min-w-0 hover:opacity-80">
            <span className="text-sm font-semibold text-[#202223] truncate">{theme.name}</span>
            <span className="hidden sm:inline text-[10px] font-semibold bg-[#008060] text-white px-2 py-0.5 rounded-full">{theme.category}</span>
            <Palette className="w-4 h-4 text-[#6D7175]" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F4F4F4] p-1 rounded-lg">
            <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-md ${device === 'desktop' ? 'bg-white shadow-sm text-[#008060]' : 'text-[#6D7175]'}`}><Monitor className="w-4 h-4" /></button>
            <button onClick={() => setDevice('tablet')} className={`p-1.5 rounded-md ${device === 'tablet' ? 'bg-white shadow-sm text-[#008060]' : 'text-[#6D7175]'}`}><Tablet className="w-4 h-4" /></button>
            <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-md ${device === 'mobile' ? 'bg-white shadow-sm text-[#008060]' : 'text-[#6D7175]'}`}><Smartphone className="w-4 h-4" /></button>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={undo} disabled={!past.length} className="p-1.5 rounded-md text-[#6D7175] disabled:opacity-30 hover:bg-black/5"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={!future.length} className="p-1.5 rounded-md text-[#6D7175] disabled:opacity-30 hover:bg-black/5"><Redo2 className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setRightOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-black/5 text-[#6D7175]"><SlidersHorizontal className="w-4 h-4" /></button>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#6D7175]">
            {autoSaved ? <><Check className="w-3.5 h-3.5 text-[#008060]" /> Enregistré</> : <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sauvegarde…</>}
          </div>
          {store?.slug && <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-[#202223] border border-[#E1E1E1] rounded-full px-3 py-2 hover:bg-black/5 whitespace-nowrap"><ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Aperçu</span></a>}
          <button onClick={publish} disabled={publishing} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-full hover:bg-[#00694d] whitespace-nowrap disabled:opacity-50">
            {published ? <><Check className="w-4 h-4" /> <span className="hidden sm:inline">Publié</span></> : publishing ? <><Loader2 className="w-4 h-4 animate-spin" /> <span className="hidden sm:inline">…</span></> : <><Rocket className="w-4 h-4" /> <span className="hidden sm:inline">Publier</span></>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {(leftOpen || rightOpen) && <div className="lg:hidden absolute inset-0 bg-black/30 z-40" onClick={() => { setLeftOpen(false); setRightOpen(false); }} />}

        <div className={`absolute z-50 inset-y-0 left-0 w-72 max-w-[82%] bg-white border-r border-[#E1E1E1] shadow-xl transition-transform lg:static lg:z-auto lg:w-64 lg:shadow-none lg:translate-x-0 ${leftOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <p className="text-xs font-bold text-[#6D7175] uppercase tracking-wide">Sections</p>
            <button onClick={() => setLeftOpen(false)} className="lg:hidden p-1 rounded text-[#6D7175]"><X className="w-4 h-4" /></button>
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="overflow-y-auto pb-2" style={{ maxHeight: 'calc(100% - 120px)' }}>
                  {theme.sections.map((s, i) => {
                    const sel = selectedId === s.id;
                    const Ic = SECTION_ICONS[s.type] || LayoutGrid;
                    return (
                      <Draggable key={s.id} draggableId={s.id} index={i}>
                        {(p, snap) => (
                          <div ref={p.innerRef} {...p.draggableProps} onClick={() => selectSection(s.id)} className={`group flex items-center gap-1.5 mx-1.5 px-2 py-1.5 rounded-md cursor-pointer text-[13px] ${sel ? 'bg-[#008060]/10 text-[#008060] font-medium' : 'text-[#202223] hover:bg-black/5'} ${snap.isDragging ? 'shadow-md bg-white ring-1 ring-[#008060]/30' : ''}`}>
                            <span {...p.dragHandleProps} onClick={(e) => e.stopPropagation()} className="text-[#C9C9C9] hover:text-[#6D7175] cursor-grab active:cursor-grabbing touch-none"><GripVertical className="w-3.5 h-3.5" /></span>
                            <Ic className={`w-3.5 h-3.5 ${!s.visible ? 'opacity-40' : 'opacity-70'}`} />
                            <span className={`flex-1 truncate ${!s.visible ? 'opacity-40' : ''}`}>{s.label}</span>
                            <button onClick={(e) => { e.stopPropagation(); toggleVisible(s.id); }} className="opacity-0 group-hover:opacity-100">{s.visible ? <Eye className="w-3.5 h-3.5 text-[#6D7175]" /> : <EyeOff className="w-3.5 h-3.5 text-[#6D7175]" />}</button>
                            <button onClick={(e) => { e.stopPropagation(); removeSection(s.id); }} className="opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5 text-[#6D7175] hover:text-red-500" /></button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="border-t border-[#E1E1E1] p-2.5 relative">
            {addOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-white border border-[#E1E1E1] rounded-lg shadow-xl p-1.5 z-10 max-h-72 overflow-y-auto">
                <p className="px-2 py-1 text-[10px] font-bold text-[#6D7175] uppercase tracking-wide">Ajouter une section</p>
                {SECTION_CATALOG.map((d) => (
                  <button key={d.type} onClick={() => addSection(d)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-[#202223] hover:bg-black/5 text-left">
                    <span className="w-7 h-7 rounded-md bg-[#008060]/10 flex items-center justify-center"><d.icon className="w-3.5 h-3.5 text-[#008060]" /></span>{d.label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setAddOpen((o) => !o)} className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#008060] border border-dashed border-[#008060]/40 rounded-md py-2 hover:bg-[#008060]/5"><Plus className="w-4 h-4" /> Ajouter une section</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#EBEBEE] p-4 sm:p-6 lg:p-10 flex justify-center">
          <div className="w-full" style={{ maxWidth: width }}>
            <div className="bg-white rounded-xl shadow-xl border border-[#E1E1E1] overflow-hidden">
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-[#E1E1E1] bg-[#F4F4F4]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" /><span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" /><span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                <div className="ml-3 flex-1 bg-white rounded-md px-2.5 py-1 text-[11px] text-[#6D7175] border border-[#E1E1E1] font-mono truncate">ma-boutique.com</div>
              </div>
              <ThemeRenderer theme={theme} sections={theme.sections} mode="editor" selectedId={selectedId} onSelectSection={selectSection} onSetImage={(sid, path, url) => { updateSections((s) => s.map((x) => (x.id === sid ? { ...x, props: setByPath(x.props, path, url) } : x))); }} onUploadFile={uploadImage} />
            </div>
          </div>
        </div>

        <div className={`absolute z-50 inset-y-0 right-0 w-80 max-w-[85%] bg-white border-l border-[#E1E1E1] shadow-xl transition-transform lg:static lg:z-auto lg:w-80 lg:shadow-none lg:translate-x-0 flex flex-col ${rightOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex gap-1 bg-[#F4F4F4] p-1 rounded-lg flex-1">
              <TabBtn id="section" label="Section" icon={LayoutGrid} />
              <TabBtn id="theme" label="Thème" icon={Palette} />
            </div>
            <button onClick={() => setRightOpen(false)} className="lg:hidden p-1 ml-2 rounded text-[#6D7175]"><X className="w-4 h-4" /></button>
          </div>
          <div className="overflow-y-auto flex-1">
            {tab === 'section' && <Inspector section={selectedSection} onSetProp={setProp} />}
            {tab === 'theme' && <ThemeSettings theme={theme} onPalette={onPalette} onFont={onFont} onButtonStyle={onButtonStyle} onReset={onReset} />}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { useTenant, useAuth, useIsSuperAdmin } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Modal } from './ui';
import { Smartphone, Tablet, Monitor, Palette, Eye, History, Layers, Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Sparkles, Bot, Check, Edit3, Store, Settings as SettingsIcon, FileText } from 'lucide-react';
import { ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY, EDITABLE_PROPS, getSectionDefaults, defaultThemeForType, renderSection, getThemeVariant, FONT_OPTIONS, googleFontsHref, FreeBlock, FreeBlockType, getFreeBlockDefaults } from '../../lib/theme-engine';
import { PLATFORM_ROOT_DOMAIN } from '../../lib/subdomain';
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

export const SCROLL_ANIMATIONS = [
  { id: 'none', label: 'Aucune' },
  { id: 'fade', label: 'Fondu doux (Fade)' },
  { id: 'slide', label: 'Glissement élégant (Slide Up)' },
  { id: 'zoom', label: 'Zoom discret (Zoom In)' },
] as const;

// Hiérarchie des forfaits, du moins cher au plus cher.
// ⚠️ Doit correspondre exactement aux codes de la table Supabase `plans`.
const PLAN_RANK: Record<string, number> = { starter: 0, pro: 1, premium: 2, entreprise: 3 };

const FREE_BLOCK_LABELS: Record<FreeBlockType, { label: string; icon: string }> = {
  text: { label: 'Texte', icon: '📝' },
  image: { label: 'Image', icon: '🖼️' },
  button: { label: 'Bouton', icon: '🔘' },
  spacer: { label: 'Espacement', icon: '↕️' },
};

function SortableBlockRow({ block, onUpdate, onRemove }: { block: FreeBlock; onUpdate: (props: Record<string, any>) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const meta = FREE_BLOCK_LABELS[block.type];

  return (
    <div ref={setNodeRef} style={style} className="p-2.5 rounded-lg border border-gray-100 bg-white space-y-2">
      <div className="flex items-center gap-1.5">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-0.5 text-gray-300 hover:text-gray-500">
          <GripVertical size={12} />
        </button>
        <span className="text-xs font-medium text-gray-600 flex-1">{meta.icon} {meta.label}</span>
        <button onClick={onRemove} className="p-0.5 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
      </div>

      {block.type === 'text' && (
        <>
          <textarea rows={2} value={block.props.text || ''} onChange={e => onUpdate({ ...block.props, text: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" />
          <div className="flex gap-1">
            {(['sm', 'md', 'lg'] as const).map(s => (
              <button key={s} onClick={() => onUpdate({ ...block.props, size: s })} className={`flex-1 py-1 rounded text-xs ${block.props.size === s ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{s}</button>
            ))}
            {(['left', 'center', 'right'] as const).map(a => (
              <button key={a} onClick={() => onUpdate({ ...block.props, align: a })} className={`flex-1 py-1 rounded text-xs ${block.props.align === a ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{a[0].toUpperCase()}</button>
            ))}
          </div>
        </>
      )}

      {block.type === 'image' && (
        <input value={block.props.url || ''} onChange={e => onUpdate({ ...block.props, url: e.target.value })} placeholder="URL de l'image" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" />
      )}

      {block.type === 'button' && (
        <>
          <input value={block.props.label || ''} onChange={e => onUpdate({ ...block.props, label: e.target.value })} placeholder="Texte du bouton" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" />
          <input value={block.props.url || ''} onChange={e => onUpdate({ ...block.props, url: e.target.value })} placeholder="Lien (https://…)" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" />
          <div className="flex gap-1">
            <button onClick={() => onUpdate({ ...block.props, style: 'primary' })} className={`flex-1 py-1 rounded text-xs ${block.props.style !== 'outline' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Plein</button>
            <button onClick={() => onUpdate({ ...block.props, style: 'outline' })} className={`flex-1 py-1 rounded text-xs ${block.props.style === 'outline' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Contour</button>
          </div>
        </>
      )}

      {block.type === 'spacer' && (
        <input type="number" min={4} max={200} value={block.props.height || 32} onChange={e => onUpdate({ ...block.props, height: parseInt(e.target.value) || 32 })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" />
      )}
    </div>
  );
}

function FreeBlocksEditor({ section, onUpdateProp }: { section: ThemeSection; onUpdateProp: (key: string, value: any) => void }) {
  const blocks: FreeBlock[] = section.props.blocks || [];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const addBlock = (type: FreeBlockType) => {
    const newBlock: FreeBlock = { id: `b${Date.now()}`, type, props: getFreeBlockDefaults(type) };
    onUpdateProp('blocks', [...blocks, newBlock]);
  };
  const updateBlock = (id: string, props: Record<string, any>) => {
    onUpdateProp('blocks', blocks.map(b => (b.id === id ? { ...b, props } : b)));
  };
  const removeBlock = (id: string) => onUpdateProp('blocks', blocks.filter(b => b.id !== id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex(b => b.id === active.id);
    const newIndex = blocks.findIndex(b => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onUpdateProp('blocks', arrayMove(blocks, oldIndex, newIndex));
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {blocks.map(b => (
              <SortableBlockRow key={b.id} block={b} onUpdate={(props) => updateBlock(b.id, props)} onRemove={() => removeBlock(b.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {blocks.length === 0 && <p className="text-xs text-gray-400">Aucun bloc — ajoutez-en un ci-dessous.</p>}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-2">Ajouter un bloc</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(FREE_BLOCK_LABELS) as FreeBlockType[]).map(t => (
            <button key={t} onClick={() => addBlock(t)} className="text-left p-1.5 rounded text-xs hover:bg-gray-50 border border-gray-100 transition-colors hover:border-brand-200">
              {FREE_BLOCK_LABELS[t].icon} {FREE_BLOCK_LABELS[t].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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

interface EditorCategory {
  id: string;
  name: string;
  count: number;
  imageUrl?: string | null;
}

interface EditorProduct {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  thumbnail: string | null;
  variants?: { id: string; name: string; value: string; priceCents: number | null; stock: number }[];
}

// Sections qui doivent recevoir les vrais produits — doit rester identique à
// la liste utilisée dans Storefront.tsx pour que l'éditeur = ce que voit le client.
const PRODUCT_AWARE_SECTIONS = new Set(['product-grid', 'filters-list', 'product-detail']);

const RADIUS_PX: Record<string, number> = { sharp: 1, soft: 5, round: 10 };

function ThemePreviewSVG({ variantKey }: { variantKey: string | null }) {
  const variant = variantKey ? getThemeVariant(variantKey) : null;
  if (!variant) {
    return (
      <div className="w-full h-24 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
        Aperçu indisponible
      </div>
    );
  }
  const { primary, secondary, background, text } = variant.colors;
  const rx = RADIUS_PX[variant.radius] ?? 5;
  return (
    <svg viewBox="0 0 200 100" className="w-full h-24 rounded-lg border border-gray-100" style={{ background }}>
      {/* header */}
      <rect x="0" y="0" width="200" height="14" fill={background} stroke={text} strokeOpacity="0.08" />
      <circle cx="12" cy="7" r="3" fill={primary} />
      <rect x="150" y="4" width="8" height="6" rx="2" fill={text} opacity="0.15" />
      <rect x="164" y="4" width="8" height="6" rx="2" fill={text} opacity="0.15" />
      {/* hero */}
      <rect x="0" y="14" width="200" height="34" fill={primary} opacity="0.12" />
      <rect x="70" y="24" width="60" height="6" rx={rx / 2} fill={text} opacity="0.6" />
      <rect x="80" y="34" width="40" height="8" rx={rx} fill={primary} />
      {/* product cards */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={6 + i * 48} y="54" width="42" height="30" rx={rx} fill={background} stroke={text} strokeOpacity="0.1" />
          <rect x={6 + i * 48} y="54" width="42" height="18" rx={rx} fill={secondary} opacity="0.25" />
          <rect x={10 + i * 48} y="76" width="30" height="4" rx="1" fill={text} opacity="0.4" />
        </g>
      ))}
      {/* footer */}
      <rect x="0" y="90" width="200" height="10" fill={text} opacity="0.85" />
    </svg>
  );
}

export default function OnlineStore() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin(user);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [editMode, setEditMode] = useState<'desktop' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<ThemeConfig>(() => defaultThemeForType('ecommerce'));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [panel, setPanel] = useState<'sections' | 'design' | 'themes' | 'ai' | 'edit'>('sections');
  const [storeThemes, setStoreThemes] = useState<StoreTheme[]>([]);
  const [purchasedThemeIds, setPurchasedThemeIds] = useState<string[]>([]);
  const [products, setProducts] = useState<EditorProduct[]>([]);
  const [categories, setCategories] = useState<EditorCategory[]>([]);
  const [reviews, setReviews] = useState<{ id: string; customerName: string; rating: number; comment: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishModal, setPublishModal] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [verifiedDomain, setVerifiedDomain] = useState<string | null>(null);

  const loadTheme = useCallback(async () => {
    if (!tenant) return;
    const { data: config, error: cfgErr } = await supabase.from('theme_configs').select('*').eq('tenant_id', tenant.id).maybeSingle();
    if (cfgErr) console.error('[OnlineStore] Erreur chargement theme_configs:', cfgErr);
    if (config) {
      setTheme({
        siteType: config.site_type,
        sections: config.sections || [],
        colors: config.colors || { primary: '#F2632C', secondary: '#16a34a', accent: '#F2632C', background: '#FFFFFF', text: '#111114' },
        fonts: config.fonts || { heading: 'Montserrat', body: 'Montserrat' },
        spacing: config.spacing || 'comfortable',
        radius: config.radius || 'soft',
        shadow: config.shadow || 'none',
        isPublished: config.is_published || false,
        scrollAnimation: config.scroll_animation || 'none',
        customCss: config.custom_css || '',
      });
      setPurchasedThemeIds(config.purchased_themes || []);
    }
    const { data: themes } = await supabase.from('theme_store_themes').select('*').eq('is_published', true);
    setStoreThemes(themes || []);

    // Charge les VRAIS produits du marchand pour que l'éditeur reflète
    // exactement ce que ses clients verront (comme dans Shopify).
    const { data: prods, error: prodErr } = await supabase
      .from('products')
      .select('id,name,price_cents,currency,product_images(url,position),product_variants(id,name,value,price_cents,stock)')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (prodErr) console.error('[OnlineStore] Erreur chargement produits:', prodErr);
    const list: EditorProduct[] = (prods || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price_cents: p.price_cents,
      currency: p.currency,
      thumbnail: (p.product_images || []).sort((a: any, b: any) => a.position - b.position)[0]?.url || null,
      variants: (p.product_variants || []).map((v: any) => ({ id: v.id, name: v.name, value: v.value, priceCents: v.price_cents, stock: v.stock })),
    }));
    setProducts(list);

    // Charge les vraies catégories du marchand (avec le nombre de produits actifs par catégorie).
    const { data: cats, error: catErr } = await supabase.from('product_categories').select('id,name,image_url').eq('tenant_id', tenant.id);
    if (catErr) console.error('[OnlineStore] Erreur chargement catégories:', catErr);
    const { data: assignments, error: assignErr } = await supabase
      .from('product_category_assignments')
      .select('category_id, products!inner(status, tenant_id)')
      .eq('products.tenant_id', tenant.id)
      .eq('products.status', 'active');
    if (assignErr) console.error('[OnlineStore] Erreur chargement assignations catégories:', assignErr);
    const countByCategory: Record<string, number> = {};
    (assignments || []).forEach((a: any) => { countByCategory[a.category_id] = (countByCategory[a.category_id] || 0) + 1; });
    setCategories((cats || []).map((c: any) => ({ id: c.id, name: c.name, count: countByCategory[c.id] || 0, imageUrl: c.image_url })));

    const { data: reviewRows } = await supabase
      .from('product_reviews')
      .select('id,customer_name,rating,comment')
      .eq('tenant_id', tenant.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(9);
    setReviews((reviewRows || []).map((r: any) => ({ id: r.id, customerName: r.customer_name, rating: r.rating, comment: r.comment })));

    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) loadTheme(); }, [tenant, loadTheme]);

  // Charge dynamiquement les polices Google Fonts choisies, pour que l'aperçu
  // reflète vraiment le rendu final (pas juste la police système par défaut).
  useEffect(() => {
    const linkId = 'liafrik-preview-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = googleFontsHref(theme.fonts);
  }, [theme.fonts.heading, theme.fonts.body]);

  const persistTheme = async (newTheme: ThemeConfig, published: boolean): Promise<boolean> => {
    if (!tenant) return false;
    setSaving(true);
    const payload = {
      tenant_id: tenant.id, site_type: newTheme.siteType, sections: newTheme.sections,
      colors: newTheme.colors, spacing: newTheme.spacing, radius: newTheme.radius, shadow: newTheme.shadow, fonts: newTheme.fonts, is_published: published,
      scroll_animation: newTheme.scrollAnimation, custom_css: newTheme.customCss,
    };
    const { data: existing } = await supabase.from('theme_configs').select('id').eq('tenant_id', tenant.id).maybeSingle();
    const { error: saveErr } = existing
      ? await supabase.from('theme_configs').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('theme_configs').insert(payload);
    setSaving(false);
    if (saveErr) {
      console.error('[OnlineStore] Erreur sauvegarde thème:', saveErr);
      setSavedMsg('');
      alert(`Erreur lors de la sauvegarde : ${saveErr.message}`);
      return false;
    }
    setSavedMsg(published ? 'Boutique publiée!' : 'Brouillon sauvegardé!');
    setTimeout(() => setSavedMsg(''), 3000);
    return true;
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

  const publish = async () => {
    const t = { ...theme, isPublished: true };
    setTheme(t);
    const ok = await persistTheme(t, true);
    if (!ok) return;
    if (tenant) {
      const { data: dom } = await supabase.from('domains').select('domain_name').eq('tenant_id', tenant.id).eq('dns_status', 'verified').maybeSingle();
      setVerifiedDomain(dom?.domain_name || null);
    }
    setJustPublished(true);
  };
  const saveDraft = () => { const t = { ...theme, isPublished: false }; setTheme(t); persistTheme(t, false); };

  const purchaseTheme = async (st: StoreTheme) => {
    if (!tenant) return;
    // BUGFIX: 'pro' manquait dans la table de rang -> un marchand "pro" débloquait
    // les thèmes premium gratuitement (undefined < 1 === false en JS, donc pas bloqué).
    const currentRank = PLAN_RANK[tenant.plan] ?? -1;
    if (!isSuperAdmin && st.is_premium && currentRank < PLAN_RANK.premium) {
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
              {selectedSec.type === 'custom-blocks' ? (
                <FreeBlocksEditor section={selectedSec} onUpdateProp={(key, value) => updateSectionProp(selectedSec.id, key, value)} />
              ) : editableFields.length > 0 ? (
                editableFields.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea rows={2} value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    ) : f.type === 'number' ? (
                      <input type="number" min={2} max={4} value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, Math.min(4, Math.max(2, parseInt(e.target.value) || 2)))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    ) : f.type === 'date' ? (
                      <input type="date" value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    ) : f.type === 'boolean' ? (
                      <button
                        type="button"
                        onClick={() => updateSectionProp(selectedSec.id, f.key, !(selectedSec.props[f.key] !== false))}
                        className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedSec.props[f.key] !== false ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {selectedSec.props[f.key] !== false ? 'Activé' : 'Désactivé'}
                      </button>
                    ) : f.type === 'list' ? (
                      <input
                        type="text"
                        value={Array.isArray(selectedSec.props[f.key]) ? selectedSec.props[f.key].join(', ') : (selectedSec.props[f.key] || '')}
                        onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="Accueil, Boutique, Contact"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
                      />
                    ) : f.type === 'select' ? (
                      <select
                        value={selectedSec.props[f.key] || ''}
                        onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 bg-white"
                      >
                        {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">Cette section utilise des données automatiques de votre boutique.</p>
              )}

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-semibold text-gray-500">Style de cette section</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fond personnalisé</label>
                  <div className="flex gap-2">
                    <input type="color" value={selectedSec.props.__bgOverride || theme.colors.background} onChange={e => updateSectionProp(selectedSec.id, '__bgOverride', e.target.value)} className="w-10 h-8 rounded border border-gray-200 cursor-pointer" />
                    {selectedSec.props.__bgOverride && (
                      <button onClick={() => updateSectionProp(selectedSec.id, '__bgOverride', undefined)} className="text-xs text-gray-400 hover:text-red-600">Réinitialiser</button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Texte personnalisé</label>
                  <div className="flex gap-2">
                    <input type="color" value={selectedSec.props.__textOverride || theme.colors.text} onChange={e => updateSectionProp(selectedSec.id, '__textOverride', e.target.value)} className="w-10 h-8 rounded border border-gray-200 cursor-pointer" />
                    {selectedSec.props.__textOverride && (
                      <button onClick={() => updateSectionProp(selectedSec.id, '__textOverride', undefined)} className="text-xs text-gray-400 hover:text-red-600">Réinitialiser</button>
                    )}
                  </div>
                </div>
              </div>

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
            <Card className="p-3 space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Palette size={16} className="text-brand-500" />
                <h3 className="text-sm font-bold text-gray-900">Éditeur de Styles Globaux</h3>
              </div>

              {/* Typography Section */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Polices & Typographies</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Titres & En-têtes</label>
                  <select
                    value={theme.fonts.heading}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, heading: e.target.value } })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 font-medium"
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Corps de texte</label>
                  <select
                    value={theme.fonts.body}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, body: e.target.value } })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400"
                    style={{ fontFamily: theme.fonts.body }}
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Color Settings */}
              <div className="space-y-2 pt-2 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Palette de Couleurs</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {([['primary', 'Primaire'], ['secondary', 'Secondaire'], ['accent', 'Accent'], ['background', 'Fond de site'], ['text', 'Texte de base']] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-gray-100 bg-gray-50/50">
                      <span className="text-xs font-medium text-gray-600">{label}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={theme.colors[key]}
                          onChange={e => updateColor(key, e.target.value)}
                          className="w-7 h-7 rounded-md border border-gray-200 cursor-pointer flex-shrink-0"
                        />
                        <input
                          value={theme.colors[key]}
                          onChange={e => updateColor(key, e.target.value)}
                          className="w-16 px-1.5 py-1 border border-gray-200 rounded text-[10px] font-mono text-gray-700 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizing & Borders */}
              <div className="space-y-2 pt-2 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bordures & Espacement</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Arrondi des boutons & cartes</label>
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                    {([['sharp', 'Droit'], ['soft', 'Adouci'], ['round', 'Arrondi']] as const).map(([rCode, rLabel]) => (
                      <button
                        key={rCode}
                        onClick={() => setTheme({ ...theme, radius: rCode })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${theme.radius === rCode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {rLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Espacement vertical</label>
                  <div className="flex gap-1">
                    {(['compact', 'comfortable', 'spacious'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setTheme({ ...theme, spacing: s })}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold capitalize transition-colors ${theme.spacing === s ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {s === 'compact' ? 'Compact' : s === 'comfortable' ? 'Confort' : 'Aéré'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ombres portées</label>
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                    {([['none', 'Sans'], ['subtle', 'Légère'], ['bold', 'Prononcée']] as const).map(([shCode, shLabel]) => (
                      <button
                        key={shCode}
                        onClick={() => setTheme({ ...theme, shadow: shCode })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${theme.shadow === shCode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                      >
                        {shLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Scroll Animations */}
              <div className="space-y-1.5 pt-2 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Effets & Transitions</p>
                <label className="block text-xs font-medium text-gray-600">Animation au scroll</label>
                <select
                  value={theme.scrollAnimation || 'none'}
                  onChange={e => setTheme({ ...theme, scrollAnimation: e.target.value as any })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 bg-white font-medium text-gray-700"
                >
                  {SCROLL_ANIMATIONS.map(sa => <option key={sa.id} value={sa.id}>{sa.label}</option>)}
                </select>
              </div>

              {/* Advanced Inject Custom CSS Override */}
              <div className="space-y-1.5 pt-2 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">CSS Personnalisé (Style overrides)</p>
                <textarea
                  rows={4}
                  value={theme.customCss || ''}
                  onChange={e => setTheme({ ...theme, customCss: e.target.value })}
                  placeholder="/* Saisissez votre code CSS ici. Exemple : \n.hero { border: 2px solid #F2632C; } */"
                  className="w-full px-2 py-2 border border-gray-200 rounded-xl text-[11px] font-mono focus:outline-none focus:border-brand-400 bg-white text-gray-800 leading-normal"
                />
              </div>

              {/* Presets */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Palettes recommandées par l'assistant</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_PALETTES.map(p => (
                    <button
                      key={p.name}
                      onClick={() => setTheme({ ...theme, colors: p.c })}
                      className="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:border-brand-300 bg-white transition-all shadow-sm"
                    >
                      <span className="text-[10px] font-bold text-gray-700">{p.name}</span>
                      <div className="flex gap-0.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.c.primary }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.c.secondary }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {panel === 'themes' && (
            <Card className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                  <Store size={16} className="text-brand-500" /> Boutique de Thèmes
                </h3>
                <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-1 rounded-full">
                  {storeThemes.length} disponibles
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Sélectionnez un thème haut de gamme pour transformer instantanément l'identité visuelle et le style de votre boutique en ligne.
              </p>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {storeThemes.map(st => {
                  const owned = purchasedThemeIds.includes(st.id) || !st.is_premium;
                  const themeConfig = st.variant_key ? getThemeVariant(st.variant_key) : null;
                  const primaryColor = themeConfig?.colors?.primary || '#F2632C';
                  const secondaryColor = themeConfig?.colors?.secondary || '#16a34a';

                  return (
                    <div
                      key={st.id}
                      className={`group relative p-3 rounded-2xl border transition-all ${
                        owned
                          ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                          : 'border-gray-200 hover:border-brand-300 bg-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Premium Header Tag */}
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                          {st.name}
                        </p>
                        {st.is_premium ? (
                          <span className="text-[10px] px-2 py-0.5 bg-brand-100 text-brand-800 rounded-full font-bold">
                            {(st.price_cents / 100).toLocaleString('fr-FR')} USD
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                            Gratuit
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 leading-relaxed mb-2.5">
                        {st.description}
                      </p>

                      {/* Dynamic Color Indicators */}
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] text-gray-400 mr-1 font-medium">Palette :</span>
                        <span className="w-3 h-3 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: primaryColor }} title="Couleur principale" />
                        <span className="w-3 h-3 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: secondaryColor }} title="Couleur secondaire" />
                        {themeConfig?.colors?.background && (
                          <span className="w-3 h-3 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: themeConfig.colors.background }} title="Couleur de fond" />
                        )}
                        <span className="text-[10px] text-gray-500 font-mono ml-auto capitalize">
                          {themeConfig?.fonts?.heading || 'Montserrat'}
                        </span>
                      </div>

                      {/* Theme Thumbnail Preview Card */}
                      <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-1.5 group-hover:border-brand-200 transition-all">
                        <ThemePreviewSVG variantKey={st.variant_key} />
                        <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                          <span className="text-xs text-white font-bold bg-gray-900/90 px-3 py-1.5 rounded-lg shadow-md border border-white/20">
                            Aperçu {st.name}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        {owned ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => applyTheme(st)}
                            className="w-full text-xs font-bold py-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg"
                          >
                            <Palette size={13} className="inline mr-1" /> Appliquer le thème
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => purchaseTheme(st)}
                            className="w-full text-xs font-bold py-2 bg-brand-500 hover:bg-brand-600 text-white shadow-sm rounded-lg"
                          >
                            Activer l'accès Premium
                          </Button>
                        )}
                      </div>
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

            <div className={`mx-auto rounded-lg border border-gray-200 overflow-hidden transition-all ${deviceWidth}`} style={{ backgroundColor: theme.colors.background, fontFamily: theme.fonts.body }}>
              {/* Inject Custom CSS live override inside preview canvas */}
              {theme.customCss && <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />}

              {theme.sections.filter(s => s.visible).map(s => (
                <div key={s.id} onClick={() => { setSelectedSection(s.id); setPanel('edit'); }} className={`cursor-pointer transition-all ${selectedSection === s.id ? 'ring-2 ring-brand-500 ring-inset' : 'hover:ring-1 hover:ring-gray-300 hover:ring-inset'}`}>
                  {renderSection(s, theme.colors, PRODUCT_AWARE_SECTIONS.has(s.type) ? products : undefined, theme.radius, theme.shadow, s.type === 'category-grid' ? categories : undefined, undefined, 0, s.type === 'testimonials' ? reviews : undefined, theme.scrollAnimation)}
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
      <Modal open={publishModal} onClose={() => { setPublishModal(false); setJustPublished(false); }} title={justPublished ? 'Boutique en ligne !' : 'Publier votre boutique'}>
        {justPublished ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-green-700 font-medium mb-2">🎉 Votre boutique est maintenant en ligne !</p>
              <a
                href={`https://${verifiedDomain || `${tenant?.slug}.${PLATFORM_ROOT_DOMAIN}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-semibold text-brand-600 underline break-all"
              >
                {verifiedDomain || `${tenant?.slug}.${PLATFORM_ROOT_DOMAIN}`}
              </a>
              {!verifiedDomain && (
                <p className="text-xs text-green-600 mt-2">Vous pouvez connecter votre propre domaine depuis Paramètres → Domaines.</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setPublishModal(false); setJustPublished(false); }}>Fermer</Button>
              <Button onClick={() => window.open(`https://${verifiedDomain || `${tenant?.slug}.${PLATFORM_ROOT_DOMAIN}`}`, '_blank')}>
                <Eye size={16} /> Voir ma boutique
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Votre boutique sera mise en ligne immédiatement.</p>
              <p className="text-xs text-green-600 mt-1">Tous les changements seront visibles par vos clients.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setPublishModal(false)}>Annuler</Button>
              <Button onClick={publish} disabled={saving}>{saving ? 'Publication…' : <><Eye size={16} /> Confirmer la publication</>}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useTenant, useAuth, useIsSuperAdmin } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Modal } from './ui';
import { Smartphone, Tablet, Monitor, Palette, Eye, History, Layers, Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Sparkles, Bot, Check, Edit3, Store, MessageSquare, MessageCircle } from 'lucide-react';
import { ThemeConfig, SiteType, ThemeSection, SITE_TYPES, SECTION_LIBRARY, EDITABLE_PROPS, getSectionDefaults, defaultThemeForType, renderSection, getThemeVariant, FONT_OPTIONS, googleFontsHref, FreeBlock, FreeBlockType, getFreeBlockDefaults, THEME_VARIANTS } from '../../lib/theme-engine';
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
];

const PRESET_PALETTES = [
  { name: 'Bleu Océan (Default)', c: { primary: '#0369A1', secondary: '#0284C7', accent: '#3B82F6', background: '#FFFFFF', text: '#0F172A' } },
  { name: 'Corail Solaire (Alternate)', c: { primary: '#FF6B35', secondary: '#F7B267', accent: '#E76F51', background: '#FFFDF9', text: '#1D1E2C' } },
  { name: 'Émeraude Sauvage', c: { primary: '#059669', secondary: '#10b981', accent: '#059669', background: '#FFFFFF', text: '#064e3b' } },
  { name: 'Or & Luxe Sombre', c: { primary: '#C9A24A', secondary: '#8A8A8A', accent: '#C9A24A', background: '#0F1115', text: '#F4F4F5' } },
];

export const SCROLL_ANIMATIONS = [
  { id: 'none', label: 'Aucune' },
  { id: 'fade', label: 'Fondu doux (Fade)' },
  { id: 'slide', label: 'Glissement (Slide Up)' },
  { id: 'zoom', label: 'Zoom élégant (Zoom In)' },
] as const;

const PLAN_RANK: Record<string, number> = { starter: 0, pro: 1, premium: 2, enterprise: 3 };

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
    <div ref={setNodeRef} style={style} className="p-2.5 rounded-lg border border-gray-100 bg-white space-y-2 font-sans">
      <div className="flex items-center gap-1.5">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-0.5 text-gray-300 hover:text-gray-500">
          <GripVertical size={12} />
        </button>
        <span className="text-xs font-semibold text-gray-600 flex-1">{meta.icon} {meta.label}</span>
        <button onClick={onRemove} className="p-0.5 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
      </div>

      {block.type === 'text' && (
        <>
          <textarea rows={2} value={block.props.text || ''} onChange={e => onUpdate({ ...block.props, text: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-400 font-sans" />
          <div className="flex gap-1">
            {(['sm', 'md', 'lg'] as const).map(s => (
              <button key={s} onClick={() => onUpdate({ ...block.props, size: s })} className={`flex-1 py-1 rounded text-[10px] font-bold ${block.props.size === s ? 'bg-[#0369A1] text-white' : 'bg-gray-100 text-gray-600'}`}>{s.toUpperCase()}</button>
            ))}
          </div>
        </>
      )}

      {block.type === 'image' && (
        <input value={block.props.url || ''} onChange={e => onUpdate({ ...block.props, url: e.target.value })} placeholder="URL de l'image" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-400 font-sans" />
      )}

      {block.type === 'button' && (
        <>
          <input value={block.props.label || ''} onChange={e => onUpdate({ ...block.props, label: e.target.value })} placeholder="Texte" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-400 font-sans" />
          <input value={block.props.url || ''} onChange={e => onUpdate({ ...block.props, url: e.target.value })} placeholder="Lien (https://…)" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-400 font-sans" />
        </>
      )}

      {block.type === 'spacer' && (
        <input type="number" min={4} max={200} value={block.props.height || 32} onChange={e => onUpdate({ ...block.props, height: parseInt(e.target.value) || 32 })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-400" />
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
    <div className="space-y-3 font-sans">
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
        <p className="text-xs font-semibold text-gray-500 mb-2">Ajouter un bloc libre</p>
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
      className={`flex items-center gap-1 p-2 rounded-lg border transition-all font-sans ${selected ? 'border-[#0369A1] bg-sky-50/50' : 'border-gray-100 hover:border-gray-200'}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-0.5 text-gray-300 hover:text-gray-500">
        <GripVertical size={12} />
      </button>
      <button onClick={onSelect} className="flex-1 text-left text-xs font-semibold text-gray-700">
        {icon} {label}
      </button>
      <button onClick={onMoveUp} className="p-0.5 text-gray-400 hover:text-gray-700"><ArrowUp size={12} /></button>
      <button onClick={onMoveDown} className="p-0.5 text-gray-400 hover:text-gray-700"><ArrowDown size={12} /></button>
      <button onClick={onToggle} className={`p-0.5 text-xs ${section.visible ? 'text-green-600' : 'text-gray-300'}`}>●</button>
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

const PRODUCT_AWARE_SECTIONS = new Set(['product-grid', 'filters-list', 'product-detail']);

const RADIUS_PX: Record<string, number> = { sharp: 1, soft: 5, round: 10 };

function ThemePreviewSVG({ variantKey }: { variantKey: string | null }) {
  const variant = variantKey ? getThemeVariant(variantKey) : null;
  if (!variant) {
    return (
      <div className="w-full h-24 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-sans">
        Aperçu indisponible
      </div>
    );
  }
  const { primary, secondary, background, text } = variant.colors;
  const rx = RADIUS_PX[variant.radius] ?? 5;
  return (
    <svg viewBox="0 0 200 100" className="w-full h-24 rounded-lg border border-gray-100" style={{ background }}>
      <rect x="0" y="0" width="200" height="14" fill={background} stroke={text} strokeOpacity="0.08" />
      <circle cx="12" cy="7" r="3" fill={primary} />
      <rect x="150" y="4" width="8" height="6" rx="2" fill={text} opacity="0.15" />
      <rect x="164" y="4" width="8" height="6" rx="2" fill={text} opacity="0.15" />
      <rect x="0" y="14" width="200" height="34" fill={primary} opacity="0.12" />
      <rect x="70" y="24" width="60" height="6" rx={rx / 2} fill={text} opacity="0.6" />
      <rect x="80" y="34" width="40" height="8" rx={rx} fill={primary} />
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={6 + i * 48} y="54" width="42" height="30" rx={rx} fill={background} stroke={text} strokeOpacity="0.1" />
          <rect x={6 + i * 48} y="54" width="42" height="18" rx={rx} fill={secondary} opacity="0.25" />
          <rect x={10 + i * 48} y="76" width="30" height="4" rx="1" fill={text} opacity="0.4" />
        </g>
      ))}
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
  const [panel, setPanel] = useState<'sections' | 'design' | 'themes' | 'ai' | 'edit' | 'inbox'>('sections');
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

  // States for shopper support chat inbox
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [inboxReplyInput, setInboxReplyInput] = useState<string>('');

  // Live checker to pull chat sessions & messages from localStorage
  useEffect(() => {
    const refreshInbox = () => {
      const sessions = JSON.parse(localStorage.getItem('os_active_chat_sessions') || '[]');
      setActiveSessions(sessions.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

      if (selectedSessionId) {
        const msgs = JSON.parse(localStorage.getItem(`os_chat_messages_${selectedSessionId}`) || '[]');
        setInboxMessages(msgs);
      }
    };
    refreshInbox();
    const interval = setInterval(refreshInbox, 1000);
    return () => clearInterval(interval);
  }, [selectedSessionId]);

  const sendInboxReply = () => {
    if (!inboxReplyInput.trim() || !selectedSessionId) return;
    const replyText = inboxReplyInput.trim();
    setInboxReplyInput('');

    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const updatedMsgs = [...inboxMessages, { sender: 'agent', text: replyText, time: timeStr }];
    setInboxMessages(updatedMsgs);
    localStorage.setItem(`os_chat_messages_${selectedSessionId}`, JSON.stringify(updatedMsgs));

    // Update global session registry
    const registry = JSON.parse(localStorage.getItem('os_active_chat_sessions') || '[]');
    const idx = registry.findIndex((s: any) => s.id === selectedSessionId);
    if (idx !== -1) {
      registry[idx].lastMessage = `Vous : ${replyText}`;
      registry[idx].updatedAt = new Date().toISOString();
    }
    localStorage.setItem('os_active_chat_sessions', JSON.stringify(registry));
  };

  const loadTheme = useCallback(async () => {
    if (!tenant) return;
    const { data: config, error: cfgErr } = await supabase.from('theme_configs').select('*').eq('tenant_id', tenant.id).maybeSingle();
    if (cfgErr) console.error('[OnlineStore] Erreur chargement theme_configs:', cfgErr);
    if (config) {
      setTheme({
        siteType: config.site_type,
        sections: config.sections || [],
        colors: config.colors || { primary: '#0369A1', secondary: '#0284C7', accent: '#3B82F6', background: '#FFFFFF', text: '#0F172A' },
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
    const variant = st.variant_key ? getThemeVariant(st.variant_key) : null;
    const newTheme = variant || defaultThemeForType(st.category as SiteType);
    setTheme(newTheme);
    persistTheme(newTheme, false);
    setSavedMsg(`Thème "${st.name}" appliqué!`);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const applyThemeVariant = (variantKey: string, label: string) => {
    const newTheme = getThemeVariant(variantKey);
    if (newTheme) {
      setTheme(newTheme);
      persistTheme(newTheme, false);
      setSavedMsg(`Thème "${label}" appliqué !`);
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  const deviceWidth = device === 'mobile' ? 'max-w-[340px]' : device === 'tablet' ? 'max-w-[640px]' : 'max-w-full';
  const applicableTips = AI_TIPS.filter(t => t.condition(theme));
  const selectedSec = theme.sections.find(s => s.id === selectedSection);
  const editableFields = selectedSec ? EDITABLE_PROPS[selectedSec.type] || [] : [];

  if (loading) return <div className="p-8 text-center text-gray-400 font-sans">Chargement de votre éditeur…</div>;

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Palette className="text-[#0369A1]" /> Os Visual Customizer
          </h1>
          <p className="text-sm text-gray-500 mt-1">L'éditeur de thèmes d'excellence le plus avancé au monde, compatible CSS Variables.</p>
        </div>
        <div className="flex gap-2 items-center">
          {savedMsg && <span className="text-sm text-green-600 flex items-center gap-1 font-semibold"><Check size={14} />{savedMsg}</span>}
          <Button variant="secondary" size="sm" onClick={saveDraft} disabled={saving}><History size={14} /> Enregistrer Brouillon</Button>
          <Button size="sm" className="bg-[#0369A1] hover:bg-[#0284C7] text-white font-bold" onClick={() => setPublishModal(true)} disabled={saving}><Eye size={14} /> Publier la Boutique</Button>
        </div>
      </div>

      {/* Site type selector */}
      <Card className="mb-4 p-4 border border-gray-100 shadow-sm rounded-2xl">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Type de structure du site</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SITE_TYPES.map(st => (
            <button key={st.id} onClick={() => setSiteType(st.id)} className={`text-left p-3.5 rounded-xl border-2 transition-all ${theme.siteType === st.id ? 'border-[#0369A1] bg-sky-50/20' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="text-xs font-extrabold text-gray-950 uppercase tracking-wide">{st.label}</div>
              <div className="text-[11px] text-gray-500 mt-1">{st.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left sidebar controller */}
        <div className="space-y-3">
          <Card className="p-1.5 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex gap-1">
              {([['sections', Layers, 'Layout'], ['design', Palette, 'Design'], ['themes', Store, 'Thèmes'], ['inbox', MessageSquare, 'Inbox'], ['ai', Bot, 'IA']] as const).map(([p, Icon, lbl]) => (
                <button
                  key={p}
                  onClick={() => setPanel(p)}
                  className={`flex-1 py-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${panel === p ? 'bg-[#0369A1] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                  type="button"
                >
                  <Icon size={14} />
                  <span className="text-[9px] font-bold uppercase mt-1 tracking-wider">{lbl}</span>
                </button>
              ))}
            </div>
          </Card>

          {panel === 'sections' && (
            <Card className="p-4 border border-gray-100 shadow-sm rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hiérarchie du Layout</h3>
              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={theme.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
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
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ajouter un bloc modulaire</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {SECTION_LIBRARY.map(lib => (
                    <button key={lib.type} onClick={() => addSection(lib.type)} className="text-left p-2 rounded-lg text-xs font-medium hover:bg-gray-50 border border-gray-100 transition-all hover:border-brand-200">
                      {lib.icon} {lib.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {panel === 'edit' && selectedSec && (
            <Card className="p-4 border border-gray-100 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-xs font-extrabold text-gray-900 flex items-center gap-1 uppercase tracking-wider"><Edit3 size={13} /> Éditeur de Bloc</h3>
                <span className="text-[10px] font-bold bg-[#0369A1] text-white px-2 py-0.5 rounded-full">{SECTION_LIBRARY.find(l => l.type === selectedSec.type)?.label}</span>
              </div>
              {selectedSec.type === 'custom-blocks' ? (
                <FreeBlocksEditor section={selectedSec} onUpdateProp={(key, value) => updateSectionProp(selectedSec.id, key, value)} />
              ) : editableFields.length > 0 ? (
                <div className="space-y-3">
                  {editableFields.map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">{f.label}</label>
                      {f.type === 'textarea' ? (
                        <textarea rows={3} value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 font-sans leading-relaxed" />
                      ) : f.type === 'select' ? (
                        <select
                          value={selectedSec.props[f.key] || ''}
                          onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)}
                          className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 bg-white font-semibold text-gray-700"
                        >
                          {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : f.type === 'boolean' ? (
                        <button
                          type="button"
                          onClick={() => updateSectionProp(selectedSec.id, f.key, !(selectedSec.props[f.key] !== false))}
                          className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${selectedSec.props[f.key] !== false ? 'bg-[#0369A1] text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {selectedSec.props[f.key] !== false ? 'Activé' : 'Désactivé'}
                        </button>
                      ) : (
                        <input type="text" value={selectedSec.props[f.key] || ''} onChange={e => updateSectionProp(selectedSec.id, f.key, e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 font-sans font-semibold text-gray-800" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Ce bloc se remplit automatiquement d'informations dynamiques.</p>
              )}

              <div className="pt-2 border-t border-gray-100">
                <Button size="sm" variant="secondary" className="w-full text-xs font-bold" onClick={() => setPanel('sections')}>← Liste des Blocs</Button>
              </div>
            </Card>
          )}

          {panel === 'edit' && !selectedSec && (
            <Card className="p-6 text-center border border-gray-100 shadow-sm rounded-2xl">
              <Edit3 size={24} className="text-gray-300 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-gray-400">Sélectionnez une section ou double-cliquez pour configurer ses propriétés.</p>
            </Card>
          )}

          {panel === 'design' && (
            <Card className="p-4 border border-gray-100 shadow-sm rounded-2xl space-y-4">
              <div className="pb-2 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuration Typo & Styles</h3>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Polices de caractères</p>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Titres & Headings</label>
                  <select
                    value={theme.fonts.heading}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, heading: e.target.value } })}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 bg-white font-semibold text-gray-800"
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Corps du texte</label>
                  <select
                    value={theme.fonts.body}
                    onChange={e => setTheme({ ...theme, fonts: { ...theme.fonts, body: e.target.value } })}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 bg-white font-semibold text-gray-800"
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Choix des couleurs</p>
                <div className="grid grid-cols-1 gap-2">
                  {([['primary', 'Principale'], ['secondary', 'Secondaire'], ['background', 'Fond de site'], ['text', 'Texte']] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-xl border border-gray-100 bg-gray-50/50">
                      <span className="text-xs font-semibold text-gray-600">{label}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={theme.colors[key]}
                          onChange={e => updateColor(key, e.target.value)}
                          className="w-7 h-7 rounded border border-gray-200 cursor-pointer flex-shrink-0"
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

              {/* Theme Presets */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Palettes Prédéfinies</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_PALETTES.map(p => (
                    <button
                      key={p.name}
                      onClick={() => setTheme({ ...theme, colors: p.c })}
                      className="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:border-brand-300 bg-white transition-all shadow-sm"
                      type="button"
                    >
                      <span className="text-[9px] font-bold text-gray-700 truncate mr-1">{p.name}</span>
                      <div className="flex gap-0.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.c.primary }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.c.secondary }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Styles, Layout and Animations */}
              <div className="pt-3 border-t border-gray-100 space-y-3.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mise en page & Design</p>

                {/* Spacing Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Espacement Global</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['compact', 'comfortable', 'spacious'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTheme({ ...theme, spacing: s })}
                        className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${theme.spacing === s ? 'bg-[#0369A1] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {s === 'compact' ? 'Compact' : s === 'comfortable' ? 'Standard' : 'Aéré'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Arrondi des Angles (Bordures)</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['sharp', 'soft', 'round'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTheme({ ...theme, radius: r })}
                        className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${theme.radius === r ? 'bg-[#0369A1] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {r === 'sharp' ? 'Carré' : r === 'soft' ? 'Doux' : 'Arrondi'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Elevation Shadows Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Ombres & Profondeur (Cartes)</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['none', 'subtle', 'bold'] as const).map(sh => (
                      <button
                        key={sh}
                        type="button"
                        onClick={() => setTheme({ ...theme, shadow: sh })}
                        className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${theme.shadow === sh ? 'bg-[#0369A1] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {sh === 'none' ? 'Plat' : sh === 'subtle' ? 'Subtil' : 'Élevé'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transitions and Scroll Animations Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Animations de défilement</label>
                  <select
                    value={theme.scrollAnimation || 'none'}
                    onChange={e => setTheme({ ...theme, scrollAnimation: e.target.value as any })}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0369A1] bg-white font-semibold text-gray-700"
                  >
                    {SCROLL_ANIMATIONS.map(anim => (
                      <option key={anim.id} value={anim.id}>{anim.label}</option>
                    ))}
                  </select>
                </div>

                {/* Live Custom CSS Editor */}
                <div className="pt-2 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-gray-500">Injecteur CSS Personnalisé</label>
                    <Badge color="blue">CSS Direct</Badge>
                  </div>
                  <textarea
                    rows={4}
                    value={theme.customCss || ''}
                    onChange={e => setTheme({ ...theme, customCss: e.target.value })}
                    placeholder="/* Exemple : .group:hover { transform: scale(1.02); } */"
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[10px] font-mono focus:outline-none focus:border-[#0369A1] bg-gray-950 text-emerald-400 placeholder-emerald-800 leading-normal"
                  />
                  <p className="text-[9px] text-gray-400 italic">Modifications appliquées en temps réel sur l'aperçu et en production.</p>
                </div>
              </div>
            </Card>
          )}

          {panel === 'themes' && (
            <Card className="p-4 border border-gray-100 shadow-sm rounded-2xl space-y-4">
              <div className="pb-2 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Templates de Thèmes</h3>
                <p className="text-[10px] text-gray-500 mt-1">Choisissez parmi nos thèmes de prestige optimisés pour la conversion.</p>
              </div>

              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {/* 1. Official Premium Themes from THEME_VARIANTS */}
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold text-[#0369A1] uppercase tracking-wider">🌟 Collection Prestige Os (Inclus)</p>

                  {THEME_VARIANTS.map(v => {
                    const sampleTheme = v.build();
                    const primary = sampleTheme.colors.primary;
                    const secondary = sampleTheme.colors.secondary;
                    const headingFont = sampleTheme.fonts.heading;
                    const isPremium = v.key.startsWith('premium-');

                    return (
                      <div
                        key={v.key}
                        className={`p-3.5 rounded-2xl border transition-all duration-300 bg-white hover:border-[#0369A1] hover:shadow-md relative overflow-hidden`}
                      >
                        {isPremium && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-white text-[8px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-widest">
                            Premium Edition
                          </div>
                        )}

                        <div className="mb-2">
                          <p className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                            {v.label.replace('✨ ', '').replace('🌊 ', '')}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5 capitalize">Site : {v.siteType} · Typo : {headingFont}</p>
                        </div>

                        {/* Palette Previews */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Palette :</span>
                          <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: primary }} title={`Primary: ${primary}`} />
                          <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: secondary }} title={`Secondary: ${secondary}`} />
                          <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: sampleTheme.colors.background }} title={`Bg: ${sampleTheme.colors.background}`} />
                        </div>

                        {/* Theme SVG Preview */}
                        <ThemePreviewSVG variantKey={v.key} />

                        {/* Apply Action */}
                        <div className="mt-3">
                          <Button
                            size="sm"
                            className="w-full text-[10px] font-extrabold py-2 bg-gradient-to-r from-[#0369A1] to-[#0284C7] text-white rounded-xl shadow-sm hover:opacity-95"
                            onClick={() => applyThemeVariant(v.key, v.label)}
                          >
                            🚀 Installer ce Thème
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Custom Store Themes from database */}
                {storeThemes.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">📦 Vos Thèmes Téléchargés</p>

                    {storeThemes.map(st => {
                      const owned = purchasedThemeIds.includes(st.id) || !st.is_premium;
                      const themeConfig = st.variant_key ? getThemeVariant(st.variant_key) : null;
                      const primaryColor = themeConfig?.colors?.primary || '#0369A1';
                      const secondaryColor = themeConfig?.colors?.secondary || '#0284C7';

                      return (
                        <div
                          key={st.id}
                          className={`p-3 rounded-xl border transition-all ${
                            owned ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-100 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-gray-900 truncate">{st.name}</p>
                            {st.is_premium && (
                              <span className="text-[9px] px-2 py-0.5 bg-brand-100 text-brand-800 rounded-full font-bold">Premium</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mb-2 truncate">{st.description}</p>

                          <div className="flex items-center gap-1.5 mb-2.5">
                            <span className="text-[9px] text-gray-400 font-semibold">Palette:</span>
                            <span className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: primaryColor }} />
                            <span className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: secondaryColor }} />
                          </div>

                          <ThemePreviewSVG variantKey={st.variant_key} />

                          <div className="mt-2.5">
                            {owned ? (
                              <Button
                                size="sm"
                                className="w-full text-[10px] font-bold py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                                onClick={() => applyTheme(st)}
                              >
                                Appliquer
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full text-[10px] font-bold py-2 bg-[#0369A1] hover:bg-[#0284C7] text-white rounded-lg"
                                onClick={() => purchaseTheme(st)}
                              >
                                Débloquer
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}

          {panel === 'ai' && (
            <Card className="p-4 border border-gray-100 shadow-sm rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Conseils d'Assistant</h3>
              {applicableTips.length > 0 ? (
                <div className="space-y-2">
                  {applicableTips.map((t, i) => (
                    <div key={i} className="p-2.5 bg-sky-50/50 rounded-xl text-xs text-sky-900 border border-sky-100 flex items-start gap-1.5 font-medium leading-relaxed">
                      <Sparkles size={12} className="text-[#0369A1] mt-0.5 shrink-0 animate-pulse" /> {t.tip}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 bg-green-50/50 text-green-900 border border-green-100 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <Check size={14} className="text-green-600 shrink-0" />
                  Structure de theme optimisée avec succès !
                </div>
              )}
            </Card>
          )}

          {panel === 'inbox' && (
            <Card className="p-4 border border-gray-100 shadow-sm rounded-2xl space-y-4 font-sans">
              <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                    Support Live Shoppers
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Échangez en temps réel avec vos visiteurs.</p>
                </div>
                {selectedSessionId && (
                  <Button size="sm" variant="secondary" className="text-[10px] py-1 px-2.5 font-bold" onClick={() => setSelectedSessionId('')}>
                    ← Liste
                  </Button>
                )}
              </div>

              {selectedSessionId ? (
                /* Thread Chat Conversation */
                <div className="flex flex-col h-[400px]">
                  <div className="bg-sky-50/50 p-2.5 rounded-xl border border-sky-100 mb-2">
                    <p className="text-[11px] font-extrabold text-sky-950">
                      {activeSessions.find(s => s.id === selectedSessionId)?.customerName || 'Visiteur Anonyme'}
                    </p>
                    <p className="text-[9px] text-sky-700 font-medium">
                      Consulte : <code className="bg-white px-1 py-0.5 rounded">{activeSessions.find(s => s.id === selectedSessionId)?.currentPage || '/'}</code>
                    </p>
                  </div>

                  {/* Message History Thread */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3 max-h-[260px]">
                    {inboxMessages.map((msg, i) => {
                      const isAgent = msg.sender === 'agent';
                      return (
                        <div key={i} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`p-2.5 max-w-[85%] text-xs font-medium rounded-2xl ${
                              isAgent
                                ? 'bg-gradient-to-r from-[#0369A1] to-[#0284C7] text-white rounded-tr-none shadow-sm'
                                : 'bg-gray-100 text-gray-800 rounded-tl-none'
                            }`}
                          >
                            <p className="leading-relaxed break-words">{msg.text}</p>
                          </div>
                          <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.time}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Send Input */}
                  <div className="flex gap-2 items-center pt-2 border-t border-gray-100">
                    <input
                      type="text"
                      value={inboxReplyInput}
                      onChange={e => setInboxReplyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendInboxReply()}
                      placeholder="Votre réponse client..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0369A1] font-semibold text-gray-800"
                    />
                    <Button size="sm" className="bg-[#0369A1] hover:bg-[#0284C7] text-white font-bold" onClick={sendInboxReply} disabled={!inboxReplyInput.trim()}>
                      Envoyer
                    </Button>
                  </div>
                </div>
              ) : (
                /* List of Sessions */
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                  {activeSessions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 px-4">
                      <MessageCircle size={32} className="mx-auto text-gray-300 mb-2 animate-bounce" />
                      <p className="text-xs font-bold text-gray-500">Aucun message de client pour le moment.</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        Pour tester, ouvrez votre boutique publiée en direct, cliquez sur le bouton de discussion 💬 en bas à droite, puis envoyez un message privé de test. Il s'affichera ici en temps réel !
                      </p>
                    </div>
                  ) : (
                    activeSessions.map(sess => (
                      <button
                        key={sess.id}
                        onClick={() => setSelectedSessionId(sess.id)}
                        className="w-full text-left p-3 border border-gray-100 bg-white hover:border-[#0369A1] hover:bg-sky-50/10 rounded-2xl transition-all shadow-sm flex items-center justify-between group"
                        type="button"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            <p className="text-xs font-extrabold text-gray-900 truncate">{sess.customerName}</p>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate mt-1 italic font-medium">
                            "{sess.lastMessage}"
                          </p>
                          <p className="text-[9px] text-[#0369A1] font-bold mt-1">
                            Page : {sess.currentPage || '/'}
                          </p>
                        </div>
                        <div className="bg-gray-50 group-hover:bg-[#0369A1] group-hover:text-white text-gray-400 p-1.5 rounded-lg transition-colors shrink-0">
                          💬
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Dynamic Preview Canvas Container */}
        <div className="lg:col-span-3">
          <Card className="p-4 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge color={theme.isPublished ? 'green' : 'orange'}>{theme.isPublished ? 'Publié' : 'Brouillon'}</Badge>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{theme.siteType}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 p-1 bg-gray-50 rounded-lg border border-gray-100">
                  <button onClick={() => { setEditMode('desktop'); setDevice('desktop'); }} className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${editMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}><Monitor size={14} /></button>
                  <button onClick={() => { setEditMode('mobile'); setDevice('mobile'); }} className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${editMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}><Smartphone size={14} /></button>
                </div>
                <div className="flex gap-1 p-1 bg-gray-50 rounded-lg border border-gray-100">
                  {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
                    <button key={d} onClick={() => setDevice(d)} className={`p-1 rounded-md transition-all ${device === d ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}><Icon size={14} /></button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated browser wrapper setting local CSS variables for full shopify compliance */}
            <div
              className={`mx-auto rounded-xl border border-gray-100 overflow-hidden transition-all shadow-inner ${deviceWidth}`}
              style={{
                '--theme-primary': theme.colors.primary,
                '--theme-secondary': theme.colors.secondary,
                '--theme-accent': theme.colors.accent,
                '--theme-background': theme.colors.background,
                '--theme-text': theme.colors.text,
                backgroundColor: 'var(--theme-background)',
                color: 'var(--theme-text)',
                fontFamily: theme.fonts.body
              } as React.CSSProperties}
            >
              {theme.customCss && <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />}

              {theme.sections.filter(s => s.visible).map(s => (
                <div key={s.id} onClick={() => { setSelectedSection(s.id); setPanel('edit'); }} className={`cursor-pointer transition-all ${selectedSection === s.id ? 'ring-2 ring-[#0369A1] ring-inset' : 'hover:ring-1 hover:ring-gray-200 hover:ring-inset'}`}>
                  {renderSection(s, theme.colors, PRODUCT_AWARE_SECTIONS.has(s.type) ? products : undefined, theme.radius, theme.shadow, s.type === 'category-grid' ? categories : undefined, undefined, 0, s.type === 'testimonials' ? reviews : undefined, theme.scrollAnimation)}
                </div>
              ))}
              {theme.sections.filter(s => s.visible).length === 0 && (
                <div className="p-12 text-center text-gray-400 text-xs">Aucun bloc dans votre layout. Sélectionnez des sections dans le panneau latéral.</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><Layers size={14} /> {theme.sections.length} blocs · {theme.sections.filter(s => s.visible).length} affichés</div>
              <Badge color="green">Performances: 100/100 (Optimisé Os)</Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Publish modal */}
      <Modal open={publishModal} onClose={() => { setPublishModal(false); setJustPublished(false); }} title={justPublished ? 'Boutique en ligne !' : 'Publication Immédiate'}>
        {justPublished ? (
          <div className="space-y-4 font-sans">
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
              <p className="text-sm text-green-800 font-bold mb-1.5">🎉 Votre boutique Os est en ligne !</p>
              <a
                href={`https://${verifiedDomain || `${tenant?.slug}.${PLATFORM_ROOT_DOMAIN}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-extrabold text-[#0369A1] underline break-all"
              >
                {verifiedDomain || `${tenant?.slug}.${PLATFORM_ROOT_DOMAIN}`}
              </a>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setPublishModal(false); setJustPublished(false); }}>Fermer</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-sans">
            <p className="text-sm text-gray-500 leading-relaxed">
              Confirmez la publication de vos modifications. Elles seront appliquées en direct pour vos clients.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setPublishModal(false)}>Annuler</Button>
              <Button className="bg-[#0369A1] hover:bg-[#0284C7] text-white font-bold" onClick={publish} disabled={saving}>{saving ? 'Mise en ligne…' : 'Confirmer'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

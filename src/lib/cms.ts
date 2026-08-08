// Shopify Online Store 2.0 CMS model.
// A theme is a set of JSON templates (index, product, collection, cart, page,
// blog, list-collections), each assembling sections that themselves contain
// orderable blocks. We mirror that model so the CMS behaves like Shopify's.
export type CmsTemplate =
  | 'index' | 'product' | 'collection' | 'list-collections'
  | 'cart' | 'page' | 'blog' | 'article' | '404' | 'search' | 'password'
  | 'landing' | 'about' | 'contact' | 'faq' | 'custom';

export type CmsBlockType =
  | 'text' | 'heading' | 'image' | 'image-with-text' | 'button'
  | 'quote' | 'video' | 'hero' | 'cta' | 'collection' | 'product'
  | 'rich-text' | 'spacer' | 'custom-liquid' | '@app';

export interface CmsBlock {
  id: string;
  type: CmsBlockType;
  settings: Record<string, any>;
}

export interface CmsSection {
  id: string;
  type: string;        // section name, e.g. "image-banner", "featured-collection"
  blocks: CmsBlock[];
  block_order: string[];
  settings: Record<string, any>;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  template: CmsTemplate;
  // Legacy flat sections (kept for backward compat with existing stored pages)
  sections: Array<{ id: string; type: string; title: string; content: string }>;
  // OS 2.0 ordered section stack — each section holds its own blocks.
  osSections?: CmsSection[];
  updatedAt: string;
}

import { getTenantStorageKey } from './app-state';

const CMS_KEY = 'liafrikos_cms_pages';

function readCmsPages(): CmsPage[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(getTenantStorageKey(CMS_KEY)) || '[]');
  } catch {
    return [];
  }
}

function writeCmsPages(pages: CmsPage[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getTenantStorageKey(CMS_KEY), JSON.stringify(pages));
}

// Shopify JSON-template-style default section stacks per template type.
function defaultOsSections(template: CmsTemplate): CmsSection[] {
  switch (template) {
    case 'product':
      return [
        { id: 'main-product', type: 'main-product', blocks: [
          { id: 'b-vendor', type: 'text', settings: { text: 'Fournisseur' } },
        ], block_order: ['b-vendor'], settings: {} },
        { id: 'product-recommendations', type: 'product-recommendations', blocks: [], block_order: [], settings: { products_to_show: 4 } },
      ];
    case 'collection':
      return [
        { id: 'main-collection-banner', type: 'collection-banner', blocks: [], block_order: [], settings: {} },
        { id: 'main-collection-product-grid', type: 'collection-product-grid', blocks: [], block_order: [], settings: { products_per_page: 24 } },
      ];
    case 'cart':
      return [
        { id: 'main-cart-items', type: 'main-cart-items', blocks: [], block_order: [], settings: {} },
        { id: 'main-cart-footer', type: 'main-cart-footer', blocks: [], block_order: [], settings: {} },
      ];
    case 'list-collections':
      return [{ id: 'main-list-collections', type: 'main-list-collections', blocks: [], block_order: [], settings: {} }];
    case 'blog':
      return [{ id: 'main-blog', type: 'main-blog', blocks: [], block_order: [], settings: { posts_per_page: 12 } }];
    case 'article':
      return [{ id: 'main-article', type: 'main-article', blocks: [], block_order: [], settings: {} }];
    case 'index':
    default:
      return [
        { id: 'image-banner', type: 'image-banner', blocks: [], block_order: [], settings: {} },
        { id: 'rich-text', type: 'rich-text', blocks: [], block_order: [], settings: {} },
        { id: 'featured-collection', type: 'featured-collection', blocks: [], block_order: [], settings: {} },
      ];
  }
}

export function getCmsPages(): CmsPage[] {
  return readCmsPages().length > 0 ? readCmsPages() : [
    {
      id: 'page-about',
      title: 'À propos',
      slug: 'about',
      status: 'published',
      template: 'about',
      sections: [
        { id: 's1', type: 'hero', title: 'Notre histoire', content: 'Nous construisons des boutiques africaines modernes, puissantes et locales.' },
        { id: 's2', type: 'stats', title: 'Chiffres clés', content: '54 pays • 0% commission • IA intégrée' },
      ],
      osSections: defaultOsSections('about'),
      updatedAt: '2026-08-04',
    },
    {
      id: 'page-contact',
      title: 'Contact',
      slug: 'contact',
      status: 'published',
      template: 'contact',
      sections: [
        { id: 's3', type: 'contact', title: 'Prenez contact', content: 'contact@os.liafrik.com' },
      ],
      osSections: defaultOsSections('contact'),
      updatedAt: '2026-08-04',
    },
    {
      id: 'page-faq',
      title: 'FAQ',
      slug: 'faq',
      status: 'draft',
      template: 'faq',
      sections: [
        { id: 's4', type: 'faq', title: 'Questions fréquentes', content: 'Combien coûte la plateforme ?' },
      ],
      osSections: defaultOsSections('faq'),
      updatedAt: '2026-08-04',
    },
  ];
}

export function saveCmsPage(page: CmsPage) {
  const pages = readCmsPages();
  const existingIndex = pages.findIndex(item => item.id === page.id);
  // Ensure OS 2.0 sections exist — default to the template's stack if absent.
  const withOs = page.osSections && page.osSections.length ? page : { ...page, osSections: defaultOsSections(page.template) };
  const next = existingIndex >= 0 ? pages.map(item => item.id === page.id ? withOs : item) : [withOs, ...pages];
  writeCmsPages(next);
  return next;
}

export function createCmsPage(): CmsPage {
  const template: CmsTemplate = 'custom';
  return {
    id: `page-${Date.now()}`,
    title: 'Nouvelle page',
    slug: `page-${Date.now()}`,
    status: 'draft',
    template,
    sections: [{ id: `block-${Date.now()}`, type: 'text', title: 'Nouveau bloc', content: 'Écrivez ici votre contenu.' }],
    osSections: defaultOsSections(template),
    updatedAt: new Date().toLocaleDateString('fr-FR'),
  };
}

// OS 2.0 block helpers — add/remove/reorder blocks within a section.
export function addBlock(page: CmsPage, sectionId: string, block: CmsBlock): CmsPage {
  const osSections = (page.osSections || []).map(sec =>
    sec.id === sectionId
      ? { ...sec, blocks: [...sec.blocks, block], block_order: [...sec.block_order, block.id] }
      : sec
  );
  return { ...page, osSections, updatedAt: new Date().toLocaleDateString('fr-FR') };
}

export function removeBlock(page: CmsPage, sectionId: string, blockId: string): CmsPage {
  const osSections = (page.osSections || []).map(sec =>
    sec.id === sectionId
      ? { ...sec, blocks: sec.blocks.filter(b => b.id !== blockId), block_order: sec.block_order.filter(id => id !== blockId) }
      : sec
  );
  return { ...page, osSections, updatedAt: new Date().toLocaleDateString('fr-FR') };
}

export const SHOPIFY_TEMPLATES: { id: CmsTemplate; label: string; desc: string }[] = [
  { id: 'index', label: 'Index (Accueil)', desc: 'Page d\'accueil — template index.json' },
  { id: 'product', label: 'Produit', desc: 'Fiche produit — template product.json' },
  { id: 'collection', label: 'Collection', desc: 'Page de collection — template collection.json' },
  { id: 'list-collections', label: 'Liste de collections', desc: 'Toutes les collections — list-collections.json' },
  { id: 'cart', label: 'Panier', desc: 'Page panier — cart.json' },
  { id: 'page', label: 'Page', desc: 'Page personnalisée — page.json' },
  { id: 'blog', label: 'Blog', desc: 'Liste d\'articles — blog.json' },
  { id: 'article', label: 'Article', desc: 'Article de blog — article.json' },
  { id: '404', label: '404', desc: 'Page non trouvée — 404.json' },
  { id: 'search', label: 'Recherche', desc: 'Résultats de recherche — search.json' },
  { id: 'password', label: 'Mot de passe', desc: 'Page de maintenance — password.json' },
  { id: 'landing', label: 'Landing', desc: 'Page d\'atterrissage produit' },
  { id: 'about', label: 'À propos', desc: 'Page institutionnelle' },
  { id: 'contact', label: 'Contact', desc: 'Page de contact' },
  { id: 'faq', label: 'FAQ', desc: 'Foire aux questions' },
  { id: 'custom', label: 'Personnalisé', desc: 'Template libre' },
];

export const SHOPIFY_BLOCK_TYPES: { type: CmsBlockType; label: string }[] = [
  { type: 'text', label: 'Texte' },
  { type: 'heading', label: 'Titre' },
  { type: 'image', label: 'Image' },
  { type: 'image-with-text', label: 'Image avec texte' },
  { type: 'button', label: 'Bouton' },
  { type: 'quote', label: 'Citation' },
  { type: 'video', label: 'Vidéo' },
  { type: 'hero', label: 'Hero' },
  { type: 'cta', label: 'Appel à l\'action' },
  { type: 'collection', label: 'Collection' },
  { type: 'product', label: 'Produit' },
  { type: 'rich-text', label: 'Texte enrichi' },
  { type: 'spacer', label: 'Espacement' },
  { type: 'custom-liquid', label: 'Code Liquid personnalisé' },
  { type: '@app', label: 'Bloc d\'application' },
];

// Shopify Online Store 2.0 section palette — the list of sections a merchant
// can add via "Add section" in the theme editor sidebar.
export const SECTION_PALETTE: { type: string; label: string; desc: string; icon: string }[] = [
  { type: 'image-banner', label: 'Bannière image', desc: 'Image plein cadre avec overlay et CTA', icon: '🖼️' },
  { type: 'slideshow', label: 'Diaporama', desc: 'Slides auto-rotatifs pleine largeur', icon: '🎠' },
  { type: 'featured-collection', label: 'Collection vedette', desc: 'Grille de produits d\'une collection', icon: '🛍️' },
  { type: 'collection-list', label: 'Liste de collections', desc: 'Cartes de catégories cliquables', icon: '📂' },
  { type: 'multicolumn', label: 'Multi-colonnes', desc: 'Colonnes de texte + icônes (atouts)', icon: '📑' },
  { type: 'image-with-text', label: 'Image + texte', desc: 'Bloc scindé image / texte avec CTA', icon: '📝' },
  { type: 'rich-text', label: 'Texte enrichi', desc: 'Paragraphe éditorial centré', icon: '✍️' },
  { type: 'collapsible-content', label: 'Contenu repliable', desc: 'Accordéons FAQ / infos', icon: '📂' },
  { type: 'contact-form', label: 'Formulaire de contact', desc: 'Champs nom / email / message', icon: '📧' },
  { type: 'email-signup', label: 'Inscription email', desc: 'Capture newsletter', icon: '✉️' },
  { type: 'video', label: 'Vidéo', desc: 'Vidéo embarquée ou URL externe', icon: '🎬' },
  { type: 'spacer', label: 'Espacement', desc: 'Espace vertical ajustable', icon: '↕️' },
];

// OS 2.0 section helpers — add / remove / reorder sections in the page stack.
export function addOsSection(page: CmsPage, type: string): CmsPage {
  const id = `${type}-${Date.now()}`;
  const section: CmsSection = { id, type, blocks: [], block_order: [], settings: { title: SECTION_PALETTE.find(p => p.type === type)?.label || type } };
  return { ...page, osSections: [...(page.osSections || []), section], updatedAt: new Date().toLocaleDateString('fr-FR') };
}

export function removeOsSection(page: CmsPage, sectionId: string): CmsPage {
  return { ...page, osSections: (page.osSections || []).filter(s => s.id !== sectionId), updatedAt: new Date().toLocaleDateString('fr-FR') };
}

export function reorderOsSections(page: CmsPage, fromIdx: number, toIdx: number): CmsPage {
  const sections = [...(page.osSections || [])];
  if (fromIdx < 0 || toIdx < 0 || fromIdx >= sections.length || toIdx >= sections.length) return page;
  const [moved] = sections.splice(fromIdx, 1);
  sections.splice(toIdx, 0, moved);
  return { ...page, osSections: sections, updatedAt: new Date().toLocaleDateString('fr-FR') };
}

export function updateOsSectionSettings(page: CmsPage, sectionId: string, settings: Record<string, any>): CmsPage {
  const osSections = (page.osSections || []).map(s => s.id === sectionId ? { ...s, settings: { ...s.settings, ...settings } } : s);
  return { ...page, osSections, updatedAt: new Date().toLocaleDateString('fr-FR') };
}

export function addOsBlock(page: CmsPage, sectionId: string, type: CmsBlockType): CmsPage {
  const block: CmsBlock = { id: `b-${Date.now()}`, type, settings: { text: SHOPIFY_BLOCK_TYPES.find(b => b.type === type)?.label || '' } };
  return addBlock(page, sectionId, block);
}

export function updateOsBlockSettings(page: CmsPage, sectionId: string, blockId: string, settings: Record<string, any>): CmsPage {
  const osSections = (page.osSections || []).map(s => s.id === sectionId
    ? { ...s, blocks: s.blocks.map(b => b.id === blockId ? { ...b, settings: { ...b.settings, ...settings } } : b) }
    : s);
  return { ...page, osSections, updatedAt: new Date().toLocaleDateString('fr-FR') };
}

export function reorderOsBlocks(page: CmsPage, sectionId: string, fromIdx: number, toIdx: number): CmsPage {
  const osSections = (page.osSections || []).map(s => {
    if (s.id !== sectionId) return s;
    const blocks = [...s.blocks];
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= blocks.length || toIdx >= blocks.length) return s;
    const [moved] = blocks.splice(fromIdx, 1);
    blocks.splice(toIdx, 0, moved);
    return { ...s, blocks, block_order: blocks.map(b => b.id) };
  });
  return { ...page, osSections, updatedAt: new Date().toLocaleDateString('fr-FR') };
}

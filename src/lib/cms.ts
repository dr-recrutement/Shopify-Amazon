export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  template: 'landing' | 'about' | 'contact' | 'faq' | 'custom';
  sections: Array<{ id: string; type: string; title: string; content: string }>;
  updatedAt: string;
};

const CMS_KEY = 'liafrikos_cms_pages';

function readCmsPages(): CmsPage[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(CMS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCmsPages(pages: CmsPage[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CMS_KEY, JSON.stringify(pages));
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
      updatedAt: '2026-08-04',
    },
    {
      id: 'page-contact',
      title: 'Contact',
      slug: 'contact',
      status: 'published',
      template: 'contact',
      sections: [
        { id: 's3', type: 'contact', title: 'Prenez contact', content: 'contact@liafrikos.com' },
      ],
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
      updatedAt: '2026-08-04',
    },
  ];
}

export function saveCmsPage(page: CmsPage) {
  const pages = readCmsPages();
  const existingIndex = pages.findIndex(item => item.id === page.id);
  const next = existingIndex >= 0 ? pages.map(item => item.id === page.id ? page : item) : [page, ...pages];
  writeCmsPages(next);
  return next;
}

export function createCmsPage(): CmsPage {
  return {
    id: `page-${Date.now()}`,
    title: 'Nouvelle page',
    slug: `page-${Date.now()}`,
    status: 'draft',
    template: 'custom',
    sections: [{ id: `block-${Date.now()}`, type: 'text', title: 'Nouveau bloc', content: 'Écrivez ici votre contenu.' }],
    updatedAt: new Date().toLocaleDateString('fr-FR'),
  };
}

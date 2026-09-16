import { useEffect } from 'react';

export interface SeoOptions {
  title: string;
  description?: string;
  image?: string; // absolute or root-relative URL
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(path: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', `${window.location.origin}${path}`);
}

/** Applies a merchant-uploaded favicon to the real browser tab — both
 *  theme engines save a faviconUrl but neither ever actually set the
 *  page's <link rel="icon">, so uploading one had no visible effect.
 *  No-ops when empty (keeps the platform's own default favicon). */
export function applyFavicon(url?: string) {
  if (!url) return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/** Sets document.title and the standard SEO/OpenGraph/Twitter meta tags for
 *  the current route. This is a client-rendered SPA (no SSR/prerendering),
 *  so these updates run after mount — search engines that execute
 *  JavaScript (Googlebot does) still pick them up, but engines that only
 *  read the initial HTML will see index.html's generic defaults. Genuine
 *  per-route SEO for a JS-only crawler would need SSR or prerendering,
 *  which is a larger infrastructure change, not a hook. */
export function useSeo({ title, description, image, type = 'website', noIndex = false }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title.includes('Sellia') ? title : `${title} | Sellia`;
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', window.location.href);
    if (image) setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    if (image) setMeta('name', 'twitter:image', image);
    setCanonical(window.location.pathname);
  }, [title, description, image, type, noIndex]);
}

/** Injects/updates a single <script type="application/ld+json"> tag with
 *  Schema.org structured data for the current page — real Product rich
 *  snippets (price, currency, availability) for product pages, real
 *  Organization data on the landing page, etc. Google (and other engines
 *  that execute JS, same caveat as useSeo above) reads this to power
 *  rich search results; without it a listing is plain blue-link text
 *  even when the page itself has the data. Pass null to remove it (e.g.
 *  product not loaded yet) rather than emit incomplete/invalid JSON-LD. */
export function useJsonLd(data: Record<string, unknown> | null) {
  useEffect(() => {
    const id = 'jsonld-page-data';
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!data) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data });
    return () => { el?.remove(); };
  }, [data]);
}

// Cloudflare Pages Function: server-side SEO for a single-page app.
//
// The app is a SPA, so every URL used to return the SAME index.html - the
// landing page's <title>, description, Open Graph image and a canonical link
// pointing at "/". Crawlers that don't run JavaScript (WhatsApp/Facebook/
// Telegram link previews, many SEO tools, first-pass Googlebot) therefore saw
// every store and product as a duplicate of the home page. This rewrites the
// <head> per URL using the same public data the storefront reads (public
// tenants view + active products, via the publishable key - never a secret).
//
// Any failure falls back to the untouched HTML, so it can never break a page.

const SUPABASE_URL = 'https://hfzbykndwsrlxqlqrmjh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GvCcilGNUG7dc3rkYiT6AQ_RXfOxV30'; // publishable (public by design)

const NOINDEX_PATHS = /^\/(login|register|forgot-password|reset-password|onboarding|oauth|dashboard|settings|orders|products|customers|collections|billing|domains|payments|theme-editor)(\/|$)/;
const STORE_PRIVATE = /^\/store\/[^/]+\/(cart|order)(\/|$)/;

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, cf: { cacheTtl: 300, cacheEverything: true } });
  if (!res.ok) return null;
  return res.json();
}

const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const firstImage = (images) => {
  const a = Array.isArray(images) ? images : [];
  const f = a[0];
  return typeof f === 'string' ? f : f?.url || f?.src || null;
};
const money = (cents, cur) => { try { return new Intl.NumberFormat('fr', { style: 'currency', currency: cur || 'USD' }).format((cents || 0) / 100); } catch { return `${(cents || 0) / 100} ${cur || ''}`; } };

async function metaFor(url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const origin = url.origin;
  const canonical = origin + path;

  const base = path.match(/^\/store\/([^/]+)(?:\/(.*))?$/);
  if (base) {
    if (STORE_PRIVATE.test(path)) return { robots: 'noindex, follow', canonical };
    const slug = decodeURIComponent(base[1]);
    const rest_ = base[2] || '';
    const tenants = await rest(`public_tenants?slug=eq.${encodeURIComponent(slug)}&select=id,name,sector,country_name,city,currency,settings&limit=1`);
    const t = tenants?.[0];
    if (!t) return { robots: 'noindex', canonical };
    const place = [t.city, t.country_name].filter(Boolean).join(', ');
    const storeDesc = clip(t.settings?.description || t.settings?.seo_description || `${t.name}${t.sector ? ' — ' + t.sector : ''}${place ? ' à ' + place : ''}. Découvrez la boutique en ligne et commandez en toute sécurité.`, 160);
    const storeImage = t.settings?.logo || t.settings?.og_image || null;

    const prod = rest_.match(/^products\/([0-9a-f-]{36})$/i);
    if (prod) {
      const rows = await rest(`products?id=eq.${prod[1]}&tenant_id=eq.${t.id}&status=eq.active&select=name,description,price_cents,currency,images&limit=1`);
      const p = rows?.[0];
      if (!p) return { robots: 'noindex', canonical };
      return {
        title: `${p.name} — ${t.name}`,
        description: clip(p.description || `${p.name} à ${money(p.price_cents, p.currency || t.currency)} chez ${t.name}.`, 160),
        image: firstImage(p.images) || storeImage, canonical, type: 'product', siteName: t.name,
      };
    }
    if (rest_ === '') return { title: `${t.name} — Boutique en ligne`, description: storeDesc, image: storeImage, canonical, siteName: t.name };
    return { title: `${t.name}`, description: storeDesc, image: storeImage, canonical, siteName: t.name };
  }

  if (NOINDEX_PATHS.test(path)) return { robots: 'noindex, nofollow', canonical };
  return null; // landing & public marketing pages keep index.html's tags
}

export async function onRequest({ request, next }) {
  const response = await next();
  try {
    if (request.method !== 'GET') return response;
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;
    const url = new URL(request.url);
    const m = await metaFor(url);
    if (!m) return response;

    const attr = (name, value) => ({ element(e) { if (value) e.setAttribute(name, value); } });
    let rw = new HTMLRewriter();
    if (m.title) rw = rw.on('title', { element(e) { e.setInnerContent(m.title); } })
      .on('meta[property="og:title"]', attr('content', m.title)).on('meta[name="twitter:title"]', attr('content', m.title));
    if (m.description) rw = rw.on('meta[name="description"]', attr('content', m.description))
      .on('meta[property="og:description"]', attr('content', m.description)).on('meta[name="twitter:description"]', attr('content', m.description));
    if (m.canonical) rw = rw.on('link[rel="canonical"]', attr('href', m.canonical)).on('meta[property="og:url"]', attr('content', m.canonical));
    if (m.image) rw = rw.on('meta[property="og:image"]', attr('content', m.image));
    if (m.type) rw = rw.on('meta[property="og:type"]', attr('content', m.type));
    if (m.siteName) rw = rw.on('meta[property="og:site_name"]', attr('content', m.siteName));
    if (m.robots) rw = rw.on('meta[name="robots"]', attr('content', m.robots));
    const out = rw.transform(response);
    const headers = new Headers(out.headers);
    headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate');
    return new Response(out.body, { status: out.status, headers });
  } catch {
    return response;
  }
}

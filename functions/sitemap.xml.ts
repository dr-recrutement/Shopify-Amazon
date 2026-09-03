// Cloudflare Pages Function — GET /sitemap.xml
// Real, dynamic sitemap: the static marketing routes plus every tenant
// that actually has a published storefront (tenants.slug IS NOT NULL —
// the same flag the public storefront resolver and RLS policies use to
// mean "live"). A hand-written static file would drift the moment a
// merchant publishes or unpublishes a store, so this queries Supabase on
// every request instead of shipping a stale list.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PUBLIC_APP_URL?: string; // e.g. https://sellia.app — falls back to the request's own origin
}

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/features', priority: '0.8', changefreq: 'weekly' },
  { path: '/pricing', priority: '0.9', changefreq: 'weekly' },
  { path: '/marketplace', priority: '0.8', changefreq: 'daily' },
  { path: '/academy', priority: '0.5', changefreq: 'weekly' },
  { path: '/blog', priority: '0.6', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.4', changefreq: 'monthly' },
  { path: '/help', priority: '0.5', changefreq: 'monthly' },
  { path: '/legal/terms', priority: '0.2', changefreq: 'yearly' },
  { path: '/legal/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/legal/cookies', priority: '0.2', changefreq: 'yearly' },
  { path: '/legal/refund', priority: '0.2', changefreq: 'yearly' },
  { path: '/legal/legal', priority: '0.2', changefreq: 'yearly' },
];

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = env.PUBLIC_APP_URL || new URL(request.url).origin;
  const urls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = STATIC_ROUTES.map(r => ({
    loc: `${origin}${r.path}`,
    priority: r.priority,
    changefreq: r.changefreq,
  }));

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/tenants?select=slug,created_at&slug=not.is.null`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    if (res.ok) {
      const tenants: Array<{ slug: string; created_at: string }> = await res.json();
      for (const t of tenants) {
        if (!t.slug) continue;
        urls.push({ loc: `${origin}/s/${t.slug}`, priority: '0.7', changefreq: 'weekly', lastmod: t.created_at?.slice(0, 10) });
      }
    }
  } catch {
    // If Supabase is unreachable, still serve the static routes rather
    // than a 500 — a partial sitemap is better than none for crawlers.
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      u =>
        `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>${
          u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
        }\n  </url>`
    )
    .join('\n')}\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};

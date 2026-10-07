import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real, dynamic sitemap.xml per store - GET /functions/v1/sitemap?store=<slug>
// Lists the storefront home and every published blog post (content_pages).
// verify_jwt is off for this function (see deploy config) since search
// engine crawlers can't send a Supabase auth header.
const SITE_ORIGIN = 'https://sellia.liafrik.com';

function xmlEscape(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('store');
  if (!slug) {
    return new Response('Missing ?store=<slug>', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, anonKey);

  const { data: tenant } = await supabase.from('tenants').select('id, slug').eq('slug', slug).maybeSingle();
  if (!tenant) {
    return new Response('Store not found', { status: 404 });
  }

  const { data: pages } = await supabase
    .from('content_pages')
    .select('slug, published_at')
    .eq('tenant_id', tenant.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const urls = [
    { loc: `${SITE_ORIGIN}/store/${tenant.slug}`, lastmod: null, priority: '1.0' },
    ...((pages || []).map((p) => ({ loc: `${SITE_ORIGIN}/store/${tenant.slug}/blog/${p.slug}`, lastmod: p.published_at, priority: '0.6' }))),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n${u.lastmod ? `    <lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>\n` : ''}    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    `\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
});

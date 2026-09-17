// Cloudflare Pages Function — POST /api/analytics/ping
// Real "who's on your site right now" signal for the merchant Analytics
// page. Called every ~25s from the storefront while a visitor has the
// page open (see StorefrontPage.tsx). Uses Cloudflare's own
// request.cf.country — resolved for every request that hits this
// platform's edge, no external geolocation API, no IP address ever
// stored (see live_visitors schema: no ip column at all).

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Body {
  tenantId?: string;
  sessionId?: string;
  path?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }

  const { tenantId, sessionId, path } = body;
  if (!tenantId || !sessionId) return json({ ok: false, error: 'tenantId et sessionId requis' }, 400);

  const country = (request as Request & { cf?: { country?: string } }).cf?.country || null;

  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/live_visitors?on_conflict=tenant_id,session_id`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ tenant_id: tenantId, session_id: sessionId, country, path: path || null, last_seen: new Date().toISOString() }),
    });
  } catch {
    // Best-effort — a failed presence ping must never break the
    // shopping experience.
  }

  return json({ ok: true });
};

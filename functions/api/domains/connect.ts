// Cloudflare Pages Function — POST /api/domains/connect
// ⚠️ Ce fichier DOIT être à /functions/api/domains/connect.ts À LA RACINE du repo,
// PAS dans src/functions/ — Cloudflare Pages ignore tout ce qui n'est pas à la racine.
//
// Body attendu: { "domain": "maboutique.com" }
// Header attendu: Authorization: Bearer <access_token supabase de l'utilisateur connecté>
//
// Variables d'environnement (Cloudflare Pages → Settings → Environment variables) :
//   CF_API_TOKEN, CF_ACCOUNT_ID, CF_PAGES_PROJECT_NAME, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

interface Env {
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CF_PAGES_PROJECT_NAME: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function isValidDomain(domain: string): boolean {
  return /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i.test(domain);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) return json({ error: 'Non authentifié.' }, 401);

  let body: { domain?: string };
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }

  const domainName = (body.domain || '').trim().toLowerCase();
  if (!domainName || !isValidDomain(domainName)) return json({ error: 'Nom de domaine invalide.' }, 400);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return json({ error: 'Session invalide.' }, 401);
  const user: { id: string } = await userRes.json();

  const tenantRes = await fetch(`${env.SUPABASE_URL}/rest/v1/tenants?select=id,plan&owner_id=eq.${user.id}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const tenants: Array<{ id: string; plan: string }> = await tenantRes.json();
  const tenant = tenants?.[0];
  if (!tenant) return json({ error: 'Boutique introuvable.' }, 404);

  // Custom domains are available to every plan — not gated like other
  // plan features (products cap, staff seats, etc).

  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/domains`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ tenant_id: tenant.id, domain_name: domainName, type: 'custom', dns_status: 'pending', ssl_status: 'pending' }),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    if (errText.includes('duplicate') || errText.includes('unique')) return json({ error: 'Ce domaine est déjà utilisé.' }, 409);
    return json({ error: "Erreur lors de l'enregistrement du domaine.", details: errText }, 500);
  }

  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/pages/projects/${env.CF_PAGES_PROJECT_NAME}/domains`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domainName }),
    }
  );
  const cfData: { success: boolean; result?: { id?: string }; errors?: unknown } = await cfRes.json();

  if (!cfData.success) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/domains?domain_name=eq.${domainName}`, {
      method: 'PATCH',
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dns_status: 'failed', last_error: JSON.stringify(cfData.errors || cfData) }),
    });
    return json({ error: "Impossible d'attacher ce domaine sur Cloudflare.", details: cfData.errors }, 502);
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/domains?domain_name=eq.${domainName}`, {
    method: 'PATCH',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dns_status: 'verifying', cloudflare_domain_id: cfData.result?.id || null }),
  });

  return json({
    success: true,
    domain: domainName,
    status: 'verifying',
    dns: {
      type: 'CNAME',
      name: domainName,
      target: `${env.CF_PAGES_PROJECT_NAME}.pages.dev`,
      note: "Pour un domaine racine (sans www), utilisez un enregistrement ALIAS/ANAME si votre registrar le propose, sinon passez par un sous-domaine (ex: www.monsite.com).",
    },
  });
};

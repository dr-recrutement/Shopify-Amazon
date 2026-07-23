// Cloudflare Pages Function — POST /api/domains/connect
// Body attendu: { "domain": "maboutique.com" }
// Header attendu: Authorization: Bearer <access_token supabase de l'utilisateur connecté>
//
// Variables d'environnement à définir dans Cloudflare Pages
// (Dashboard Cloudflare → ton projet Pages → Settings → Environment variables → Production & Preview) :
//   CF_API_TOKEN            token API Cloudflare avec droit "Cloudflare Pages: Edit"
//   CF_ACCOUNT_ID            ID de ton compte Cloudflare
//   CF_PAGES_PROJECT_NAME    nom exact de ton projet Cloudflare Pages
//   SUPABASE_URL             URL de ton projet Supabase
//   SUPABASE_SERVICE_ROLE_KEY  clé service_role Supabase (⚠️ secrète, jamais côté client)

interface Env {
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CF_PAGES_PROJECT_NAME: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

interface TenantRow {
  id: string;
  plan: string;
  [key: string]: unknown;
}

const ALLOWED_PLAN_CODES = ['pro', 'premium', 'entreprise'];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corps de requête invalide.' }, 400);
  }

  const domain = (body.domain || '').trim().toLowerCase();
  if (!domain || !isValidDomain(domain)) {
    return json({ error: 'Nom de domaine invalide.' }, 400);
  }

  // 1) Vérifier l'utilisateur via son access token
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!userRes.ok) return json({ error: 'Session invalide.' }, 401);
  const user = (await userRes.json()) as SupabaseUser;

  // 2) Récupérer le tenant du user + son plan
  const tenantRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/tenants?select=id,plan&owner_id=eq.${user.id}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const tenants = (await tenantRes.json()) as TenantRow[];
  const tenant = tenants?.[0];
  if (!tenant) return json({ error: 'Boutique introuvable.' }, 404);

  if (!ALLOWED_PLAN_CODES.includes(tenant.plan)) {
    return json({ error: "Votre forfait actuel ne permet pas d'attacher un domaine personnalisé." }, 403);
  }

  // 3) Enregistrer le domaine en base (statut pending)
  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/domains`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ tenant_id: tenant.id, domain, status: 'pending' }),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    if (errText.includes('duplicate') || errText.includes('unique')) {
      return json({ error: 'Ce domaine est déjà utilisé.' }, 409);
    }
    return json({ error: 'Erreur lors de l\'enregistrement du domaine.' }, 500);
  }

  // 4) Attacher le domaine au projet Cloudflare Pages
  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/pages/projects/${env.CF_PAGES_PROJECT_NAME}/domains`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  );
  const cfData: any = await cfRes.json();

  if (!cfData.success) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/domains?domain=eq.${domain}`, {
      method: 'PATCH',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'failed', last_error: JSON.stringify(cfData.errors || cfData) }),
    });
    return json({ error: "Impossible d'attacher ce domaine sur Cloudflare.", details: cfData.errors }, 502);
  }

  // 5) Mettre à jour le statut + garder l'id Cloudflare
  await fetch(`${env.SUPABASE_URL}/rest/v1/domains?domain=eq.${domain}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'verifying', cloudflare_domain_id: cfData.result?.id || null }),
  });

  return json({
    success: true,
    domain,
    status: 'verifying',
    dns: {
      type: 'CNAME',
      name: domain,
      target: `${env.CF_PAGES_PROJECT_NAME}.pages.dev`,
      note: "Si c'est un domaine racine (ex: monsite.com, sans www), certains registrars n'acceptent pas de CNAME sur la racine — utilisez alors un enregistrement de type ALIAS/ANAME s'il est proposé, ou passez par un sous-domaine (ex: www.monsite.com).",
    },
  });
};

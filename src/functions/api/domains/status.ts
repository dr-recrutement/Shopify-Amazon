// Cloudflare Pages Function — GET /api/domains/status?domain=maboutique.com
// Header attendu: Authorization: Bearer <access_token supabase de l'utilisateur connecté>
// Vérifie l'état réel du domaine côté Cloudflare et met à jour Supabase en conséquence.
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

interface DomainRow {
  id: string;
  tenant_id: string;
  status: string;
  domain: string;
  tenants?: { owner_id: string };
  [key: string]: unknown;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const domain = (url.searchParams.get('domain') || '').trim().toLowerCase();
  if (!domain) return json({ error: 'Paramètre "domain" manquant.' }, 400);
  const authHeader = request.headers.get('Authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) return json({ error: 'Non authentifié.' }, 401);
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!userRes.ok) return json({ error: 'Session invalide.' }, 401);
  const user = (await userRes.json()) as SupabaseUser;
  // Vérifie que ce domaine appartient bien à un tenant possédé par cet utilisateur
  const domainRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/domains?select=id,tenant_id,status,domain,tenants(owner_id)&domain=eq.${domain}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const rows = (await domainRes.json()) as DomainRow[];
  const row = rows?.[0];
  if (!row || row.tenants?.owner_id !== user.id) {
    return json({ error: 'Domaine introuvable.' }, 404);
  }
  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/pages/projects/${env.CF_PAGES_PROJECT_NAME}/domains/${domain}`,
    { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } }
  );
  const cfData: any = await cfRes.json();
  if (!cfData.success) {
    return json({ status: row.status, cloudflare: null });
  }
  const cfStatus = cfData.result?.status; // 'pending' | 'active' | ...
  const newStatus = cfStatus === 'active' ? 'active' : 'verifying';
  if (newStatus !== row.status) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/domains?domain=eq.${domain}`, {
      method: 'PATCH',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
        ssl_status: cfData.result?.certificate_authority ? 'active' : 'pending',
        verified_at: newStatus === 'active' ? new Date().toISOString() : null,
      }),
    });
  }
  return json({ status: newStatus, cloudflare: cfData.result });
};

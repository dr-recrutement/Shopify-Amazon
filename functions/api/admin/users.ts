// Cloudflare Pages Function — GET /api/admin/users
// Lists real platform users (Supabase Auth) for super admins, joined with
// the tenant(s) each one owns. auth.users isn't exposed over PostgREST, so
// this uses the Supabase Admin API (GET /auth/v1/admin/users) with the
// service role key — the same key pattern already used by
// extend-subscription.ts for privileged, server-side-only operations.
//
// Header: Authorization: Bearer <access_token supabase du super admin>

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

async function requireSuperAdmin(request: Request, env: Env): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = request.headers.get('Authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) return { error: 'Non authentifié.', status: 401 };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return { error: 'Session invalide.', status: 401 };
  const user: { id: string } = await userRes.json();

  const adminRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/super_admins?select=id&user_id=eq.${user.id}&status=eq.active`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const rows: unknown[] = adminRes.ok ? await adminRes.json() : [];
  if (!Array.isArray(rows) || rows.length === 0) return { error: 'Accès réservé aux super admins.', status: 403 };

  return { userId: user.id };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await requireSuperAdmin(request, env);
  if ('error' in admin) return json({ error: admin.error }, admin.status);

  const usersRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users?per_page=500`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!usersRes.ok) {
    const details = await usersRes.text();
    return json({ error: "Impossible de récupérer la liste des utilisateurs.", details }, 502);
  }
  const usersData: { users?: Array<{ id: string; email?: string; created_at: string; last_sign_in_at?: string | null; banned_until?: string | null }> } = await usersRes.json();
  const authUsers = usersData.users || [];

  const tenantsRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/tenants?select=id,name,plan,status,owner_id,created_at`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const tenants: Array<{ id: string; name: string; plan: string; status: string; owner_id: string; created_at: string }> =
    tenantsRes.ok ? await tenantsRes.json() : [];

  const users = authUsers.map(u => ({
    id: u.id,
    email: u.email || '(sans email)',
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at || null,
    banned: !!u.banned_until && new Date(u.banned_until).getTime() > Date.now(),
    tenants: tenants.filter(t => t.owner_id === u.id).map(t => ({ id: t.id, name: t.name, plan: t.plan, status: t.status })),
  }));

  return json({ users });
};

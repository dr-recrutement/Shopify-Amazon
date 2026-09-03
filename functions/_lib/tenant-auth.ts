// Shared helper: resolve the authenticated Supabase user from a bearer
// token, then resolve the tenant they own. Used by any Pages Function that
// needs to act on behalf of the currently signed-in merchant.

export interface TenantAuthEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function resolveOwnedTenant(
  request: Request,
  env: TenantAuthEnv
): Promise<{ tenantId: string } | { error: string; status: number }> {
  const authHeader = request.headers.get('Authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) return { error: 'Non authentifié.', status: 401 };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return { error: 'Session invalide.', status: 401 };
  const user: { id: string } = await userRes.json();

  const tenantRes = await fetch(`${env.SUPABASE_URL}/rest/v1/tenants?select=id&owner_id=eq.${user.id}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!tenantRes.ok) return { error: 'Boutique introuvable.', status: 404 };
  const tenants: Array<{ id: string }> = await tenantRes.json();
  const tenant = tenants?.[0];
  if (!tenant) return { error: 'Boutique introuvable.', status: 404 };

  return { tenantId: tenant.id };
}

// Cloudflare Pages Function — POST /api/admin/toggle-tenant-status
// Real suspend/reactivate action for the Modération admin page. The
// "Boutiques" table already showed a suspended/active/trial status
// badge, and Moderation itself was a "not built yet" stub — nowhere in
// the whole app could a super admin actually change a tenant's status.
// Same secure pattern as extend-subscription.ts: verifies the caller is
// an active super admin, writes with the service role key (RLS on
// `tenants` is owner-only, same reason that function doesn't rely on
// client-side RLS either), and logs to audit_logs.
//
// Body: { "tenantId": "...", "action": "suspend" | "reactivate", "reason": "..." }
// Header: Authorization: Bearer <access_token supabase du super admin>

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Body {
  tenantId?: string;
  action?: 'suspend' | 'reactivate';
  reason?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

async function requireSuperAdmin(request: Request, env: Env): Promise<{ userId: string; email: string } | { error: string; status: number }> {
  const authHeader = request.headers.get('Authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) return { error: 'Non authentifié.', status: 401 };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return { error: 'Session invalide.', status: 401 };
  const user: { id: string; email?: string } = await userRes.json();

  const adminRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/super_admins?select=id&user_id=eq.${user.id}&status=eq.active`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const rows: unknown[] = adminRes.ok ? await adminRes.json() : [];
  if (!Array.isArray(rows) || rows.length === 0) return { error: 'Accès réservé aux super admins.', status: 403 };

  return { userId: user.id, email: user.email || '' };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await requireSuperAdmin(request, env);
  if ('error' in admin) return json({ error: admin.error }, admin.status);

  let body: Body;
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }

  const { tenantId, action, reason } = body;
  if (!tenantId || !action || !['suspend', 'reactivate'].includes(action)) {
    return json({ error: 'tenantId et action ("suspend" ou "reactivate") sont requis.' }, 400);
  }

  const currentRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/tenants?select=status,name&id=eq.${tenantId}`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const currentRows: Array<{ status: string; name: string }> = currentRes.ok ? await currentRes.json() : [];
  const current = currentRows[0];
  if (!current) return json({ error: 'Boutique introuvable.' }, 404);

  // Reactivating restores 'active' — a merchant mid-trial who gets
  // suspended and reactivated shouldn't lose their trial status, but we
  // have no reliable way here to know if they were trialing vs already
  // paying, so 'active' (not 'trial') is the safe default: it never
  // undercuts a paying merchant's access, and the plan/billing safety
  // net (plan_renews_at) still applies independently either way.
  const newStatus = action === 'suspend' ? 'suspended' : 'active';
  if (current.status === newStatus) {
    return json({ error: `Cette boutique est déjà ${newStatus === 'suspended' ? 'suspendue' : 'active'}.` }, 400);
  }

  const updateRes = await fetch(`${env.SUPABASE_URL}/rest/v1/tenants?id=eq.${tenantId}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!updateRes.ok) {
    const errText = await updateRes.text();
    return json({ error: 'Erreur lors de la mise à jour du statut.', details: errText }, 500);
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/audit_logs`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actor_id: admin.userId,
      action: action === 'suspend' ? 'tenant_suspended' : 'tenant_reactivated',
      target_type: 'tenant',
      target_id: tenantId,
      metadata: { tenantName: current.name, previousStatus: current.status, newStatus, actorEmail: admin.email, reason: reason ?? null },
    }),
  });

  return json({ success: true, tenantId, status: newStatus });
};

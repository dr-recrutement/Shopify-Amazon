// Cloudflare Pages Function — POST /api/admin/extend-subscription
// Lets a super admin extend or set a merchant's subscription period.
// Writes tenants.plan_renews_at directly with the service role key — the
// same field functions/api/subscriptions/webhook.ts sets on a real
// Flutterwave payment, so this takes effect exactly like a real renewal
// would (dashboard, plan-access checks, everything reads this field).
//
// Body:
//   {
//     "tenantId": "...",
//     "mode": "days" | "months" | "years" | "custom_date",
//     "amount": 30,              // required for days/months/years — added
//                                 // on top of the LATER of now/current
//                                 // plan_renews_at, so stacking extensions
//                                 // never loses remaining time
//     "customDate": "2027-01-01" // required for custom_date — sets the
//                                 // absolute renewal date instead
//     "plan": "premium",         // optional — also change the plan tier
//     "reason": "..."            // optional — stored in the audit log
//   }
// Header: Authorization: Bearer <access_token supabase du super admin>

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Body {
  tenantId?: string;
  mode?: 'days' | 'months' | 'years' | 'custom_date';
  amount?: number;
  customDate?: string;
  plan?: string;
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

  const { tenantId, mode, amount, customDate, plan, reason } = body;
  if (!tenantId || !mode) return json({ error: 'tenantId et mode sont requis.' }, 400);

  // Fetch the current row so a "add X days" extension stacks on top of
  // remaining time instead of resetting it — extending an active
  // subscription that still has 10 days left by 30 days should land 40
  // days out, not 30.
  const currentRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/tenants?select=plan,plan_renews_at&id=eq.${tenantId}`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const currentRows: Array<{ plan: string; plan_renews_at: string | null }> = currentRes.ok ? await currentRes.json() : [];
  const current = currentRows[0];
  if (!current) return json({ error: 'Boutique introuvable.' }, 404);

  let newRenewsAt: Date;
  if (mode === 'custom_date') {
    if (!customDate) return json({ error: 'customDate est requis pour ce mode.' }, 400);
    newRenewsAt = new Date(customDate);
    if (isNaN(newRenewsAt.getTime())) return json({ error: 'customDate invalide.' }, 400);
  } else {
    if (!amount || amount <= 0) return json({ error: 'amount doit être un nombre positif pour ce mode.' }, 400);
    const currentRenewsAt = current.plan_renews_at ? new Date(current.plan_renews_at) : null;
    const base = currentRenewsAt && currentRenewsAt.getTime() > Date.now() ? currentRenewsAt : new Date();
    newRenewsAt = new Date(base);
    if (mode === 'days') newRenewsAt.setDate(newRenewsAt.getDate() + amount);
    else if (mode === 'months') newRenewsAt.setMonth(newRenewsAt.getMonth() + amount);
    else if (mode === 'years') newRenewsAt.setFullYear(newRenewsAt.getFullYear() + amount);
    else return json({ error: 'mode invalide.' }, 400);
  }

  const patch: Record<string, unknown> = {
    status: 'active',
    trial_ends_at: null,
    plan_renews_at: newRenewsAt.toISOString(),
  };
  if (plan) patch.plan = plan;

  const updateRes = await fetch(`${env.SUPABASE_URL}/rest/v1/tenants?id=eq.${tenantId}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
  if (!updateRes.ok) {
    const errText = await updateRes.text();
    return json({ error: "Erreur lors de la mise à jour de l'abonnement.", details: errText }, 500);
  }

  // Audit trail — every extension is traceable to the admin who granted it.
  await fetch(`${env.SUPABASE_URL}/rest/v1/audit_logs`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actor_id: admin.userId,
      action: 'subscription_extended',
      target_type: 'tenant',
      target_id: tenantId,
      metadata: { mode, amount: amount ?? null, customDate: customDate ?? null, plan: plan ?? current.plan, previousRenewsAt: current.plan_renews_at, newRenewsAt: newRenewsAt.toISOString(), actorEmail: admin.email, reason: reason ?? null },
    }),
  });

  return json({ success: true, tenantId, planRenewsAt: newRenewsAt.toISOString(), plan: plan ?? current.plan, status: 'active' });
};

// Cloudflare Pages Function — POST /api/subscriptions/checkout
// Crée un lien de paiement Flutterwave pour souscrire/mettre à niveau un plan.
//
// Body attendu: { "plan": "premium" | "enterprise", "billingCycle": "monthly" | "annual" }
// Header attendu: Authorization: Bearer <access_token supabase>
//
// Variables d'environnement (Cloudflare Pages → Settings → Environment variables) :
//   FLUTTERWAVE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_APP_URL

interface Env {
  FLUTTERWAVE_SECRET_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PUBLIC_APP_URL: string;
}

// Kept in sync manually with src/lib/constants.ts PLANS (see functions/lib/plans.ts note).
const PRICES: Record<string, { monthly: number; annual: number }> = {
  premium: { monthly: 19, annual: 159 },
  enterprise: { monthly: 69, annual: 599 },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) return json({ error: 'Non authentifié.' }, 401);

  let body: { plan?: string; billingCycle?: string };
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }

  const plan = body.plan || '';
  const billingCycle = body.billingCycle === 'annual' ? 'annual' : 'monthly';
  const price = PRICES[plan];
  if (!price) return json({ error: 'Plan invalide. Utilisez "premium" ou "enterprise".' }, 400);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return json({ error: 'Session invalide.' }, 401);
  const user: { id: string; email?: string } = await userRes.json();

  const adminRes = await fetch(`${env.SUPABASE_URL}/rest/v1/super_admins?select=id&user_id=eq.${user.id}&status=eq.active`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const admins = await adminRes.json();
  if (Array.isArray(admins) && admins.length > 0) {
    return json({ error: 'Les super admins ne paient aucun abonnement — rien à facturer.' }, 400);
  }

  const tenantRes = await fetch(`${env.SUPABASE_URL}/rest/v1/tenants?select=id,name&owner_id=eq.${user.id}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const tenants: Array<{ id: string; name: string }> = await tenantRes.json();
  const tenant = tenants?.[0];
  if (!tenant) return json({ error: 'Boutique introuvable.' }, 404);

  const amount = billingCycle === 'annual' ? price.annual : price.monthly;
  const txRef = `os-sub-${tenant.id}-${Date.now()}`;

  const fwRes = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency: 'USD',
      redirect_url: `${env.PUBLIC_APP_URL}/dashboard/settings?subscription=pending`,
      customer: { email: user.email, name: tenant.name },
      customizations: { title: 'Os by LiAfrik — Abonnement', description: `Plan ${plan} (${billingCycle})` },
      meta: { tenant_id: tenant.id, plan, billing_cycle: billingCycle },
    }),
  });

  const fwData: { status: string; data?: { link?: string }; message?: string } = await fwRes.json();
  if (fwData.status !== 'success' || !fwData.data?.link) {
    return json({ error: 'Impossible de créer le paiement Flutterwave.', details: fwData.message }, 502);
  }

  return json({ success: true, paymentLink: fwData.data.link, txRef });
};

// Cloudflare Pages Function — POST /api/subscriptions/webhook
// Reçoit les événements Flutterwave (à configurer dans le dashboard Flutterwave :
// Settings → Webhooks, avec le "Secret Hash" ci-dessous).
//
// ⚠️ SÉCURITÉ : ce endpoint n'est PAS protégé par une session utilisateur —
// n'importe qui peut appeler cette URL. La seule protection est la vérification
// du header `verif-hash` contre FLUTTERWAVE_WEBHOOK_HASH. Ne jamais activer un
// plan sans cette vérification.
//
// Variables d'environnement :
//   FLUTTERWAVE_WEBHOOK_HASH, FLUTTERWAVE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

interface Env {
  FLUTTERWAVE_WEBHOOK_HASH: string;
  FLUTTERWAVE_SECRET_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Verify the webhook is genuinely from Flutterwave.
  const signature = request.headers.get('verif-hash');
  if (!signature || signature !== env.FLUTTERWAVE_WEBHOOK_HASH) {
    return json({ error: 'Signature invalide.' }, 401);
  }

  let event: {
    event?: string;
    data?: {
      id: number;
      tx_ref: string;
      status: string;
      amount: number;
      currency: string;
      meta?: { tenant_id?: string; plan?: string; billing_cycle?: string };
    };
  };
  try { event = await request.json(); } catch { return json({ error: 'Corps invalide.' }, 400); }

  const data = event.data;
  if (!data || event.event !== 'charge.completed') {
    return json({ received: true }); // ignore anything we don't handle
  }

  // 2. Re-verify the transaction directly with Flutterwave (never trust the
  // webhook payload alone — this confirms the charge actually succeeded and
  // wasn't spoofed even with a leaked hash).
  const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${data.id}/verify`, {
    headers: { Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}` },
  });
  const verify: { status: string; data?: { status?: string; amount?: number; currency?: string } } = await verifyRes.json();
  if (verify.status !== 'success' || verify.data?.status !== 'successful') {
    return json({ received: true, ignored: 'not successful on re-verification' });
  }

  const tenantId = data.meta?.tenant_id;
  const plan = data.meta?.plan;
  const billingCycle = data.meta?.billing_cycle || 'monthly';
  if (!tenantId || !plan) return json({ received: true, ignored: 'missing meta' });

  // 3. Idempotency: if we've already recorded this exact Flutterwave
  // transaction id, don't process it twice (webhook retries are normal).
  const existingRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/subscription_events?select=id&flutterwave_tx_id=eq.${data.id}`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const existing = await existingRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    return json({ received: true, duplicate: true });
  }

  const periodDays = billingCycle === 'annual' ? 365 : 30;
  const renewsAt = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

  await fetch(`${env.SUPABASE_URL}/rest/v1/tenants?id=eq.${tenantId}`, {
    method: 'PATCH',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, status: 'active', trial_ends_at: null, plan_renews_at: renewsAt }),
  });

  await fetch(`${env.SUPABASE_URL}/rest/v1/subscription_events`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: tenantId,
      flutterwave_tx_id: String(data.id),
      flutterwave_tx_ref: data.tx_ref,
      plan,
      billing_cycle: billingCycle,
      amount: verify.data?.amount ?? data.amount,
      currency: verify.data?.currency ?? data.currency,
      status: 'confirmed',
      raw_payload: event,
    }),
  });

  return json({ received: true, activated: plan });
};

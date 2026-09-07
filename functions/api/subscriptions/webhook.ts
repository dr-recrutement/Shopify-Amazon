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
//   CF_API_TOKEN, CF_ACCOUNT_ID, CF_PAGES_PROJECT_NAME (pour les achats de domaine —
//   voir functions/api/domains/purchase-initialize.ts)

interface Env {
  FLUTTERWAVE_WEBHOOK_HASH: string;
  FLUTTERWAVE_SECRET_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CF_PAGES_PROJECT_NAME: string;
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
      meta?: { tenant_id?: string; plan?: string; billing_cycle?: string; purchase_type?: string; domain?: string; wholesale_cost?: number };
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
  if (!tenantId) return json({ received: true, ignored: 'missing tenant_id' });

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

  if (data.meta?.purchase_type === 'domain') {
    return handleDomainPurchase(env, event, data, tenantId, data.meta.domain, verify);
  }

  const plan = data.meta?.plan;
  const billingCycle = data.meta?.billing_cycle || 'monthly';
  if (!plan) return json({ received: true, ignored: 'missing meta' });

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

/** Domain purchase confirmed paid — now, and only now, do we call
 *  Cloudflare's real, non-refundable Registrar API. Re-checks availability
 *  one last time first: the domain could theoretically have been taken by
 *  someone else in the (usually short) time between initializing payment
 *  and the buyer completing it. If that happens, the payment is recorded
 *  as 'paid_registration_failed' — a human needs to refund it, this
 *  function can't safely do that automatically — rather than silently
 *  charging the merchant for nothing. */
async function handleDomainPurchase(
  env: Env, event: unknown, data: { id: number; tx_ref: string; amount: number; currency: string },
  tenantId: string, domain: string | undefined, verify: { data?: { amount?: number; currency?: string } }
): Promise<Response> {
  if (!domain) return json({ received: true, ignored: 'missing domain in meta' });

  const recordEvent = (status: string, extra?: Record<string, unknown>) =>
    fetch(`${env.SUPABASE_URL}/rest/v1/subscription_events`, {
      method: 'POST',
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        flutterwave_tx_id: String(data.id),
        flutterwave_tx_ref: data.tx_ref,
        plan: null,
        amount: verify.data?.amount ?? data.amount,
        currency: verify.data?.currency ?? data.currency,
        status,
        raw_payload: { ...(typeof event === 'object' ? event : {}), domain, ...extra },
      }),
    });

  let cfCheck: { success: boolean; result?: { domains?: Array<{ registrable: boolean }> } };
  try {
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/registrar/domain-check`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: [domain] }),
    });
    cfCheck = await cfRes.json();
  } catch {
    await recordEvent('paid_registration_pending_retry');
    return json({ received: true, error: 'cloudflare_unreachable_will_need_manual_follow_up' }, 200);
  }

  if (!cfCheck.success || !cfCheck.result?.domains?.[0]?.registrable) {
    await recordEvent('paid_registration_failed', { reason: 'domain_no_longer_available' });
    return json({ received: true, error: 'domain_taken_after_payment_needs_refund' });
  }

  const registerRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/registrar/registrations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain_name: domain }),
  });
  const registerData: { success: boolean; result?: { state?: string; completed?: boolean }; errors?: unknown } = await registerRes.json();

  if (!registerData.success) {
    await recordEvent('paid_registration_failed', { reason: 'cloudflare_register_error', details: registerData.errors });
    return json({ received: true, error: 'cloudflare_registration_failed_needs_refund' });
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/domains`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: tenantId, domain_name: domain, type: 'purchased', dns_status: 'active', ssl_status: 'active', verified_at: new Date().toISOString() }),
  });

  await recordEvent('confirmed', { cloudflare_state: registerData.result?.state });

  // Best-effort: attach the freshly registered domain to the tenant's
  // Cloudflare Pages project so the storefront resolves on it immediately
  // without the merchant having to also click 'Relier' separately. If this
  // sub-step fails, the domain is still real and purchased — the merchant
  // can still connect it manually from Online Store → Domaines.
  try {
    await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/pages/projects/${env.CF_PAGES_PROJECT_NAME}/domains`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }),
    });
  } catch {
    // Non-fatal — see comment above.
  }

  return json({ received: true, registered: domain });
}

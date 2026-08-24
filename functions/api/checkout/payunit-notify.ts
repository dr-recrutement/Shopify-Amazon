// Cloudflare Pages Function — POST /api/checkout/payunit-notify
// Reçoit la notification PayUnit après un paiement (configuré comme
// notify_url lors de l'initialisation). Ne fait JAMAIS confiance au
// contenu du payload seul — revérifie toujours le statut réel auprès de
// l'API PayUnit avant de marquer une commande comme payée.
//
// Documentation : https://developer.payunit.net/checkout/check-status
//
// Variables d'environnement :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const PAYUNIT_BASE_URL = 'https://gateway.payunit.net';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let payload: Record<string, any>;
  try { payload = await request.json(); } catch { return json({ received: true }); }

  // PayUnit's notify payload shape can vary by integration path — accept
  // the reasonable set of field names their docs/SDKs use rather than
  // assume one exact shape.
  const checkoutId: string | undefined = payload.checkout_id || payload.data?.checkout_id || payload.data?.id;
  const transactionId: string | undefined = payload.transaction_id || payload.data?.transaction_id;
  if (!checkoutId && !transactionId) return json({ received: true, ignored: 'no identifiers in payload' });

  // The order id IS the transaction_id we sent at initialization — use it
  // to find which tenant this belongs to, so we know whose PayUnit
  // credentials to use for the authoritative status re-check.
  if (!transactionId) return json({ received: true, ignored: 'no transaction_id, cannot resolve tenant' });

  const orderRes = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?select=id,tenant_id,status&id=eq.${transactionId}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const orders: Array<{ id: string; tenant_id: string; status: string }> = await orderRes.json();
  const order = orders?.[0];
  if (!order) return json({ received: true, ignored: 'order not found' });

  const gwRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?select=api_key_encrypted,api_secret_encrypted,client_id_encrypted&tenant_id=eq.${order.tenant_id}&gateway=eq.PayUnit`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const gwRows: Array<{ api_key_encrypted: string; api_secret_encrypted: string; client_id_encrypted: string }> = await gwRes.json();
  const gw = gwRows?.[0];
  if (!gw) return json({ received: true, ignored: 'no PayUnit credentials for tenant' });

  const basicAuth = btoa(`${gw.api_key_encrypted}:${gw.api_secret_encrypted}`);
  const mode = gw.client_id_encrypted?.startsWith('live_') ? 'live' : 'test';
  const idForStatus = checkoutId || transactionId;

  // Re-verify directly with PayUnit — never trust the notify payload's own
  // status field alone (same principle as the Flutterwave webhook: the
  // notification just tells us to go check, it doesn't get to decide).
  const statusRes = await fetch(`${PAYUNIT_BASE_URL}/api/gateway/checkout/status/${idForStatus}`, {
    headers: { 'Authorization': `Basic ${basicAuth}`, 'x-api-key': gw.client_id_encrypted, 'mode': mode, 'Content-Type': 'application/json' },
  });
  const statusData: { status: string; data?: { status?: string } } = await statusRes.json();
  const realStatus = statusData.data?.status;

  if (realStatus !== 'SUCCESS') {
    return json({ received: true, status: realStatus || 'unknown' });
  }

  if (order.status !== 'paid') {
    await fetch(`${env.SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
  }

  return json({ received: true, activated: true });
};

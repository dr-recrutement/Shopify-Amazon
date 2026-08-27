// Cloudflare Pages Function — POST /api/checkout/payunit-initialize
// Initie un vrai paiement PayUnit pour une commande d'un tenant donné, en
// utilisant les identifiants PayUnit propres au marchand (stockés dans
// vendor_payment_gateways, jamais exposés au client).
//
// Body attendu: { "tenantId": "...", "orderId": "...", "amount": 5000,
//                  "currency": "XAF", "customerEmail": "...",
//                  "items": [{ "name": "...", "price": 1000, "qty": 2 }] }
//
// Documentation officielle PayUnit :
// https://developer.payunit.net/checkout/initialize-payment
// Endpoint réel: POST https://gateway.payunit.net/api/gateway/checkout/initialize
//
// Variables d'environnement (Cloudflare Pages → Settings → Environment variables) :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_APP_URL

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PUBLIC_APP_URL: string;
}

const PAYUNIT_BASE_URL = 'https://gateway.payunit.net';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: {
    tenantId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    customerEmail?: string;
    items?: Array<{ name: string; price: number; qty: number }>;
  };
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }

  const { tenantId, orderId, amount, currency, items } = body;
  if (!tenantId || !orderId || !amount || !currency) {
    return json({ error: 'tenantId, orderId, amount et currency sont requis.' }, 400);
  }

  // Fetch this merchant's own PayUnit credentials — never the platform's,
  // each tenant connects and pays with their own PayUnit account.
  const gwRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?select=api_key_encrypted,api_secret_encrypted,client_id_encrypted,is_active&tenant_id=eq.${tenantId}&gateway=eq.PayUnit`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const rows: Array<{ api_key_encrypted: string; api_secret_encrypted: string; client_id_encrypted: string; is_active: boolean }> = await gwRes.json();
  const gw = rows?.[0];
  if (!gw || !gw.is_active) {
    return json({ error: "Ce marchand n'a pas connecté PayUnit — le paiement PayUnit n'est pas disponible sur cette boutique." }, 400);
  }

  const apiUser = gw.api_key_encrypted;
  const apiPassword = gw.api_secret_encrypted;
  const applicationToken = gw.client_id_encrypted;
  if (!apiUser || !apiPassword || !applicationToken) {
    return json({ error: 'Identifiants PayUnit incomplets pour ce marchand.' }, 400);
  }

  const basicAuth = btoa(`${apiUser}:${apiPassword}`);
  const mode = applicationToken.startsWith('live_') ? 'live' : 'test';

  const payunitRes = await fetch(`${PAYUNIT_BASE_URL}/api/gateway/checkout/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuth}`,
      'x-api-key': applicationToken,
      'mode': mode,
    },
    body: JSON.stringify({
      cancel_url: `${env.PUBLIC_APP_URL}/checkout?payment=cancelled&order=${orderId}`,
      success_url: `${env.PUBLIC_APP_URL}/checkout?payment=success&order=${orderId}`,
      notify_url: `${env.PUBLIC_APP_URL}/api/checkout/payunit-notify`,
      currency,
      mode: 'payment',
      transaction_id: orderId,
      total_amount: amount,
      items: (items || []).map(i => ({
        price_description: { unit_amount: i.price },
        product_description: { name: i.name, image_url: `${env.PUBLIC_APP_URL}/logo.png` },
        quantity: i.qty,
      })),
      meta: { phone_number_collection: true, address_collection: false },
    }),
  });

  const payunitData: { status: string; data?: { redirect?: string }; message?: string } = await payunitRes.json();
  if (payunitData.status !== 'SUCCESS' || !payunitData.data?.redirect) {
    return json({ error: "Impossible d'initialiser le paiement PayUnit.", details: payunitData.message }, 502);
  }

  return json({ success: true, redirect: payunitData.data.redirect });
};

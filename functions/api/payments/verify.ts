// Cloudflare Pages Function — GET /api/payments/verify?order_id=X&transaction_id=Y&tenant_id=Z
// Appelée depuis OrderConfirmationPage.tsx après le retour de la page de paiement Flutterwave.
// Vérifie le paiement via l'API Flutterwave AVEC LA CLÉ DU MARCHAND (pas une clé globale),
// et met à jour le statut de la commande en conséquence.
//
// Variables d'environnement nécessaires :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');
  const transactionId = url.searchParams.get('transaction_id');
  const tenantId = url.searchParams.get('tenant_id');

  if (!orderId || !transactionId || !tenantId) {
    return json({ error: 'Paramètres manquants.' }, 400);
  }

  const sbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1) Récupère la commande
  const orderRes = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?select=*&id=eq.${orderId}&tenant_id=eq.${tenantId}`, {
    headers: sbHeaders,
  });
  const orders = await orderRes.json();
  const order = orders?.[0];
  if (!order) return json({ error: 'Commande introuvable.' }, 404);

  if (order.status === 'paid' || order.status === 'confirmed') {
    return json({ status: order.status, alreadyVerified: true });
  }

  // 2) Récupère la clé Flutterwave DE CE MARCHAND (celle qui a servi à initier le paiement).
  const gwRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?select=api_secret_encrypted&tenant_id=eq.${tenantId}&gateway=eq.flutterwave&is_active=eq.true`,
    { headers: sbHeaders }
  );
  const gateways = await gwRes.json();
  const gw = gateways?.[0];
  if (!gw?.api_secret_encrypted) return json({ error: 'Passerelle de paiement introuvable pour ce marchand.' }, 400);
  const secretKey = atob(gw.api_secret_encrypted);

  // 3) Vérifie la transaction directement auprès de Flutterwave.
  const fwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const fwData: any = await fwRes.json();
  const tx = fwData?.data;

  const isValid =
    fwData.status === 'success' &&
    tx?.status === 'successful' &&
    tx?.currency === order.currency &&
    Number(tx?.amount) >= Number(order.total_cents) &&
    tx?.tx_ref === order.payment_reference;

  const newStatus = isValid ? 'paid' : 'payment_failed';

  await fetch(`${env.SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: 'PATCH',
    headers: sbHeaders,
    body: JSON.stringify({ status: newStatus }),
  });

  return json({ status: newStatus, verified: isValid });
};

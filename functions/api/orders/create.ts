// Cloudflare Pages Function — POST /api/orders/create
// Accessible sans authentification (achat invité). Body attendu :
// { tenantId, items: [{ productId, quantity }], customer: { name, email, phone, address } }
//
// Variables d'environnement nécessaires (Cloudflare Pages → Settings → Environment variables) :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Le paiement utilise la clé Flutterwave PROPRE À CHAQUE MARCHAND
// (table vendor_payment_gateways), pas une clé globale — chaque marchand
// reçoit ses paiements directement sur son propre compte Flutterwave.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }

  const { tenantId, items, customer } = body || {};
  if (!tenantId || !Array.isArray(items) || items.length === 0) {
    return json({ error: 'Panier invalide.' }, 400);
  }
  if (!customer?.name || !customer?.phone) {
    return json({ error: 'Nom et téléphone du client requis.' }, 400);
  }

  const sbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1) Re-vérifie les prix réels côté serveur — ne JAMAIS faire confiance
  // aux prix envoyés par le navigateur (facilement manipulables).
  const productIds = items.map((i: any) => i.productId);
  const prodRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/products?select=id,name,price_cents,currency,tenant_id&id=in.(${productIds.join(',')})&tenant_id=eq.${tenantId}&status=eq.active`,
    { headers: sbHeaders }
  );
  const realProducts: any[] = await prodRes.json();

  if (!Array.isArray(realProducts) || realProducts.length === 0) {
    return json({ error: 'Aucun produit valide trouvé pour cette boutique.' }, 400);
  }

  const orderItems = items
    .map((i: any) => {
      const p = realProducts.find(rp => rp.id === i.productId);
      if (!p) return null;
      const qty = Math.max(1, parseInt(i.quantity) || 1);
      return { product_id: p.id, product_name: p.name, price_cents: p.price_cents, quantity: qty };
    })
    .filter(Boolean);

  if (orderItems.length === 0) {
    return json({ error: 'Aucun article valide dans le panier.' }, 400);
  }

  const currency = realProducts[0].currency;
  const totalCents = orderItems.reduce((s: number, i: any) => s + i.price_cents * i.quantity, 0);

  // 2) Cherche la passerelle Flutterwave active DE CE MARCHAND précis.
  const gwRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?select=api_secret_encrypted&tenant_id=eq.${tenantId}&gateway=eq.flutterwave&is_active=eq.true`,
    { headers: sbHeaders }
  );
  const gateways = await gwRes.json();
  const gw = gateways?.[0];
  const paymentConfigured = !!gw?.api_secret_encrypted;

  // 3) Crée la commande
  const orderRes = await fetch(`${env.SUPABASE_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({
      tenant_id: tenantId,
      customer_name: customer.name,
      customer_email: customer.email || null,
      customer_phone: customer.phone,
      shipping_address: customer.address || null,
      total_cents: totalCents,
      currency,
      status: paymentConfigured ? 'awaiting_payment' : 'pending_payment_setup',
      payment_gateway: paymentConfigured ? 'flutterwave' : null,
    }),
  });

  if (!orderRes.ok) {
    const errText = await orderRes.text();
    return json({ error: 'Erreur lors de la création de la commande.', details: errText }, 500);
  }
  const [order] = await orderRes.json();

  // 4) Crée les lignes de commande
  const itemsRes = await fetch(`${env.SUPABASE_URL}/rest/v1/order_items`, {
    method: 'POST',
    headers: sbHeaders,
    body: JSON.stringify(orderItems.map((i: any) => ({ ...i, order_id: order.id }))),
  });
  if (!itemsRes.ok) {
    const errText = await itemsRes.text();
    return json({ error: "Erreur lors de l'enregistrement des articles.", details: errText }, 500);
  }

  if (!paymentConfigured) {
    return json({
      success: true,
      orderId: order.id,
      total: totalCents,
      currency,
      paymentUrl: null,
      notice: "Le paiement en ligne n'est pas encore configuré pour cette boutique. La commande a été enregistrée.",
    });
  }

  // 5) Initie le paiement Flutterwave (Standard — page hébergée) AVEC LA CLÉ DU MARCHAND.
  // ⚠️ redirect_url doit inclure order_id ET tenant_id en query params : Flutterwave y
  // ajoutera automatiquement transaction_id/status, et /api/payments/verify exige les 3.
  // ⚠️ Malgré son nom, `total_cents` est en réalité le montant en unité pleine
  // (ex: 25000 = 25 000 XOF), PAS des centimes — voir formatPrice() dans theme-engine.tsx
  // qui ne divise jamais par 100. Ne pas diviser ici non plus.
  const secretKey = atob(gw.api_secret_encrypted);
  const origin = new URL(request.url).origin;
  const txRef = `LA-${order.id}`;
  const fwRes = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: totalCents,
      currency,
      redirect_url: `${origin}/order-confirmation/${order.id}?tenant_id=${tenantId}`,
      customer: { email: customer.email || 'client@liafrik.com', phonenumber: customer.phone, name: customer.name },
      customizations: { title: 'Paiement de commande' },
    }),
  });
  const fwData: any = await fwRes.json();

  if (fwData.status !== 'success') {
    console.error('[orders/create] Erreur initiation Flutterwave:', fwData);
    return json({ success: true, orderId: order.id, total: totalCents, currency, paymentUrl: null, error: "Erreur lors de l'initiation du paiement." });
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
    method: 'PATCH',
    headers: sbHeaders,
    body: JSON.stringify({ payment_reference: txRef }),
  });

  return json({ success: true, orderId: order.id, total: totalCents, currency, paymentUrl: fwData.data.link });
};

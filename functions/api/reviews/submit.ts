// Cloudflare Pages Function — POST /api/reviews/submit
// Body attendu: { orderId, productId, rating, comment, customerName }
// N'accepte l'avis QUE si productId appartient bien à une ligne de orderId
// (achat vérifié) — empêche les faux avis non liés à un vrai achat.
//
// Variables d'environnement nécessaires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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

  const { orderId, productId, rating, comment, customerName } = body || {};
  if (!orderId || !productId || !rating || !customerName) {
    return json({ error: 'Paramètres manquants.' }, 400);
  }
  const ratingNum = parseInt(rating);
  if (ratingNum < 1 || ratingNum > 5) return json({ error: 'Note invalide (1 à 5).' }, 400);

  const sbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // Vérifie que ce produit appartient bien à cette commande (achat réel vérifié).
  const orderRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/orders?select=id,tenant_id,status&id=eq.${orderId}`,
    { headers: sbHeaders }
  );
  const orders = await orderRes.json();
  const order = orders?.[0];
  if (!order) return json({ error: 'Commande introuvable.' }, 404);

  const itemRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/order_items?select=id&order_id=eq.${orderId}&product_id=eq.${productId}`,
    { headers: sbHeaders }
  );
  const orderItems = await itemRes.json();
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return json({ error: "Ce produit ne fait pas partie de cette commande." }, 403);
  }

  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/product_reviews`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({
      tenant_id: order.tenant_id,
      product_id: productId,
      order_id: orderId,
      customer_name: customerName,
      rating: ratingNum,
      comment: comment || null,
    }),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    if (errText.includes('duplicate') || errText.includes('unique')) {
      return json({ error: 'Vous avez déjà laissé un avis pour ce produit sur cette commande.' }, 409);
    }
    return json({ error: "Erreur lors de l'enregistrement de l'avis.", details: errText }, 500);
  }

  return json({ success: true });
};

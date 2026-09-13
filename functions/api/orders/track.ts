// Cloudflare Pages Function — POST /api/orders/track
// Real order lookup for a shopper tracking their own order on a specific
// merchant's storefront. Orders have no public SELECT policy (a shopper
// can't just query another customer's order), so this uses the service
// role and requires BOTH the order number and the email used at checkout
// to match — prevents anyone from guessing order numbers to see someone
// else's order.
//
// Body: { "shopSlug": "...", "orderNumber": "...", "email": "..." }

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { shopSlug?: string; orderNumber?: string; email?: string };
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }

  const shopSlug = (body.shopSlug || '').trim();
  const orderNumber = (body.orderNumber || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  if (!shopSlug || !orderNumber || !email) {
    return json({ error: 'Boutique, numéro de commande et email sont requis.' }, 400);
  }

  const tenantRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/tenants?select=id,name&slug=eq.${encodeURIComponent(shopSlug)}`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const tenants: Array<{ id: string; name: string }> = await tenantRes.json();
  const tenant = tenants?.[0];
  if (!tenant) return json({ error: 'Boutique introuvable.' }, 404);

  const orderRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/orders?select=order_number,status,total_cents,currency,items,created_at,customer_email&tenant_id=eq.${tenant.id}&order_number=eq.${encodeURIComponent(orderNumber)}`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const orders: Array<{ order_number: string; status: string; total_cents: number; currency: string; items: unknown; created_at: string; customer_email: string | null }> = await orderRes.json();
  const order = orders?.[0];

  // Deliberately generic error whether the order number or the email is
  // wrong — doesn't confirm whether an order number exists at all.
  if (!order || !order.customer_email || order.customer_email.toLowerCase() !== email) {
    return json({ error: 'Aucune commande trouvée avec ces informations.' }, 404);
  }

  return json({
    shopName: tenant.name,
    orderNumber: order.order_number,
    status: order.status,
    total: (order.total_cents || 0) / 100,
    currency: order.currency,
    items: order.items,
    date: order.created_at,
  });
};

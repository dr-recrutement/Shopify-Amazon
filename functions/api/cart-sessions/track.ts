// Cloudflare Pages Function — POST /api/cart-sessions/track
// Appelée depuis CheckoutPage quand un client saisit son email avec des
// articles dans le panier — permet de détecter les paniers abandonnés.
// Body: { tenantId, customerEmail, customerPhone, items, totalCents, currency }
//
// Variables d'environnement: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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

  const { tenantId, customerEmail, customerPhone, items, totalCents, currency } = body || {};
  if (!tenantId || !customerEmail || !Array.isArray(items) || items.length === 0) {
    return json({ error: 'Paramètres manquants.' }, 400);
  }

  const sbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // Une seule session "active" par email+tenant : on la met à jour si elle existe déjà.
  const existingRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cart_sessions?select=id&tenant_id=eq.${tenantId}&customer_email=eq.${encodeURIComponent(customerEmail)}&status=eq.active`,
    { headers: sbHeaders }
  );
  const existing = await existingRes.json();

  const payload = {
    tenant_id: tenantId,
    customer_email: customerEmail,
    customer_phone: customerPhone || null,
    items,
    total_cents: totalCents || 0,
    currency: currency || 'XOF',
    status: 'active',
    updated_at: new Date().toISOString(),
  };

  if (existing?.[0]) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/cart_sessions?id=eq.${existing[0].id}`, {
      method: 'PATCH', headers: sbHeaders, body: JSON.stringify(payload),
    });
  } else {
    await fetch(`${env.SUPABASE_URL}/rest/v1/cart_sessions`, {
      method: 'POST', headers: sbHeaders, body: JSON.stringify(payload),
    });
  }

  return json({ success: true });
};

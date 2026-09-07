// Cloudflare Pages Function — POST /api/domains/purchase-initialize
// Real payment collection BEFORE any Cloudflare Registrar charge happens.
// The merchant pays Sellia (Flutterwave) for the domain + markup; only
// once that payment is confirmed (webhook, functions/api/subscriptions/
// webhook.ts) does the platform call Cloudflare's real, non-refundable
// registration endpoint using the platform's own Cloudflare account.
//
// Body: { "domain": "maboutique.com" }
// Header: Authorization: Bearer <access_token supabase du marchand>
//
// Variables d'environnement :
//   CF_API_TOKEN, CF_ACCOUNT_ID, FLUTTERWAVE_SECRET_KEY,
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_APP_URL

interface Env {
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  FLUTTERWAVE_SECRET_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PUBLIC_APP_URL: string;
}

// Sellia's service markup on top of Cloudflare's real at-cost registry
// price — same 20% figure already disclosed to merchants in the product
// copy before this was wired to a real registrar.
const MARKUP = 1.2;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
    return json({ error: "L'achat de domaine n'est pas configuré (clés Cloudflare manquantes)." }, 503);
  }

  const authHeader = request.headers.get('Authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) return json({ error: 'Non authentifié.' }, 401);

  let body: { domain?: string };
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }
  const domain = (body.domain || '').trim().toLowerCase();
  if (!domain) return json({ error: 'domain requis.' }, 400);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return json({ error: 'Session invalide.' }, 401);
  const user: { id: string; email?: string } = await userRes.json();

  const tenantRes = await fetch(`${env.SUPABASE_URL}/rest/v1/tenants?select=id,name&owner_id=eq.${user.id}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const tenants: Array<{ id: string; name: string }> = await tenantRes.json();
  const tenant = tenants?.[0];
  if (!tenant) return json({ error: 'Boutique introuvable.' }, 404);

  // Authoritative, real-time check — never trust a price the client sent.
  let cfCheck: { success: boolean; result?: { domains?: Array<{ name: string; registrable: boolean; pricing?: { currency: string; registration_cost: string } }> } };
  try {
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/registrar/domain-check`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: [domain] }),
    });
    cfCheck = await cfRes.json();
  } catch {
    return json({ error: 'Service Cloudflare momentanément indisponible.' }, 502);
  }
  const result = cfCheck.result?.domains?.[0];
  if (!cfCheck.success || !result) return json({ error: 'Vérification indisponible.' }, 502);
  if (!result.registrable) return json({ error: "Ce domaine n'est plus disponible." }, 409);

  const wholesaleCost = parseFloat(result.pricing?.registration_cost || '0');
  if (!wholesaleCost) return json({ error: 'Prix indisponible pour ce domaine.' }, 502);
  const amount = Math.ceil(wholesaleCost * MARKUP * 100) / 100;
  const txRef = `os-domain-${tenant.id}-${Date.now()}`;

  const fwRes = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency: result.pricing?.currency || 'USD',
      redirect_url: `${env.PUBLIC_APP_URL}/app/online-store/advanced?domain_purchase=pending`,
      customer: { email: user.email, name: tenant.name },
      customizations: { title: 'Sellia — Achat de domaine', description: `Enregistrement de ${domain}` },
      meta: { tenant_id: tenant.id, purchase_type: 'domain', domain, wholesale_cost: wholesaleCost },
    }),
  });

  const fwData: { status: string; data?: { link?: string }; message?: string } = await fwRes.json();
  if (fwData.status !== 'success' || !fwData.data?.link) {
    return json({ error: 'Impossible de créer le paiement.', details: fwData.message }, 502);
  }

  return json({ success: true, paymentLink: fwData.data.link, amount, currency: result.pricing?.currency || 'USD' });
};

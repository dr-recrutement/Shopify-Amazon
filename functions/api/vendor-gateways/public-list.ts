// Cloudflare Pages Function — GET /api/vendor-gateways/public-list?tenantId=...
// Real fix for the storefront checkout showing payment options (Orange
// Money, Wave, MTN MoMo, Carte bancaire) that had no processor wired
// behind them regardless of what the merchant actually connected in
// Settings — a shopper could "pay" with any of them and nothing but a
// decorative pending order was ever created. This endpoint lets the
// public, anonymous storefront ask "which gateways does this merchant
// have active?" without ever exposing a key or secret (only the gateway
// name + isActive boolean) — StorefrontPage.tsx then only offers the
// payment methods that are genuinely wired AND connected.
//
// Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const tenantId = new URL(request.url).searchParams.get('tenantId');
  if (!tenantId) return json({ error: 'tenantId requis' }, 400);

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?select=gateway,is_active&tenant_id=eq.${tenantId}&is_active=eq.true`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    if (!res.ok) return json({ gateways: [] });
    const rows: Array<{ gateway: string; is_active: boolean }> = await res.json();
    return json({ gateways: rows.map(r => r.gateway) });
  } catch {
    return json({ gateways: [] });
  }
};

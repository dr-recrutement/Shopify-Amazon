// Cloudflare Pages Function — POST /api/discounts/validate
// Body attendu: { tenantId, code, subtotalCents }
// Accessible sans authentification (utilisé pendant le checkout invité).
//
// Variables d'environnement nécessaires:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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

  const { tenantId, code, subtotalCents } = body || {};
  if (!tenantId || !code || typeof subtotalCents !== 'number') {
    return json({ error: 'Paramètres manquants.' }, 400);
  }

  const sbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/discount_codes?select=*&tenant_id=eq.${tenantId}&code=eq.${encodeURIComponent(code.trim().toUpperCase())}&is_active=eq.true`,
    { headers: sbHeaders }
  );
  const rows = await res.json();
  const discount = rows?.[0];

  if (!discount) return json({ error: 'Code promo invalide.' }, 404);

  const now = new Date();
  if (discount.starts_at && new Date(discount.starts_at) > now) {
    return json({ error: "Ce code n'est pas encore actif." }, 400);
  }
  if (discount.ends_at && new Date(discount.ends_at) < now) {
    return json({ error: 'Ce code promo a expiré.' }, 400);
  }
  if (discount.max_uses != null && discount.used_count >= discount.max_uses) {
    return json({ error: "Ce code promo a atteint sa limite d'utilisation." }, 400);
  }
  if (discount.min_amount_cents && subtotalCents < discount.min_amount_cents) {
    return json({ error: `Montant minimum requis : ${discount.min_amount_cents}.` }, 400);
  }

  const discountCents =
    discount.discount_type === 'percentage'
      ? Math.round((subtotalCents * discount.value) / 100)
      : Math.min(Math.round(discount.value), subtotalCents);

  return json({ code: discount.code, discountCents });
};

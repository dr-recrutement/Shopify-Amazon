// Cloudflare Pages Function — POST /api/discounts/validate
// Real destination for a promo-code field at checkout. Merchants could
// already create discount codes (Discounts.tsx) but nothing anywhere
// let a shopper actually enter one — this validates a code for real
// (case-insensitive match, active status, date window, usage limit,
// minimum order) and returns the real discount to apply, or a specific
// reason it can't be used. Anonymous-safe: discounts are owner-only in
// RLS, so this needs the service role to even look one up.
//
// Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Body {
  tenantId?: string;
  code?: string;
  orderTotal?: number;
}

interface DiscountRow {
  id: string;
  code: string;
  title: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  min_order: number | null;
  usage_limit: number | null;
  used_count: number;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Body;
  try { body = await request.json(); } catch { return json({ valid: false, error: 'Requête invalide.' }, 400); }

  const { tenantId, code, orderTotal } = body;
  if (!tenantId || !code) return json({ valid: false, error: 'Code requis.' }, 400);

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/discounts?select=id,code,title,type,value,min_order,usage_limit,used_count,status,starts_at,ends_at&tenant_id=eq.${tenantId}&code=ilike.${encodeURIComponent(code.trim())}&limit=1`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    if (!res.ok) return json({ valid: false, error: 'Service indisponible, réessayez.' }, 502);
    const rows: DiscountRow[] = await res.json();
    const d = rows[0];

    if (!d) return json({ valid: false, error: 'Code promo introuvable.' });
    if (d.status !== 'active') return json({ valid: false, error: 'Ce code promo n\'est plus actif.' });
    const now = Date.now();
    if (d.starts_at && new Date(d.starts_at).getTime() > now) return json({ valid: false, error: 'Ce code promo n\'est pas encore actif.' });
    if (d.ends_at && new Date(d.ends_at).getTime() < now) return json({ valid: false, error: 'Ce code promo a expiré.' });
    if (d.usage_limit != null && d.used_count >= d.usage_limit) return json({ valid: false, error: 'Ce code promo a atteint sa limite d\'utilisation.' });
    if (d.min_order != null && typeof orderTotal === 'number' && orderTotal < d.min_order) {
      return json({ valid: false, error: `Ce code nécessite un montant minimum de ${d.min_order.toLocaleString('fr-FR')}.` });
    }

    return json({
      valid: true,
      discount: { id: d.id, code: d.code, title: d.title, type: d.type, value: d.value },
    });
  } catch {
    return json({ valid: false, error: 'Service indisponible, réessayez.' }, 502);
  }
};

// Cloudflare Pages Function — POST /api/domains/check
// Authoritative real-time availability + price, straight from the
// registry via Cloudflare's Registrar API. Always call this right before
// showing a price the merchant is about to pay — /api/domains/search
// results are cached and can be stale.
//
// Variables d'environnement : CF_API_TOKEN, CF_ACCOUNT_ID

interface Env {
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { domain?: string };
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }
  const domain = (body.domain || '').trim().toLowerCase();
  if (!domain) return json({ error: 'domain requis.' }, 400);
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
    return json({ error: "L'achat de domaine n'est pas configuré (clés Cloudflare manquantes)." }, 503);
  }

  try {
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/registrar/domain-check`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: [domain] }),
    });
    const cfData: { success: boolean; result?: { domains?: Array<{ name: string; registrable: boolean; pricing?: { currency: string; registration_cost: string } }> }; errors?: unknown } = await cfRes.json();
    if (!cfData.success) return json({ error: 'Vérification indisponible.', details: cfData.errors }, 502);
    const result = cfData.result?.domains?.[0];
    if (!result) return json({ error: 'Réponse inattendue du registrar.' }, 502);
    return json({
      domain: result.name,
      registrable: result.registrable,
      currency: result.pricing?.currency,
      registrationCostUsd: result.pricing?.registration_cost,
    });
  } catch {
    return json({ error: 'Service Cloudflare momentanément indisponible.' }, 502);
  }
};

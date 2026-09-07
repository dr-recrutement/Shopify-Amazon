// Cloudflare Pages Function — GET /api/domains/search?q=...
// Real Cloudflare Registrar API (beta, launched April 2026) domain search —
// fast, cached results for suggesting names. Not authoritative for
// availability/price; always re-confirm via /api/domains/check right
// before showing a price the merchant can pay for.
//
// Variables d'environnement : CF_API_TOKEN, CF_ACCOUNT_ID
// Le token CF_API_TOKEN doit avoir la permission "Registrar: Write" —
// si ce n'était pas déjà le cas au moment où vous l'avez créé, il faut le
// régénérer avec ce scope pour que cette fonctionnalité marche.

interface Env {
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'Paramètre q requis.' }, 400);
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
    return json({ error: "L'achat de domaine n'est pas configuré (clés Cloudflare manquantes)." }, 503);
  }

  try {
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/registrar/domain-search?${new URLSearchParams({ q, limit: '8' })}`,
      { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } }
    );
    const cfData: { success: boolean; result?: { domains?: Array<{ name: string; registrable: boolean; pricing?: { currency: string; registration_cost: string } }> }; errors?: unknown } = await cfRes.json();
    if (!cfData.success) return json({ error: 'Recherche indisponible.', details: cfData.errors }, 502);
    return json({ domains: cfData.result?.domains || [] });
  } catch {
    return json({ error: 'Service Cloudflare momentanément indisponible.' }, 502);
  }
};

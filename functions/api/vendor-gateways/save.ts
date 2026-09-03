// Cloudflare Pages Function — POST /api/vendor-gateways/save
// Saves a merchant's own payment-gateway credentials (Flutterwave, PayUnit,
// Stripe, etc. used for THEIR storefront checkout), encrypting the secret
// fields server-side before they ever reach Supabase. Replaces writing
// straight to the vendor_payment_gateways table from the client, which
// stored these values as plaintext despite the *_encrypted column names.
//
// Body: { "gateway": "PayUnit", "apiKey": "...", "apiSecret": "...",
//          "clientId": "...", "isActive": true }
// Header: Authorization: Bearer <access_token supabase de l'utilisateur connecté>
//
// Pass an empty string for apiKey/apiSecret/clientId to leave that field
// unchanged (so the UI never has to round-trip the real secret back to
// prefill an edit form).
//
// Variables d'environnement (Cloudflare Pages → Settings → Environment variables) :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMENT_API_KEY_ENCRYPTION_SECRET

import { resolveOwnedTenant } from '../../_lib/tenant-auth';
import { encryptSecret } from '../../_lib/crypto';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PAYMENT_API_KEY_ENCRYPTION_SECRET: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const auth = await resolveOwnedTenant(request, env);
  if ('error' in auth) return json({ error: auth.error }, auth.status);

  let body: { gateway?: string; apiKey?: string; apiSecret?: string; clientId?: string; isActive?: boolean };
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }

  const gateway = (body.gateway || '').trim();
  if (!gateway) return json({ error: 'gateway est requis.' }, 400);

  // Fetch the existing row so blank fields mean "keep current value" rather
  // than "erase it" — the client never holds the real secret after the
  // initial save, so it can only send back what actually changed.
  const existingRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?select=api_key_encrypted,api_secret_encrypted,client_id_encrypted&tenant_id=eq.${auth.tenantId}&gateway=eq.${encodeURIComponent(gateway)}`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const existingRows: Array<{ api_key_encrypted: string | null; api_secret_encrypted: string | null; client_id_encrypted: string | null }> =
    existingRes.ok ? await existingRes.json() : [];
  const existing = existingRows?.[0];

  const secret = env.PAYMENT_API_KEY_ENCRYPTION_SECRET;
  const apiKeyEncrypted = body.apiKey ? await encryptSecret(body.apiKey, secret) : existing?.api_key_encrypted || '';
  const apiSecretEncrypted = body.apiSecret ? await encryptSecret(body.apiSecret, secret) : existing?.api_secret_encrypted || '';
  const clientIdEncrypted = body.clientId ? await encryptSecret(body.clientId, secret) : existing?.client_id_encrypted || null;

  const upsertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?on_conflict=tenant_id,gateway`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      tenant_id: auth.tenantId,
      gateway,
      api_key_encrypted: apiKeyEncrypted,
      api_secret_encrypted: apiSecretEncrypted,
      client_id_encrypted: clientIdEncrypted,
      is_active: !!body.isActive,
      status: body.isActive ? 'active' : 'pending',
    }),
  });

  if (!upsertRes.ok) {
    const errText = await upsertRes.text();
    return json({ error: "Erreur lors de l'enregistrement de la passerelle.", details: errText }, 500);
  }

  return json({ success: true, gateway, isActive: !!body.isActive });
};

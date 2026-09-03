// Cloudflare Pages Function — GET /api/vendor-gateways/list
// Returns the current merchant's connected payment gateways with secrets
// masked (e.g. "••••ab12") rather than decrypted — the dashboard only needs
// to show "connected, ending in ab12", never the real key, so the real
// value never has to travel back to the browser after the initial save.
//
// Header: Authorization: Bearer <access_token supabase de l'utilisateur connecté>
//
// Variables d'environnement (Cloudflare Pages → Settings → Environment variables) :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMENT_API_KEY_ENCRYPTION_SECRET

import { resolveOwnedTenant } from '../../_lib/tenant-auth';
import { decryptSecret, maskSecret } from '../../_lib/crypto';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PAYMENT_API_KEY_ENCRYPTION_SECRET: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const auth = await resolveOwnedTenant(request, env);
  if ('error' in auth) return json({ error: auth.error }, auth.status);

  const rowsRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?select=gateway,api_key_encrypted,api_secret_encrypted,client_id_encrypted,is_active&tenant_id=eq.${auth.tenantId}`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  if (!rowsRes.ok) return json({ error: 'Erreur lors de la lecture des passerelles.' }, 500);
  const rows: Array<{ gateway: string; api_key_encrypted: string | null; api_secret_encrypted: string | null; client_id_encrypted: string | null; is_active: boolean }> =
    await rowsRes.json();

  const secret = env.PAYMENT_API_KEY_ENCRYPTION_SECRET;
  const result = await Promise.all(rows.map(async row => {
    const apiKey = await decryptSecret(row.api_key_encrypted || '', secret);
    const apiSecret = await decryptSecret(row.api_secret_encrypted || '', secret);
    const clientId = await decryptSecret(row.client_id_encrypted || '', secret);
    return {
      gateway: row.gateway,
      isActive: !!row.is_active,
      apiKeyMasked: maskSecret(apiKey),
      apiSecretMasked: maskSecret(apiSecret),
      clientIdMasked: maskSecret(clientId),
      configured: !!(apiKey || apiSecret),
    };
  }));

  return json({ gateways: result });
};

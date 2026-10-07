import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real "Tester la connexion" for a merchant's own PSP credentials - a
// genuine lightweight API call per provider using their actual stored
// (encrypted) keys, not a fake always-green checkmark. Confirms the
// credentials are valid and the account is reachable before the
// merchant ever sends a real customer to checkout with them.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

async function decryptOne(keyHex: string, stored: string): Promise<string> {
  const [ivHex, ctHex] = stored.split(':');
  const toBytes = (hex: string) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', toBytes(keyHex), 'AES-GCM', false, ['decrypt']);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBytes(ivHex) }, key, toBytes(ctHex));
  return new TextDecoder().decode(plainBuf);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  let payload: { tenant_id?: string; gateway?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const { tenant_id, gateway } = payload;
  if (!tenant_id || !gateway) return json({ error: 'tenant_id and gateway are required' }, 400);

  // Only the store owner can test its own gateway credentials - checked
  // under the caller's own RLS, not an admin bypass.
  const { data: tenant } = await asCaller.from('tenants').select('id').eq('id', tenant_id).maybeSingle();
  if (!tenant) return json({ error: "You don't have access to this store" }, 403);

  try {
    const { data: secretRow, error: secretError } = await admin.from('platform_secrets').select('value').eq('key', 'gateway_encryption_key').single();
    if (secretError || !secretRow) throw new Error('Encryption key unavailable');

    const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', tenant_id).eq('gateway', gateway).maybeSingle();
    if (!gw) return json({ ok: false, message: 'Aucune information de connexion enregistrée pour ce moyen de paiement.' });

    if (gateway === 'stripe') {
      if (!gw.api_secret_encrypted) return json({ ok: false, message: 'Clé secrète manquante.' });
      const secretKey = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const res = await fetch('https://api.stripe.com/v1/balance', { headers: { Authorization: `Bearer ${secretKey}` } });
      const body = await res.json();
      if (!res.ok) return json({ ok: false, message: body.error?.message || 'Identifiants Stripe invalides.' });
      return json({ ok: true, message: `Connexion Stripe réussie (compte ${body.livemode ? 'live' : 'test'}).` });
    }

    if (gateway === 'flutterwave') {
      if (!gw.api_secret_encrypted) return json({ ok: false, message: 'Clé secrète manquante.' });
      const secretKey = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const res = await fetch('https://api.flutterwave.com/v3/balances', { headers: { Authorization: `Bearer ${secretKey}` } });
      const body = await res.json();
      if (!res.ok || body.status !== 'success') return json({ ok: false, message: body.message || 'Identifiants Flutterwave invalides.' });
      return json({ ok: true, message: 'Connexion Flutterwave réussie.' });
    }

    if (gateway === 'paystack') {
      if (!gw.api_secret_encrypted) return json({ ok: false, message: 'Clé secrète manquante.' });
      const secretKey = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const res = await fetch('https://api.paystack.co/transaction/totals', { headers: { Authorization: `Bearer ${secretKey}` } });
      const body = await res.json();
      if (!res.ok || !body.status) return json({ ok: false, message: body.message || 'Identifiants Paystack invalides.' });
      return json({ ok: true, message: 'Connexion Paystack réussie.' });
    }

    if (gateway === 'payunit') {
      if (!gw.api_key_encrypted || !gw.client_id_encrypted || !gw.api_secret_encrypted) return json({ ok: false, message: 'Informations de connexion incomplètes.' });
      const apiKey = await decryptOne(secretRow.value, gw.api_key_encrypted);
      const clientId = await decryptOne(secretRow.value, gw.client_id_encrypted);
      const apiPassword = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const authData = btoa(`${clientId}:${apiPassword}`);
      // A deliberately tiny (10 XAF) initialize call is Payunit's own
      // lightest real endpoint to confirm credentials - there is no
      // dedicated "ping"/balance endpoint on their API.
      const res = await fetch('https://app.payunit.net/api/gateway/initialize', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'content-type': 'application/json', Authorization: `Basic ${authData}` },
        body: JSON.stringify({ total_amount: '10', currency: 'XAF', transaction_id: `test_${crypto.randomUUID()}`, purchaseRef: 'connection_test', description: 'Test de connexion', name: 'Test', return_url: 'https://sellia.liafrik.com', notify_url: 'https://sellia.liafrik.com' }),
      });
      const body = await res.json();
      if (!res.ok || body.statusCode !== 200) return json({ ok: false, message: body.message || 'Identifiants Payunit invalides.' });
      return json({ ok: true, message: 'Connexion Payunit réussie.' });
    }

    return json({ ok: false, message: `Le test de connexion n'est pas disponible pour ${gateway}.` });
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : String(e) }, 500);
  }
});

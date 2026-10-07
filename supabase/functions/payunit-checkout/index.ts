import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real Payunit checkout for a merchant's own customers.

const PAYUNIT_INIT_BASE = 'https://app.payunit.net';
const PAYUNIT_STATUS_BASE = 'https://gateway.payunit.net';

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

// "Request mode not set. Transaction can not be processed" - confirmed via
// every real Payunit SDK (Ruby, Node, Dart) that every one of them sends a
// "mode" header ('live' or 'sandbox'/'test') alongside x-api-key/
// Authorization, which this integration never sent at all. Defaults to
// 'live' - this platform processes real production payments for real
// merchants, not a sandbox integration.
async function payunitHeaders(encKey: string, gw: { api_key_encrypted: string; client_id_encrypted: string; api_secret_encrypted: string }) {
  const apiKey = await decryptOne(encKey, gw.api_key_encrypted);
  const clientId = await decryptOne(encKey, gw.client_id_encrypted);
  const apiPassword = await decryptOne(encKey, gw.api_secret_encrypted);
  const authData = btoa(`${clientId}:${apiPassword}`);
  return { 'x-api-key': apiKey, 'content-type': 'application/json', Authorization: `Basic ${authData}`, mode: 'live' };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let payload: { action?: string; order_id?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: secretRow, error: secretError } = await admin.from('platform_secrets').select('value').eq('key', 'gateway_encryption_key').single();
    if (secretError || !secretRow) throw new Error('Encryption key unavailable');

    if (payload.action === 'initiate') {
      const { order_id } = payload;
      if (!order_id) return json({ error: 'order_id is required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status !== 'pending') return json({ error: 'This order has already been processed' }, 409);

      const { data: gw, error: gwError } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'payunit').eq('is_active', true).maybeSingle();
      if (gwError || !gw || !gw.api_key_encrypted || !gw.client_id_encrypted || !gw.api_secret_encrypted) return json({ error: "Payunit n'est pas connecté pour cette boutique" }, 422);

      const headers = await payunitHeaders(secretRow.value, gw);
      const { data: tenant } = await admin.from('tenants').select('slug, name').eq('id', order.tenant_id).maybeSingle();
      const origin = req.headers.get('origin') || 'https://sellia.liafrik.com';
      const returnUrl = `${origin}/store/${tenant?.slug}?payunit_return=1&order=${order.id}`;

      const res = await fetch(`${PAYUNIT_INIT_BASE}/api/gateway/initialize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          notify_url: returnUrl,
          total_amount: String((order.total_cents / 100).toFixed(2)),
          return_url: returnUrl,
          purchaseRef: order.id,
          description: `Commande chez ${tenant?.name || 'la boutique'}`,
          name: order.customer_name || 'Client',
          currency: order.currency || 'XAF',
          transaction_id: order.id,
        }),
      });
      const body = await res.json();
      if (!res.ok || body.statusCode !== 200) {
        return json({ error: body.message || 'Payunit a refusé la demande de paiement' }, 502);
      }
      await admin.from('orders').update({ payment_gateway: 'payunit' }).eq('id', order.id);
      return json({ transaction_url: body.data.transaction_url });
    }

    if (payload.action === 'verify') {
      const { order_id } = payload;
      if (!order_id) return json({ error: 'order_id is required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status === 'paid') return json({ status: 'paid', already: true });

      const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'payunit').maybeSingle();
      if (!gw?.api_key_encrypted || !gw.client_id_encrypted || !gw.api_secret_encrypted) return json({ error: "Payunit n'est pas connecté pour cette boutique" }, 422);
      const headers = await payunitHeaders(secretRow.value, gw);

      const res = await fetch(`${PAYUNIT_STATUS_BASE}/api/gateway/paymentstatus/${encodeURIComponent(order.id)}`, { headers });
      const body = await res.json();
      const status = body?.data?.transaction_status;
      const ok = res.ok && status === 'SUCCESS';
      if (!ok) return json({ status: 'failed', detail: status || 'unknown' });

      await admin.from('orders').update({ status: 'paid', payment_reference: order.id, payment_gateway: 'payunit' }).eq('id', order.id);
      return json({ status: 'paid' });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

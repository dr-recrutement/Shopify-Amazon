import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real CinetPay checkout - a real aggregator covering Mobile Money across
// CEMAC/UEMOA (Orange Money, MTN MoMo, Moov, Wave and more) through one
// API, confirmed against CinetPay's own official documentation (init
// response shape { code, data: { payment_token, payment_url } }, check
// endpoint { code, data: { status } }) rather than assumed. Hosted-page
// redirect flow, same shape as Payunit here - CinetPay has no inline
// widget for a server-side integration like this one.
//
// Field mapping matches Payments.jsx's real CinetPay config: api_key ->
// apikey, client_id -> site_id. CinetPay's real init/check payloads only
// ever use apikey+site_id (confirmed in their docs) - the api_secret
// field Payments.jsx also collects for this provider isn't part of
// CinetPay's actual request, so it's read but unused here (harmless,
// not a blocking mismatch).

const CINETPAY_BASE = 'https://api-checkout.cinetpay.com/v2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

function errMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return e instanceof Error ? e.message : String(e);
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

      const { data: gw, error: gwError } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'cinetpay').eq('is_active', true).maybeSingle();
      if (gwError || !gw || !gw.api_key_encrypted || !gw.client_id_encrypted) return json({ error: "CinetPay n'est pas connecté pour cette boutique" }, 422);

      const apikey = await decryptOne(secretRow.value, gw.api_key_encrypted);
      const siteId = await decryptOne(secretRow.value, gw.client_id_encrypted);
      const { data: tenant } = await admin.from('tenants').select('slug, name').eq('id', order.tenant_id).maybeSingle();
      const origin = req.headers.get('origin') || 'https://sellia.liafrik.com';
      const returnUrl = `${origin}/store/${tenant?.slug}?cinetpay_return=1&order=${order.id}`;

      // CinetPay requires the amount to be a multiple of 5 (their own
      // documented constraint) - rounds up so the merchant is never
      // shortchanged by a rounding-down.
      const rawAmount = Math.round(order.total_cents / 100);
      const amount = Math.ceil(rawAmount / 5) * 5;

      const res = await fetch(`${CINETPAY_BASE}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey, site_id: siteId,
          transaction_id: order.id,
          amount,
          currency: order.currency || 'XOF',
          description: `Commande chez ${tenant?.name || 'la boutique'}`,
          customer_name: order.customer_name || 'Client',
          customer_email: order.customer_email,
          customer_phone_number: order.customer_phone || '000000000',
          notify_url: returnUrl,
          return_url: returnUrl,
          channels: 'ALL',
        }),
      });
      const body = await res.json();
      if (!res.ok || body.code !== '201' || !body.data?.payment_url) {
        return json({ error: body.message || body.description || 'CinetPay a refusé la demande de paiement' }, 502);
      }
      await admin.from('orders').update({ payment_gateway: 'cinetpay' }).eq('id', order.id);
      return json({ transaction_url: body.data.payment_url });
    }

    if (payload.action === 'verify') {
      const { order_id } = payload;
      if (!order_id) return json({ error: 'order_id is required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status === 'paid') return json({ status: 'paid', already: true });

      const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'cinetpay').maybeSingle();
      if (!gw?.api_key_encrypted || !gw.client_id_encrypted) return json({ error: "CinetPay n'est pas connecté pour cette boutique" }, 422);
      const apikey = await decryptOne(secretRow.value, gw.api_key_encrypted);
      const siteId = await decryptOne(secretRow.value, gw.client_id_encrypted);

      const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey, site_id: siteId, transaction_id: order.id }),
      });
      const body = await res.json();
      const status = body?.data?.status;
      const ok = res.ok && body.code === '00' && status === 'ACCEPTED';
      if (!ok) return json({ status: 'failed', detail: status || body.message || 'unknown' });

      await admin.from('orders').update({ status: 'paid', payment_reference: order.id, payment_gateway: 'cinetpay' }).eq('id', order.id);
      return json({ status: 'paid' });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: errMessage(e) }, 500);
  }
});

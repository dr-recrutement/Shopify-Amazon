import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real PayPal checkout - PayPal's own Orders v2 API (create + capture),
// rendered inline via PayPal's JS SDK buttons, no redirect. Same rule as
// every other gateway here: the client-side approval callback is never
// trusted alone - only a server-side capture call against PayPal's own
// API, re-verified against the real order amount, can mark an order paid.
//
// Field mapping matches Payments.jsx's own PayPal config exactly
// (fields: ['api_secret', 'api_key'], labelled Client Secret / Client ID
// there) - api_key_encrypted holds the Client ID, api_secret_encrypted
// holds the Client Secret. Checked against the real UI before writing
// this, not assumed from the field names alone.

const PAYPAL_BASE = 'https://api-m.paypal.com'; // Live - PayPal's sandbox base differs and is out of scope for a production merchant flow.

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function decryptOne(keyHex: string, stored: string): Promise<string> {
  const [ivHex, ctHex] = stored.split(':');
  const toBytes = (hex: string) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', toBytes(keyHex), 'AES-GCM', false, ['decrypt']);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBytes(ivHex) }, key, toBytes(ctHex));
  return new TextDecoder().decode(plainBuf);
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error_description || 'Impossible de s’authentifier auprès de PayPal');
  return body.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let payload: { action?: string; order_id?: string; paypal_order_id?: string };
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

    if (payload.action === 'get_client_id') {
      const { order_id } = payload;
      if (!order_id) return json({ error: 'order_id is required' }, 400);
      const { data: order } = await admin.from('orders').select('tenant_id').eq('id', order_id).maybeSingle();
      if (!order) return json({ error: 'Order not found' }, 404);
      const { data: gw } = await admin.from('vendor_payment_gateways').select('api_key_encrypted').eq('tenant_id', order.tenant_id).eq('gateway', 'paypal').eq('is_active', true).maybeSingle();
      if (!gw?.api_key_encrypted) return json({ error: 'PayPal is not connected for this store' }, 422);
      return json({ client_id: await decryptOne(secretRow.value, gw.api_key_encrypted) });
    }

    if (payload.action === 'create_order') {
      const { order_id } = payload;
      if (!order_id) return json({ error: 'order_id is required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status !== 'pending') return json({ error: 'This order has already been processed' }, 409);

      const { data: gw, error: gwError } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'paypal').eq('is_active', true).maybeSingle();
      if (gwError || !gw || !gw.api_key_encrypted || !gw.api_secret_encrypted) return json({ error: 'PayPal is not connected for this store' }, 422);

      const clientId = await decryptOne(secretRow.value, gw.api_key_encrypted);
      const clientSecret = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const accessToken = await getAccessToken(clientId, clientSecret);

      const currency = (order.currency || 'USD').toUpperCase();
      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{ reference_id: order.id, amount: { currency_code: currency, value: (order.total_cents / 100).toFixed(2) } }],
        }),
      });
      const body = await res.json();
      if (!res.ok) return json({ error: body.message || 'PayPal a refusé la demande de paiement' }, 502);

      await admin.from('orders').update({ payment_gateway: 'paypal', payment_reference: body.id }).eq('id', order.id);
      return json({ paypal_order_id: body.id });
    }

    if (payload.action === 'capture') {
      const { order_id, paypal_order_id } = payload;
      if (!order_id || !paypal_order_id) return json({ error: 'order_id and paypal_order_id are required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status === 'paid') return json({ status: 'paid', already: true });

      const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'paypal').maybeSingle();
      if (!gw?.api_key_encrypted || !gw.api_secret_encrypted) return json({ error: 'PayPal is not connected for this store' }, 422);
      const clientId = await decryptOne(secretRow.value, gw.api_key_encrypted);
      const clientSecret = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const accessToken = await getAccessToken(clientId, clientSecret);

      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypal_order_id}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      const body = await res.json();
      const capture = body?.purchase_units?.[0]?.payments?.captures?.[0];
      const currency = (order.currency || 'USD').toUpperCase();
      const ok = res.ok && body.status === 'COMPLETED' && capture?.status === 'COMPLETED'
        && body.purchase_units?.[0]?.reference_id === order.id
        && Math.round(Number(capture.amount?.value) * 100) === order.total_cents
        && capture.amount?.currency_code === currency;
      if (!ok) {
        return json({ status: 'failed', detail: body.message || capture?.status || 'verification_failed' });
      }
      await admin.from('orders').update({ status: 'paid', payment_reference: capture.id, payment_gateway: 'paypal' }).eq('id', order.id);
      return json({ status: 'paid' });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real Mercado Pago checkout (Latin America) - Checkout Pro via the
// official Preferences API, confirmed against Mercado Pago's own official
// docs (POST /checkout/preferences -> {id, init_point}; GET
// /v1/payments/search?external_reference=... to verify). Hosted-page
// redirect flow, same shape as Payunit/CinetPay here.

const MP_BASE = 'https://api.mercadopago.com';

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

      const { data: gw, error: gwError } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'mercadopago').eq('is_active', true).maybeSingle();
      if (gwError || !gw || !gw.api_secret_encrypted) return json({ error: "Mercado Pago n'est pas connecté pour cette boutique" }, 422);

      const accessToken = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const { data: tenant } = await admin.from('tenants').select('slug, name').eq('id', order.tenant_id).maybeSingle();
      const origin = req.headers.get('origin') || 'https://sellia.liafrik.com';
      const returnUrl = `${origin}/store/${tenant?.slug}?mercadopago_return=1&order=${order.id}`;

      const res = await fetch(`${MP_BASE}/checkout/preferences`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            title: `Commande chez ${tenant?.name || 'la boutique'}`,
            quantity: 1,
            unit_price: Number((order.total_cents / 100).toFixed(2)),
            currency_id: (order.currency || 'BRL').toUpperCase(),
          }],
          payer: { name: order.customer_name || 'Client', email: order.customer_email },
          external_reference: order.id,
          back_urls: { success: returnUrl, failure: returnUrl, pending: returnUrl },
          auto_return: 'approved',
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.init_point) {
        return json({ error: body.message || 'Mercado Pago a refusé la demande de paiement' }, 502);
      }
      await admin.from('orders').update({ payment_gateway: 'mercadopago' }).eq('id', order.id);
      return json({ transaction_url: body.init_point });
    }

    if (payload.action === 'verify') {
      const { order_id } = payload;
      if (!order_id) return json({ error: 'order_id is required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status === 'paid') return json({ status: 'paid', already: true });

      const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'mercadopago').maybeSingle();
      if (!gw?.api_secret_encrypted) return json({ error: "Mercado Pago n'est pas connecté pour cette boutique" }, 422);
      const accessToken = await decryptOne(secretRow.value, gw.api_secret_encrypted);

      const res = await fetch(`${MP_BASE}/v1/payments/search?external_reference=${encodeURIComponent(order.id)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await res.json();
      const payment = (body?.results || []).find((p: { status?: string }) => p.status === 'approved') || body?.results?.[0];
      const ok = res.ok && payment?.status === 'approved'
        && Number(payment.transaction_amount) === Number((order.total_cents / 100).toFixed(2))
        && String(payment.currency_id || '').toUpperCase() === (order.currency || 'BRL').toUpperCase();
      if (!ok) return json({ status: 'failed', detail: payment?.status || 'unknown' });

      await admin.from('orders').update({ status: 'paid', payment_reference: String(payment.id), payment_gateway: 'mercadopago' }).eq('id', order.id);
      return json({ status: 'paid' });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: errMessage(e) }, 500);
  }
});

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real Yoco (South Africa) checkout - hosted Checkout API
// (https://payments.yoco.com/api), Bearer secret-key auth. Create-checkout
// (POST /checkouts -> {id, redirectUrl}) is confirmed against Yoco's own
// official docs and the community PHP SDK alike. The verify step
// (GET /checkouts/{id}) is NOT on Yoco's official docs page directly - it
// is modeled/inferred from Yoco's PHP SDK exposing a full checkouts
// resource and a third-party API profile - flagged here rather than
// silently treated as equally certain, so a real failure here is checked
// against Yoco's own dashboard before assuming this integration itself is
// wrong.

const YOCO_BASE = 'https://payments.yoco.com/api';

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

      const { data: gw, error: gwError } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'yoco').eq('is_active', true).maybeSingle();
      if (gwError || !gw || !gw.api_secret_encrypted) return json({ error: "Yoco n'est pas connecté pour cette boutique" }, 422);

      const secretKey = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const { data: tenant } = await admin.from('tenants').select('slug, name').eq('id', order.tenant_id).maybeSingle();
      const origin = req.headers.get('origin') || 'https://sellia.liafrik.com';
      const returnUrl = `${origin}/store/${tenant?.slug}?yoco_return=1&order=${order.id}`;

      const res = await fetch(`${YOCO_BASE}/checkouts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total_cents,
          currency: (order.currency || 'ZAR').toUpperCase(),
          successUrl: returnUrl,
          cancelUrl: returnUrl,
          failureUrl: returnUrl,
          metadata: { order_id: order.id },
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.redirectUrl) {
        return json({ error: body.message || body.displayMessage || 'Yoco a refusé la demande de paiement' }, 502);
      }
      await admin.from('orders').update({ payment_gateway: 'yoco', payment_reference: body.id }).eq('id', order.id);
      return json({ transaction_url: body.redirectUrl });
    }

    if (payload.action === 'verify') {
      const { order_id } = payload;
      if (!order_id) return json({ error: 'order_id is required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status === 'paid') return json({ status: 'paid', already: true });
      if (!order.payment_reference) return json({ status: 'failed', detail: 'no_checkout_id' });

      const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'yoco').maybeSingle();
      if (!gw?.api_secret_encrypted) return json({ error: "Yoco n'est pas connecté pour cette boutique" }, 422);
      const secretKey = await decryptOne(secretRow.value, gw.api_secret_encrypted);

      const res = await fetch(`${YOCO_BASE}/checkouts/${encodeURIComponent(order.payment_reference)}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      const body = await res.json();
      const status = body?.status;
      const ok = res.ok && (status === 'completed' || status === 'succeeded')
        && Number(body.amount) === order.total_cents
        && String(body.currency || '').toUpperCase() === (order.currency || 'ZAR').toUpperCase();
      if (!ok) return json({ status: 'failed', detail: status || 'unknown' });

      await admin.from('orders').update({ status: 'paid', payment_gateway: 'yoco' }).eq('id', order.id);
      return json({ status: 'paid' });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: errMessage(e) }, 500);
  }
});

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real Stripe checkout via PaymentIntents + Stripe Elements - inline by
// design (Stripe's own model), never a redirect. 'create_intent' hands the
// client the publishable key (meant to be public) and a client_secret
// scoped to this one PaymentIntent; the secret key never leaves the
// server. 'verify' re-fetches the PaymentIntent from Stripe's own API
// (never trusts the client-side confirmCardPayment result alone) before
// marking the order paid. 'get_public_key' lets the client mount the Card
// Element before an order exists (Stripe Elements needs no client_secret
// to render, only to confirm) - just the tenant_id, no secret involved.

const STRIPE_BASE = 'https://api.stripe.com/v1';

const ZERO_DECIMAL_CURRENCIES = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf']);

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

function stripeAmount(totalCents: number, currency: string) {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase()) ? Math.round(totalCents / 100) : totalCents;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let payload: { action?: string; order_id?: string; payment_intent_id?: string; tenant_id?: string };
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

    if (payload.action === 'get_public_key') {
      const { tenant_id } = payload;
      if (!tenant_id) return json({ error: 'tenant_id is required' }, 400);
      const { data: gw } = await admin.from('vendor_payment_gateways').select('api_key_encrypted').eq('tenant_id', tenant_id).eq('gateway', 'stripe').eq('is_active', true).maybeSingle();
      if (!gw?.api_key_encrypted) return json({ error: 'Stripe is not connected for this store' }, 422);
      return json({ publishable_key: await decryptOne(secretRow.value, gw.api_key_encrypted) });
    }

    if (payload.action === 'create_intent') {
      const { order_id } = payload;
      if (!order_id) return json({ error: 'order_id is required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status !== 'pending') return json({ error: 'This order has already been processed' }, 409);

      const { data: gw, error: gwError } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'stripe').eq('is_active', true).maybeSingle();
      if (gwError || !gw || !gw.api_secret_encrypted || !gw.api_key_encrypted) return json({ error: 'Stripe is not connected for this store' }, 422);

      const secretKey = await decryptOne(secretRow.value, gw.api_secret_encrypted);
      const currency = (order.currency || 'usd').toLowerCase();

      const form = new URLSearchParams({
        amount: String(stripeAmount(order.total_cents, currency)),
        currency,
        'automatic_payment_methods[enabled]': 'true',
        'metadata[order_id]': order.id,
      });
      if (order.customer_email) form.set('receipt_email', order.customer_email);

      const res = await fetch(`${STRIPE_BASE}/payment_intents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const body = await res.json();
      if (!res.ok) return json({ error: body.error?.message || 'Stripe rejected the payment request' }, 502);

      await admin.from('orders').update({ payment_gateway: 'stripe', payment_reference: body.id }).eq('id', order.id);
      return json({ client_secret: body.client_secret, payment_intent_id: body.id });
    }

    if (payload.action === 'verify') {
      const { order_id, payment_intent_id } = payload;
      if (!order_id || !payment_intent_id) return json({ error: 'order_id and payment_intent_id are required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status === 'paid') return json({ status: 'paid', already: true });

      const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'stripe').maybeSingle();
      if (!gw?.api_secret_encrypted) return json({ error: 'Stripe is not connected for this store' }, 422);
      const secretKey = await decryptOne(secretRow.value, gw.api_secret_encrypted);

      const res = await fetch(`${STRIPE_BASE}/payment_intents/${payment_intent_id}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      const pi = await res.json();
      const currency = (order.currency || 'usd').toLowerCase();
      const ok = res.ok && pi.status === 'succeeded'
        && pi.metadata?.order_id === order.id
        && Number(pi.amount) === stripeAmount(order.total_cents, currency)
        && pi.currency === currency;
      if (!ok) {
        return json({ status: 'failed', detail: pi.status || pi.error?.message || 'verification_failed' });
      }
      await admin.from('orders').update({ status: 'paid', payment_reference: payment_intent_id, payment_gateway: 'stripe' }).eq('id', order.id);
      return json({ status: 'paid' });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

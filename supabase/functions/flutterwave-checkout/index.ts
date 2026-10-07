import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real Flutterwave INLINE checkout - a popup modal on the same page, no
// redirect away. 'initiate' hands the client only what it needs to open
// the popup (the public key - meant to be public, and the order's own
// data) - the secret key never leaves the server. 'verify' is the same
// authoritative check as before: only Flutterwave's own /verify response
// can mark an order paid, never the popup's client-side callback alone
// (that data is client-controlled and could be spoofed).

const FLW_BASE = 'https://api.flutterwave.com/v3';

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

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let payload: { action?: string; order_id?: string; transaction_id?: string; tx_ref?: string };
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

      const { data: gw, error: gwError } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'flutterwave').eq('is_active', true).maybeSingle();
      if (gwError || !gw || !gw.api_key_encrypted) return json({ error: 'Flutterwave is not connected for this store' }, 422);

      const publicKey = await decryptOne(secretRow.value, gw.api_key_encrypted);
      await admin.from('orders').update({ payment_gateway: 'flutterwave' }).eq('id', order.id);

      // Everything FlutterwaveCheckout({...}) needs client-side - no secret.
      return json({
        public_key: publicKey,
        tx_ref: order.id,
        amount: Number((order.total_cents / 100).toFixed(2)),
        currency: order.currency || 'USD',
        customer: { email: order.customer_email, name: order.customer_name, phonenumber: order.customer_phone },
      });
    }

    if (payload.action === 'verify') {
      const { transaction_id, tx_ref } = payload;
      if (!transaction_id || !tx_ref) return json({ error: 'transaction_id and tx_ref are required' }, 400);

      const { data: order, error: orderError } = await admin.from('orders').select('*').eq('id', tx_ref).maybeSingle();
      if (orderError || !order) return json({ error: 'Order not found' }, 404);
      if (order.status === 'paid') return json({ status: 'paid', already: true });

      const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', 'flutterwave').maybeSingle();
      if (!gw?.api_secret_encrypted) return json({ error: 'Flutterwave is not connected for this store' }, 422);
      const secretKey = await decryptOne(secretRow.value, gw.api_secret_encrypted);

      const res = await fetch(`${FLW_BASE}/transactions/${transaction_id}/verify`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      const body = await res.json();
      const tx = body?.data;
      const ok = res.ok && body.status === 'success' && tx?.status === 'successful'
        && tx.tx_ref === order.id
        && Number(tx.amount) >= Number(order.total_cents) / 100 - 0.01
        && tx.currency === (order.currency || 'USD');
      if (!ok) {
        return json({ status: 'failed', detail: tx?.status || body.message || 'verification_failed' });
      }
      await admin.from('orders').update({ status: 'paid', payment_reference: String(transaction_id), payment_gateway: 'flutterwave' }).eq('id', order.id);
      return json({ status: 'paid' });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

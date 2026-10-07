import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real PSP refunds for merchant orders paid through Stripe, Flutterwave,
// Paystack or PayPal. Caller must be the store owner or an admin team
// member. Money moves first via the PSP's own refund API using the
// merchant's own decrypted credentials; the order is only credited
// (refunded_cents) when the PSP accepts. A compare-and-set on
// refunded_cents prevents double refunds from concurrent clicks.
// Input: { order_id, amount_cents? }  (default: full remaining amount)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });

const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf']);

async function decryptOne(keyHex: string, stored: string): Promise<string> {
  const [ivHex, ctHex] = stored.split(':');
  const toBytes = (hex: string) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', toBytes(keyHex), 'AES-GCM', false, ['decrypt']);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBytes(ivHex) }, key, toBytes(ctHex)));
}

const SUPPORTED = ['stripe', 'flutterwave', 'paystack', 'paypal'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: u, error: ue } = await asCaller.auth.getUser();
  if (ue || !u?.user) return json({ error: 'Unauthorized' }, 401);
  const user = u.user;

  let payload: { order_id?: string; amount_cents?: number };
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!payload.order_id) return json({ error: 'order_id is required' }, 400);

  const { data: order } = await admin.from('orders').select('*').eq('id', payload.order_id).maybeSingle();
  if (!order) return json({ error: 'Order not found' }, 404);

  const { data: tenant } = await admin.from('tenants').select('id, owner_id').eq('id', order.tenant_id).maybeSingle();
  let allowed = tenant?.owner_id === user.id;
  if (!allowed && user.email) {
    const { data: tm } = await admin.from('team_members').select('id').eq('tenant_id', order.tenant_id).ilike('email', user.email).eq('role', 'admin').neq('status', 'removed').maybeSingle();
    allowed = !!tm;
  }
  if (!allowed) return json({ error: "You don't have access to this store" }, 403);

  if (!SUPPORTED.includes(order.payment_gateway) || !order.payment_reference) return json({ error: 'Cette commande n\'a pas été payée via un PSP remboursable automatiquement.' }, 422);
  if (['pending', 'cancelled'].includes(order.status)) return json({ error: 'Seule une commande payée peut être remboursée.' }, 409);

  const already = Number(order.refunded_cents || 0);
  const remaining = Number(order.total_cents) - already;
  const amount = Math.round(Number(payload.amount_cents ?? remaining));
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'Montant invalide' }, 400);
  if (amount > remaining) return json({ error: `Montant supérieur au reste remboursable (${remaining / 100})` }, 400);

  // Compare-and-set claim: only one concurrent request can win this.
  const { data: claimed } = await admin.from('orders').update({ refunded_cents: already + amount }).eq('id', order.id).eq('refunded_cents', already).select('id');
  if (!claimed || claimed.length === 0) return json({ error: 'Un remboursement est déjà en cours sur cette commande, réessayez.' }, 409);
  const revert = () => admin.from('orders').update({ refunded_cents: already }).eq('id', order.id);

  try {
    const { data: keyRow } = await admin.from('platform_secrets').select('value').eq('key', 'gateway_encryption_key').single();
    if (!keyRow) throw new Error('Encryption key unavailable');
    const { data: gw } = await admin.from('vendor_payment_gateways').select('*').eq('tenant_id', order.tenant_id).eq('gateway', order.payment_gateway).maybeSingle();
    if (!gw?.api_secret_encrypted) { await revert(); return json({ error: `${order.payment_gateway} n'est plus connecté pour cette boutique` }, 422); }
    const secretKey = await decryptOne(keyRow.value, gw.api_secret_encrypted);
    const currency = String(order.currency || 'usd');
    let ref = '';
    let failure: string | null = null;

    if (order.payment_gateway === 'stripe') {
      const major = ZERO_DECIMAL.has(currency.toLowerCase()) ? Math.round(amount / 100) : amount;
      const res = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `refund_${order.id}_${already}_${amount}` },
        body: new URLSearchParams({ payment_intent: order.payment_reference, amount: String(major), 'metadata[order_id]': order.id }).toString(),
      });
      const b = await res.json();
      if (!res.ok || !['succeeded', 'pending'].includes(b.status)) failure = b.error?.message || `Stripe: ${b.status || res.status}`; else ref = b.id;
    } else if (order.payment_gateway === 'flutterwave') {
      const res = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(order.payment_reference)}/refund`, {
        method: 'POST', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number((amount / 100).toFixed(2)) }),
      });
      const b = await res.json();
      if (!res.ok || b.status !== 'success') failure = b.message || `Flutterwave: ${res.status}`; else ref = String(b.data?.id ?? '');
    } else if (order.payment_gateway === 'paystack') {
      const res = await fetch('https://api.paystack.co/refund', {
        method: 'POST', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: order.payment_reference, amount }),
      });
      const b = await res.json();
      if (!res.ok || !b.status) failure = b.message || `Paystack: ${res.status}`; else ref = String(b.data?.id ?? '');
    } else {
      // PayPal: api_key_encrypted = Client ID, api_secret_encrypted = secret.
      const clientId = await decryptOne(keyRow.value, gw.api_key_encrypted);
      const tokRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        method: 'POST', headers: { Authorization: `Basic ${btoa(`${clientId}:${secretKey}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials',
      });
      const tok = await tokRes.json();
      if (!tokRes.ok) failure = tok.error_description || 'PayPal auth failed';
      else {
        const res = await fetch(`https://api-m.paypal.com/v2/payments/captures/${encodeURIComponent(order.payment_reference)}/refund`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': `refund_${order.id}_${already}_${amount}` },
          body: JSON.stringify({ amount: { value: (amount / 100).toFixed(2), currency_code: currency.toUpperCase() } }),
        });
        const b = await res.json();
        if (!res.ok || !['COMPLETED', 'PENDING'].includes(b.status)) failure = b.message || `PayPal: ${b.status || res.status}`; else ref = b.id;
      }
    }

    if (failure) { await revert(); return json({ error: failure }, 502); }

    const full = already + amount >= Number(order.total_cents);
    // Money already moved: never revert past this point, even if this bookkeeping write fails.
    try { await admin.from('orders').update({ refunded_at: new Date().toISOString(), refund_reference: ref || null }).eq('id', order.id); } catch { /* ignore */ }
    return json({ ok: true, refund_reference: ref, refunded_cents: already + amount, full });
  } catch (e) {
    await revert();
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

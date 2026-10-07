import { createClient } from 'jsr:@supabase/supabase-js@2';

// Sellia's own platform billing (merchant subscriptions + domain purchases).
//
// SECURITY MODEL - the client is never trusted for money:
//   * `start` creates a row in platform_payments (the ledger) with the amount
//     computed HERE (plan price table / live Cloudflare price), a server-made
//     reference, and the owning user/tenant.
//   * `verify` re-asks the PSP about that exact reference, checks status AND
//     amount/currency against the ledger, flips initiated->paid atomically
//     (so one payment can be applied once), and for subscriptions applies the
//     plan to the tenant itself with the service role.
//   * Domains are registered by cloudflare-domains only against a `paid`
//     ledger row (consumed atomically).
// Merchants can no longer write plan/status/subscription columns directly
// (DB trigger protect_tenant_billing_columns).

const CF_BASE = 'https://api.cloudflare.com/client/v4';
const PLATFORM_MARKUP = 0.10;
const PLAN_PRICES_USD: Record<string, number> = { starter: 7, growth: 19, pro: 39, enterprise: 129 };
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

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>;
    return String(o.message || o.error_description || o.error || JSON.stringify(o));
  }
  return String(e);
}

type Admin = ReturnType<typeof createClient>;

async function secret(admin: Admin, key: string): Promise<string | null> {
  const { data } = await admin.from('platform_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}

const PROVIDER_KEYS: Record<string, string[]> = {
  stripe: ['platform_stripe_secret_key', 'platform_stripe_publishable_key'],
  flutterwave: ['platform_flutterwave_secret_key', 'platform_flutterwave_public_key'],
  paystack: ['platform_paystack_secret_key', 'platform_paystack_public_key'],
  payunit: ['payunit_api_key', 'payunit_api_username', 'payunit_api_password'],
  korapay: ['platform_korapay_secret_key', 'platform_korapay_public_key'],
  paddle: ['platform_paddle_api_key', 'platform_paddle_client_token'],
};

const near = (paid: number, expected: number) => paid + 0.009 >= expected;

async function cfCheckDomain(admin: Admin, name: string) {
  const accountId = await secret(admin, 'cloudflare_account_id');
  const token = await secret(admin, 'cloudflare_api_token');
  if (!accountId || !token) throw new Error('Cloudflare is not configured');
  const res = await fetch(`${CF_BASE}/accounts/${accountId}/registrar/domain-check`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains: [name] }),
  });
  const body = await res.json();
  if (!res.ok || body.success === false) throw new Error(body.errors?.map((e: { message: string }) => e.message).join('; ') || `Cloudflare error (${res.status})`);
  const d = (body.result?.domains || [])[0];
  if (!d?.registrable) throw new Error(`Domain is not registrable (${d?.reason || 'unavailable'})`);
  const cost = Number(d.pricing.registration_cost);
  return { price: Number((cost * (1 + PLATFORM_MARKUP)).toFixed(2)), currency: String(d.pricing.currency || 'USD').toUpperCase() };
}

async function applySubscription(admin: Admin, row: Record<string, unknown>) {
  const { data: t } = await admin.from('tenants').select('id, status, subscription_ends_at').eq('id', row.tenant_id).single();
  const now = Date.now();
  const currentEnd = t?.subscription_ends_at ? new Date(t.subscription_ends_at).getTime() : 0;
  // Renewing early extends from the current end rather than losing paid days.
  const base = t?.status === 'active' && currentEnd > now ? currentEnd : now;
  const ends = new Date(base + 30 * 86400000).toISOString();
  const { error } = await admin.from('tenants').update({
    plan: row.plan, status: 'active', billing_cycle: 'monthly', subscription_ends_at: ends,
    suspended_at: null, suspended_reason: null,
  }).eq('id', row.tenant_id);
  if (error) throw error;
  return ends;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const { action } = payload;

  if (action === 'availability') {
    const result: Record<string, boolean> = {};
    for (const [provider, keys] of Object.entries(PROVIDER_KEYS)) {
      const values = await Promise.all(keys.map((k) => secret(admin, k)));
      result[provider] = values.every((v) => !!v);
    }
    return json({ available: result });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);
  const user = userData.user;

  try {
    // ---------------------------------------------------------------- start
    if (action === 'start') {
      const { purpose, tenant_id, provider } = payload;
      if (!['subscription', 'domain'].includes(purpose)) return json({ error: 'Invalid purpose' }, 400);
      if (!provider || !PROVIDER_KEYS[provider]) return json({ error: `Unknown provider: ${provider}` }, 400);
      if (!tenant_id) return json({ error: 'tenant_id is required' }, 400);

      const { data: tenant } = await admin.from('tenants').select('id, owner_id, name').eq('id', tenant_id).maybeSingle();
      if (!tenant) return json({ error: 'Store not found' }, 404);
      let allowed = tenant.owner_id === user.id;
      if (!allowed && user.email) {
        const { data: tm } = await admin.from('team_members').select('id').eq('tenant_id', tenant_id).ilike('email', user.email).eq('role', 'admin').neq('status', 'removed').maybeSingle();
        allowed = !!tm;
      }
      if (!allowed) return json({ error: "You don't have access to this store" }, 403);

      let amount: number; let currency = 'USD'; let plan: string | null = null; let domainName: string | null = null;
      if (purpose === 'subscription') {
        plan = String(payload.plan || '');
        if (!(plan in PLAN_PRICES_USD)) return json({ error: 'Unknown plan' }, 400);
        amount = PLAN_PRICES_USD[plan];
      } else {
        domainName = String(payload.domain_name || '').trim().toLowerCase();
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domainName)) return json({ error: 'Invalid domain name' }, 400);
        const q = await cfCheckDomain(admin, domainName);
        amount = q.price; currency = q.currency;
      }

      for (const k of PROVIDER_KEYS[provider]) if (!(await secret(admin, k))) return json({ error: `${provider} is not configured` }, 502);

      const reference = `${purpose === 'domain' ? 'dom' : 'sub'}_${crypto.randomUUID().replace(/-/g, '')}`;
      const name = String(payload.name || tenant.name || 'Marchand Sellia').slice(0, 120);
      const email = String(payload.email || user.email || '').slice(0, 200);
      const origin = req.headers.get('origin') || 'https://sellia.liafrik.com';
      const email_ = email || user.email || 'billing@sellia.liafrik.com';

      const ledger = { tenant_id, user_id: user.id, purpose, plan, domain_name: domainName, provider, reference, amount, currency, status: 'initiated' as const };
      const insertLedger = async (extra: Record<string, unknown> = {}) => {
        const { error } = await admin.from('platform_payments').insert({ ...ledger, ...extra });
        if (error) throw error;
      };

      if (provider === 'stripe') {
        const sk = (await secret(admin, 'platform_stripe_secret_key'))!;
        const pk = (await secret(admin, 'platform_stripe_publishable_key'))!;
        const params = new URLSearchParams({
          amount: String(Math.round(amount * 100)), currency: currency.toLowerCase(),
          'automatic_payment_methods[enabled]': 'true',
          'metadata[reference]': reference, 'metadata[purpose]': purpose,
        });
        const res = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST', headers: { Authorization: `Bearer ${sk}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString(),
        });
        const body = await res.json();
        if (!res.ok) return json({ error: body.error?.message || 'Stripe error' }, 502);
        await insertLedger({ provider_reference: body.id });
        return json({ reference, amount, currency, mode: 'stripe', client_secret: body.client_secret, publishable_key: pk });
      }
      if (provider === 'flutterwave') {
        await insertLedger();
        return json({ reference, amount, currency, mode: 'inline', public_key: await secret(admin, 'platform_flutterwave_public_key'), tx_ref: reference, customer: { email: email_, name } });
      }
      if (provider === 'paystack') {
        await insertLedger();
        return json({ reference, amount, currency, mode: 'inline', public_key: await secret(admin, 'platform_paystack_public_key'), paystack_amount: Math.round(amount * 100), email: email_ });
      }
      if (provider === 'korapay') {
        await insertLedger();
        return json({ reference, amount, currency, mode: 'inline', public_key: await secret(admin, 'platform_korapay_public_key'), customer: { email: email_, name }, notification_url: origin });
      }
      if (provider === 'paddle') {
        if (purpose === 'domain') return json({ error: 'Paddle ne peut pas facturer un achat de domaine (prix variable). Choisissez un autre moyen de paiement.' }, 400);
        const priceId = await secret(admin, `platform_paddle_price_${plan}`);
        if (!priceId) return json({ error: `Aucun prix Paddle configuré pour le plan ${plan} (clé platform_paddle_price_${plan}).` }, 502);
        await insertLedger();
        return json({ reference, amount, currency, mode: 'overlay', client_token: await secret(admin, 'platform_paddle_client_token'), price_id: priceId });
      }
      if (provider === 'payunit') {
        const apiKey = (await secret(admin, 'payunit_api_key'))!;
        const user_ = (await secret(admin, 'payunit_api_username'))!;
        const pass = (await secret(admin, 'payunit_api_password'))!;
        const mode = (await secret(admin, 'payunit_mode')) || 'live';
        const headers = { 'x-api-key': apiKey, 'content-type': 'application/json', Authorization: `Basic ${btoa(`${user_}:${pass}`)}`, mode };
        const page = purpose === 'domain' ? 'domains' : 'billing';
        const returnUrl = `${origin}/${page}?platform_return=1&ref=${reference}`;
        const res = await fetch(`${PAYUNIT_INIT_BASE}/api/gateway/initialize`, {
          method: 'POST', headers,
          body: JSON.stringify({
            notify_url: returnUrl, return_url: returnUrl, total_amount: String(amount), currency,
            purchaseRef: domainName || plan, transaction_id: reference, name,
            description: purpose === 'domain' ? `Achat du domaine ${domainName} via Sellia` : `Abonnement Sellia ${plan}`,
          }),
        });
        const body = await res.json();
        if (!res.ok || body.statusCode !== 200) return json({ error: body.message || 'Payunit a refusé la demande de paiement' }, 502);
        await insertLedger();
        return json({ reference, amount, currency, mode: 'redirect', transaction_url: body.data.transaction_url });
      }
      return json({ error: 'Unsupported provider' }, 400);
    }

    // --------------------------------------------------------------- verify
    if (action === 'verify') {
      const reference = String(payload.reference || '');
      if (!reference) return json({ error: 'reference is required' }, 400);
      const { data: row } = await admin.from('platform_payments').select('*').eq('reference', reference).maybeSingle();
      if (!row || row.user_id !== user.id) return json({ error: 'Unknown payment reference' }, 404);

      const finish = async (ends?: string) => json({ paid: true, purpose: row.purpose, plan: row.plan, domain_name: row.domain_name, subscription_ends_at: ends });

      if (row.status === 'consumed') return finish();
      if (row.status === 'paid') {
        if (row.purpose === 'subscription') {
          const { data: won } = await admin.from('platform_payments').update({ status: 'consumed', consumed_at: new Date().toISOString() }).eq('id', row.id).eq('status', 'paid').select('id');
          if (won?.length) { const ends = await applySubscription(admin, row); return finish(ends); }
          return finish();
        }
        return finish();
      }

      const provider: string = row.provider;
      const expected = Number(row.amount);
      let paid = false; let rawStatus = 'unknown'; let reason = '';

      if (provider === 'flutterwave') {
        const sk = await secret(admin, 'platform_flutterwave_secret_key');
        const res = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${sk}` } });
        const b = await res.json();
        rawStatus = b.data?.status || 'unknown';
        paid = b.status === 'success' && rawStatus === 'successful';
        if (paid && (!near(Number(b.data?.amount), expected) || String(b.data?.currency).toUpperCase() !== row.currency)) { paid = false; reason = 'amount_mismatch'; }
      } else if (provider === 'paystack') {
        const sk = await secret(admin, 'platform_paystack_secret_key');
        const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${sk}` } });
        const b = await res.json();
        rawStatus = b.data?.status || 'unknown';
        paid = b.status === true && rawStatus === 'success';
        if (paid && (!near(Number(b.data?.amount) / 100, expected) || String(b.data?.currency).toUpperCase() !== row.currency)) { paid = false; reason = 'amount_mismatch'; }
      } else if (provider === 'korapay') {
        const sk = await secret(admin, 'platform_korapay_secret_key');
        const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${sk}` } });
        const b = await res.json();
        rawStatus = b.data?.status || 'unknown';
        paid = b.status === true && rawStatus === 'success';
        if (paid && (!near(Number(b.data?.amount), expected) || String(b.data?.currency).toUpperCase() !== row.currency)) { paid = false; reason = 'amount_mismatch'; }
      } else if (provider === 'stripe') {
        const sk = await secret(admin, 'platform_stripe_secret_key');
        const res = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(row.provider_reference)}`, { headers: { Authorization: `Bearer ${sk}` } });
        const b = await res.json();
        rawStatus = b.status || 'unknown';
        paid = rawStatus === 'succeeded' && b.metadata?.reference === reference;
        if (paid && (b.amount_received !== Math.round(expected * 100) || String(b.currency).toUpperCase() !== row.currency)) { paid = false; reason = 'amount_mismatch'; }
      } else if (provider === 'payunit') {
        const apiKey = await secret(admin, 'payunit_api_key');
        const user_ = await secret(admin, 'payunit_api_username');
        const pass = await secret(admin, 'payunit_api_password');
        const mode = (await secret(admin, 'payunit_mode')) || 'live';
        const headers = { 'x-api-key': apiKey!, 'content-type': 'application/json', Authorization: `Basic ${btoa(`${user_}:${pass}`)}`, mode };
        const res = await fetch(`${PAYUNIT_STATUS_BASE}/api/gateway/paymentstatus/${encodeURIComponent(reference)}`, { headers });
        const b = await res.json();
        rawStatus = b?.data?.transaction_status || 'unknown';
        paid = res.ok && rawStatus === 'SUCCESS';
        // Amount is fixed server-side at initialize time on Payunit's hosted page.
      } else if (provider === 'paddle') {
        const txn = String(payload.provider_txn_id || '');
        if (!txn) return json({ error: 'provider_txn_id is required for Paddle' }, 400);
        const apiKey = await secret(admin, 'platform_paddle_api_key');
        const res = await fetch(`https://api.paddle.com/transactions/${encodeURIComponent(txn)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
        const b = await res.json();
        rawStatus = b.data?.status || 'unknown';
        paid = rawStatus === 'completed' && b.data?.custom_data?.reference === reference;
        const total = Number(b.data?.details?.totals?.grand_total ?? b.data?.details?.totals?.total) / 100;
        if (paid && (!near(total, expected))) { paid = false; reason = 'amount_mismatch'; }
      }

      if (!paid) return json({ paid: false, raw_status: rawStatus, reason });

      // initiated -> paid is atomic: only one concurrent verify wins.
      const { data: won } = await admin.from('platform_payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', row.id).eq('status', 'initiated').select('id');
      if (!won?.length) return finish(); // someone else already finalized it
      await admin.from('platform_audit_log').insert({
        admin_id: user.id, admin_email: user.email || '', action: `platform_payment_${row.purpose}_paid`,
        target_type: 'tenant', target_id: row.tenant_id, new_value: { reference, provider, amount: expected, currency: row.currency, plan: row.plan, domain: row.domain_name },
      });
      if (row.purpose === 'subscription') {
        await admin.from('platform_payments').update({ status: 'consumed', consumed_at: new Date().toISOString() }).eq('id', row.id);
        const ends = await applySubscription(admin, row);
        return finish(ends);
      }
      return finish();
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: errMessage(e) }, 500);
  }
});

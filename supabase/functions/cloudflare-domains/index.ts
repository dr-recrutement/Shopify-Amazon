import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real Cloudflare Registrar integration (beta API). The Cloudflare token lives
// only in public.platform_secrets (service-role only). Actions: 'search',
// 'check' (live price), 'register' (REAL MONEY billed to Sellia's Cloudflare
// account). `register` is only possible against a PAID ledger row in
// platform_payments created/verified by platform-billing: the row must belong
// to this user + store + domain, and is consumed atomically so one payment
// buys exactly one domain.

const CF_BASE = 'https://api.cloudflare.com/client/v4';
const PLATFORM_MARKUP = 0.10;

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

async function getSecret(admin: ReturnType<typeof createClient>, key: string): Promise<string> {
  const { data, error } = await admin.from('platform_secrets').select('value').eq('key', key).single();
  if (error || !data) throw new Error(`Missing platform secret: ${key}`);
  return data.value;
}

async function cf(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${CF_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await res.json();
  if (!res.ok || body.success === false) {
    const msg = body.errors?.map((e: { message: string }) => e.message).join('; ') || `Cloudflare API error (${res.status})`;
    throw new Error(msg);
  }
  return body.result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let payload: { action?: string; query?: string; domain_name?: string; tenant_id?: string; reference?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const { action } = payload;

  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const admin = createClient(supabaseUrl, serviceKey);
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);
  const user = userData.user;

  try {
    const accountId = await getSecret(admin, 'cloudflare_account_id');
    const token = await getSecret(admin, 'cloudflare_api_token');

    if (action === 'search') {
      const q = (payload.query || '').trim();
      if (!q) return json({ error: 'query is required' }, 400);
      const result = await cf(`/accounts/${accountId}/registrar/domain-search?q=${encodeURIComponent(q)}&limit=8`, token);
      const domains = (result.domains || []).map((d: { name: string; registrable: boolean; pricing?: { currency: string; registration_cost: string } }) => ({
        name: d.name,
        registrable: d.registrable,
        currency: d.pricing?.currency,
        cloudflare_cost: d.pricing ? Number(d.pricing.registration_cost) : null,
        price: d.pricing ? Number((Number(d.pricing.registration_cost) * (1 + PLATFORM_MARKUP)).toFixed(2)) : null,
      }));
      return json({ domains });
    }

    if (action === 'check') {
      const name = (payload.domain_name || '').trim().toLowerCase();
      if (!name) return json({ error: 'domain_name is required' }, 400);
      const result = await cf(`/accounts/${accountId}/registrar/domain-check`, token, {
        method: 'POST',
        body: JSON.stringify({ domains: [name] }),
      });
      const d = (result.domains || [])[0];
      if (!d) return json({ error: 'No result from Cloudflare' }, 502);
      if (!d.registrable) return json({ name, registrable: false, reason: d.reason || 'domain_unavailable' });
      const cost = Number(d.pricing.registration_cost);
      const price = Number((cost * (1 + PLATFORM_MARKUP)).toFixed(2));
      return json({ name, registrable: true, currency: d.pricing.currency, cloudflare_cost: cost, platform_fee: Number((price - cost).toFixed(2)), price });
    }

    if (action === 'register') {
      const name = (payload.domain_name || '').trim().toLowerCase();
      const tenantId = payload.tenant_id;
      const reference = payload.reference;
      if (!name || !tenantId || !reference) return json({ error: 'domain_name, tenant_id and reference are required' }, 400);

      const { data: tenant, error: tenantError } = await asCaller.from('tenants').select('id').eq('id', tenantId).maybeSingle();
      if (tenantError || !tenant) return json({ error: "You don't have access to this store" }, 403);

      const { data: pay } = await admin.from('platform_payments').select('*').eq('reference', reference).maybeSingle();
      if (!pay || pay.user_id !== user.id || pay.purpose !== 'domain' || pay.tenant_id !== tenantId || pay.domain_name !== name) {
        return json({ error: 'Aucun paiement correspondant à ce domaine.' }, 403);
      }
      if (pay.status !== 'paid') return json({ error: pay.status === 'consumed' ? 'Ce paiement a déjà été utilisé.' : 'Paiement non confirmé.' }, 402);

      // Consume atomically BEFORE touching Cloudflare: one payment, one purchase.
      const { data: won } = await admin.from('platform_payments').update({ status: 'consumed', consumed_at: new Date().toISOString() }).eq('id', pay.id).eq('status', 'paid').select('id');
      if (!won?.length) return json({ error: 'Ce paiement a déjà été utilisé.' }, 409);
      const release = async () => { await admin.from('platform_payments').update({ status: 'paid', consumed_at: null }).eq('id', pay.id); };

      let registered = false;
      try {
        const checkResult = await cf(`/accounts/${accountId}/registrar/domain-check`, token, { method: 'POST', body: JSON.stringify({ domains: [name] }) });
        const d = (checkResult.domains || [])[0];
        if (!d?.registrable) { await release(); return json({ error: `Domain is not registrable (${d?.reason || 'unknown reason'})` }, 422); }
        const cost = Number(d.pricing.registration_cost);
        const priceNow = cost * (1 + PLATFORM_MARKUP);
        // Never register for more than the merchant actually paid (small rounding tolerance).
        if (priceNow > Number(pay.amount) + 0.5) { await release(); return json({ error: 'Le prix du domaine a changé depuis votre paiement. Contactez le support pour un remboursement ou un ajustement.' }, 409); }
        const priceCents = Math.round(Number(pay.amount) * 100);
        const feeCents = priceCents - Math.round(cost * 100);

        const reg = await cf(`/accounts/${accountId}/registrar/registrations`, token, { method: 'POST', body: JSON.stringify({ domain_name: name }) });
        if (reg.state === 'failed' || reg.state === 'blocked') {
          await release();
          const errMsg = reg.error?.message || reg.context?.error?.message || 'Cloudflare a refusé l’enregistrement.';
          return json({ error: `L'enregistrement du domaine a échoué côté Cloudflare : ${errMsg}. Votre paiement est conservé (vous pouvez réessayer ou demander un remboursement au support).` }, 502);
        }
        registered = true;

        const { data: row, error: insertError } = await admin.from('domains').insert({
          tenant_id: tenantId, domain_name: name, type: 'buy',
          dns_status: reg.state === 'succeeded' ? 'verified' : reg.state === 'action_required' ? 'action_required' : 'pending',
          ssl_status: 'pending', cloudflare_domain_id: name,
          price_cents: priceCents, platform_fee_cents: feeCents, currency: d.pricing.currency,
          last_error: reg.state === 'action_required' ? (reg.error?.message || 'Action requise sur le compte Cloudflare de Sellia.') : null,
        }).select().single();
        if (insertError) throw insertError;
        return json({ domain: row, registration_state: reg.state });
      } catch (e) {
        if (!registered) await release();
        throw e;
      }
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: errMessage(e) }, 500);
  }
});

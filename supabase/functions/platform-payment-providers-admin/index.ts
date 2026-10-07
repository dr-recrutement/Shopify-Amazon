import { createClient } from 'jsr:@supabase/supabase-js@2';

// Super Admin only: write/inspect/test Sellia's OWN platform credentials
// (platform_secrets: RLS on, no policies, service role only). Secret values
// are never returned to the browser - only "is set" flags.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
function errMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') return (e as { message: string }).message;
  return e instanceof Error ? e.message : String(e);
}

const PLANS = ['starter', 'growth', 'pro', 'enterprise'];
const PROVIDER_KEYS: Record<string, string[]> = {
  stripe: ['platform_stripe_secret_key', 'platform_stripe_publishable_key'],
  flutterwave: ['platform_flutterwave_secret_key', 'platform_flutterwave_public_key'],
  paystack: ['platform_paystack_secret_key', 'platform_paystack_public_key'],
  payunit: ['payunit_api_key', 'payunit_api_username', 'payunit_api_password', 'payunit_mode'],
  korapay: ['platform_korapay_secret_key', 'platform_korapay_public_key'],
  paddle: ['platform_paddle_api_key', 'platform_paddle_client_token', ...PLANS.map((p) => `platform_paddle_price_${p}`)],
  cloudflare: ['cloudflare_account_id', 'cloudflare_api_token'],
  ai: ['platform_gemini_api_key'],
};
const ALL_KEYS = Object.values(PROVIDER_KEYS).flat();

type Admin = ReturnType<typeof createClient>;
async function secret(admin: Admin, key: string): Promise<string | null> {
  const { data } = await admin.from('platform_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}

async function probe(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  let body: any = null; // deno-lint-ignore no-explicit-any
  try { body = await res.json(); } catch { /* not json */ }
  return { res, body };
}

async function testProvider(admin: Admin, provider: string): Promise<{ ok: boolean; message: string }> {
  const missing: string[] = [];
  const need = async (k: string) => { const v = await secret(admin, k); if (!v) missing.push(k); return v || ''; };
  switch (provider) {
    case 'stripe': {
      const sk = await need('platform_stripe_secret_key'); await need('platform_stripe_publishable_key');
      if (missing.length) break;
      const { res, body } = await probe('https://api.stripe.com/v1/balance', { headers: { Authorization: `Bearer ${sk}` } });
      return res.ok ? { ok: true, message: `Stripe OK (${body?.livemode ? 'live' : 'test'})` } : { ok: false, message: body?.error?.message || `Stripe a refusé la clé (${res.status})` };
    }
    case 'flutterwave': {
      const sk = await need('platform_flutterwave_secret_key'); await need('platform_flutterwave_public_key');
      if (missing.length) break;
      const { res, body } = await probe('https://api.flutterwave.com/v3/balances', { headers: { Authorization: `Bearer ${sk}` } });
      return res.ok && body?.status === 'success' ? { ok: true, message: 'Flutterwave OK' } : { ok: false, message: body?.message || `Flutterwave a refusé la clé (${res.status})` };
    }
    case 'paystack': {
      const sk = await need('platform_paystack_secret_key'); await need('platform_paystack_public_key');
      if (missing.length) break;
      const { res, body } = await probe('https://api.paystack.co/balance', { headers: { Authorization: `Bearer ${sk}` } });
      return res.ok && body?.status ? { ok: true, message: 'Paystack OK' } : { ok: false, message: body?.message || `Paystack a refusé la clé (${res.status})` };
    }
    case 'korapay': {
      const sk = await need('platform_korapay_secret_key'); await need('platform_korapay_public_key');
      if (missing.length) break;
      const { res, body } = await probe('https://api.korapay.com/merchant/api/v1/balances', { headers: { Authorization: `Bearer ${sk}` } });
      return res.ok && body?.status ? { ok: true, message: 'Korapay OK' } : { ok: false, message: body?.message || `Korapay a refusé la clé (${res.status})` };
    }
    case 'paddle': {
      const key = await need('platform_paddle_api_key'); await need('platform_paddle_client_token');
      if (missing.length) break;
      const base = key.includes('_sdbx_') ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';
      const { res, body } = await probe(`${base}/currencies?per_page=1`, { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) return { ok: false, message: body?.error?.detail || `Paddle a refusé la clé (${res.status})` };
      const noPrice = [];
      for (const p of PLANS) if (!(await secret(admin, `platform_paddle_price_${p}`))) noPrice.push(p);
      return { ok: true, message: `Paddle OK (${base.includes('sandbox') ? 'sandbox' : 'live'})` + (noPrice.length ? ` — IDs de prix manquants pour : ${noPrice.join(', ')} (ces plans ne pourront pas être payés via Paddle ; les domaines ne sont pas supportés par Paddle)` : '') };
    }
    case 'payunit': {
      const apiKey = await need('payunit_api_key'); const user = await need('payunit_api_username'); const pass = await need('payunit_api_password');
      if (missing.length) break;
      const mode = (await secret(admin, 'payunit_mode')) || 'live';
      const { res, body } = await probe('https://app.payunit.net/api/gateway/initialize', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'content-type': 'application/json', Authorization: `Basic ${btoa(`${user}:${pass}`)}`, mode },
        body: JSON.stringify({ notify_url: 'https://sellia.liafrik.com/billing', return_url: 'https://sellia.liafrik.com/billing', total_amount: '100', currency: 'XAF', purchaseRef: 'connection-test', transaction_id: `test_${crypto.randomUUID().replace(/-/g, '')}`, name: 'Sellia connection test', description: 'Test de connexion (aucun débit)' }),
      });
      return res.ok && body?.statusCode === 200 ? { ok: true, message: `Payunit OK (${mode}) — une transaction de test non payée a été créée, sans débit` } : { ok: false, message: body?.message || `Payunit a refusé les identifiants (${res.status})` };
    }
    case 'cloudflare': {
      const id = await need('cloudflare_account_id'); const tok = await need('cloudflare_api_token');
      if (missing.length) break;
      const { res, body } = await probe('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: { Authorization: `Bearer ${tok}` } });
      if (!(res.ok && body?.success)) return { ok: false, message: body?.errors?.[0]?.message || `Cloudflare a refusé le token (${res.status})` };
      const r2 = await probe(`https://api.cloudflare.com/client/v4/accounts/${id}/registrar/domain-check`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ domains: ['example.com'] }) });
      return r2.res.ok && r2.body?.success !== false ? { ok: true, message: 'Cloudflare OK (token valide, accès Registrar confirmé)' } : { ok: false, message: `Token valide mais accès Registrar refusé : ${r2.body?.errors?.[0]?.message || r2.res.status}` };
    }
    case 'ai': {
      const key = await need('platform_gemini_api_key');
      if (missing.length) break;
      const { res, body } = await probe(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(key)}`, {});
      return res.ok ? { ok: true, message: 'Clé Gemini OK' } : { ok: false, message: body?.error?.message || `Gemini a refusé la clé (${res.status})` };
    }
    default:
      return { ok: false, message: 'Fournisseur inconnu' };
  }
  return { ok: false, message: `Clés manquantes : ${missing.join(', ')}` };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const asCaller = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);
  const { data: isAdmin } = await admin.rpc('is_super_admin', { check_user_id: userData.user.id });
  if (!isAdmin) return json({ error: 'Super Admin access required' }, 403);

  let payload: { action?: string; provider?: string; values?: Record<string, string> };
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

  const audit = (action: string, target: string, value: unknown) => admin.from('platform_audit_log').insert({
    admin_id: userData.user.id, admin_email: userData.user.email || '', action, target_type: 'platform_secrets', target_id: target, new_value: value,
  });

  try {
    if (payload.action === 'list') {
      const { data: rows } = await admin.from('platform_secrets').select('key').in('key', ALL_KEYS);
      const setKeys = new Set((rows || []).map((r: { key: string }) => r.key));
      const status: Record<string, Record<string, boolean>> = {};
      for (const [provider, keys] of Object.entries(PROVIDER_KEYS)) status[provider] = Object.fromEntries(keys.map((k) => [k, setKeys.has(k)]));
      return json({ status });
    }

    if (payload.action === 'set') {
      const { provider, values } = payload;
      if (!provider || !PROVIDER_KEYS[provider]) return json({ error: `Unknown provider: ${provider}` }, 400);
      if (!values || typeof values !== 'object') return json({ error: 'values is required' }, 400);
      const allowed = new Set(PROVIDER_KEYS[provider]);
      const rows = Object.entries(values)
        .filter(([k, v]) => allowed.has(k) && typeof v === 'string' && v.trim() !== '')
        .map(([key, value]) => ({ key, value: (value as string).trim(), updated_at: new Date().toISOString() }));
      if (rows.length === 0) return json({ error: 'No valid values provided for this provider' }, 400);
      if (provider === 'payunit') {
        const m = rows.find((r) => r.key === 'payunit_mode');
        if (m && !['live', 'sandbox'].includes(m.value)) return json({ error: "payunit_mode doit valoir 'live' ou 'sandbox'" }, 400);
      }
      const { error } = await admin.from('platform_secrets').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      await audit('platform_payment_provider_updated', provider, { keys_set: rows.map((r) => r.key) });
      return json({ ok: true });
    }

    if (payload.action === 'test') {
      const { provider } = payload;
      if (!provider || !PROVIDER_KEYS[provider]) return json({ error: `Unknown provider: ${provider}` }, 400);
      const result = await testProvider(admin, provider);
      await audit('platform_payment_provider_tested', provider, { ok: result.ok });
      return json(result);
    }

    if (payload.action === 'remove') {
      const { provider } = payload;
      if (!provider || !PROVIDER_KEYS[provider]) return json({ error: `Unknown provider: ${provider}` }, 400);
      const { error } = await admin.from('platform_secrets').delete().in('key', PROVIDER_KEYS[provider]);
      if (error) throw error;
      await audit('platform_payment_provider_removed', provider, {});
      return json({ ok: true });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: errMessage(e) }, 500);
  }
});

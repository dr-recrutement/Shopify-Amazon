import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real Cloudflare Registrar transfer-out: unlocking a domain so it can be
// moved to another registrar. Confirmed against Cloudflare's own current
// API docs: PATCH /accounts/{account_id}/registrar/domains/{domain_name}
// with { locked: boolean }. The actual auth/EPP code itself has no
// confirmed API endpoint in Cloudflare's current docs - it's a dashboard
// action (Cloudflare Registrar > domain > Transfer out) for a good reason
// (it's effectively a password that lets anyone move the domain away) -
// this only handles the unlock/status/lock actions and tells the merchant
// plainly where to get the code, rather than guessing an endpoint for
// something this sensitive.

const CF_BASE = 'https://api.cloudflare.com/client/v4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
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

  let payload: { action?: string; domain_name?: string; tenant_id?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  const { action, domain_name, tenant_id } = payload;
  if (!domain_name || !tenant_id) return json({ error: 'domain_name and tenant_id are required' }, 400);

  // Ownership check under the caller's own RLS - this endpoint can unlock
  // a real domain (a real security-relevant action), so it must only ever
  // work for the tenant that actually owns it.
  const { data: domainRow, error: domainError } = await asCaller.from('domains')
    .select('id').eq('tenant_id', tenant_id).eq('domain_name', domain_name).eq('type', 'buy').maybeSingle();
  if (domainError || !domainRow) return json({ error: "You don't have access to this domain" }, 403);

  try {
    const accountId = await getSecret(admin, 'cloudflare_account_id');
    const token = await getSecret(admin, 'cloudflare_api_token');

    if (action === 'get_status') {
      const result = await cf(`/accounts/${accountId}/registrar/domains/${domain_name}`, token);
      return json({ locked: result.locked, expires_at: result.expires_at, current_registrar: result.current_registrar });
    }

    if (action === 'set_lock') {
      const locked = payload.locked !== false;
      const result = await cf(`/accounts/${accountId}/registrar/domains/${domain_name}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ locked }),
      });
      await admin.from('platform_audit_log').insert({
        admin_id: userData.user.id, admin_email: userData.user.email || '',
        action: locked ? 'domain_relocked' : 'domain_unlocked_for_transfer',
        target_type: 'domain', target_id: domain_name, new_value: { locked },
      });
      return json({ locked: result.locked });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

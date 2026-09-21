import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

const TABLE = 'sellia_settings';
const CF_KEYS = ['cf_api_token', 'cf_account_id', 'cf_zone_id'];

async function supabase(base44: any) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
  const projRes = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
  const projects = await projRes.json();
  const ref = projects[0]?.ref;
  if (!ref) throw new Error('Aucune base de données connectée');
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const keys = await keysRes.json();
  const serviceKey = (Array.isArray(keys) ? keys.find((k: any) => k.name === 'service_role') : null)?.api_key;
  if (!serviceKey) throw new Error('service_role key not found');
  const restBase = `https://${ref}.supabase.co/rest/v1`;
  const restH: Record<string, string> = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const mgmtH: Record<string, string> = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: mgmtH, body: JSON.stringify({ query: `CREATE TABLE IF NOT EXISTS ${TABLE} (key text primary key, value text, updated_at timestamptz default now());` }) });
  await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: mgmtH, body: JSON.stringify({ query: `NOTIFY pgrst, 'reload schema';` }) });
  await new Promise((r) => setTimeout(r, 2000));
  return { restBase, restH };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body: any = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action || (req.method === 'GET' ? 'status' : '');
    const { restBase, restH } = await supabase(base44);

    const getSettings = async () => {
      const res = await fetch(`${restBase}/${TABLE}?select=key,value`, { headers: restH });
      const rows = await res.json();
      const map: Record<string, string> = {};
      if (Array.isArray(rows)) for (const r of rows) if (CF_KEYS.includes(r.key)) map[r.key] = r.value || '';
      return map;
    };
    const saveSetting = async (key: string, value: string) => {
      await fetch(`${restBase}/${TABLE}?on_conflict=key`, { method: 'POST', headers: { ...restH, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }) });
    };

    if (action === 'saveKeys') {
      for (const k of CF_KEYS) if (body[k] !== undefined) await saveSetting(k, String(body[k] || ''));
      return Response.json({ ok: true });
    }

    const settings = await getSettings();
    const token = settings.cf_api_token || '';
    const accountId = settings.cf_account_id || '';
    const zoneId = settings.cf_zone_id || '';
    const configured = { api_token: !!token, account_id: !!accountId, zone_id: !!zoneId };

    if (action === 'status') {
      let valid = false;
      if (token) {
        try {
          const v = await (await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: { Authorization: `Bearer ${token}` } })).json();
          valid = !!v?.success;
        } catch { /* ignore */ }
      }
      return Response.json({ configured, token_valid: valid });
    }

    if (!token || !accountId || !zoneId) return Response.json({ error: "Cloudflare non configuré — renseignez vos clés dans l'onglet Paramètres Cloudflare.", configured }, { status: 400 });

    const cf = async (path: string, opts: any = {}) => {
      const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, { method: opts.method || 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, json: j };
    };

    if (action === 'createCustomHostname') {
      const hostname = String(body.hostname || '').trim().toLowerCase();
      if (!hostname) return Response.json({ error: 'hostname requis' }, { status: 400 });
      const find = await cf(`/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`);
      const existing = find.json?.result?.find((h: any) => h.hostname === hostname);
      if (existing) return Response.json({ hostname: existing });
      const cr = await cf(`/zones/${zoneId}/custom_hostnames`, { method: 'POST', body: { hostname, ssl: { method: 'http', type: 'dv', wildcard: false } } });
      if (!cr.ok) return Response.json({ error: (cr.json?.errors?.[0]?.message) || `CF ${cr.status}` }, { status: 400 });
      return Response.json({ hostname: cr.json.result });
    }

    if (action === 'getCustomHostname') {
      const id = String(body.id || '');
      if (!id) return Response.json({ error: 'id requis' }, { status: 400 });
      const r = await cf(`/zones/${zoneId}/custom_hostnames/${id}`);
      if (!r.ok) return Response.json({ error: `CF ${r.status}` }, { status: 400 });
      return Response.json({ hostname: r.json.result });
    }

    if (action === 'deleteCustomHostname') {
      const id = String(body.id || '');
      const r = await cf(`/zones/${zoneId}/custom_hostnames/${id}`, { method: 'DELETE' });
      return Response.json({ ok: r.ok, error: r.ok ? null : (r.json?.errors?.[0]?.message) });
    }

    if (action === 'createSubdomain') {
      const slug = String(body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      const target = String(body.target || 'afristore-builder-pro.base44.app');
      if (!slug) return Response.json({ error: 'slug requis' }, { status: 400 });
      const name = `${slug}.sellia.app`;
      const find = await cf(`/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}`);
      const existing = find.json?.result?.find((r: any) => r.name === name);
      if (existing) return Response.json({ record: existing, name });
      const cr = await cf(`/zones/${zoneId}/dns_records`, { method: 'POST', body: { type: 'CNAME', name, content: target, proxied: true } });
      if (!cr.ok) return Response.json({ error: (cr.json?.errors?.[0]?.message) || `CF ${cr.status}` }, { status: 400 });
      return Response.json({ record: cr.json.result, name });
    }

    if (action === 'registerDomain') {
      const name = String(body.name || '').trim().toLowerCase();
      const contact = body.contact || {};
      if (!name) return Response.json({ error: 'nom de domaine requis' }, { status: 400 });
      const payload = {
        name,
        years: 1,
        auto_renew: true,
        privacy: true,
        locked: true,
        registrant: {
          first_name: contact.first_name || 'Sellia',
          last_name: contact.last_name || 'Merchant',
          email: contact.email || user.email,
          phone: contact.phone || '+1.0000000000',
          address: contact.address || 'N/A',
          city: contact.city || 'N/A',
          state: contact.state || 'N/A',
          zip: contact.zip || '00000',
          country: contact.country || 'US',
        },
      };
      const r = await cf(`/accounts/${accountId}/registrar/domains`, { method: 'POST', body: payload });
      return Response.json({ ok: r.ok, result: r.json?.result, errors: r.json?.errors, raw_status: r.status });
    }

    return Response.json({ error: 'action inconnue' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
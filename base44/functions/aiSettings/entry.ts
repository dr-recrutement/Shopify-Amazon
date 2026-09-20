import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

const TABLE = 'sellia_ai_keys';
const PROVIDERS = ['gemini', 'claude', 'openai'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const projRes = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
    const projects = await projRes.json();
    const ref = projects[0]?.ref;
    if (!ref) return Response.json({ error: 'Aucune base de données connectée' }, { status: 400 });

    const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const keys = await keysRes.json();
    const serviceKey = (Array.isArray(keys) ? keys.find((k: any) => k.name === 'service_role') : null)?.api_key;
    if (!serviceKey) return Response.json({ error: 'service_role key not found' }, { status: 400 });

    const restBase = `https://${ref}.supabase.co/rest/v1`;
    const restH: Record<string, string> = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
    const mgmtH: Record<string, string> = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // ensure table exists, then refresh PostgREST schema cache so it is immediately queryable
    await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST', headers: mgmtH,
      body: JSON.stringify({ query: `CREATE TABLE IF NOT EXISTS ${TABLE} (provider text primary key, api_key text, is_active boolean default true, updated_at timestamptz default now());` }),
    });
    await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: mgmtH, body: JSON.stringify({ query: `NOTIFY pgrst, 'reload schema';` }) });
    await new Promise((r) => setTimeout(r, 2500));

    const body: any = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

    if (req.method === 'POST' && body.provider) {
      const provider = String(body.provider);
      if (!PROVIDERS.includes(provider)) return Response.json({ error: 'provider invalide' }, { status: 400 });
      const apiKey = String(body.api_key || '');
      const insRes = await fetch(`${restBase}/${TABLE}?on_conflict=provider`, {
        method: 'POST', headers: { ...restH, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ provider, api_key: apiKey, is_active: true, updated_at: new Date().toISOString() }),
      });
      return Response.json({ ok: true, provider, error: insRes.ok ? null : (await insRes.text()).slice(0, 200) });
    }

    // GET: expose only which providers are configured, never the keys
    const status: Record<string, boolean> = { gemini: false, claude: false, openai: false };
    try {
      const res = await fetch(`${restBase}/${TABLE}?select=provider,is_active`, { headers: restH });
      const rows = await res.json();
      if (Array.isArray(rows)) for (const r of rows) if (status[r.provider] !== undefined) status[r.provider] = !!r.is_active;
    } catch {}
    return Response.json({ status });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
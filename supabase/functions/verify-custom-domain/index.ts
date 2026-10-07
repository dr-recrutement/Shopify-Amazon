import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

async function dnsLookup(name: string, type: string) {
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
    headers: { Accept: 'application/dns-json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.Answer || []).map((a: { data: string }) => a.data.replace(/\.$/, ''));
}

const PLATFORM_DOMAIN = 'sellia.liafrik.com';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  let payload: { domain_id?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!payload.domain_id) return json({ error: 'domain_id is required' }, 400);

  const { data: domainRow, error: domainError } = await asCaller.from('domains').select('*').eq('id', payload.domain_id).maybeSingle();
  if (domainError || !domainRow) return json({ error: "Domain not found or you don't have access to it" }, 404);

  try {
    const [cnames, txts] = await Promise.all([
      dnsLookup(domainRow.domain_name, 'CNAME'),
      dnsLookup(domainRow.domain_name, 'A'),
    ]);
    const cnameOk = cnames.some((c: string) => c.toLowerCase() === PLATFORM_DOMAIN.toLowerCase());
    let apexOk = false;
    if (!cnameOk) {
      const platformIps = await dnsLookup(PLATFORM_DOMAIN, 'A');
      apexOk = txts.some((ip: string) => platformIps.includes(ip));
    }
    const verified = cnameOk || apexOk;

    await admin.from('domains').update({ dns_status: verified ? 'verified' : 'pending' }).eq('id', domainRow.id);

    return json({ verified, found: { cname: cnames, a: txts }, expected: PLATFORM_DOMAIN });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

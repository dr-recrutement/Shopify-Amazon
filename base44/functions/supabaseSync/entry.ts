import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

const ENTITIES = [
  'Store', 'Product', 'Order', 'Customer', 'Collection', 'Cart', 'Discount',
  'Payment', 'Article', 'Review', 'Message', 'Automation', 'ShippingZone', 'MediaFile',
];
const BUILTINS = ['id', 'created_date', 'updated_date', 'created_by_id'];
const BATCH = 500;

function inferType(val: any): string {
  if (val === null || val === undefined) return 'text';
  if (Array.isArray(val) || typeof val === 'object') return 'jsonb';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'numeric';
  return 'text';
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const srEntities = base44.asServiceRole.entities as any;
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    const projRes = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
    const projects = await projRes.json();
    if (!Array.isArray(projects) || !projects.length) return Response.json({ error: 'No Supabase projects found' }, { status: 400 });
    const ref = projects[0].ref;

    const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const keys = await keysRes.json();
    const serviceKey = (Array.isArray(keys) ? keys.find((k: any) => k.name === 'service_role') : null)?.api_key;
    if (!serviceKey) return Response.json({ error: 'service_role key not found' }, { status: 400 });

    const restBase = `https://${ref}.supabase.co/rest/v1`;
    const restHeaders: Record<string, string> = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
    const mgmtHeaders: Record<string, string> = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Phase 1: create tables (drop+replace) and collect rows
    const prepared: any[] = [];
    for (const name of ENTITIES) {
      const table = `sellia_${name.toLowerCase()}`;
      try {
        const records = await srEntities[name].list('-created_date', 100000);
        const rows = records || [];
        const colTypes: Record<string, string> = {};
        for (const r of rows) {
          for (const [k, v] of Object.entries(r)) {
            if (BUILTINS.includes(k)) continue;
            const t = inferType(v);
            if (!colTypes[k] || (colTypes[k] === 'text' && t !== 'text')) colTypes[k] = t;
          }
        }
        const cols = ['"id" text primary key', '"created_date" text', '"updated_date" text', '"created_by_id" text'];
        for (const [k, t] of Object.entries(colTypes)) cols.push(`"${k}" ${t}`);
        const ddl = `DROP TABLE IF EXISTS "${table}" CASCADE; CREATE TABLE "${table}" (${cols.join(', ')});`;
        const ddlRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: mgmtHeaders, body: JSON.stringify({ query: ddl }) });
        if (!ddlRes.ok) { prepared.push({ name, table, error: `DDL: ${await ddlRes.text()}` }); continue; }
        const dataKeys = Object.keys(colTypes);
        const insertRows = rows.map((r: any) => {
          const row: any = { id: r.id, created_date: r.created_date, updated_date: r.updated_date, created_by_id: r.created_by_id };
          for (const k of dataKeys) row[k] = r[k] !== undefined ? r[k] : null;
          return row;
        });
        prepared.push({ name, table, insertRows });
      } catch (e: any) {
        prepared.push({ name, error: e.message });
      }
    }

    // Phase 2: refresh PostgREST schema cache, then insert
    await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: mgmtHeaders, body: JSON.stringify({ query: `NOTIFY pgrst, 'reload schema';` }) });
    await sleep(3000);

    const report: any[] = [];
    for (const p of prepared) {
      if (p.error) { report.push({ entity: p.name, error: p.error }); continue; }
      const rows = p.insertRows || [];
      let inserted = 0;
      let failed = false;
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const insRes = await fetch(`${restBase}/${p.table}`, { method: 'POST', headers: { ...restHeaders, Prefer: 'return=representation' }, body: JSON.stringify(chunk) });
        if (!insRes.ok) { report.push({ entity: p.name, table: p.table, error: `INSERT: ${await insRes.text()}`, synced: inserted }); failed = true; break; }
        inserted += chunk.length;
      }
      if (!failed) report.push({ entity: p.name, table: p.table, synced: inserted });
    }

    const totalSynced = report.reduce((s, r) => s + (typeof r.synced === 'number' ? r.synced : 0), 0);
    return Response.json({ ok: true, project: ref, totalSynced, report });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
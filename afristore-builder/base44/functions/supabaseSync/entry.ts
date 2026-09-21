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
  if (typeof val === 'number') return Number.isInteger(val) ? 'bigint' : 'numeric';
  return 'text';
}

export default async function(req: Request): Promise<Response> {
  try {
    const body: any = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const prune = body?.prune === true;
    const gitOnly = body?.git_only === true;
    const only: string[] | null = Array.isArray(body?.entities) && body.entities.length ? body.entities : null;

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const srEntities = base44.asServiceRole.entities as any;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let ref: string | null = null;
    let restBase = '';
    let restHeaders: Record<string, string> = {};
    let mgmtHeaders: Record<string, string> = {};
    if (!gitOnly) {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
      const projRes = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
      const projects = await projRes.json();
      if (!Array.isArray(projects) || !projects.length) return Response.json({ error: 'Aucune base de données connectée' }, { status: 400 });
      ref = projects[0].ref;
      const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const keys = await keysRes.json();
      const serviceKey = (Array.isArray(keys) ? keys.find((k: any) => k.name === 'service_role') : null)?.api_key;
      if (!serviceKey) return Response.json({ error: 'service_role key not found' }, { status: 400 });
      restBase = `https://${ref}.supabase.co/rest/v1`;
      restHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
      mgmtHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    }
    const runSql = async (sql: string) => {
      if (gitOnly || !ref) return { ok: true } as any;
      return fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: mgmtHeaders, body: JSON.stringify({ query: sql }) });
    };

    const entities = only ? only : ENTITIES;
    const snapshot: any = {};
    const prepared: any[] = [];

    // ===== Phase 1: ensure schema (non-destructive) for all entities =====
    for (const name of entities) {
      const table = `sellia_${name.toLowerCase()}`;
      try {
        const records = await srEntities[name].list('-created_date', 100000);
        const rows = records || [];
        snapshot[name] = rows;

        const colTypes: Record<string, string> = {};
        for (const r of rows) {
          for (const [k, v] of Object.entries(r)) {
            if (BUILTINS.includes(k) || k === 'store_id') continue;
            const t = inferType(v);
            if (!colTypes[k] || (colTypes[k] === 'text' && t !== 'text')) colTypes[k] = t;
          }
        }

        const baseCols = ['"id" text primary key', '"created_date" text', '"updated_date" text', '"created_by_id" text', '"store_id" text'];
        const ddl: string[] = [
          `CREATE TABLE IF NOT EXISTS "${table}" (${baseCols.join(', ')});`,
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "store_id" text;`,
        ];
        for (const [k, t] of Object.entries(colTypes)) ddl.push(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${k}" ${t};`);
        ddl.push(`CREATE INDEX IF NOT EXISTS "${table}_store_id_idx" ON "${table}" (store_id);`);
        await runSql(ddl.join(' '));

        const dataKeys = Object.keys(colTypes);
        const insertRows = rows.map((r: any) => {
          const row: any = { id: r.id, created_date: r.created_date, updated_date: r.updated_date, created_by_id: r.created_by_id, store_id: r.store_id || null };
          for (const k of dataKeys) row[k] = r[k] !== undefined ? r[k] : null;
          return row;
        });
        prepared.push({ name, table, insertRows });
      } catch (e: any) {
        prepared.push({ name, error: e.message });
      }
    }

    // refresh PostgREST schema cache so newly added columns are visible
    if (!gitOnly) {
      await runSql(`NOTIFY pgrst, 'reload schema';`);
      await sleep(3000);
    }

    // ===== Phase 2: incremental upsert by id (+ optional prune) =====
    const report: any[] = [];
    if (gitOnly) {
      for (const p of prepared) report.push({ entity: p.name, table: p.table, skipped: 'git-only mode' });
    } else
    for (const p of prepared) {
      if (p.error) { report.push({ entity: p.name, error: p.error }); continue; }
      const rows = p.insertRows || [];
      let upserted = 0;
      let upsertError: string | null = null;
      for (let i = 0; i < rows.length; i += BATCH) {
        if (upsertError) break;
        const chunk = rows.slice(i, i + BATCH);
        const insRes = await fetch(`${restBase}/${p.table}?on_conflict=id`, {
          method: 'POST', headers: { ...restHeaders, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(chunk),
        });
        if (!insRes.ok) upsertError = `UPSERT: ${(await insRes.text()).slice(0, 300)}`;
        else upserted += chunk.length;
      }
      if (upsertError) { report.push({ entity: p.name, table: p.table, error: upsertError, synced: upserted }); continue; }

      let pruned = 0;
      if (prune) {
        const exRes = await fetch(`${restBase}/${p.table}?select=id`, { headers: restHeaders });
        const exRows = await exRes.json();
        const existing = new Set((exRows || []).map((x: any) => String(x.id)));
        const keep = new Set(rows.map((r: any) => String(r.id)).filter(Boolean));
        const toDelete = [...existing].filter((id) => !keep.has(id));
        for (let i = 0; i < toDelete.length; i += 100) {
          const chunk = toDelete.slice(i, i + 100);
          await fetch(`${restBase}/${p.table}?id=in.(${chunk.join(',')})`, { method: 'DELETE', headers: restHeaders });
          pruned += chunk.length;
        }
      }
      report.push({ entity: p.name, table: p.table, synced: upserted, ...(pruned ? { pruned } : {}) });
    }

    const totalSynced = report.reduce((s, r) => s + (typeof r.synced === 'number' ? r.synced : 0), 0);

    // ===== Phase 3: auto-push data snapshot to GitHub =====
    let githubBackup: any = null;
    try {
      const { accessToken: ghToken } = await base44.asServiceRole.connectors.getConnection('github');
      const ghHeaders: Record<string, string> = { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Sellia-Builder' };
      const jget = async (res: Response) => {
        const t = await res.text();
        let j: any = null; try { j = JSON.parse(t); } catch {}
        return { ok: res.ok, status: res.status, text: t, json: j };
      };
      const reposR = await jget(await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', { headers: ghHeaders }));
      if (!reposR.ok || !Array.isArray(reposR.json)) {
        githubBackup = { error: `repos list HTTP ${reposR.status}: ${reposR.text.slice(0, 200)}` };
      } else {
        const match = reposR.json.find((r: any) => /afristore|sellia|builder/i.test(r.name)) || reposR.json[0];
        const owner = match.owner?.login || match.full_name.split('/')[0];
        const repo = match.name;
        const branch = 'main';
        const path = 'sellia-backup.json';
        const content = btoa(unescape(encodeURIComponent(JSON.stringify({ generated_at: new Date().toISOString(), totalSynced, entities: snapshot }, null, 2))));
        let sha: string | undefined;
        const getR = await jget(await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, { headers: ghHeaders }));
        if (getR.ok && getR.json?.sha) sha = getR.json.sha;
        const putR = await jget(await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
          method: 'PUT', headers: { ...ghHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'chore: auto backup Sellia data snapshot', content, branch, ...(sha ? { sha } : {}) }),
        }));
        githubBackup = { repo: `${owner}/${repo}`, path, ok: putR.ok, commit: putR.json?.commit?.sha || null, error: putR.ok ? null : `HTTP ${putR.status}: ${putR.text.slice(0, 200)}` };
      }
    } catch (e: any) {
      githubBackup = { error: e.message };
    }

    return Response.json({ ok: true, project: ref, mode: gitOnly ? 'git-only' : (prune ? 'incremental+prune' : 'incremental'), totalSynced, report, githubBackup });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
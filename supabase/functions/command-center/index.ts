import { createClient } from 'jsr:@supabase/supabase-js@2';

// LIAFRIK Command Center integration - real server-to-server API.
// Auth model: a Command Center request presents `Authorization: Bearer
// <raw key>`. The raw key is NEVER stored - only sha256(key) is, compared
// on every request. Every request is audited. Every capability described
// here actually exists in this application (Sellia): tenants (merchant
// stores) is the real, meaningful platform-level entity a Super Admin
// manages - no invented modules.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const APP_INFO = {
  id: 'sellia-platform',
  name: 'Sellia',
  version: '1.1.0',
};

// Every module/action/scope described here is real and implemented below
// - nothing declared here is aspirational. Extending this list requires
// actually building the corresponding handler first.
const CAPABILITIES = [
  {
    module: 'tenants',
    actions: ['read', 'list', 'suspend', 'reactivate'],
    scopes: { read: 'read:tenants', list: 'read:tenants', suspend: 'write:tenants', reactivate: 'write:tenants' },
  },
  {
    module: 'analytics',
    actions: ['read'],
    scopes: { read: 'read:analytics' },
  },
];
const WEBHOOK_EVENTS = ['tenant.suspended', 'tenant.reactivated', 'order.created', 'order.paid'];
const RATE_LIMIT_PER_MINUTE = 60;
const ALL_SCOPES = ['read:tenants', 'write:tenants', 'read:analytics', 'execute:actions'];

async function auditLog(admin: ReturnType<typeof createClient>, entry: Record<string, unknown>) {
  try {
    await admin.from('command_center_audit_log').insert(entry);
  } catch (e) {
    console.error('Failed to write command center audit log:', e instanceof Error ? e.message : e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  // Path after the function name, e.g. /command-center/v1/health ->
  // "v1/health" - real path-based routing, not a body action param.
  const path = url.pathname.replace(/^\/(functions\/v1\/)?command-center\/?/, '');
  const requestId = crypto.randomUUID();
  const correlationId = req.headers.get('x-correlation-id') || requestId;
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // Health check needs no API key - a monitoring probe checking whether
  // the integration is even reachable shouldn't require credentials, and
  // it reveals no sensitive data (only aggregate status, matching the
  // exact shape requested).
  if (path === 'v1/health' || path === 'health') {
    const startedAt = Date.now();
    let dbStatus = 'unknown';
    try {
      const { error } = await admin.from('command_center_api_keys').select('id', { count: 'exact', head: true });
      dbStatus = error ? 'error' : 'connected';
    } catch {
      dbStatus = 'error';
    }
    const body = {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      environment: 'production',
      database: dbStatus,
      api: 'operational',
      version: APP_INFO.version,
      response_time_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
    await auditLog(admin, { request_id: requestId, correlation_id: correlationId, endpoint: path, method: req.method, result: 'success', http_status: 200, ip_address: ip });
    return json(body);
  }

  if (path === 'v1/openapi.json' || path === 'openapi.json') {
    const base = `${supabaseUrl}/functions/v1/command-center`;
    const err = { description: 'Error', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } } };
    const sec = [{ bearerAuth: [] }];
    const tenantParam = { name: 'tenant_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };
    return json({
      openapi: '3.0.3',
      info: { title: 'Sellia - LIAFRIK Command Center API', version: APP_INFO.version, description: `Server-to-server API. Authenticate with Authorization: Bearer <api key>. Rate limit: ${RATE_LIMIT_PER_MINUTE} requests/minute/key (429 + Retry-After). Webhooks are signed: header X-LIAFRIK-Signature = sha256=HMAC_SHA256(signing_secret, raw body); events (${WEBHOOK_EVENTS.join(', ')}) carry a unique id (X-LIAFRIK-Event-Id, stable across retries - dedupe on it) and a timestamp; failed deliveries are retried with backoff 1m, 5m, 30m, 2h, 12h (X-LIAFRIK-Attempt header).` },
      servers: [{ url: base }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
      paths: {
        '/v1/health': { get: { summary: 'Health check (no auth)', responses: { 200: { description: 'Status' } } } },
        '/v1/openapi.json': { get: { summary: 'This document (no auth)', responses: { 200: { description: 'OpenAPI 3 document' } } } },
        '/v1/capabilities': { get: { summary: 'Modules, actions and scopes', security: sec, responses: { 200: { description: 'Capabilities' }, 401: err, 429: err } } },
        '/v1/tenants': { get: { summary: 'List stores (scope read:tenants)', security: sec, parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'per_page', in: 'query', schema: { type: 'integer', maximum: 100 } }, { name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'Paginated tenants' }, 401: err, 403: err, 429: err } } },
        '/v1/tenants/{tenant_id}/suspend': { post: { summary: 'Suspend a store (scope write:tenants)', security: sec, parameters: [tenantParam], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } }, responses: { 200: { description: 'Suspended' }, 403: err, 429: err } } },
        '/v1/tenants/{tenant_id}/reactivate': { post: { summary: 'Reactivate a store (scope write:tenants)', security: sec, parameters: [tenantParam], responses: { 200: { description: 'Reactivated' }, 403: err, 429: err } } },
        '/v1/analytics': { get: { summary: 'Platform counters (scope read:analytics)', security: sec, responses: { 200: { description: 'Analytics' }, 403: err, 429: err } } },
      },
    });
  }

  // Every other endpoint requires a real, active, non-expired API key -
  // presented as Authorization: Bearer <raw key>. Never accepted as a
  // query param (would leak into logs/browser history at the transport
  // layer even over HTTPS).
  const authHeader = req.headers.get('Authorization') || '';
  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!rawKey) {
    await auditLog(admin, { request_id: requestId, correlation_id: correlationId, endpoint: path, method: req.method, result: 'denied', http_status: 401, ip_address: ip });
    return json({ error: 'Missing Authorization: Bearer <api key>' }, 401);
  }
  const keyHash = await sha256Hex(rawKey);
  const { data: apiKey } = await admin.from('command_center_api_keys').select('*').eq('key_hash', keyHash).eq('status', 'active').maybeSingle();
  if (!apiKey) {
    await auditLog(admin, { request_id: requestId, correlation_id: correlationId, endpoint: path, method: req.method, result: 'denied', http_status: 401, ip_address: ip });
    return json({ error: 'Invalid or revoked API key' }, 401);
  }
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, result: 'denied', http_status: 401, ip_address: ip });
    return json({ error: 'API key expired' }, 401);
  }
  // Rate limit per API key, counted from the audit log (every request is logged).
  const { count: recent } = await admin.from('command_center_audit_log').select('id', { count: 'exact', head: true }).eq('api_key_id', apiKey.id).gte('created_at', new Date(Date.now() - 60_000).toISOString());
  if ((recent || 0) >= RATE_LIMIT_PER_MINUTE) {
    await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, result: 'denied', http_status: 429, ip_address: ip });
    return new Response(JSON.stringify({ error: `Rate limit exceeded (${RATE_LIMIT_PER_MINUTE}/minute)` }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '30', ...CORS_HEADERS } });
  }
  // Best-effort - never blocks the actual request on a failed bookkeeping write.
  admin.from('command_center_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id).then(() => {});

  const requireScope = async (scope: string): Promise<boolean> => {
    const ok = (apiKey.scopes || []).includes(scope) || (apiKey.scopes || []).includes('execute:actions') && scope === 'execute:actions';
    if (!ok) {
      await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, scope_required: scope, result: 'denied', http_status: 403, ip_address: ip });
    }
    return ok;
  };

  try {
    if (path === 'v1/capabilities' || path === 'capabilities') {
      await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, result: 'success', http_status: 200, ip_address: ip });
      return json({
        application: { ...APP_INFO, environment: 'production' },
        api_version: 'v1',
        capabilities: CAPABILITIES,
        webhook_events: WEBHOOK_EVENTS,
        rate_limit_per_minute: RATE_LIMIT_PER_MINUTE,
        openapi: 'v1/openapi.json',
        granted_scopes: apiKey.scopes || [],
      });
    }

    if (path === 'v1/tenants' || path === 'tenants') {
      if (!(await requireScope('read:tenants'))) return json({ error: 'Missing scope: read:tenants' }, 403);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '25', 10)));
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      let q = admin.from('tenants').select('id, name, slug, plan, status, country, currency, created_at, suspended_at, trial_ends_at, subscription_ends_at', { count: 'exact' });
      if (status) q = q.eq('status', status);
      if (search) q = q.ilike('name', `%${search}%`);
      q = q.order('created_at', { ascending: false }).range((page - 1) * perPage, page * perPage - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, action: 'list', result: 'success', http_status: 200, ip_address: ip });
      return json({ data, pagination: { page, per_page: perPage, total: count || 0, total_pages: Math.ceil((count || 0) / perPage) } });
    }

    const tenantActionMatch = path.match(/^(?:v1\/)?tenants\/([^/]+)\/(suspend|reactivate)$/);
    if (tenantActionMatch && req.method === 'POST') {
      const [, tenantId, action] = tenantActionMatch;
      if (!(await requireScope('write:tenants'))) return json({ error: 'Missing scope: write:tenants' }, 403);
      let body: { reason?: string } = {};
      try { body = await req.json(); } catch { /* body optional for reactivate */ }
      if (action === 'suspend') {
        const { error } = await admin.from('tenants').update({ suspended_at: new Date().toISOString(), suspended_reason: body.reason || 'Suspended via LIAFRIK Command Center' }).eq('id', tenantId);
        if (error) throw error;
      } else {
        const { error } = await admin.from('tenants').update({ suspended_at: null, suspended_reason: null }).eq('id', tenantId);
        if (error) throw error;
      }
      await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, action, target_resource: `tenants/${tenantId}`, result: 'success', http_status: 200, ip_address: ip });
      return json({ success: true, tenant_id: tenantId, action });
    }

    if (path === 'v1/analytics' || path === 'analytics') {
      if (!(await requireScope('read:analytics'))) return json({ error: 'Missing scope: read:analytics' }, 403);
      const { count: totalTenants } = await admin.from('tenants').select('id', { count: 'exact', head: true });
      const { count: activeTenants } = await admin.from('tenants').select('id', { count: 'exact', head: true }).is('suspended_at', null);
      const { count: totalOrders } = await admin.from('orders').select('id', { count: 'exact', head: true });
      await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, result: 'success', http_status: 200, ip_address: ip });
      return json({ total_tenants: totalTenants || 0, active_tenants: activeTenants || 0, suspended_tenants: (totalTenants || 0) - (activeTenants || 0), total_orders: totalOrders || 0, generated_at: new Date().toISOString() });
    }

    await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, result: 'error', http_status: 404, ip_address: ip });
    return json({ error: `Unknown endpoint: ${path}` }, 404);
  } catch (e) {
    await auditLog(admin, { request_id: requestId, correlation_id: correlationId, api_key_id: apiKey.id, endpoint: path, method: req.method, result: 'error', http_status: 500, ip_address: ip });
    return json({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});

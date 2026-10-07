import { createClient } from 'jsr:@supabase/supabase-js@2';

// Management endpoint for the Command Center integration - used by the
// Super Admin's own logged-in session (Supabase Auth JWT), not by the
// external Command Center (that uses command-center/v1/* with an API key
// instead). Key generation happens here so the raw key is hashed
// server-side and never has to round-trip through anywhere it could be
// logged - the browser only ever sees it in this one response.
//
// Also handles real event delivery (action: deliver_event), called by a
// real Postgres trigger (see migration) whenever tenants.suspended_at
// actually changes - not a promise in the UI text, an actual fired-on-
// real-data-change webhook dispatch to every enabled webhook subscribed
// to that event type. Authenticated with command_center_trigger_secret
// (platform_secrets), a dedicated secret for this one purpose - not the
// service role key, which isn't reachable to seed into the trigger from
// outside the running application anyway.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomKey(env: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sk_${env === 'staging' ? 'test' : 'live'}_${hex}`;
}

async function decryptOne(keyHex: string, stored: string): Promise<string> {
  const [ivHex, ctHex] = stored.split(':');
  const toBytes = (hex: string) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', toBytes(keyHex), 'AES-GCM', false, ['decrypt']);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBytes(ivHex) }, key, toBytes(ctHex));
  return new TextDecoder().decode(plainBuf);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function deliverToWebhook(admin: ReturnType<typeof createClient>, webhook: { id: string; url: string; signing_secret_encrypted: string }, eventType: string, data: Record<string, unknown>) {
  const eventId = `evt_${crypto.randomUUID().replace(/-/g, '')}`;
  try {
    const { data: encKeyRow } = await admin.from('platform_secrets').select('value').eq('key', 'gateway_encryption_key').maybeSingle();
    if (!encKeyRow?.value) throw new Error('Encryption key not configured');
    const signingSecret = await decryptOne(encKeyRow.value, webhook.signing_secret_encrypted);
    const eventPayload = { id: eventId, type: eventType, application_id: 'sellia-platform', environment: 'production', timestamp: new Date().toISOString(), correlation_id: eventId, data };
    const bodyStr = JSON.stringify(eventPayload);
    const signature = await hmacSha256Hex(signingSecret, bodyStr);
    let responseStatus = 0; let responseBody = ''; let status = 'failed';
    try {
      const res = await fetch(webhook.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LIAFRIK-Signature': `sha256=${signature}`, 'X-LIAFRIK-Event-Id': eventId }, body: bodyStr });
      responseStatus = res.status;
      responseBody = (await res.text()).slice(0, 500);
      status = res.ok ? 'success' : 'failed';
    } catch (e) {
      responseBody = e instanceof Error ? e.message : 'Network error';
    }
    await admin.from('command_center_webhook_deliveries').insert({
      webhook_id: webhook.id, event_id: eventId, event_type: eventType, payload: eventPayload, status, attempts: 1, response_status: responseStatus || null, response_body: responseBody, delivered_at: status === 'success' ? new Date().toISOString() : null,
    });
  } catch (e) {
    // A broken signing secret (or any other setup issue) must not crash
    // the caller, and must not vanish silently either - logged as a real
    // failed delivery so it's visible in the audit/deliveries UI.
    await admin.from('command_center_webhook_deliveries').insert({
      webhook_id: webhook.id, event_id: eventId, event_type: eventType, payload: { error: 'setup_failure' }, status: 'failed', attempts: 1, response_body: e instanceof Error ? e.message : String(e),
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  let payload: { action?: string; name?: string; environment?: string; scopes?: string[]; expires_in_days?: number; key_id?: string; webhook_id?: string; url?: string; events?: string[]; enabled?: boolean; event_type?: string; event_data?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (payload.action === 'deliver_event') {
    const provided = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: secretRow } = await admin.from('platform_secrets').select('value').eq('key', 'command_center_trigger_secret').maybeSingle();
    if (!secretRow?.value || provided !== secretRow.value) return json({ error: 'Unauthorized' }, 401);
    const { event_type, event_data } = payload;
    if (!event_type) return json({ error: 'event_type required' }, 400);
    const { data: webhooks } = await admin.from('command_center_webhooks').select('*').eq('enabled', true).contains('events', [event_type]);
    for (const wh of webhooks || []) {
      await deliverToWebhook(admin, wh, event_type, event_data || {});
    }
    return json({ delivered_to: (webhooks || []).length });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  const { data: superAdminRow } = await admin.from('super_admins').select('id').eq('user_id', userData.user.id).eq('status', 'active').maybeSingle();
  if (!superAdminRow) return json({ error: 'Super admin access required' }, 403);

  try {
    if (payload.action === 'create_key') {
      const { name, environment = 'production', scopes = [], expires_in_days } = payload;
      if (!name) return json({ error: 'name is required' }, 400);
      const rawKey = randomKey(environment);
      const keyHash = await sha256Hex(rawKey);
      const expiresAt = expires_in_days ? new Date(Date.now() + expires_in_days * 86400000).toISOString() : null;
      const { data, error } = await admin.from('command_center_api_keys').insert({
        name, environment, key_prefix: rawKey.slice(0, 12), key_hash: keyHash, scopes, created_by: userData.user.id, expires_at: expiresAt,
      }).select().single();
      if (error) throw error;
      return json({ id: data.id, raw_key: rawKey, key_prefix: data.key_prefix, created_at: data.created_at });
    }

    if (payload.action === 'revoke_key') {
      const { error } = await admin.from('command_center_api_keys').update({ status: 'revoked', revoked_at: new Date().toISOString() }).eq('id', payload.key_id);
      if (error) throw error;
      return json({ success: true });
    }

    if (payload.action === 'create_webhook') {
      const { name, url, events = [] } = payload;
      if (!name || !url) return json({ error: 'name and url are required' }, 400);
      const rawSecret = Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, '0')).join('');
      const { data: encKeyRow } = await admin.from('platform_secrets').select('value').eq('key', 'gateway_encryption_key').maybeSingle();
      if (!encKeyRow?.value) return json({ error: 'Encryption key not configured (gateway_encryption_key missing)' }, 502);
      const ivBytes = crypto.getRandomValues(new Uint8Array(12));
      const toBytes = (hex: string) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));
      const cryptoKey = await crypto.subtle.importKey('raw', toBytes(encKeyRow.value), 'AES-GCM', false, ['encrypt']);
      const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBytes }, cryptoKey, new TextEncoder().encode(rawSecret));
      const ivHex = Array.from(ivBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const ctHex = Array.from(new Uint8Array(ctBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      const { data, error } = await admin.from('command_center_webhooks').insert({
        name, url, events, signing_secret_encrypted: `${ivHex}:${ctHex}`, created_by: userData.user.id,
      }).select().single();
      if (error) throw error;
      return json({ id: data.id, raw_signing_secret: rawSecret });
    }

    if (payload.action === 'test_webhook') {
      const { webhook_id } = payload;
      const { data: webhook } = await admin.from('command_center_webhooks').select('*').eq('id', webhook_id).maybeSingle();
      if (!webhook) return json({ error: 'Webhook not found' }, 404);
      await deliverToWebhook(admin, webhook, 'connection.test', { message: 'Real test delivery from Sellia Command Center integration.' });
      const { data: lastDelivery } = await admin.from('command_center_webhook_deliveries').select('*').eq('webhook_id', webhook_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return json({ delivered: lastDelivery?.status === 'success', response_status: lastDelivery?.response_status, response_body: lastDelivery?.response_body });
    }

    return json({ error: `Unknown action: ${payload.action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});

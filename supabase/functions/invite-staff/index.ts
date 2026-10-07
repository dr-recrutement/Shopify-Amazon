import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real staff invitations: creates an actual Supabase Auth pending user via
// the Admin API and sends Supabase's own invite email (sets a password via
// the link, then signs in normally) - not just a database row pretending
// someone was invited.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  let payload: { tenant_id?: string; email?: string; role?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const { tenant_id, email, role } = payload;
  if (!tenant_id || !email) return json({ error: 'tenant_id and email are required' }, 400);

  // Only the store owner can invite staff to it - checked under the
  // caller's own RLS, not an admin bypass.
  const { data: tenant, error: tenantError } = await asCaller.from('tenants').select('id, name').eq('id', tenant_id).maybeSingle();
  if (tenantError || !tenant) return json({ error: "You don't have access to this store" }, 403);

  try {
    const origin = req.headers.get('origin') || 'https://sellia.liafrik.com';
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { tenant_id, role: role || 'user', invited_to_store: tenant.name },
      // Was /dashboard: the invite link establishes a session (Supabase
      // fires the same SIGNED_IN event a recovery link does) but the
      // invited person never had a chance to set a password anywhere -
      // they'd land in the app once, then be unable to log in again
      // normally. /reset-password already listens for exactly this
      // (PASSWORD_RECOVERY or SIGNED_IN) and lets them set one before
      // continuing to /login.
      redirectTo: `${origin}/reset-password`,
    });
    if (inviteError) {
      // A person can only have one pending Supabase invite/account per
      // email - surface that plainly instead of a generic failure.
      if (inviteError.message?.toLowerCase().includes('already been registered') || inviteError.message?.toLowerCase().includes('already registered')) {
        return json({ error: 'Cette adresse e-mail a déjà un compte Sellia.' }, 409);
      }
      throw inviteError;
    }

    const { data: row, error: insertError } = await admin.from('team_members').insert({
      tenant_id, email, role: role || 'user', status: 'invited', invited_by: userData.user.email || userData.user.id,
    }).select().single();
    if (insertError) throw insertError;

    return json({ member: row, user_id: invited.user?.id });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

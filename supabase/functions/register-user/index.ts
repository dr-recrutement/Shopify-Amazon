import { createClient } from 'jsr:@supabase/supabase-js@2';

// Fallback sign-up used ONLY when Supabase Auth cannot send its confirmation
// email ("Error sending confirmation email", i.e. the project's SMTP is
// broken/misconfigured). Creates the account server-side with the email marked
// confirmed so the person can log in immediately. Trade-off: the address is not
// verified. Once Auth email works again the normal signUp() path (with the
// confirmation email) succeeds and this function is never called.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let b: { email?: string; password?: string; phone?: string; country?: string };
  try { b = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return json({ error: 'Adresse e-mail invalide' }, 400);
  if (password.length < 8 || password.length > 200) return json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Gate: only fall back when Auth's own sign-up fails specifically because the
  // confirmation email cannot be sent. If a normal sign-up works (mail OK) the
  // account is created the normal, verified way and we report that instead.
  const attempt = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY')!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { phone: String(b.phone || '').slice(0, 40), country: String(b.country || '').slice(0, 4) } }),
  });
  if (attempt.ok) return json({ ok: true, mode: 'email_confirmation_sent' });
  const attemptBody = await attempt.json().catch(() => ({}));
  if (!/sending (confirmation|magic link|recovery)? ?email|error sending/i.test(String(attemptBody.msg || attemptBody.message || ''))) {
    if (/already|registered/i.test(String(attemptBody.msg || attemptBody.message || ''))) return json({ error: 'user_exists', message: 'Un compte existe déjà avec cet e-mail. Connectez-vous.' }, 409);
    return json({ error: String(attemptBody.msg || attemptBody.message || 'Inscription impossible') }, 400);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { phone: String(b.phone || '').slice(0, 40), country: String(b.country || '').slice(0, 4), registered_without_email_check: true },
  });
  if (error) {
    const m = String(error.message || '');
    if (/already|registered|exists/i.test(m)) return json({ error: 'user_exists', message: 'Un compte existe déjà avec cet e-mail. Connectez-vous.' }, 409);
    return json({ error: m }, 400);
  }
  return json({ ok: true, mode: 'created_confirmed', user_id: data.user?.id });
});

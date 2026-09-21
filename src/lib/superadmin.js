import { supabase } from '@/api/supabaseClient';

// Super admin status now lives in the database (public.super_admins), with
// RLS that only lets existing active super admins add/remove others (see
// migration secure_super_admins_and_invites). This replaces the old
// hardcoded SUPERADMIN_EMAILS allowlist, which anyone reading the bundled
// JS could see and which had no real access control behind it anyway.

export async function checkIsSuperAdmin(userId) {
  if (!userId) return false;
  const { data } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return !!data;
}

// If this user's email has a pending super-admin invite, claim it: insert
// their own super_admins row (RLS allows a self-insert when a matching
// invite exists), then remove the invite. Safe to call on every login -
// it's a no-op when there's no invite. This is how a super admin can be
// "added" before they've ever signed up: the invite just waits for them.
export async function claimPendingSuperAdminInvite(user) {
  if (!user?.email) return;
  const { data: invite } = await supabase
    .from('super_admin_invites')
    .select('email')
    .ilike('email', user.email)
    .maybeSingle();
  if (!invite) return;
  const { error } = await supabase.from('super_admins').insert({
    user_id: user.id,
    email: user.email,
    status: 'active',
    promoted_at: new Date().toISOString(),
  });
  if (!error) {
    await supabase.from('super_admin_invites').delete().ilike('email', user.email);
  }
}

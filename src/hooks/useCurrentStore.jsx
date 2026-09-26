import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

// Loads the tenant (boutique) owned by the current user from the native
// `tenants` table (RLS: owner_id = auth.uid()), and normalizes it into the
// field names the rest of the app already expects (business_name, plan_status,
// etc. - the shape the old Base44 `Store` entity used). `tenants` doesn't
// carry every one of those fields (no logo/email/address/description columns
// today) - those come back undefined rather than crashing the page.
// Returns { store, loading, error, reload }.
function normalizeTenant(t) {
  if (!t) return null;
  return {
    ...t,
    business_name: t.name,
    business_type: t.sector,
    category: t.sector,
    plan_status: t.status,
    // No dedicated columns yet on `tenants` for these - left undefined on
    // purpose rather than guessed, so pages render an empty state instead of
    // wrong data.
    color: t.color,
    description: t.description,
    domain: t.domain,
    email: t.email,
    image: t.image,
    address: t.address,
  };
}

export function useCurrentStore() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffRole, setStaffRole] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStore(null);
        setStaffRole(null);
        setError(null);
        return;
      }
      const { data, error: queryError } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (queryError) throw queryError;
      if (data) {
        setStore(normalizeTenant(data));
        setStaffRole('owner');
        setError(null);
        return;
      }
      // Not an owner - this was the actual bug behind invited staff never
      // seeing anything: this hook only ever looked up tenants.owner_id,
      // with no fallback path for someone invited as staff (team_members
      // matches by email, not a user_id column). Every page reading
      // `store` from here would render its "configurez votre boutique"
      // empty state for a real, logged-in staff member.
      const { data: membership } = await supabase
        .from('team_members')
        .select('tenant_id, role')
        .eq('status', 'invited')
        .ilike('email', user.email)
        .maybeSingle();
      if (membership?.tenant_id) {
        const { data: staffTenant, error: staffTenantError } = await supabase
          .from('tenants').select('*').eq('id', membership.tenant_id).maybeSingle();
        if (staffTenantError) throw staffTenantError;
        setStore(normalizeTenant(staffTenant));
        setStaffRole(membership.role || 'user');
        setError(null);
        return;
      }
      setStore(null);
      setStaffRole(null);
      setError(null);
    } catch (e) {
      console.error('useCurrentStore: failed to load tenant:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // staffRole: 'owner' | 'admin' | 'user' | null - lets pages that need to
  // restrict something to owners/admins do so (Payments, Billing, Staff
  // management itself). Everything else keeps working exactly as before
  // for an owner, who still gets staffRole 'owner' unconditionally.
  return { store, loading, error, reload: load, staffRole };
}

export default useCurrentStore;

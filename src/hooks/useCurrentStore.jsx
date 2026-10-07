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

const SELECTED_KEY = 'sellia_current_store';
export const NEW_STORE = '__new__';
export function getSelectedStore() { try { return localStorage.getItem(SELECTED_KEY); } catch { return null; } }
export function selectStore(id) {
  try { if (id) localStorage.setItem(SELECTED_KEY, id); else localStorage.removeItem(SELECTED_KEY); } catch { /* storage unavailable */ }
}
// Switching stores reloads the page: ~40 components each hold their own copy
// of the store, so a reload is the only way to make them all agree.
export function switchStore(id) { selectStore(id); window.location.assign(id === NEW_STORE ? '/onboarding' : '/'); }

export function useCurrentStore() {
  const [stores, setStores] = useState([]);
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
      const { data: owned, error: queryError } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });
      if (queryError) throw queryError;
      setStores((owned || []).map(normalizeTenant));
      const selected = getSelectedStore();
      if (owned?.length && selected === NEW_STORE && window.location.pathname === '/onboarding') {
        // Creating an additional store: no current store until onboarding inserts it.
        setStore(null);
        setStaffRole('owner');
        setError(null);
        return;
      }
      const data = (owned || []).find((t) => t.id === selected) || (owned || [])[0];
      if (selected === NEW_STORE) selectStore(null); // abandoned creation: stop forcing onboarding
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
        .order('created_at', { ascending: true });
      const memberships = membership || [];
      const picked = memberships.find((m) => m.tenant_id === getSelectedStore()) || memberships[0];
      if (picked?.tenant_id) {
        const { data: staffTenants } = await supabase.from('tenants').select('*').in('id', memberships.map((m) => m.tenant_id));
        setStores((staffTenants || []).map(normalizeTenant));
        const staffTenant = (staffTenants || []).find((t) => t.id === picked.tenant_id);
        setStore(normalizeTenant(staffTenant));
        setStaffRole(picked.role || 'user');
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
  return { store, stores, loading, error, reload: load, staffRole };
}

export default useCurrentStore;

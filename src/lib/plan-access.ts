import { useEffect, useState } from 'react';
import { supabase, isLocalAuthMode } from './supabase';
import { PLANS } from './constants';
import { useAuth } from './hooks';
import { getCurrentTenantId } from './tenant-sync';

export type Plan = (typeof PLANS)[number];

export type PlanAccess = {
  loading: boolean;
  plan: Plan;
  isSuperAdmin: boolean;
  /** True when limits cannot currently be enforced (local/demo mode, no
   *  Supabase tenant resolved yet). Nothing is blocked in that case — same
   *  as the app's behavior before plan enforcement existed. */
  unrestricted: boolean;
};

/**
 * Resolves the current user's subscription plan and access rights.
 * Super admins (SUPER_ADMIN_EMAILS) always get unrestricted access and are
 * never charged or limited by any plan, per product policy.
 */
export function usePlanAccess(): PlanAccess {
  const { isSuperAdmin, user, loading: authLoading } = useAuth();
  const [planId, setPlanId] = useState<string>('starter');
  const [loading, setLoading] = useState(true);
  const [unrestricted, setUnrestricted] = useState(isLocalAuthMode());

  useEffect(() => {
    if (authLoading) return;
    if (isSuperAdmin || !user || isLocalAuthMode()) {
      setUnrestricted(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        if (!cancelled) {
          setUnrestricted(true);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from('tenants')
        .select('plan')
        .eq('id', tenantId)
        .maybeSingle();
      if (!cancelled) {
        if (!error && data?.plan) setPlanId(data.plan as string);
        setUnrestricted(false);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, isSuperAdmin]);

  const plan = PLANS.find(p => p.id === planId) ?? PLANS[0];
  return { loading, plan, isSuperAdmin, unrestricted };
}

/** -1 means unlimited on this plan. */
export function isOverLimit(limit: number, currentCount: number): boolean {
  if (limit === -1) return false;
  return currentCount >= limit;
}

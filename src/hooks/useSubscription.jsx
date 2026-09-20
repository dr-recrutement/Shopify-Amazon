import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getPlan } from '@/lib/plans';

export function useSubscription() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const list = await base44.entities.Store.filter({ created_by_id: user.id });
      setStore(list[0] || null);
    } catch {
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const planId = store?.plan || 'growth';
  const plan = getPlan(planId);
  const planStatus = store?.plan_status || 'trial';

  return { store, planId, plan, planStatus, loading, reload: load };
}

export default useSubscription;
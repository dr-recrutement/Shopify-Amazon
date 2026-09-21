import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Loads the first store owned by the current user (created_by_id).
// Returns { store, loading, error, reload }.
export function useCurrentStore() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const list = await base44.entities.Store.filter({ created_by_id: user.id });
      setStore(list[0] || null);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  return { store, loading, error, reload: load };
}

export default useCurrentStore;
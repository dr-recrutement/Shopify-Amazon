import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  country: string | null;
  currency: string;
  plan: string;
  status: string;
  theme_id: string;
  billing_cycle: string;
  city: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  app_metadata: Record<string, any>;
}

// Helper to check if Supabase has placeholder keys
const isPlaceholderSupabase = !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL.includes('placeholder-project-id');

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a mock user in localStorage first
    const savedMockUser = localStorage.getItem('os_mock_user');
    if (savedMockUser) {
      try {
        setUser(JSON.parse(savedMockUser));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('os_mock_user');
      }
    }

    if (isPlaceholderSupabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          app_metadata: data.session.user.app_metadata || {},
        });
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (localStorage.getItem('os_mock_user')) return; // Prioritize mock if active
      setUser(session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        app_metadata: session.user.app_metadata || {},
      } : null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (isPlaceholderSupabase) {
        throw new Error("Failed to fetch");
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      if (isPlaceholderSupabase) {
        throw new Error("Failed to fetch");
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signInDemo = (email: string = 'demo@liafrikos.com') => {
    const mock: AuthUser = {
      id: 'mock-user-123',
      email,
      app_metadata: { role: 'admin' }
    };
    localStorage.setItem('os_mock_user', JSON.stringify(mock));
    setUser(mock);

    // Initialize default demo tenant if none exists
    const savedTenant = localStorage.getItem('os_mock_tenant');
    if (!savedTenant) {
      const mockTenant: Tenant = {
        id: 'mock-tenant-123',
        name: 'Ma Boutique Os',
        slug: 'ma-boutique',
        sector: 'Mode & Design',
        country: 'Côte d\'Ivoire',
        currency: 'XOF',
        plan: 'premium',
        status: 'trial',
        theme_id: 'universal',
        billing_cycle: 'monthly',
        city: 'Abidjan'
      };
      localStorage.setItem('os_mock_tenant', JSON.stringify(mockTenant));
    }
  };

  const signOut = async () => {
    localStorage.removeItem('os_mock_user');
    try {
      if (!isPlaceholderSupabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {}
    setUser(null);
  };

  return { user, loading, signIn, signUp, signInDemo, signOut };
}

export function useTenant() {
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTenant = useCallback(async () => {
    if (!user) { setTenant(null); setLoading(false); return; }

    // If we have a mock tenant in localStorage, use it
    const savedTenant = localStorage.getItem('os_mock_tenant');
    if (savedTenant) {
      try {
        setTenant(JSON.parse(savedTenant));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('os_mock_tenant');
      }
    }

    if (isPlaceholderSupabase) {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      if (error) throw error;
      setTenant((data?.[0] as Tenant) || null);
    } catch (error) {
      console.error('[useTenant] Erreur chargement tenant:', error);
      setTenant(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading) loadTenant(); }, [authLoading, loadTenant]);

  const updateMockTenant = (updated: Partial<Tenant>) => {
    const current = localStorage.getItem('os_mock_tenant');
    if (current) {
      try {
        const parsed = JSON.parse(current);
        const next = { ...parsed, ...updated };
        localStorage.setItem('os_mock_tenant', JSON.stringify(next));
        setTenant(next);
      } catch (e) {}
    }
  };

  return { tenant, loading: authLoading || loading, reload: loadTenant, updateMockTenant };
}

export function useIsSuperAdmin(user: AuthUser | null) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setIsSuperAdmin(false); setLoading(false); return; }

    if (user.id === 'mock-user-123') {
      setIsSuperAdmin(true);
      setLoading(false);
      return;
    }

    if (isPlaceholderSupabase) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    const userId = user.id;
    setLoading(true);
    async function checkAdmin() {
      try {
        const { data, error } = await supabase
          .from('super_admins')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        if (error) console.error('[useIsSuperAdmin] Erreur vérification:', error);
        setIsSuperAdmin(!!data);
      } catch (err) {
        console.error('[useIsSuperAdmin] Erreur réseau:', err);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [user?.id]);
  return { isSuperAdmin, loading };
}

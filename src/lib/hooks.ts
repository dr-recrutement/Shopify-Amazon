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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  };

  return { user, loading, signIn, signUp, signOut };
}

export function useTenant() {
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTenant = useCallback(async () => {
    if (!user) { setTenant(null); setLoading(false); return; }

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

  return { tenant, loading: authLoading || loading, reload: loadTenant };
}

export function useIsSuperAdmin(user: AuthUser | null) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setIsSuperAdmin(false); setLoading(false); return; }

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

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
export interface Tenant {
  id: string;
  name: string;
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };
  return { user, loading, signIn, signUp, signOut };
}
export function useTenant() {
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const loadTenant = useCallback(async () => {
    if (!user) { setTenant(null); setLoading(false); return; }
    const { data } = await supabase.from('tenants').select('*').eq('owner_id', user.id).maybeSingle();
    setTenant(data as Tenant | null);
    setLoading(false);
  }, [user]);
  useEffect(() => { if (!authLoading) loadTenant(); }, [authLoading, loadTenant]);
  return { tenant, loading: authLoading || loading, reload: loadTenant };
}

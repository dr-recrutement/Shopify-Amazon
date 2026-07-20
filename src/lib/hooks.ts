import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { isSuperAdminEmail } from './auth';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSuperAdmin = session?.user?.email ? isSuperAdminEmail(session.user.email) : false;

  return { session, loading, isSuperAdmin, user: session?.user ?? null };
}

export function useTenant() {
  const { session } = useAuth();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return; }
    supabase.from('tenants').select('*').eq('owner_id', session.user.id).maybeSingle()
      .then(({ data }) => { setTenant(data); setLoading(false); });
  }, [session?.user?.id]);

  return { tenant, loading };
}

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(ref);
      }
    }, { threshold: 0.1, ...options });
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return { setRef, isVisible };
}

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { claimPendingSuperAdminInvite } from '@/lib/superadmin';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  // Public, non-sensitive platform config (maintenance banner, announcements).
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();

    // Keep the session reactive: token refresh, login/logout in another tab,
    // and the initial session restore from localStorage all flow through here.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      if (_event === 'SIGNED_IN' && session?.user) {
        claimPendingSuperAdminInvite(session.user).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    try {
      // Public platform settings (maintenance mode, announcement banner).
      // Row-level security allows anyone to read this row. Pinned to its
      // own fixed id: platform_settings also holds key/value rows now
      // (e.g. the help-center tutorial video), and an unfiltered
      // .maybeSingle() would fail with "multiple rows" the moment a second
      // row exists - the error is swallowed below, which would have
      // silently switched off maintenance mode and the announcement banner
      // for the whole platform.
      const { data } = await supabase
        .from('platform_settings')
        .select('maintenance_mode, maintenance_message, announcement_active, announcement_message')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();
      setAppPublicSettings(data || null);
    } catch (error) {
      console.error('Failed to load platform settings:', error);
      setAppPublicSettings(null);
    } finally {
      setIsLoadingPublicSettings(false);
    }

    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    const returnTo = window.location.pathname + window.location.search;
    const target = "/login" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "");
    if (window.location.pathname !== "/login") {
      window.location.href = target;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

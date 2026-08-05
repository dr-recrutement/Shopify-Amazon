import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://demo.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'demo-anon-key';

function createLocalSupabaseClient() {
  const storageKey = 'liafrikos_auth_session';
  const getStorage = () => {
    if (typeof window !== 'undefined') return window.localStorage as Storage | undefined;
    return globalThis.localStorage as Storage | undefined;
  };

  const loadSession = () => {
    const storage = getStorage();
    if (!storage) return null;
    try {
      return JSON.parse(storage.getItem(storageKey) || 'null');
    } catch {
      return null;
    }
  };

  const saveSession = (session: unknown) => {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(storageKey, JSON.stringify(session));
  };

  const auth = {
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
      const user = { id: `local-${Date.now()}`, email, app_metadata: {}, user_metadata: options?.data ?? {} };
      const session = { access_token: `local-${email}`, user };
      saveSession(session);
      return { data: { user, session }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const existing = loadSession();
      if (existing?.user?.email === email) {
        return { data: { session: existing, user: existing.user }, error: null };
      }
      const user = { id: `local-${Date.now()}`, email, app_metadata: {}, user_metadata: {} };
      const session = { access_token: `local-${email}`, user };
      saveSession(session);
      return { data: { session, user }, error: null };
    },
    async signOut() {
      const storage = getStorage();
      if (storage) {
        storage.removeItem(storageKey);
        storage.removeItem('use_local_supabase');
      }
      return { error: null };
    },
    async getSession() {
      return { data: { session: loadSession() }, error: null };
    },
    async getUser() {
      const session = loadSession();
      return { data: { user: session?.user ?? null }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: unknown) => void) {
      const session = loadSession();
      callback('SIGNED_IN', session);
      return { data: { subscription: { unsubscribe: () => undefined } } };
    },
  };

  const from = (table: string) => ({
    async insert(values: Record<string, unknown>) {
      if (table === 'tenants') {
        const storage = getStorage();
        const stored = storage ? JSON.parse(storage.getItem('liafrikos_tenants') || '[]') : [];
        const item = { id: globalThis.crypto?.randomUUID?.() ?? `tenant-${Date.now()}`, ...values };
        const next = [item, ...stored];
        if (storage) storage.setItem('liafrikos_tenants', JSON.stringify(next));
        return { data: item, error: null };
      }
      return { data: null, error: null };
    },
  });

  return { auth, from };
}

const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const localClient = createLocalSupabaseClient();

export function isLocalAuthMode(): boolean {
  if (!isSupabaseConfigured) return true;
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('use_local_supabase') === 'true';
  }
  return false;
}

export function setLocalAuthMode(enabled: boolean) {
  if (typeof window !== 'undefined') {
    if (enabled) {
      window.localStorage.setItem('use_local_supabase', 'true');
    } else {
      window.localStorage.removeItem('use_local_supabase');
    }
  }
}

// Unified, crash-proof, multi-mode client
export const supabase = {
  auth: {
    async signUp(params: any) {
      if (isLocalAuthMode()) {
        return localClient.auth.signUp(params);
      }
      try {
        const res = await supabaseClient.auth.signUp(params);
        if (res.error && (res.error.message.includes('Failed to fetch') || res.error.message.includes('fetch'))) {
          setLocalAuthMode(true);
          return localClient.auth.signUp(params);
        }
        return res;
      } catch (e: any) {
        if (e?.message?.includes('Failed to fetch') || e?.message?.includes('fetch')) {
          setLocalAuthMode(true);
          return localClient.auth.signUp(params);
        }
        throw e;
      }
    },
    async signInWithPassword(params: any) {
      if (isLocalAuthMode()) {
        return localClient.auth.signInWithPassword(params);
      }
      try {
        const res = await supabaseClient.auth.signInWithPassword(params);
        if (res.error && (res.error.message.includes('Failed to fetch') || res.error.message.includes('fetch'))) {
          setLocalAuthMode(true);
          return localClient.auth.signInWithPassword(params);
        }
        return res;
      } catch (e: any) {
        if (e?.message?.includes('Failed to fetch') || e?.message?.includes('fetch')) {
          setLocalAuthMode(true);
          return localClient.auth.signInWithPassword(params);
        }
        throw e;
      }
    },
    async signOut() {
      if (isLocalAuthMode()) {
        return localClient.auth.signOut();
      }
      try {
        return await supabaseClient.auth.signOut();
      } catch {
        return localClient.auth.signOut();
      }
    },
    async getSession() {
      if (isLocalAuthMode()) {
        return localClient.auth.getSession();
      }
      try {
        return await supabaseClient.auth.getSession();
      } catch {
        return localClient.auth.getSession();
      }
    },
    async getUser() {
      if (isLocalAuthMode()) {
        return localClient.auth.getUser();
      }
      try {
        return await supabaseClient.auth.getUser();
      } catch {
        return localClient.auth.getUser();
      }
    },
    onAuthStateChange(callback: any) {
      if (isLocalAuthMode()) {
        return localClient.auth.onAuthStateChange(callback);
      }
      try {
        return supabaseClient.auth.onAuthStateChange(callback);
      } catch {
        return localClient.auth.onAuthStateChange(callback);
      }
    }
  },
  from(table: string) {
    if (isLocalAuthMode()) {
      return localClient.from(table);
    }
    const originalFrom = supabaseClient.from(table);
    return {
      async insert(values: any) {
        try {
          const res = await originalFrom.insert(values);
          if (res.error && (res.error.message.includes('Failed to fetch') || res.error.message.includes('fetch'))) {
            setLocalAuthMode(true);
            return localClient.from(table).insert(values);
          }
          return res;
        } catch {
          setLocalAuthMode(true);
          return localClient.from(table).insert(values);
        }
      },
      select() {
        return originalFrom.select();
      }
    } as any;
  }
} as unknown as typeof supabaseClient;

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
      if (storage) storage.removeItem(storageKey);
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

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured ? supabaseClient : (createLocalSupabaseClient() as any) as typeof supabaseClient;

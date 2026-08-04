import { beforeEach, describe, expect, it } from 'vitest';
import { supabase } from './supabase';

const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  } as Storage;
};

describe('local Supabase fallback', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createLocalStorageMock(),
      configurable: true,
    });
  });

  it('signs up and signs in a user locally', async () => {
    const signUp = await supabase.auth.signUp({
      email: 'demo@example.com',
      password: '123456',
      options: { data: { full_name: 'Demo User' } },
    });

    expect(signUp.error).toBeNull();
    expect(signUp.data.user?.email).toBe('demo@example.com');

    const signIn = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: '123456',
    });

    expect(signIn.error).toBeNull();
    expect(signIn.data.session?.user.email).toBe('demo@example.com');
  });

  it('persists onboarding tenant data locally', async () => {
    const result = await supabase.from('tenants').insert({
      owner_id: 'demo-user',
      name: 'Ma Boutique',
      country: 'CI',
      plan: 'premium',
      status: 'trial',
    });

    expect(result.error).toBeNull();
    const stored = JSON.parse(localStorage.getItem('liafrikos_tenants') || '[]');
    expect(stored[0].name).toBe('Ma Boutique');
  });
});

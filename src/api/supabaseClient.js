import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// "Remember me" on Login.jsx sets this flag before signing in. When it's
// false, the session token is kept in sessionStorage instead of
// localStorage, so it's cleared automatically when the browser/tab closes
// - a real remember-me toggle, not just a checkbox with no effect.
const REMEMBER_KEY = 'sellia_remember_me';
const rememberMeStorage = {
  getItem: (key) => {
    const remember = localStorage.getItem(REMEMBER_KEY) !== 'false';
    return (remember ? localStorage : sessionStorage).getItem(key);
  },
  setItem: (key, value) => {
    const remember = localStorage.getItem(REMEMBER_KEY) !== 'false';
    (remember ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: rememberMeStorage,
    // The password-recovery email link redirects back here with the
    // recovery session encoded in the URL hash; Supabase needs to read it
    // from there once (ResetPassword.jsx) to let the user set a new password.
    detectSessionInUrl: true,
  },
});

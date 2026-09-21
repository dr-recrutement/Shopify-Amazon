import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // The password-recovery email link redirects back here with the
    // recovery session encoded in the URL hash; Supabase needs to read it
    // from there once (ResetPassword.jsx) to let the user set a new password.
    detectSessionInUrl: true,
  },
});

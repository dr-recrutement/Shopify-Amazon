import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project-id.supabase.co') as string
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key') as string

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "[Os SaaS Warning] Les clés d'API Supabase ne sont pas injectées ou sont incorrectes dans l'environnement Vite.\n" +
    "Veuillez vous assurer de définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env ou dans la console Cloudflare Pages.\n" +
    "Pour le moment, l'application utilise des variables d'environnement de secours pour éviter un crash."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})

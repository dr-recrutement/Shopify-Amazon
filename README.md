# LIAFRIKOS — SaaS E-commerce Panafricain

Plateforme SaaS multi-tenant e-commerce, conçue et développée au Cameroun 🇨🇲 par **LIYAH GROUP**, pour toute l'Afrique 🌍.

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Edge Functions, RLS multi-tenant)
- **Icons** : lucide-react
- **Routing** : react-router-dom

## Pré-requis

- Node.js 18+
- npm 9+

## Installation locale

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build production -> dist/
npm run typecheck # vérification TypeScript
```

## Variables d'environnement

Copier `.env.example` vers `.env` et renseigner :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Les secrets serveur (clés de chiffrement des clés API paiement vendeurs, clés tierces) sont gérés via les variables d'environnement Cloudflare / secrets Supabase Edge Functions — jamais en dur dans le code.

## Déploiement Cloudflare Pages

1. Connecter le dépôt GitHub à Cloudflare Pages
2. Build command : `npm run build`
3. Output directory : `dist`
4. Variables d'environnement (Cloudflare Dashboard) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Multi-tenant & domaines personnalisés

- Sous-domaines : `*.liafrikos.com` → DNS wildcard Cloudflare
- Domaines personnalisés (plans Premium/Entreprise) : Cloudflare Custom Hostnames (SSL automatique)

## Structure du dépôt

```
src/
  components/      # Composants partagés (Navbar, Footer, Logo)
  lib/             # Supabase client, auth, i18n, hooks, theme-engine
  pages/
    dashboard/     # Dashboard vendeur (18 modules)
    admin/         # Master Console Super Admin
    *.tsx          # Pages publiques (landing, marketplace, cart, checkout, etc.)
supabase/
  migrations/      # Migrations SQL (schema + RLS)
```

## Conçu et développé au Cameroun 🇨🇲 par LIYAH GROUP — pour toute l'Afrique 🌍

# LIAFRIKOS — SaaS E-commerce Panafricain

Plateforme SaaS multi-tenant e-commerce, conçue et développée au Cameroun 🇨🇲 par **LIYAH GROUP**, pour toute l'Afrique.

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite 6 + Tailwind CSS
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

### Configuration

1. Connecter le dépôt GitHub à Cloudflare Pages
2. Build command : `npm run build`
3. Output directory : `dist`
4. Variables d'environnement (Cloudflare Dashboard) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### ⚠️ Correction de l'erreur de déploiement Vite + nom de projet

**Erreurs corrigées** :

1. **Vite 5.4.8 → 6.4.3** : Cloudflare (Wrangler) ne pouvait pas configurer automatiquement un projet Vite < 6.0.0. Le log renvoyait :
```
✘ [ERROR] The version of Vite used in the project ("5.4.8") cannot be automatically configured.
Please update the Vite version to at least "6.0.0" and try again.
```

2. **Nom de projet `shopify-amazon` → `liafrikos-platform`** : Le `name` dans `package.json` était hérité du starter (`vite-react-typescript-starter`), causant la détection d'un Worker nommé `shopify-amazon` par Cloudflare. Renommé en `liafrikos-platform`.

**Corrections appliquées** :
- `vite` mis à jour vers `^6.4.3`, `@vitejs/plugin-react` vers `^4.7.0`
- `name` dans `package.json` renommé `liafrikos-platform`
- Lockfile régénéré via `npm install`
- Build local vérifié : `npm run build` se termine sans erreur
- `vite.config.ts` reste compatible (aucun changement requis)
- `public/_redirects` (`/* /index.html 200`) assure le routing SPA

### Mode de déploiement recommandé

Ce projet est un **frontend statique SPA** (React + Vite). Le déploiement recommandé est **Cloudflare Pages** (et non Workers via `wrangler deploy`) :

1. Connecter le dépôt GitHub à Cloudflare Pages
2. Build command : `npm run build`
3. Output directory : `dist`
4. Variables d'environnement : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Si des fonctions serverless sont nécessaires (webhooks paiement, proxy API), les déployer séparément via **Supabase Edge Functions** ou **Cloudflare Workers** dédiés.

### Routing SPA

Le fichier `public/_redirects` est copié dans `dist/` au build. Il redirige toutes les routes vers `index.html` pour que le routing côté client fonctionne sur Cloudflare Pages (pas de 404 sur deep links).

## Multi-tenant & domaines personnalisés

- Sous-domaines : `*.liafrikos.com` → DNS wildcard Cloudflare
- Domaines personnalisés (plans Premium/Entreprise) : Cloudflare Custom Hostnames (SSL automatique)

## Structure du dépôt

```
src/
  components/      # Composants partagés (Navbar, Footer, Logo)
  lib/             # Supabase client, auth, i18n, hooks, theme-engine
  pages/
    dashboard/     # Dashboard vendeur (19 modules)
    admin/         # Master Console Super Admin
    *.tsx          # Pages publiques (landing, marketplace, cart, checkout, etc.)
supabase/
  migrations/      # Migrations SQL (schema + RLS)
public/
  manifest.json   # PWA manifest
  sw.js           # Service worker (offline)
  _redirects      # Cloudflare Pages SPA routing
```

## PWA

LiAfrikOS est installable sur Android et iOS (PWA). Le manifest et le service worker sont dans `public/`. Le service worker met en cache les pages naviguées et les images pour un fonctionnement partiel hors-ligne.

## Conçu et développé au Cameroun 🇨🇲 par LIYAH GROUP — pour toute l'Afrique

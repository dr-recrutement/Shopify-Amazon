# LiAfrikOS — Plateforme E-commerce Panafricaine

SaaS multi-tenant e-commerce panafricain, développé par LIYAH GROUP.

## Déploiement sur Cloudflare Pages

Ce projet est configuré pour un déploiement sur Cloudflare Pages.

### Étapes de déploiement

1. Connectez votre dépôt GitHub à Cloudflare Pages
2. Configuration de build :
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Variables d'environnement (Settings > Environment Variables) :
   - `VITE_SUPABASE_URL` — URL du projet Supabase
   - `VITE_SUPABASE_ANON_KEY` — Clé anonyme Supabase
4. Le fichier `_redirects` assure le routing SPA (toutes les routes → index.html)

### Développement local

```bash
npm install
npm run dev
```

### Build de production

```bash
npm run build
```

## Stack technique

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Supabase (base de données, auth, storage)
- Lucide React (icônes)
- React Router 6

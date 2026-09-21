# Migration Base44 → Supabase

Ce projet quitte Base44 pour Supabase. État actuel :

## ✅ Fait — Authentification (100% Supabase)

- `src/api/supabaseClient.js` : client Supabase (`@supabase/supabase-js`), configuré via
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (voir `.env.production`).
- `src/lib/AuthContext.jsx` : session gérée par `supabase.auth` (`getSession`,
  `onAuthStateChange`), plus plus aucun appel à `base44.auth.*`.
- `src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` :
  appellent directement `supabase.auth.signInWithPassword`, `signUp`, `signInWithOAuth`,
  `resetPasswordForEmail`, `updateUser`. L'inscription utilise le flow OTP natif de
  Supabase (`verifyOtp`/`resend`, type `signup`) à la place de l'OTP custom Base44.
- `src/hooks/useCurrentStore.jsx` : lit la boutique de l'utilisateur depuis la table
  native `tenants` (RLS `owner_id = auth.uid()`), avec un alias de champs
  (`business_name`, `plan_status`, ...) pour rester compatible avec les pages
  existantes. Certains champs (`logo`, `email`, `description`, `address`, `domain`,
  `color`) n'ont pas encore de colonne équivalente sur `tenants` : ils remontent
  `undefined` plutôt que d'être devinés.
- `vite.config.js` : le plugin `@base44/vite-plugin` a été retiré ; l'alias `@` (vers
  `src/`) qu'il fournissait est maintenant déclaré explicitement dans `resolve.alias`.

## ⏳ Pas fait — Données (toujours sur `@base44/sdk`)

Toutes les pages métier (Produits, Commandes, Clients, Thèmes, Automatisations,
Facturation, Staff, etc. — ~47 fichiers) utilisent encore
`base44.entities.X.filter/create/update/delete` via `src/api/base44Client.js`.
`@base44/sdk` est donc **volontairement conservé** en dépendance : le retirer
casserait l'app entière tant que ces pages n'ont pas leur propre migration.

**Important** : comme l'authentification est maintenant 100% Supabase, ces pages
n'ont plus de token Base44 valide côté client — leurs appels `base44.entities.*`
renverront des erreurs 401. Il faut les migrer vers de vraies requêtes Supabase
(table par table) pour qu'elles refonctionnent.

Le vrai backend de données ciblé, confirmé avec des données réelles dedans :
`tenants`, `products`, `orders`, `order_items`, `customers`, `domains`,
`theme_configs`, `marketing_campaigns`, `discount_codes`, `shipping_zones`,
`product_reviews`, `content_pages`, etc. (project Supabase `hfzbykndwsrlxqlqrmjh`).
Les tables `sellia_*` sont une copie/export Base44 quasi vide (données de démo) —
à ne pas utiliser comme source de vérité.

Plusieurs entités Base44 (MediaFile, Automation, Payment, Article, Message) n'ont
pas encore de table native équivalente et devront soit être mappées sur une table
existante, soit être créées.

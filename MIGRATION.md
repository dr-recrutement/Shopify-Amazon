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

## ✅ Fait — Données (pages cœur)

- `src/pages/Onboarding.jsx` : crée/édite le tenant (`tenants`), les premiers
  produits (`products`), une zone de livraison (`shipping_zones`).
- `src/components/admin/AdminLayout.jsx` : utilisateur + déconnexion via
  `useAuth()` ; redirige automatiquement vers `/onboarding` tout utilisateur
  sans boutique.
- `src/pages/Dashboard.jsx` : stats/graphique sur `orders`/`customers`/
  `products` réels.
- `src/pages/Products.jsx` + `src/components/admin/ProductForm.jsx` : CRUD
  complet sur `products`, upload d'images vers le bucket Storage
  `product-images` (confirmé public-read + policies authenticated). Les
  colonnes absentes de la table (`vendor`, `product_type`, `barcode`,
  `weight`, `track_inventory`, `tags`, `options`, `seo`) vivent dans
  `products.metafields` (jsonb) plutôt que d'être perdues. L'assistant IA de
  description produit a été retiré (appelait une fonction Base44 sans
  équivalent Supabase).
- `src/pages/Orders.jsx` + `src/components/admin/OrderDetail.jsx` : lecture
  jointe `orders` + `order_items`. L'édition ne couvre que ce qui existe
  vraiment sur la table (`status`, `tracking_number`) — `payment_status`,
  `fulfillment_status`, `timeline`, `note`, `billing_address`, le détail
  sous-total/remise/taxes n'ont pas de colonne : retirés de l'UI plutôt que
  simulés.
- `src/pages/Customers.jsx` + `src/components/admin/CustomerForm.jsx` : CRUD
  sur `customers` (`name`/`email`/`phone` uniquement — pas de `tags`/`note`/
  consentement marketing sur la table native).
- `src/pages/Collections.jsx` + `src/components/admin/CollectionForm.jsx` :
  CRUD sur `product_categories` + `product_category_assignments` (lien
  many-to-many réel). Retiré : collections « intelligentes » à règles et le
  statut actif/brouillon (aucune colonne pour ça côté natif) — reste une
  collection à sélection manuelle de produits, ce que le schéma supporte
  vraiment.
- `src/pages/Discounts.jsx` + `src/components/admin/DiscountForm.jsx` : CRUD
  sur `discount_codes`. `scheduled`/`expired` sont recalculés à la lecture
  depuis `starts_at`/`ends_at`, la table n'a qu'un booléen `is_active`.
- `src/pages/Reviews.jsx` : lecture/modération/suppression sur
  `product_reviews`, avec jointure vers `products(name)` pour le nom du
  produit. `is_approved` (booléen, nullable) est normalisé en
  pending/approved/rejected.
## ⏳ Pas fait — reste sur `@base44/sdk`

Toutes les autres pages : Marketing,
Automations, Accounting, Markets, Chat, Apps, Payments, Superadmin,
ActivityLogs, SeoIa, Team, Reports, Settings, Billing, Inventory,
ShippingSettings, Domains, StaffManagement (invite/liste faite plus tôt,
mais toujours sur base44 pour le CRUD), StoreSettings, Support, Blog,
ProductAnalytics, MediaLibrary, AbandonedCheckouts, ThemeEditor, Analytics,
ThemeGallery, StoreSetup, Growth, Content, AssistantIA, ArticleDetail,
Storefront (la vitrine publique !), `useSubscription.jsx`, `PageNotFound.jsx`,
`SettingsSections.jsx`. Ces pages continueront à échouer en 401 (aucune
session Base44 n'existe plus) tant qu'elles ne sont pas migrées une à une,
en vérifiant à chaque fois quelle table/quelles colonnes existent réellement
côté Supabase avant d'écrire les requêtes.


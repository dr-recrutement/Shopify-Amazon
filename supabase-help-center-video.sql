-- À exécuter une seule fois dans l'éditeur SQL de votre projet Supabase
-- (Dashboard Supabase → SQL Editor → New query → coller → Run).
--
-- Je n'ai pas les identifiants de votre base Supabase depuis cet
-- environnement : je ne peux donc pas exécuter cette migration moi-même.
-- Cette table est un petit magasin clé/valeur générique pour du contenu
-- piloté par le Super Admin et visible publiquement (on commence avec la
-- vidéo tutoriel du Centre d'aide, mais elle pourra resservir plus tard
-- pour d'autres réglages publics sans nouvelle migration).

create table if not exists platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table platform_settings enable row level security;

-- Lecture publique : le Centre d'aide (/centre-aide) est une page publique,
-- sans connexion — un visiteur anonyme doit pouvoir charger la vidéo.
drop policy if exists platform_settings_public_read on platform_settings;
create policy platform_settings_public_read
  on platform_settings for select
  using (true);

-- Écriture réservée aux super admins actifs (même convention que les
-- autres tables super-admin : super_admins.status = 'active').
drop policy if exists platform_settings_superadmin_write on platform_settings;
create policy platform_settings_superadmin_write
  on platform_settings for insert
  with check (exists (
    select 1 from super_admins sa
    where sa.user_id = auth.uid() and sa.status = 'active'
  ));

drop policy if exists platform_settings_superadmin_update on platform_settings;
create policy platform_settings_superadmin_update
  on platform_settings for update
  using (exists (
    select 1 from super_admins sa
    where sa.user_id = auth.uid() and sa.status = 'active'
  ));

drop policy if exists platform_settings_superadmin_delete on platform_settings;
create policy platform_settings_superadmin_delete
  on platform_settings for delete
  using (exists (
    select 1 from super_admins sa
    where sa.user_id = auth.uid() and sa.status = 'active'
  ));

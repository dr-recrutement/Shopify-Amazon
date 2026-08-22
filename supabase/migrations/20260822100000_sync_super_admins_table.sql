/*
# Fix: super_admins table was never populated — every check against it
# silently failed (RLS policies in AdminHome/AdminStores, the Flutterwave
# checkout's "super admins never pay" check).

## Root cause
Two separate, disconnected sources of truth existed for "who is a super
admin":
1. src/lib/constants.ts SUPER_ADMIN_EMAILS — a hardcoded list, used by the
   client-side route guard (App.tsx ProtectedRoute) and plan-access.ts.
2. The `super_admins` database table — used by every server-side/RLS
   check (subscription checkout, admin console real-data queries added
   in the "AdminHome fake MRR" and "AdminStores fake list" fixes).
Nothing ever inserted rows into (2), so every check against it returned
zero rows — meaning even the real super admin emails would see empty
admin dashboards and could still be charged a subscription, silently
defeating both fixes.

## Fix
A trigger on auth.users keeps `super_admins` in sync automatically: any
account that signs up (or whose email changes) with one of the known
super admin emails gets a matching super_admins row, active, with no
manual provisioning step required. The email list here is a SQL mirror
of SUPER_ADMIN_EMAILS in src/lib/constants.ts — if that list changes,
this function must be updated too (documented inline).
*/

-- Needed for the ON CONFLICT clauses below — one super_admins row per
-- user. Must run BEFORE the trigger/backfill that rely on it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'super_admins_user_id_key'
  ) THEN
    ALTER TABLE super_admins ADD CONSTRAINT super_admins_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION sync_super_admin_from_email()
RETURNS trigger AS $$
BEGIN
  -- ⚠️ Keep this list in sync with SUPER_ADMIN_EMAILS in
  -- src/lib/constants.ts — this is the SQL-side mirror of that list.
  IF lower(NEW.email) IN ('webdxb1@gmail.com', 'vincentnogue@yahoo.com', 'vincentnogue2@gmail.com') THEN
    INSERT INTO super_admins (user_id, status)
    VALUES (NEW.id, 'active')
    ON CONFLICT (user_id) DO UPDATE SET status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_super_admin ON auth.users;
CREATE TRIGGER trg_sync_super_admin
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_super_admin_from_email();

-- Backfill: catch anyone who already signed up with one of these emails
-- before this trigger existed.
INSERT INTO super_admins (user_id, status)
SELECT id, 'active' FROM auth.users
WHERE lower(email) IN ('webdxb1@gmail.com', 'vincentnogue@yahoo.com', 'vincentnogue2@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET status = 'active';

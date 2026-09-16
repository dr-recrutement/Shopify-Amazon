/*
# Boutique contact phone number

## Summary
Onboarding now asks for a business contact phone number (with country
dial code, via components/PhoneInput.tsx) alongside shop name/sector —
distinct from the personal phone collected at signup (stored in
auth.users.raw_user_meta_data.phone). No existing column covered a
merchant's store-facing phone number.
*/

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone text;

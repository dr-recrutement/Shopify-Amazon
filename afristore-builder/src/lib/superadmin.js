// Superadmin access control — platform-wide, unrestricted.
// Access is restricted to a fixed allowlist of emails.
// NOTE: these users must ALSO be assigned role "admin" in the App Users dashboard
// so that RLS (owner-or-admin) lets them read every tenant's data.
export const SUPERADMIN_EMAILS = [
  'vincentnogue@yahoo.com',
  'vincentnogue2@gmail.com',
  'webdxb1@gmail.com',
];

export const isSuperadmin = (email) => !!email && SUPERADMIN_EMAILS.includes(String(email).toLowerCase());
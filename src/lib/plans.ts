// Codes des forfaits autorisés à attacher un domaine personnalisé.
// Correspond à la colonne `code` de la table Supabase `plans`.
export const PLANS_WITH_CUSTOM_DOMAIN = ['pro', 'premium', 'entreprise'];

export function planAllowsCustomDomain(planCode: string | null | undefined): boolean {
  if (!planCode) return false;
  return PLANS_WITH_CUSTOM_DOMAIN.includes(planCode);
}

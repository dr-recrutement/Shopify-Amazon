/**
 * Hiérarchie des forfaits et règles d'accès aux fonctionnalités premium.
 * Centralise ici toute logique "ce plan a-t-il accès à X ?" pour éviter
 * de dupliquer des listes de plans dans chaque composant.
 */

export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise';

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'enterprise'];

function normalizePlan(plan?: string | null): PlanId {
  const p = (plan || 'free').toLowerCase();
  return (PLAN_ORDER as string[]).includes(p) ? (p as PlanId) : 'free';
}

function atLeast(plan: string | null | undefined, minimum: PlanId): boolean {
  const current = normalizePlan(plan);
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(minimum);
}

/**
 * Domaine personnalisé (ex: maboutique.com) : disponible sur tous les plans.
 */
export function planAllowsCustomDomain(plan?: string | null): boolean {
  return true;
}

/**
 * Tous les forfaits (y compris Free/Starter) ont droit au sous-domaine
 * gratuit fourni par la plateforme, ex: maboutique.os.liafrik.com.
 */
export function planAllowsSubdomain(_plan?: string | null): boolean {
  return true;
}

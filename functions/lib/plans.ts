// ⚠️ Duplicated from src/lib/constants.ts PLANS on purpose: Cloudflare Pages
// Functions are bundled separately from the Vite app and importing across
// that boundary is unreliable. Keep the customDomain flags below in sync
// whenever PLANS changes in src/lib/constants.ts.
export const PLAN_CUSTOM_DOMAIN: Record<string, boolean> = {
  starter: false,
  premium: true,
  enterprise: true,
};

export function planAllowsCustomDomain(planId: string, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return PLAN_CUSTOM_DOMAIN[planId] === true;
}

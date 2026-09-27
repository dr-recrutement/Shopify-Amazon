export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 7,
    period: '$/mois',
    color: '#6B7280',
    tagline: 'Pour lancer votre première boutique',
    limits: {
      stores: 1,
      products: 20,
      users: 1,
      themes: 'basic',
      editor: false,
      payments: 'integrated', // was 'manual' - declared but never enforced anywhere (Payments.jsx has no plan check at all), and real PSP access for every plan is the intended, current behavior - every merchant needs to get paid regardless of tier. Gating this reads poorly next to genuinely tiered features like AI/analytics/automations below.
      multi_currency: false,
      analytics: false,
      ai_assistant: false,
      custom_domain: false,
      discounts: false,
      marketplace: false,
      api: false,
      automations: false,
      headless: false,
      support: 'email',
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 19,
    period: '$/mois',
    color: '#008060',
    tagline: 'Pour les marchands en croissance',
    limits: {
      stores: 1,
      products: 60,
      users: 3,
      themes: 'premium',
      editor: true,
      payments: 'integrated',
      multi_currency: true,
      analytics: 'basic',
      ai_assistant: false,
      custom_domain: false,
      discounts: true,
      marketplace: false,
      api: false,
      automations: false,
      headless: false,
      support: 'priority',
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    period: '$/mois',
    color: '#7C3AED',
    tagline: 'Pour les marchands établis',
    limits: {
      stores: 2,
      products: 150,
      users: 10,
      themes: 'premium',
      editor: true,
      payments: 'integrated',
      multi_currency: true,
      analytics: 'advanced',
      ai_assistant: true,
      custom_domain: true,
      discounts: true,
      marketplace: false,
      api: true,
      automations: false,
      headless: false,
      support: 'priority',
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 129,
    period: '$/mois',
    color: '#1E293B',
    tagline: 'Pour les places de marché',
    limits: {
      stores: Infinity,
      products: Infinity,
      users: Infinity,
      themes: 'premium',
      editor: true,
      payments: 'integrated',
      multi_currency: true,
      analytics: 'advanced',
      ai_assistant: true,
      custom_domain: true,
      discounts: true,
      marketplace: true,
      api: true,
      automations: true,
      headless: true,
      support: 'dedicated',
    },
  },
};

export const PLAN_ORDER = ['starter', 'growth', 'pro', 'enterprise'];

export function getPlan(planId) {
  return PLANS[planId] || PLANS.growth;
}

export function canAccess(planId, feature) {
  const plan = getPlan(planId);
  const v = plan.limits[feature];
  return v !== undefined && v !== false && v !== 'basic' ? v : v;
}

export function hasFeature(planId, feature) {
  const plan = getPlan(planId);
  const v = plan.limits[feature];
  if (v === undefined || v === false) return false;
  return true;
}

export function getFeatureValue(planId, feature) {
  return getPlan(planId).limits[feature];
}

export function planRank(planId) {
  return PLAN_ORDER.indexOf(planId);
}

export function isPlanAtLeast(currentPlan, requiredPlan) {
  return planRank(currentPlan) >= planRank(requiredPlan);
}
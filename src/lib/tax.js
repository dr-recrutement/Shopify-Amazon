// Display-side tax estimate for the storefront checkout. The authoritative
// computation is the identical computeTax() in the create-order Edge function;
// the order total the customer is charged always comes from the server.
export function computeTax(taxes, country, subtotalCents, discountCents = 0, shippingCents = 0) {
  if (!taxes?.enabled) return { taxCents: 0, rate: 0, included: false };
  const code = (country || '').toLowerCase();
  const match = (taxes.rates || []).find((r) => r.country && r.country.toLowerCase() === code);
  const rate = Math.max(0, Math.min(100, Number(match ? match.rate : taxes.default_rate) || 0));
  const included = !!taxes.prices_include_tax;
  if (!rate) return { taxCents: 0, rate: 0, included };
  const base = Math.max(0, subtotalCents - discountCents) + (taxes.tax_shipping ? shippingCents : 0);
  const taxCents = included ? Math.round(base - base / (1 + rate / 100)) : Math.round(base * (rate / 100));
  return { taxCents, rate, included };
}

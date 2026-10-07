import { supabase } from '@/api/supabaseClient';

// Storefront-side data access that must NOT go through direct table access:
// the carts table holds every shopper's e-mail and the discount table holds
// every merchant's codes, so anonymous visitors only get scoped RPCs
// (a cart is addressed by tenant + its private random session id; a discount
// is looked up by its exact code).

export async function cartGet(tenantId, sessionId) {
  const { data, error } = await supabase.rpc('storefront_cart_get', { p_tenant_id: tenantId, p_session_id: sessionId });
  if (error) throw error;
  return data || null;
}

export async function cartSave(tenantId, sessionId, items, subtotal, currency) {
  const { data, error } = await supabase.rpc('storefront_cart_save', {
    p_tenant_id: tenantId, p_session_id: sessionId, p_items: items,
    p_total_cents: Math.round(subtotal * 100), p_currency: currency,
  });
  if (error) throw error;
  return data;
}

export async function cartSetEmail(tenantId, sessionId, email, name = null) {
  const { error } = await supabase.rpc('storefront_cart_set_email', { p_tenant_id: tenantId, p_session_id: sessionId, p_email: email, p_name: name });
  if (error) throw error;
}

export async function cartRecover(tenantId, sessionId) {
  const { error } = await supabase.rpc('storefront_cart_recover', { p_tenant_id: tenantId, p_session_id: sessionId });
  if (error) throw error;
}

export async function validateDiscount(tenantId, code) {
  const { data, error } = await supabase.rpc('storefront_validate_discount', { p_tenant_id: tenantId, p_code: code });
  if (error) throw error;
  return data || null;
}

export async function getOrderStatus(tenantId, ref, email = null) {
  const { data, error } = await supabase.rpc('storefront_order_status', { p_tenant_id: tenantId, p_ref: ref, p_email: email });
  if (error) throw error;
  return data || null;
}

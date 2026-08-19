import { supabase, isLocalAuthMode } from './supabase';
import type { StoreProduct, StoreOrder } from './app-state';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns a valid UUID for a record id, generating a fresh one if the
 *  existing id predates the Supabase schema (e.g. legacy `p-171234...`
 *  ids). Stable across calls for ids that are already valid UUIDs. */
export function ensureUuidId(id: string): string {
  return UUID_RE.test(id) ? id : crypto.randomUUID();
}

/** True once real Supabase credentials are configured and active. In local
 *  fallback mode there is no backend to sync to, so localStorage stays the
 *  sole source of truth exactly like before this change — nothing about
 *  local/demo behavior changes. */
export function isCloudSyncActive(): boolean {
  return !isLocalAuthMode();
}

let cachedTenantId: string | null | undefined;

/** Resolves the current user's tenant id from Supabase. Does not create a
 *  tenant — onboarding already does that. Returns null if unauthenticated,
 *  offline, or no tenant row exists yet (dashboard falls back to local
 *  storage in that case, same as before). */
export async function getCurrentTenantId(): Promise<string | null> {
  if (!isCloudSyncActive()) return null;
  if (cachedTenantId !== undefined) return cachedTenantId;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    cachedTenantId = (data as { id: string }).id;
    return cachedTenantId;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

function productToRow(tenantId: string, p: StoreProduct) {
  return {
    id: ensureUuidId(p.id),
    tenant_id: tenantId,
    name: p.name,
    description: p.description || null,
    price_cents: Math.round((p.price || 0) * 100),
    currency: p.currency || 'XOF',
    stock: p.stock || 0,
    status: p.status,
    category: p.category || null,
    subcategory: p.subcategory || null,
    images: p.images && p.images.length ? p.images : (p.image ? [p.image] : []),
  };
}

function rowToProduct(row: Record<string, any>): StoreProduct {
  const images: string[] = Array.isArray(row.images) ? row.images : [];
  return {
    id: row.id,
    name: row.name,
    price: (row.price_cents || 0) / 100,
    stock: row.stock || 0,
    status: row.status === 'out_of_stock' ? 'out_of_stock' : 'active',
    currency: row.currency || 'XOF',
    category: row.category || undefined,
    subcategory: row.subcategory || undefined,
    images,
    image: images[0] || undefined,
    description: row.description || undefined,
  };
}

/** Pulls the tenant's products from Supabase, or null if cloud sync isn't
 *  available (caller should keep using the local cache in that case). */
export async function fetchCloudProducts(): Promise<StoreProduct[] | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error || !data) return null;
  return (data as Record<string, any>[]).map(rowToProduct);
}

/** Best-effort push of the full product list to Supabase. Failures are
 *  swallowed on purpose — localStorage remains authoritative on this
 *  device regardless of cloud sync outcome. */
export async function pushCloudProducts(products: StoreProduct[]): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId || products.length === 0) return;
  try {
    await supabase.from('products').upsert(products.map(p => productToRow(tenantId, p)));
  } catch {
    // Offline or RLS mismatch — ignore, local cache still authoritative.
  }
}

export async function deleteCloudProduct(id: string): Promise<void> {
  if (!(await getCurrentTenantId())) return;
  try {
    await supabase.from('products').delete().eq('id', id);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

function orderToRow(tenantId: string, o: StoreOrder) {
  return {
    id: ensureUuidId(o.id),
    tenant_id: tenantId,
    customer_name: o.customer,
    total_cents: Math.round((o.total || 0) * 100),
    currency: o.currency || 'XOF',
    status: o.status,
    order_number: o.orderNumber || o.id,
    payment_method: o.payment,
    items: o.items || [],
  };
}

function rowToOrder(row: Record<string, any>): StoreOrder {
  return {
    id: row.id,
    customer: row.customer_name || 'Client',
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : '',
    total: (row.total_cents || 0) / 100,
    status: row.status,
    payment: row.payment_method || '',
    currency: row.currency || 'XOF',
    items: Array.isArray(row.items) ? row.items : [],
    orderNumber: row.order_number || row.id,
  };
}

export async function fetchCloudOrders(): Promise<StoreOrder[] | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error || !data) return null;
  return (data as Record<string, any>[]).map(rowToOrder);
}

export async function pushCloudOrders(orders: StoreOrder[]): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId || orders.length === 0) return;
  try {
    await supabase.from('orders').upsert(orders.map(o => orderToRow(tenantId, o)));
  } catch {
    // ignore — local cache still authoritative.
  }
}

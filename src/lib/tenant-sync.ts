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

// ---------------------------------------------------------------------------
// Generic helper: builds a fetch/push/delete triplet for a simple tenant-
// scoped table, following the exact same best-effort pattern as products
// and orders above. Keeps the per-entity code below to just field mapping.
// ---------------------------------------------------------------------------

async function fetchCloudRows<T>(table: string, mapRow: (row: Record<string, any>) => T): Promise<T[] | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;
  const { data, error } = await supabase.from(table).select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (error || !data) return null;
  return (data as Record<string, any>[]).map(mapRow);
}

async function pushCloudRows(table: string, rows: Record<string, any>[]): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId || rows.length === 0) return;
  try {
    await supabase.from(table).upsert(rows);
  } catch {
    // ignore — local cache still authoritative.
  }
}

async function deleteCloudRow(table: string, id: string): Promise<void> {
  if (!(await getCurrentTenantId())) return;
  try {
    await supabase.from(table).delete().eq('id', id);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
import type { Customer, Discount, StaffMember, Campaign } from './app-state';

function customerToRow(tenantId: string, c: Customer) {
  return {
    id: ensureUuidId(c.id),
    tenant_id: tenantId,
    name: c.name,
    email: c.email,
    phone: c.phone || null,
    country: c.country || null,
    city: c.city || null,
    segment: c.segment,
    tags: c.tags || [],
    notes: c.notes || null,
    total_spent_cents: Math.round((c.totalSpent || 0) * 100),
    orders_count: c.ordersCount || 0,
  };
}

function rowToCustomer(row: Record<string, any>): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    country: row.country || undefined,
    city: row.city || undefined,
    ordersCount: row.orders_count || 0,
    totalSpent: (row.total_spent_cents || 0) / 100,
    currency: 'XOF',
    segment: row.segment || 'new',
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at ? row.created_at.slice(0, 10) : '',
    notes: row.notes || undefined,
  };
}

export const fetchCloudCustomers = () => fetchCloudRows('customers', rowToCustomer);
export async function pushCloudCustomers(customers: Customer[]): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  await pushCloudRows('customers', customers.map(c => customerToRow(tenantId, c)));
}
export const deleteCloudCustomer = (id: string) => deleteCloudRow('customers', id);

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

function discountToRow(tenantId: string, d: Discount) {
  return {
    id: ensureUuidId(d.id),
    tenant_id: tenantId,
    code: d.code,
    title: d.title,
    type: d.type,
    value: d.value,
    currency: d.currency || null,
    min_order: d.minOrder ?? null,
    usage_limit: d.usageLimit ?? null,
    used_count: d.usedCount || 0,
    status: d.status,
    starts_at: d.startsAt || null,
    ends_at: d.endsAt || null,
  };
}

function rowToDiscount(row: Record<string, any>): Discount {
  return {
    id: row.id,
    code: row.code,
    title: row.title || '',
    type: row.type,
    value: Number(row.value) || 0,
    currency: row.currency || undefined,
    minOrder: row.min_order ?? undefined,
    usageLimit: row.usage_limit ?? undefined,
    usedCount: row.used_count || 0,
    status: row.status,
    startsAt: row.starts_at || undefined,
    endsAt: row.ends_at || undefined,
    createdAt: row.created_at ? row.created_at.slice(0, 10) : '',
  };
}

export const fetchCloudDiscounts = () => fetchCloudRows('discounts', rowToDiscount);
export async function pushCloudDiscounts(discounts: Discount[]): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  await pushCloudRows('discounts', discounts.map(d => discountToRow(tenantId, d)));
}
export const deleteCloudDiscount = (id: string) => deleteCloudRow('discounts', id);

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

function staffToRow(tenantId: string, s: StaffMember) {
  return {
    id: ensureUuidId(s.id),
    tenant_id: tenantId,
    name: s.name,
    email: s.email,
    role: s.role,
    status: s.status,
    permissions: s.permissions || [],
    last_active: s.lastActive || null,
  };
}

function rowToStaff(row: Record<string, any>): StaffMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    lastActive: row.last_active || undefined,
    createdAt: row.created_at ? row.created_at.slice(0, 10) : '',
  };
}

export const fetchCloudStaff = () => fetchCloudRows('staff_members', rowToStaff);
export async function pushCloudStaff(staff: StaffMember[]): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  await pushCloudRows('staff_members', staff.map(s => staffToRow(tenantId, s)));
}
export const deleteCloudStaff = (id: string) => deleteCloudRow('staff_members', id);

// ---------------------------------------------------------------------------
// Marketing campaigns
// ---------------------------------------------------------------------------

function campaignToRow(tenantId: string, c: Campaign) {
  return {
    id: ensureUuidId(c.id),
    tenant_id: tenantId,
    name: c.name,
    channel: c.channel,
    audience: c.audience || 0,
    status: c.status,
    sent_count: c.sent || 0,
    open_rate: c.sent > 0 ? Math.round((c.opened / c.sent) * 1000) / 10 : 0,
    clicked_count: c.clicked || 0,
    revenue_cents: Math.round((c.revenue || 0) * 100),
    currency: c.currency || 'XOF',
  };
}

function rowToCampaign(row: Record<string, any>): Campaign {
  const sent = row.sent_count || 0;
  const opened = Math.round(((row.open_rate || 0) / 100) * sent);
  return {
    id: row.id,
    name: row.name,
    channel: row.channel || 'email',
    status: row.status,
    audience: row.audience || sent,
    sent,
    opened,
    clicked: row.clicked_count || 0,
    revenue: (row.revenue_cents || 0) / 100,
    currency: row.currency || 'XOF',
    createdAt: row.created_at ? row.created_at.slice(0, 10) : '',
  };
}

export const fetchCloudCampaigns = () => fetchCloudRows('marketing_campaigns', rowToCampaign);
export async function pushCloudCampaigns(campaigns: Campaign[]): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  await pushCloudRows('marketing_campaigns', campaigns.map(c => campaignToRow(tenantId, c)));
}
export const deleteCloudCampaign = (id: string) => deleteCloudRow('marketing_campaigns', id);

// ---------------------------------------------------------------------------
// Theme config (single JSON blob per tenant — mirrors the exact shape
// already used in localStorage via getShopTheme/saveShopTheme, no
// relational redesign).
// ---------------------------------------------------------------------------

export async function fetchCloudTheme<T = any>(): Promise<T | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;
  const { data, error } = await supabase.from('theme_configs').select('config').eq('tenant_id', tenantId).maybeSingle();
  if (error || !data) return null;
  return data.config as T;
}

export async function pushCloudTheme(config: unknown): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  try {
    await supabase.from('theme_configs').upsert({ tenant_id: tenantId, config, updated_at: new Date().toISOString() });
  } catch {
    // ignore — local cache still authoritative.
  }
}

// ---------------------------------------------------------------------------
// CMS pages (single JSON blob per tenant, mirrors src/lib/cms.ts exactly).
// ---------------------------------------------------------------------------

export async function fetchCloudCmsPages<T = any>(): Promise<T[] | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;
  const { data, error } = await supabase.from('cms_pages').select('pages').eq('tenant_id', tenantId).maybeSingle();
  if (error || !data) return null;
  return data.pages as T[];
}

export async function pushCloudCmsPages(pages: unknown[]): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  try {
    await supabase.from('cms_pages').upsert({ tenant_id: tenantId, pages, updated_at: new Date().toISOString() });
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Generic tenant settings (checkout prefs, customer accounts mode, tax
// rate, notification toggles, language, privacy text — small blob, one row
// per tenant, same pattern as theme_configs).
// ---------------------------------------------------------------------------

export async function fetchCloudSettings<T = Record<string, any>>(): Promise<T | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;
  const { data, error } = await supabase.from('tenants').select('settings').eq('id', tenantId).maybeSingle();
  if (error || !data) return null;
  return (data.settings || {}) as T;
}

/** Anon-safe variant for the public storefront — a visitor has no
 *  session, so settings must be looked up by tenantId directly. Relies
 *  on the same anon SELECT policy already used to resolve the tenant
 *  itself (published tenants only). */
export async function fetchCloudSettingsFor<T = Record<string, any>>(tenantId: string): Promise<T | null> {
  try {
    const { data, error } = await supabase.from('tenants').select('settings').eq('id', tenantId).maybeSingle();
    if (error || !data) return null;
    return (data.settings || {}) as T;
  } catch {
    return null;
  }
}

export async function pushCloudSettings(settings: Record<string, any>): Promise<void> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  try {
    await supabase.from('tenants').update({ settings }).eq('id', tenantId);
  } catch {
    // ignore — local cache still authoritative.
  }
}

// ---------------------------------------------------------------------------
// Vendor payment gateways — each merchant's own Flutterwave/Paystack/Stripe
// etc. credentials, used for THEIR storefront checkout (separate from the
// platform's own Flutterwave subscription billing in functions/api/
// subscriptions/). Secrets are encrypted server-side (AES-256-GCM, key held
// only in the Cloudflare Pages environment) via /api/vendor-gateways/save
// and /list — the client never writes plaintext credentials to Supabase and
// never receives the real secret back, only a masked preview like
// "••••ab12". See functions/_lib/crypto.ts.
// ---------------------------------------------------------------------------

export type VendorGatewayStatus = {
  gateway: string;
  isActive: boolean;
  configured: boolean;
  apiKeyMasked: string;
  apiSecretMasked: string;
  clientIdMasked: string;
};

async function authedFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return null;
  return fetch(path, {
    ...init,
    headers: { ...(init?.headers || {}), Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchCloudGateways(): Promise<VendorGatewayStatus[] | null> {
  if (!isCloudSyncActive()) return null;
  try {
    const res = await authedFetch('/api/vendor-gateways/list');
    if (!res || !res.ok) return null;
    const result: { gateways?: VendorGatewayStatus[] } = await res.json();
    return result.gateways || [];
  } catch {
    return null;
  }
}

/** apiKey/apiSecret/clientId left blank keep the currently stored value —
 *  the client never holds the real secret after the first save, so it can
 *  only send what actually changed. */
export async function pushCloudGateway(g: { gateway: string; apiKey?: string; apiSecret?: string; clientId?: string; isActive: boolean }): Promise<boolean> {
  if (!isCloudSyncActive()) return false;
  try {
    const res = await authedFetch('/api/vendor-gateways/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g),
    });
    return !!res && res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// PUBLIC storefront resolution — the critical piece that was missing.
// These need NO authentication: any visitor must be able to resolve a
// merchant's public store by slug and read their catalog/theme/pages.
// Relies on the anon RLS policies added alongside tenants.slug.
// ---------------------------------------------------------------------------

export type PublicTenant = { id: string; name: string; currency: string; plan: string };

/** Resolves a merchant's public storefront by its slug
 *  (maboutique.os.liafrik.com → slug "maboutique"). Returns null if the
 *  slug doesn't exist, isn't published yet, or Supabase isn't configured
 *  (local/demo mode) — callers should fall back to local behavior then. */
export async function resolvePublicTenant(slug: string): Promise<PublicTenant | null> {
  if (isLocalAuthMode() || !slug) return null;
  try {
    const { data, error } = await supabase.from('tenants').select('id,name,currency,plan').eq('slug', slug).maybeSingle();
    if (error || !data) return null;
    return data as PublicTenant;
  } catch {
    return null;
  }
}

export async function fetchPublicProducts(tenantId: string) {
  const { data, error } = await supabase.from('products').select('*').eq('tenant_id', tenantId).eq('status', 'active');
  if (error || !data) return null;
  return (data as Record<string, any>[]).map(rowToProduct);
}

export async function fetchPublicTheme<T = any>(tenantId: string): Promise<T | null> {
  const { data, error } = await supabase.from('theme_configs').select('config').eq('tenant_id', tenantId).maybeSingle();
  if (error || !data) return null;
  return data.config as T;
}

export async function fetchPublicCmsPages<T = any>(tenantId: string): Promise<T[] | null> {
  const { data, error } = await supabase.from('cms_pages').select('pages').eq('tenant_id', tenantId).maybeSingle();
  if (error || !data) return null;
  return data.pages as T[];
}

/** Creates an order directly against a specific tenant — used by the
 *  public storefront checkout, where the buyer is anonymous and there is
 *  no logged-in session to resolve a tenant from (unlike the merchant
 *  dashboard's pushCloudOrders, which uses the current session). */
export async function createPublicOrder(tenantId: string, order: StoreOrder): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').insert(orderToRow(tenantId, order));
    return !error;
  } catch {
    return false;
  }
}

/** Real destination for the storefront's newsletter/email-signup
 *  sections — previously showed a success message without saving the
 *  email anywhere. Anonymous-safe (storefront visitors have no session). */
export async function subscribeToNewsletter(tenantId: string, email: string, source?: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('newsletter_subscribers').insert({ tenant_id: tenantId, email: email.toLowerCase().trim(), source: source || null });
    // Duplicate email (already subscribed) is not a failure from the
    // visitor's point of view — they're already on the list either way.
    return !error || error.message?.includes('duplicate') || error.code === '23505';
  } catch {
    return false;
  }
}

/** Fires the merchant's configured order webhook (Settings > Customer
 *  events), if one is set. Best-effort, fire-and-forget — a failing or
 *  slow webhook must never block order creation for the buyer. Reads the
 *  URL from the tenant settings blob directly (works both from an
 *  authenticated dashboard session and from an anonymous storefront
 *  checkout, since it queries by tenantId rather than the current user). */
export async function fireOrderWebhook(tenantId: string, order: StoreOrder): Promise<void> {
  try {
    const { data } = await supabase.from('tenants').select('settings').eq('id', tenantId).maybeSingle();
    const url = data?.settings?.orderWebhookUrl;
    if (!url) return;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'order.created', order }),
    }).catch(() => {
      // Best-effort — a merchant's own endpoint being down must never
      // affect order creation.
    });
  } catch {
    // ignore
  }
}

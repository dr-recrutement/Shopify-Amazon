export type CartItem = {
  id: number;
  name: string;
  variant: string;
  price: number;
  qty: number;
  currency: string;
};

export type StoreProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: 'active' | 'out_of_stock';
  currency: string;
  category?: string;
  subcategory?: string;
  /** Gallery of uploaded images (base64 data URLs) — never external links.
   *  images[0] is the primary image shown in grids and the storefront. */
  images?: string[];
  /** Single-image legacy field. Kept for backward compatibility with older
   *  stored products; new products write `images` instead. */
  image?: string;
  /** Short marketing description shown on the storefront + product card. */
  description?: string;
};

export type StoreOrder = {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  payment: string;
  currency: string;
  items: Array<{ name: string; qty: number; price: number }>;
  /** Human-readable order number shown to the merchant/customer (e.g.
   *  "LA-1755..."). Kept separate from `id` because `id` must be a valid
   *  UUID once synced to Supabase. Falls back to `id` when absent. */
  orderNumber?: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  createdAt: string;
  status: 'open' | 'resolved';
};

const CART_KEY = 'liafrikos_cart';
const PRODUCTS_KEY = 'liafrikos_products';
const ORDERS_KEY = 'liafrikos_orders';
const SUPPORT_TICKETS_KEY = 'liafrikos_support_tickets';
const SHOP_PROFILE_KEY = 'liafrikos_shop_profile';
const CATEGORIES_KEY = 'liafrikos_categories';

export function getTenantStorageKey(baseKey: string): string {
  if (typeof window === 'undefined') return baseKey;
  try {
    const rawSession = window.localStorage.getItem('liafrikos_auth_session');
    if (rawSession) {
      const session = JSON.parse(rawSession);
      const emailOrId = session?.user?.email || session?.user?.id;
      if (emailOrId) {
        const suffix = emailOrId.toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
        return `${baseKey}_${suffix}`;
      }
    }
  } catch {
    // ignore
  }
  return baseKey;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(getTenantStorageKey(key));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getTenantStorageKey(key), JSON.stringify(value));
}

export function getCartItems(): CartItem[] {
  return readStorage<CartItem[]>(CART_KEY, [
    { id: 1, name: 'Robe wax traditionnelle', variant: 'Taille M', price: 15000, qty: 1, currency: 'XOF' },
    { id: 2, name: 'Sac en cuir artisanal', variant: 'Marron', price: 25000, qty: 2, currency: 'XOF' },
  ]);
}

export function saveCartItems(items: CartItem[]) {
  writeStorage(CART_KEY, items);
}

export function clearCart() {
  writeStorage(CART_KEY, []);
}

export function getProducts(): StoreProduct[] {
  return readStorage<StoreProduct[]>(PRODUCTS_KEY, [
    { id: 'p1', name: 'Robe wax traditionnelle', price: 15000, stock: 12, status: 'active', currency: 'XOF', category: 'Mode Femme', subcategory: 'Robes' },
    { id: 'p2', name: 'Sac en cuir artisanal', price: 25000, stock: 5, status: 'active', currency: 'XOF', category: 'Accessoires', subcategory: 'Sacs' },
    { id: 'p3', name: 'Boucles d’oreilles dorées', price: 8000, stock: 0, status: 'out_of_stock', currency: 'XOF', category: 'Bijoux', subcategory: 'Boucles d’oreilles' },
  ]);
}

export type CategoryMap = {
  [category: string]: string[]; // category name maps to list of subcategories
};

export function getCategories(): CategoryMap {
  return readStorage<CategoryMap>(CATEGORIES_KEY, {
    'Mode Femme': ['Robes', 'Jupes', 'Pagne Wax'],
    'Accessoires': ['Sacs', 'Ceintures', 'Chapeaux'],
    'Bijoux': ['Boucles d’oreilles', 'Colliers', 'Bracelets'],
  });
}

export function saveCategories(categories: CategoryMap) {
  writeStorage(CATEGORIES_KEY, categories);
}

export function saveProducts(products: StoreProduct[]) {
  try {
    writeStorage(PRODUCTS_KEY, products);
    return true;
  } catch (err) {
    // localStorage quota exceeded — images are large base64 strings.
    // Surface a clear signal so the UI can inform the merchant.
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      return false;
    }
    throw err;
  }
}

/** Resolves the primary image of a product, handling both the new `images`
 *  gallery and the legacy single `image` field. */
export function getProductImage(p: StoreProduct): string {
  if (p.images && p.images.length > 0) return p.images[0];
  return p.image || '';
}

/** Resolves the full image gallery of a product (legacy single image is
 *  treated as a 1-element gallery). */
export function getProductImages(p: StoreProduct): string[] {
  if (p.images && p.images.length > 0) return p.images;
  if (p.image) return [p.image];
  return [];
}

export function getOrders(): StoreOrder[] {
  return readStorage<StoreOrder[]>(ORDERS_KEY, [
    {
      id: 'LA-2024-1001',
      customer: 'Aïcha Diallo',
      date: '19 Jul 2026',
      total: 66000,
      status: 'pending',
      payment: 'Orange Money',
      currency: 'XOF',
      items: [
        { name: 'Robe wax traditionnelle', qty: 1, price: 15000 },
        { name: 'Sac en cuir artisanal', qty: 2, price: 25000 },
      ],
    },
    {
      id: 'LA-2024-1002',
      customer: 'Kwame Mensah',
      date: '18 Jul 2026',
      total: 32000,
      status: 'paid',
      payment: 'Paystack',
      currency: 'GHS',
      items: [{ name: 'Kit de support', qty: 1, price: 32000 }],
    },
  ]);
}

export function saveOrder(order: StoreOrder) {
  const orders = getOrders();
  writeStorage(ORDERS_KEY, [order, ...orders]);
}

export function saveOrdersList(orders: StoreOrder[]) {
  writeStorage(ORDERS_KEY, orders);
}

export function getSupportTickets(): SupportTicket[] {
  return readStorage<SupportTicket[]>(SUPPORT_TICKETS_KEY, []);
}

export function saveSupportTicket(ticket: SupportTicket) {
  const tickets = getSupportTickets();
  writeStorage(SUPPORT_TICKETS_KEY, [ticket, ...tickets]);
}

export function saveSupportTickets(tickets: SupportTicket[]) {
  writeStorage(SUPPORT_TICKETS_KEY, tickets);
}

// ---------------------------------------------------------------------------
// Customers — tenant-scoped CRM. Each seller manages their own customer base.
// ---------------------------------------------------------------------------

export type CustomerSegment = 'vip' | 'new' | 'regular' | 'inactive';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  ordersCount: number;
  totalSpent: number;
  currency: string;
  segment: CustomerSegment;
  tags?: string[];
  createdAt: string;
  notes?: string;
};

const CUSTOMERS_KEY = 'liafrikos_customers';

export function getCustomers(): Customer[] {
  return readStorage<Customer[]>(CUSTOMERS_KEY, [
    { id: 'c1', name: 'Aïcha Diallo', email: 'aicha@example.com', phone: '+225 07 00 00 01', country: 'CI', city: 'Abidjan', ordersCount: 3, totalSpent: 45000, currency: 'XOF', segment: 'vip', createdAt: '2026-05-10', tags: ['Fidèle'] },
    { id: 'c2', name: 'Kwame Mensah', email: 'kwame@example.com', phone: '+233 24 000 002', country: 'GH', city: 'Accra', ordersCount: 1, totalSpent: 320, currency: 'GHS', segment: 'new', createdAt: '2026-07-20', tags: [] },
    { id: 'c3', name: 'Fatou Ndiaye', email: 'fatou@example.com', phone: '+221 77 000 003', country: 'SN', city: 'Dakar', ordersCount: 0, totalSpent: 0, currency: 'XOF', segment: 'inactive', createdAt: '2026-03-01', tags: [] },
  ]);
}

export function saveCustomers(customers: Customer[]) {
  writeStorage(CUSTOMERS_KEY, customers);
}

// ---------------------------------------------------------------------------
// Discounts — promo codes and automatic discounts (Shopify Discounts).
// ---------------------------------------------------------------------------

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type DiscountStatus = 'active' | 'scheduled' | 'expired';

export type Discount = {
  id: string;
  code: string;
  title: string;
  type: DiscountType;
  value: number; // percentage (0-100) or fixed amount
  currency?: string;
  minOrder?: number;
  usageLimit?: number;
  usedCount: number;
  status: DiscountStatus;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
};

const DISCOUNTS_KEY = 'liafrikos_discounts';

export function getDiscounts(): Discount[] {
  return readStorage<Discount[]>(DISCOUNTS_KEY, [
    { id: 'd1', code: 'BIENVENUE10', title: 'Bienvenue 10%', type: 'percentage', value: 10, currency: 'XOF', minOrder: 0, usageLimit: 100, usedCount: 12, status: 'active', createdAt: '2026-06-01', startsAt: '2026-06-01' },
    { id: 'd2', code: 'LIVRAISONFREE', title: 'Livraison offerte', type: 'free_shipping', value: 0, currency: 'XOF', minOrder: 35000, usageLimit: 50, usedCount: 5, status: 'active', createdAt: '2026-06-15' },
    { id: 'd3', code: 'VIP20', title: 'VIP -20%', type: 'percentage', value: 20, currency: 'XOF', minOrder: 50000, usageLimit: 20, usedCount: 0, status: 'scheduled', createdAt: '2026-07-01', startsAt: '2026-12-01' },
  ]);
}

export function saveDiscounts(discounts: Discount[]) {
  writeStorage(DISCOUNTS_KEY, discounts);
}

// ---------------------------------------------------------------------------
// Staff / Team — multi-tenant staff management with roles & permissions.
// ---------------------------------------------------------------------------

export type StaffRole = 'admin' | 'manager' | 'staff' | 'support';

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'active' | 'invited' | 'suspended';
  permissions: string[];
  lastActive?: string;
  createdAt: string;
};

const STAFF_KEY = 'liafrikos_staff';

export function getStaff(): StaffMember[] {
  return readStorage<StaffMember[]>(STAFF_KEY, [
    { id: 's1', name: 'Aïcha Diallo (Vous)', email: 'aicha@example.com', role: 'admin', status: 'active', permissions: ['all'], lastActive: '2026-08-08', createdAt: '2026-01-01' },
    { id: 's2', name: 'Moussa Traoré', email: 'moussa@example.com', role: 'manager', status: 'active', permissions: ['products', 'orders', 'customers'], lastActive: '2026-08-07', createdAt: '2026-03-15' },
  ]);
}

export function saveStaff(staff: StaffMember[]) {
  writeStorage(STAFF_KEY, staff);
}

// ---------------------------------------------------------------------------
// Markets — internationalization config (active countries, currencies).
// ---------------------------------------------------------------------------

export type MarketConfig = {
  activeCountries: string[];
  defaultCountry: string;
  currencies: string[];
  defaultCurrency: string;
};

const MARKETS_KEY = 'liafrikos_markets';

export function getMarketConfig(): MarketConfig {
  return readStorage<MarketConfig>(MARKETS_KEY, {
    activeCountries: ['CI', 'GH', 'NG'],
    defaultCountry: 'CI',
    currencies: ['XOF', 'GHS', 'NGN'],
    defaultCurrency: 'XOF',
  });
}

export function saveMarketConfig(config: MarketConfig) {
  writeStorage(MARKETS_KEY, config);
}

// ---------------------------------------------------------------------------
// Automations — workflow rules (Shopify Flow style).
// ---------------------------------------------------------------------------

export type AutomationTrigger = 'order_created' | 'order_paid' | 'customer_signup' | 'low_stock' | 'abandoned_cart';
export type AutomationAction = 'send_email' | 'create_discount' | 'tag_customer' | 'notify_staff' | 'restock_alert';

export type Automation = {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  enabled: boolean;
  runs: number;
  createdAt: string;
};

const AUTOMATIONS_KEY = 'liafrikos_automations';

export function getAutomations(): Automation[] {
  return readStorage<Automation[]>(AUTOMATIONS_KEY, [
    { id: 'a1', name: 'Email de bienvenue', trigger: 'customer_signup', action: 'send_email', enabled: true, runs: 47, createdAt: '2026-05-01' },
    { id: 'a2', name: 'Alerte stock bas', trigger: 'low_stock', action: 'restock_alert', enabled: true, runs: 8, createdAt: '2026-06-01' },
    { id: 'a3', name: 'Relance panier abandonné', trigger: 'abandoned_cart', action: 'send_email', enabled: false, runs: 0, createdAt: '2026-07-01' },
  ]);
}

export function saveAutomations(automations: Automation[]) {
  writeStorage(AUTOMATIONS_KEY, automations);
}

// ---------------------------------------------------------------------------
// Marketing campaigns — email/SMS/social campaigns.
// ---------------------------------------------------------------------------

export type CampaignChannel = 'email' | 'sms' | 'social';
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'active';

export type Campaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  audience: number;
  sent: number;
  opened: number;
  clicked: number;
  revenue: number;
  currency: string;
  createdAt: string;
};

const CAMPAIGNS_KEY = 'liafrikos_campaigns';

export function getCampaigns(): Campaign[] {
  return readStorage<Campaign[]>(CAMPAIGNS_KEY, [
    { id: 'mc1', name: 'Soldes d\'été', channel: 'email', status: 'sent', audience: 120, sent: 120, opened: 78, clicked: 34, revenue: 85000, currency: 'XOF', createdAt: '2026-07-15' },
    { id: 'mc2', name: 'Nouvelle collection', channel: 'sms', status: 'scheduled', audience: 85, sent: 0, opened: 0, clicked: 0, revenue: 0, currency: 'XOF', createdAt: '2026-08-01' },
    { id: 'mc3', name: 'Black Friday', channel: 'social', status: 'draft', audience: 0, sent: 0, opened: 0, clicked: 0, revenue: 0, currency: 'XOF', createdAt: '2026-08-05' },
  ]);
}

export function saveCampaigns(campaigns: Campaign[]) {
  writeStorage(CAMPAIGNS_KEY, campaigns);
}

// ---------------------------------------------------------------------------
// Chat messages — customer support inbox.
// ---------------------------------------------------------------------------

export type ChatMessage = {
  id: string;
  customerName: string;
  customerEmail: string;
  message: string;
  fromMerchant: boolean;
  read: boolean;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  messages: ChatMessage[];
};

const CHAT_KEY = 'liafrikos_chat_threads';

export function getChatThreads(): ChatThread[] {
  return readStorage<ChatThread[]>(CHAT_KEY, [
    {
      id: 't1', customerName: 'Aïcha Diallo', customerEmail: 'aicha@example.com',
      lastMessage: 'Bonjour, ma commande est-elle expédiée ?', lastAt: '2026-08-08 10:30', unread: 1,
      messages: [
        { id: 'm1', customerName: 'Aïcha Diallo', customerEmail: 'aicha@example.com', message: 'Bonjour, ma commande est-elle expédiée ?', fromMerchant: false, read: false, createdAt: '2026-08-08 10:30' },
      ],
    },
    {
      id: 't2', customerName: 'Kwame Mensah', customerEmail: 'kwame@example.com',
      lastMessage: 'Merci pour la livraison rapide !', lastAt: '2026-08-07 16:45', unread: 0,
      messages: [
        { id: 'm2', customerName: 'Kwame Mensah', customerEmail: 'kwame@example.com', message: 'Merci pour la livraison rapide !', fromMerchant: false, read: true, createdAt: '2026-08-07 16:45' },
      ],
    },
  ]);
}

export function saveChatThreads(threads: ChatThread[]) {
  writeStorage(CHAT_KEY, threads);
}

export function getShopProfile() {
  return readStorage<{ name: string; country: string; plan: string; currency: string; slug?: string; customDomain?: string }>(SHOP_PROFILE_KEY, {
    name: 'Ma Boutique',
    country: 'CI',
    plan: 'premium',
    currency: 'XOF',
  });
}

export function saveShopProfile(profile: { name: string; country: string; plan: string; currency: string; slug?: string; customDomain?: string }) {
  writeStorage(SHOP_PROFILE_KEY, profile);
}

/** Returns the merchant's auto-assigned temporary subdomain on the platform. */
export function getShopSubdomain(): string {
  const profile = getShopProfile();
  const base = (profile.slug || profile.name || 'ma-boutique')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'ma-boutique';
  return `${base}.os.liafrik.com`;
}

/** Full temporary URL the platform assigns to every shop. */
export function getShopTemporaryUrl(): string {
  return `https://${getShopSubdomain()}`;
}

export type ShopDomain = {
  domain: string;
  type: 'platform' | 'custom' | 'external';
  status: 'active' | 'pending' | 'error';
  isPrimary: boolean;
  createdAt: string;
};

const DOMAINS_KEY = 'liafrikos_domains';

export function getDomains(): ShopDomain[] {
  const subdomain = getShopSubdomain();
  return readStorage<ShopDomain[]>(DOMAINS_KEY, [
    { domain: subdomain, type: 'platform', status: 'active', isPrimary: true, createdAt: 'Créé à l’inscription' },
  ]);
}

export function saveDomains(domains: ShopDomain[]) {
  writeStorage(DOMAINS_KEY, domains);
}

/** Adds a custom domain and marks it primary (demotes others). */
export function addCustomDomain(domain: string): ShopDomain[] {
  const clean = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!clean) return getDomains();
  const current = getDomains().map(d => ({ ...d, isPrimary: false }));
  const entry: ShopDomain = { domain: clean, type: 'custom', status: 'pending', isPrimary: true, createdAt: new Date().toLocaleDateString('fr-FR') };
  const next = [entry, ...current.filter(d => d.domain !== clean)];
  saveDomains(next);
  // Persist the primary custom domain on the shop profile so the storefront can resolve it.
  saveShopProfile({ ...getShopProfile(), customDomain: clean });
  return next;
}

/** Resolves which domain is primary (custom takes priority over platform). */
export function getPrimaryDomain(): string {
  const domains = getDomains();
  const primary = domains.find(d => d.isPrimary) || domains[0];
  return primary?.domain || getShopSubdomain();
}

export type CatalogProductCard = {
  name: string;
  price: number;
  oldPrice: number;
  image: string;
  images: string[];
  rating: number;
  description: string;
  stock: number;
  category?: string;
  id?: string;
};

/** Returns the merchant's active products, mapped to the card shape the
 *  storefront sections expect. `image` is the primary uploaded base64 data
 *  URL; `images` carries the full gallery for product detail / quick view. */
export function getActiveCatalogProducts(): CatalogProductCard[] {
  return getProducts()
    .filter(p => p.status === 'active')
    .map(p => {
      const images = getProductImages(p);
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        oldPrice: Math.round(p.price * 1.2),
        image: images[0] || '',
        images,
        rating: 5,
        description: p.description || '',
        stock: p.stock,
        category: p.category,
      };
    });
}

export type CatalogCategoryCard = { name: string; image: string };

/** Returns the merchant's categories, mapped to the card shape the storefront
 *  category sections expect. */
export function getCatalogCategories(): CatalogCategoryCard[] {
  return Object.keys(getCategories()).map(cat => ({ name: cat, image: '' }));
}

// ---------------------------------------------------------------------------
// SHOP THEME PERSISTENCE
// ---------------------------------------------------------------------------
const THEME_CONFIG_KEY = 'liafrikos_theme_config';

export function getShopTheme<T = any>(fallback: T): T {
  return readStorage<T>(THEME_CONFIG_KEY, fallback);
}

export function saveShopTheme(theme: any) {
  writeStorage(THEME_CONFIG_KEY, theme);
}

/** The key the storefront section-renderer checks to decide whether to pull
 *  real catalog products (active) into product-grid / featured-collection. */
export const STOREFRONT_USE_CATALOG = true;

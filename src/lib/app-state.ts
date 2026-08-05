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
  image?: string;
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
    { id: 'p1', name: 'Robe wax traditionnelle', price: 15000, stock: 12, status: 'active', currency: 'XOF', category: 'Mode Femme', subcategory: 'Robes', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600' },
    { id: 'p2', name: 'Sac en cuir artisanal', price: 25000, stock: 5, status: 'active', currency: 'XOF', category: 'Accessoires', subcategory: 'Sacs', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600' },
    { id: 'p3', name: 'Boucles d’oreilles dorées', price: 8000, stock: 0, status: 'out_of_stock', currency: 'XOF', category: 'Bijoux', subcategory: 'Boucles d’oreilles', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600' },
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
  writeStorage(PRODUCTS_KEY, products);
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

export function getShopProfile() {
  return readStorage<{ name: string; country: string; plan: string; currency: string }>(SHOP_PROFILE_KEY, {
    name: 'Ma Boutique',
    country: 'CI',
    plan: 'premium',
    currency: 'XOF',
  });
}

export function saveShopProfile(profile: { name: string; country: string; plan: string; currency: string }) {
  writeStorage(SHOP_PROFILE_KEY, profile);
}

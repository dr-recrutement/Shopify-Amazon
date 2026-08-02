import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  currency: string;
  thumbnail: string | null;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
}

export interface AddToCartInput {
  productId: string;
  name: string;
  priceCents: number;
  currency: string;
  thumbnail: string | null;
  variantId?: string;
  variantLabel?: string;
}

interface CartContextValue {
  items: CartItem[];
  totalCents: number;
  totalItems: number;
  addItem: (item: AddToCartInput, qty?: number) => void;
  updateQuantity: (productId: string, qty: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(tenantId: string) {
  return `liafrik_cart_${tenantId}`;
}

export function CartProvider({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(tenantId));
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
    setHydrated(true);
  }, [tenantId]);

  useEffect(() => {
    if (!hydrated) return; // évite d'écraser le panier stocké avant d'avoir fini de le charger
    try {
      localStorage.setItem(storageKey(tenantId), JSON.stringify(items));
    } catch {
      // stockage plein ou bloqué (navigation privée stricte) — on ignore silencieusement
    }
  }, [items, tenantId, hydrated]);

  const addItem: CartContextValue['addItem'] = (item, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variantId === item.variantId);
      if (existing) {
        return prev.map(i => (i.productId === item.productId && i.variantId === item.variantId ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const updateQuantity = (productId: string, qty: number, variantId?: string) => {
    setItems(prev =>
      qty <= 0
        ? prev.filter(i => !(i.productId === productId && i.variantId === variantId))
        : prev.map(i => (i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i))
    );
  };

  const removeItem = (productId: string, variantId?: string) =>
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)));
  const clearCart = () => setItems([]);

  const totalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalCents, totalItems, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart() doit être utilisé à l'intérieur d'un <CartProvider>.");
  return ctx;
}

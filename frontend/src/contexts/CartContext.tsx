'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { CartItem } from '@/types';
import { useAuth } from './AuthContext';

interface CartCtx {
  items: CartItem[];
  loading: boolean;
  addToCart: (
    productId: number,
    qty?: number,
    size?: string,
    color?: string,
    storage?: string,
    mattress?: string,
    priceOverride?: number
  ) => Promise<void>;
  updateQty: (cartItemId: number, qty: number) => Promise<void>;
  remove: (cartItemId: number) => Promise<void>;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartCtx>({ items: [], loading: false, addToCart: async () => {}, updateQty: async () => {}, remove: async () => {}, clear: () => {}, total: 0, count: 0 });
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const populateCartItems = async (guestItems: CartItem[]): Promise<CartItem[]> => {
    try {
      const products = await api.getProducts();
      const productMap = new Map(products.map((p: any) => [p.id, p]));
      return guestItems.map(item => {
        const prod = productMap.get(item.productId);
        if (prod) {
          return {
            ...item,
            name: prod.name,
            image: prod.image,
            price: item.price || prod.price,
            slug: prod.slug
          };
        }
        return item;
      });
    } catch {
      return guestItems;
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      api.getCart().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
    } else {
      const saved = localStorage.getItem('cs_guest_cart');
      let guestItems: CartItem[] = [];
      try { guestItems = saved ? JSON.parse(saved) : []; } catch { guestItems = []; }
      if (guestItems.length > 0) {
        setLoading(true);
        populateCartItems(guestItems).then(populated => {
          setItems(populated);
          setLoading(false);
        });
      } else {
        setItems([]);
      }
    }
  }, [user]);

  const saveGuest = (cart: CartItem[]) => {
    localStorage.setItem('cs_guest_cart', JSON.stringify(cart));
  };

  const addToCart = async (
    productId: number,
    qty = 1,
    size?: string,
    color?: string,
    storage?: string,
    mattress?: string,
    priceOverride?: number
  ) => {
    if (user) {
      setLoading(true);
      const updated = await api.addToCart(productId, qty, size, color, storage, mattress, priceOverride);
      setItems(updated);
      setLoading(false);
    } else {
      const saved = localStorage.getItem('cs_guest_cart');
      let prev: CartItem[] = [];
      try { prev = saved ? JSON.parse(saved) : []; } catch { prev = []; }

      const existingIndex = prev.findIndex(i =>
        i.productId === productId &&
        (i.selectedSize || '') === (size || '') &&
        (i.selectedColor || '') === (color || '') &&
        (i.selectedStorage || '') === (storage || '') &&
        (i.selectedMattress || '') === (mattress || '')
      );

      let next: CartItem[];
      if (existingIndex > -1) {
        next = prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + qty } : item
        );
      } else {
        const newItem: CartItem = {
          id: Date.now() + Math.random(),
          userId: 0,
          productId,
          quantity: qty,
          name: '',
          image: '',
          price: priceOverride || 0,
          slug: '',
          selectedSize: size || '',
          selectedColor: color || '',
          selectedStorage: storage || '',
          selectedMattress: mattress || ''
        };
        next = [...prev, newItem];
      }
      saveGuest(next);

      const populated = await populateCartItems(next);
      setItems(populated);
    }
  };

  const updateQty = async (cartItemId: number, qty: number) => {
    if (user) {
      const updated = await api.updateCart(cartItemId, qty);
      setItems(updated);
    } else {
      let next: CartItem[] = [];
      setItems(prev => {
        next = qty <= 0 ? prev.filter(i => i.id !== cartItemId) : prev.map(i => i.id === cartItemId ? { ...i, quantity: qty } : i);
        saveGuest(next);
        return next;
      });
    }
  };

  const remove = async (cartItemId: number) => {
    if (user) {
      const updated = await api.removeFromCart(cartItemId);
      setItems(updated);
    } else {
      let next: CartItem[] = [];
      setItems(prev => {
        next = prev.filter(i => i.id !== cartItemId);
        saveGuest(next);
        return next;
      });
    }
  };

  const clear = () => {
    setItems([]);
    localStorage.removeItem('cs_guest_cart');
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return <CartContext.Provider value={{ items, loading, addToCart, updateQty, remove, clear, total, count }}>{children}</CartContext.Provider>;
}

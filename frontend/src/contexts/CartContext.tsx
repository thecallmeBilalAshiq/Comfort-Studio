'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { CartItem } from '@/types';
import { useAuth } from './AuthContext';

interface CartCtx {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: number, qty?: number) => Promise<void>;
  updateQty: (productId: number, qty: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
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

  useEffect(() => {
    if (user) {
      setLoading(true);
      api.getCart().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
    } else {
      const saved = localStorage.getItem('cs_guest_cart');
      try { setItems(saved ? JSON.parse(saved) : []); } catch { setItems([]); }
    }
  }, [user]);

  const saveGuest = (cart: CartItem[]) => {
    localStorage.setItem('cs_guest_cart', JSON.stringify(cart));
  };

  const addToCart = async (productId: number, qty = 1) => {
    if (user) {
      setLoading(true);
      const updated = await api.addToCart(productId, qty);
      setItems(updated);
      setLoading(false);
    } else {
      setItems(prev => {
        const existing = prev.find(i => i.productId === productId);
        let next: CartItem[];
        if (existing) {
          next = prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + qty } : i);
        } else {
          next = [...prev, { id: productId, userId: 0, productId, quantity: qty, name: '', image: '', price: 0, slug: '' }];
        }
        saveGuest(next);
        return next;
      });
    }
  };

  const updateQty = async (productId: number, qty: number) => {
    if (user) {
      const updated = await api.updateCart(productId, qty);
      setItems(updated);
    } else {
      setItems(prev => {
        const next = qty <= 0 ? prev.filter(i => i.productId !== productId) : prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i);
        saveGuest(next);
        return next;
      });
    }
  };

  const remove = async (productId: number) => {
    if (user) {
      const updated = await api.removeFromCart(productId);
      setItems(updated);
    } else {
      setItems(prev => {
        const next = prev.filter(i => i.productId !== productId);
        saveGuest(next);
        return next;
      });
    }
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return <CartContext.Provider value={{ items, loading, addToCart, updateQty, remove, clear, total, count }}>{children}</CartContext.Provider>;
}

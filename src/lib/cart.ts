import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
  variant?: string;
};

const STORAGE_KEY = "atelier-cart-v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

let cache: CartItem[] | null = null;
let cacheSerialized = "";

function refreshCache() {
  if (typeof window === "undefined") {
    cache = EMPTY;
    cacheSerialized = "[]";
    return;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  if (raw !== cacheSerialized || cache === null) {
    cacheSerialized = raw;
    try {
      cache = JSON.parse(raw) as CartItem[];
    } catch {
      cache = EMPTY;
    }
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(items);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cacheSerialized = serialized;
  cache = items;
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const EMPTY: CartItem[] = [];
function getSnapshot(): CartItem[] {
  refreshCache();
  return cache ?? EMPTY;
}
function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = read();
  const key = `${item.productId}::${item.variant ?? ""}`;
  const idx = items.findIndex((i) => `${i.productId}::${i.variant ?? ""}` === key);
  if (idx >= 0) {
    items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
  } else {
    items.push({ ...item, quantity });
  }
  write(items);
}

export function updateQuantity(productId: string, variant: string | undefined, quantity: number) {
  const items = read();
  const key = `${productId}::${variant ?? ""}`;
  const idx = items.findIndex((i) => `${i.productId}::${i.variant ?? ""}` === key);
  if (idx < 0) return;
  if (quantity <= 0) items.splice(idx, 1);
  else items[idx] = { ...items[idx], quantity };
  write(items);
}

export function removeFromCart(productId: string, variant: string | undefined) {
  updateQuantity(productId, variant, 0);
}

export function clearCart() {
  write([]);
}

export function cartSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

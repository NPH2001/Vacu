"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ProductRow } from "@/db/schema";
import { trackEvent } from "@/lib/gtag";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  image: string;
  unit: string;
  qty: number;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  total: number;
  add: (item: ProductRow, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  has: (id: string) => boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "vacu_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restores the saved cart after mount. This has to be an effect: localStorage
  // does not exist during the server render, so seeding it via useState would
  // make the server and client disagree and break hydration. The one extra
  // render on mount is the intended cost — `hydrated` then guards the writer
  // effect below so an empty initial state never overwrites the saved cart.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see above: no SSR-safe alternative without moving the cart to an external store.
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = (item: ProductRow, qty = 1) => {
    const n = Math.max(1, Math.floor(qty));
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + n } : p));
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, image: item.image, unit: item.unit, qty: n },
      ];
    });
    trackEvent('add_to_cart', {
      currency: 'VND',
      value: item.price * n,
      items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: n }],
    });
    setOpen(true);
  };

  const remove = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id));

  const setQty = (id: string, qty: number) =>
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, qty: Math.max(0, qty) } : p))
        .filter((p) => p.qty > 0)
    );

  const clear = () => setItems([]);
  const has = (id: string) => items.some((i) => i.id === id);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items, count, total, add, remove, setQty, clear, has, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

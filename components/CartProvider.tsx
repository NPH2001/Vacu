"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ProductRow } from "@/db/schema";

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
  add: (item: ProductRow) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  has: (id: string) => boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "nongtraixanh_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = (item: ProductRow) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, image: item.image, unit: item.unit, qty: 1 },
      ];
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

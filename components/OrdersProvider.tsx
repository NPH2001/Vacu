"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Order = {
  id: string;
  date: string;
  items: { id: string; name: string; price: number; qty: number; image: string; unit: string }[];
  total: number;
  address: string;
  deliverySlot: string;
  status: "pending" | "preparing" | "delivering" | "delivered";
};

type OrdersContextValue = {
  orders: Order[];
  addOrder: (o: Omit<Order, "id" | "date" | "status">) => string;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);
const STORAGE_KEY = "nongtraixanh_orders_v1";

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOrders(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders, hydrated]);

  const addOrder = (o: Omit<Order, "id" | "date" | "status">) => {
    const order: Order = {
      ...o,
      id: `NTX-${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      status: "pending",
    };
    setOrders((prev) => [order, ...prev]);
    return order.id;
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside OrdersProvider");
  return ctx;
}

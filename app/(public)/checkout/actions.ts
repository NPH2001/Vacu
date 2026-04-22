'use server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@/db/client';
import { orders, orderItems } from '@/db/schema';
import { placeOrderSchema } from '@/lib/validators';
import {
  MY_ORDERS_COOKIE, MY_ORDERS_MAX_AGE,
  appendMyOrder, parseMyOrders,
} from '@/lib/orders-cookie';

const cartLineSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number().int().positive(),
  qty: z.coerce.number().int().positive(),
  unit: z.string(),
  image: z.string(),
});

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

function newOrderId(): string {
  return `NTX-${Date.now().toString().slice(-8)}`;
}

export async function placeOrder(formData: FormData): Promise<PlaceOrderResult> {
  const meta = placeOrderSchema.safeParse({
    customerName: formData.get('customerName'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    deliverySlot: formData.get('deliverySlot'),
    note: formData.get('note') || undefined,
  });
  if (!meta.success) return { ok: false, error: 'Thông tin không hợp lệ' };

  let cart: z.infer<typeof cartLineSchema>[];
  try {
    const raw = formData.get('cart');
    cart = z.array(cartLineSchema).min(1).parse(JSON.parse(String(raw)));
  } catch {
    return { ok: false, error: 'Giỏ hàng trống hoặc không hợp lệ' };
  }

  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const orderId = newOrderId();

  await db.transaction(async (tx) => {
    await tx.insert(orders).values({ id: orderId, total, ...meta.data });
    await tx.insert(orderItems).values(
      cart.map((l) => ({
        orderId, productId: l.id, name: l.name, price: l.price,
        qty: l.qty, unit: l.unit, image: l.image,
      })),
    );
  });

  try {
    const store = await cookies();
    const existing = parseMyOrders(store.get(MY_ORDERS_COOKIE)?.value);
    store.set(MY_ORDERS_COOKIE, JSON.stringify(appendMyOrder(existing, orderId)), {
      httpOnly: false, path: '/', sameSite: 'lax', maxAge: MY_ORDERS_MAX_AGE,
    });
  } catch {
    // No request context (e.g., unit test): skip cookie
  }

  return { ok: true, orderId };
}

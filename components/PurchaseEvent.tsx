'use client';
import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/gtag';

type Item = { item_id: string; item_name: string; price: number; quantity: number };

/**
 * Fires the GA4 `purchase` event exactly once when the order-success page is
 * shown (?new=<id>). Rendered only for the just-placed order.
 */
export default function PurchaseEvent({
  orderId, value, items,
}: { orderId: string; value: number; items: Item[] }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent('purchase', { transaction_id: orderId, value, currency: 'VND', items });
  }, [orderId, value, items]);
  return null;
}

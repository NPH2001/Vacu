export const MY_ORDERS_COOKIE = 'ntx_my_orders';
export const MY_ORDERS_MAX = 20;
export const MY_ORDERS_MAX_AGE = 30 * 24 * 3600;

export function parseMyOrders(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x) => typeof x === 'string');
  } catch {
    return [];
  }
}

export function appendMyOrder(existing: string[], id: string): string[] {
  if (existing.includes(id)) return existing;
  return [id, ...existing].slice(0, MY_ORDERS_MAX);
}

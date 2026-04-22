import { describe, it, expect } from 'vitest';
import { parseMyOrders, appendMyOrder } from '@/lib/orders-cookie';

describe('orders cookie', () => {
  it('parses empty/invalid cookies as empty list', () => {
    expect(parseMyOrders(undefined)).toEqual([]);
    expect(parseMyOrders('not-json')).toEqual([]);
    expect(parseMyOrders('{"not":"array"}')).toEqual([]);
  });
  it('parses valid JSON array of strings', () => {
    expect(parseMyOrders('["NTX-1","NTX-2"]')).toEqual(['NTX-1', 'NTX-2']);
  });
  it('prepends new order and caps at 20', () => {
    const existing = Array.from({ length: 20 }, (_, i) => `NTX-${i}`);
    const next = appendMyOrder(existing, 'NTX-NEW');
    expect(next[0]).toBe('NTX-NEW');
    expect(next).toHaveLength(20);
    expect(next).not.toContain('NTX-19');
  });
  it('deduplicates existing ids', () => {
    expect(appendMyOrder(['NTX-1', 'NTX-2'], 'NTX-1')).toEqual(['NTX-1', 'NTX-2']);
  });
});

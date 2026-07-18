import { describe, it, expect } from 'vitest';
import { filterAndSortProducts } from '@/lib/product-filter';
import type { ProductRow } from '@/db/schema';

function p(over: Partial<ProductRow>): ProductRow {
  return {
    id: 'x', name: 'X', categoryId: 'c', unit: 'kg', price: 1000, oldPrice: null,
    image: '/x', farmerId: null, description: '', body: '', tags: [], featured: false,
    inStock: true, createdAt: new Date('2020-01-01'), updatedAt: new Date('2020-01-01'),
    ...over,
  } as ProductRow;
}

const items = [
  p({ id: 'ca', name: 'Cà chua bi', price: 3000, inStock: true, createdAt: new Date('2020-01-03') }),
  p({ id: 'rau', name: 'Rau cải xoăn', price: 1000, inStock: false, createdAt: new Date('2020-01-02') }),
  p({ id: 'bo', name: 'Bơ sáp', price: 2000, inStock: true, createdAt: new Date('2020-01-01') }),
];

describe('filterAndSortProducts', () => {
  it('search is diacritic/case-insensitive', () => {
    expect(filterAndSortProducts(items, { q: 'ca chua' }).map((x) => x.id)).toEqual(['ca']);
    expect(filterAndSortProducts(items, { q: 'RAU' }).map((x) => x.id)).toEqual(['rau']);
  });

  it('folds Vietnamese đ (đ ↔ d) in search', () => {
    const d = [p({ id: 'dau', name: 'Đậu bắp', description: '' })];
    expect(filterAndSortProducts(d, { q: 'dau' }).map((x) => x.id)).toEqual(['dau']);
    expect(filterAndSortProducts(d, { q: 'ĐẬU' }).map((x) => x.id)).toEqual(['dau']);
  });

  it('in-stock filter drops out-of-stock', () => {
    expect(filterAndSortProducts(items, { inStockOnly: true }).map((x) => x.id).sort()).toEqual(['bo', 'ca']);
  });

  it('sorts by price asc/desc and name', () => {
    expect(filterAndSortProducts(items, { sort: 'price-asc' }).map((x) => x.price)).toEqual([1000, 2000, 3000]);
    expect(filterAndSortProducts(items, { sort: 'price-desc' }).map((x) => x.price)).toEqual([3000, 2000, 1000]);
    expect(filterAndSortProducts(items, { sort: 'name' }).map((x) => x.name)).toEqual(['Bơ sáp', 'Cà chua bi', 'Rau cải xoăn']);
  });

  it('defaults to newest first', () => {
    expect(filterAndSortProducts(items, {}).map((x) => x.id)).toEqual(['ca', 'rau', 'bo']);
  });

  it('combines search + in-stock + sort', () => {
    // "a" matches Cà chua and Bơ sáp; Rau is out of stock → dropped.
    const r = filterAndSortProducts(items, { q: 'a', inStockOnly: true, sort: 'price-asc' });
    expect(r.map((x) => x.id)).toEqual(['bo', 'ca']); // price 2000 then 3000
  });
});

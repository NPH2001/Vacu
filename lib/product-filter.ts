import type { ProductRow } from '@/db/schema';

export type ProductFilterOpts = { q?: string; sort?: string; inStockOnly?: boolean };

/**
 * Applies the catalog search box, sort, and in-stock toggle to a product list.
 * Pure and case/diacritic-insensitive on the query so it can be unit-tested and
 * reused by any listing.
 */
export function filterAndSortProducts(products: ProductRow[], opts: ProductFilterOpts): ProductRow[] {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const needle = opts.q?.trim() ? norm(opts.q.trim()) : '';

  let out = products;
  if (needle) out = out.filter((p) => norm(`${p.name} ${p.description}`).includes(needle));
  if (opts.inStockOnly) out = out.filter((p) => p.inStock);

  switch (opts.sort) {
    case 'price-asc': return [...out].sort((a, b) => a.price - b.price);
    case 'price-desc': return [...out].sort((a, b) => b.price - a.price);
    case 'name': return [...out].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    default: // newest
      return [...out].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

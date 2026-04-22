import { describe, it, expect } from 'vitest';
import {
  parseListParams,
  buildWhere,
  buildOrderBy,
  buildPagination,
  sortHref,
  filterHref,
  pageHref,
  pageSizeHref,
  clearHref,
  hasAnyListParam,
  type ListSchema,
  type ParsedListParams,
} from '@/lib/admin/list-params';
import { products } from '@/db/schema';

const schema: ListSchema = {
  searchFields: [products.name, products.id],
  sortable: { name: products.name, price: products.price, createdAt: products.createdAt },
  defaultSort: 'name',
  filters: {
    categoryId: { type: 'equals', column: products.categoryId, values: ['rau', 'qua'] },
    featured: { type: 'boolean', column: products.featured },
  },
};

describe('parseListParams', () => {
  it('returns defaults when no params are supplied', () => {
    const p = parseListParams({}, schema);
    expect(p.q).toBe('');
    expect(p.sort).toBeNull();
    expect(p.page).toBe(1);
    expect(p.pageSize).toBe(25);
    expect(p.filters).toEqual({});
  });

  it('parses q, page, pageSize, sort asc/desc', () => {
    const p = parseListParams({ q: 'rau', page: '3', pageSize: '50', sort: '-price' }, schema);
    expect(p.q).toBe('rau');
    expect(p.page).toBe(3);
    expect(p.pageSize).toBe(50);
    expect(p.sort).toEqual({ key: 'price', dir: 'desc' });
  });

  it('ignores sort not in whitelist', () => {
    const p = parseListParams({ sort: 'bogus' }, schema);
    expect(p.sort).toBeNull();
  });

  it('ignores pageSize not in allowed list (falls back to default 25)', () => {
    const p = parseListParams({ pageSize: '1000' }, schema);
    expect(p.pageSize).toBe(25);
  });

  it('clamps page < 1 to 1 and non-integer to 1', () => {
    expect(parseListParams({ page: '0' }, schema).page).toBe(1);
    expect(parseListParams({ page: '-4' }, schema).page).toBe(1);
    expect(parseListParams({ page: 'xyz' }, schema).page).toBe(1);
  });

  it('accepts boolean filter values "1" and "0"', () => {
    expect(parseListParams({ featured: '1' }, schema).filters.featured).toBe('1');
    expect(parseListParams({ featured: '0' }, schema).filters.featured).toBe('0');
    expect(parseListParams({ featured: 'yes' }, schema).filters.featured).toBeUndefined();
  });

  it('accepts equals filter only from whitelist', () => {
    expect(parseListParams({ categoryId: 'rau' }, schema).filters.categoryId).toBe('rau');
    expect(parseListParams({ categoryId: 'bogus' }, schema).filters.categoryId).toBeUndefined();
  });

  it('ignores unknown filter keys', () => {
    const p = parseListParams({ zzz: 'anything' }, schema);
    expect(p.filters).toEqual({});
  });

  it('takes the first value when a param is an array', () => {
    const p = parseListParams({ q: ['rau', 'qua'] }, schema);
    expect(p.q).toBe('rau');
  });
});

describe('buildPagination', () => {
  it('computes limit and offset', () => {
    expect(buildPagination({ q: '', sort: null, page: 1, pageSize: 25, filters: {} }))
      .toEqual({ limit: 25, offset: 0 });
    expect(buildPagination({ q: '', sort: null, page: 3, pageSize: 10, filters: {} }))
      .toEqual({ limit: 10, offset: 20 });
  });
});

describe('buildOrderBy', () => {
  it('uses default sort when parsed sort is null', () => {
    const s = buildOrderBy(
      { q: '', sort: null, page: 1, pageSize: 25, filters: {} },
      schema,
    );
    expect(s).toBeTruthy();
  });

  it('uses explicit sort when present', () => {
    const s = buildOrderBy(
      { q: '', sort: { key: 'price', dir: 'desc' }, page: 1, pageSize: 25, filters: {} },
      schema,
    );
    expect(s).toBeTruthy();
  });

  it('supports default sort with "-" prefix for desc', () => {
    const s = buildOrderBy(
      { q: '', sort: null, page: 1, pageSize: 25, filters: {} },
      { ...schema, defaultSort: '-createdAt' },
    );
    expect(s).toBeTruthy();
  });
});

describe('buildWhere', () => {
  it('returns undefined when no q and no filters', () => {
    expect(buildWhere({ q: '', sort: null, page: 1, pageSize: 25, filters: {} }, schema))
      .toBeUndefined();
  });

  it('returns a SQL fragment when q is set', () => {
    const w = buildWhere(
      { q: 'rau', sort: null, page: 1, pageSize: 25, filters: {} },
      schema,
    );
    expect(w).toBeTruthy();
  });

  it('returns a SQL fragment when a filter is set', () => {
    const w = buildWhere(
      { q: '', sort: null, page: 1, pageSize: 25, filters: { featured: '1' } },
      schema,
    );
    expect(w).toBeTruthy();
  });
});

const basePath = '/admin/products';

function p(partial: Partial<ParsedListParams>): ParsedListParams {
  return { q: '', sort: null, page: 1, pageSize: 25, filters: {}, ...partial };
}

describe('sortHref', () => {
  it('off → asc', () => {
    expect(sortHref(basePath, p({}), 'name', schema)).toBe('/admin/products?sort=name');
  });
  it('asc → desc', () => {
    expect(sortHref(basePath, p({ sort: { key: 'name', dir: 'asc' } }), 'name', schema))
      .toBe('/admin/products?sort=-name');
  });
  it('desc → off (param removed)', () => {
    expect(sortHref(basePath, p({ sort: { key: 'name', dir: 'desc' } }), 'name', schema))
      .toBe('/admin/products');
  });
  it('different column replaces current sort with asc', () => {
    expect(sortHref(basePath, p({ sort: { key: 'name', dir: 'asc' } }), 'price', schema))
      .toBe('/admin/products?sort=price');
  });
  it('resets page to 1 when toggling sort', () => {
    expect(sortHref(basePath, p({ sort: null, page: 4 }), 'name', schema))
      .toBe('/admin/products?sort=name');
  });
});

describe('filterHref', () => {
  it('adds a filter and resets page', () => {
    expect(filterHref(basePath, p({ page: 3 }), 'featured', '1'))
      .toBe('/admin/products?featured=1');
  });
  it('replaces existing filter value', () => {
    expect(filterHref(basePath, p({ filters: { categoryId: 'rau' } }), 'categoryId', 'qua'))
      .toBe('/admin/products?categoryId=qua');
  });
  it('clears a filter when value is null', () => {
    expect(filterHref(basePath, p({ filters: { featured: '1' } }), 'featured', null))
      .toBe('/admin/products');
  });
  it('preserves other params', () => {
    expect(filterHref(basePath, p({ q: 'rau', filters: { categoryId: 'rau' } }),
                      'featured', '1'))
      .toBe('/admin/products?q=rau&categoryId=rau&featured=1');
  });
});

describe('pageHref', () => {
  it('omits page=1', () => {
    expect(pageHref(basePath, p({ page: 3 }), 1)).toBe('/admin/products');
  });
  it('sets page>1', () => {
    expect(pageHref(basePath, p({}), 2)).toBe('/admin/products?page=2');
  });
});

describe('pageSizeHref', () => {
  it('omits default size and resets page', () => {
    expect(pageSizeHref(basePath, p({ page: 3, pageSize: 50 }), 25)).toBe('/admin/products');
  });
  it('sets non-default size and resets page', () => {
    expect(pageSizeHref(basePath, p({ page: 3 }), 50)).toBe('/admin/products?pageSize=50');
  });
});

describe('clearHref', () => {
  it('returns the base path with no params', () => {
    expect(clearHref(basePath)).toBe('/admin/products');
  });
});

describe('hasAnyListParam', () => {
  it('false for defaults', () => {
    expect(hasAnyListParam(p({}))).toBe(false);
  });
  it('true when q is set', () => {
    expect(hasAnyListParam(p({ q: 'hi' }))).toBe(true);
  });
  it('true when filter is set', () => {
    expect(hasAnyListParam(p({ filters: { featured: '1' } }))).toBe(true);
  });
  it('true when page > 1', () => {
    expect(hasAnyListParam(p({ page: 2 }))).toBe(true);
  });
  it('true when sort is set', () => {
    expect(hasAnyListParam(p({ sort: { key: 'name', dir: 'asc' } }))).toBe(true);
  });
});

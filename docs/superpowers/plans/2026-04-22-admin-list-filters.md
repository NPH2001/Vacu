# Admin list filters/search/sort/pagination — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add search, filter chips/selects, column-sort, and page-based pagination to every admin list page under `/admin/*`, with URL as the single source of truth.

**Architecture:** A small library (`lib/admin/list-params.ts`) parses `searchParams` into a typed `ParsedListParams` object and produces Drizzle `where`/`orderBy`/`limit`/`offset` fragments; a handful of primitives in `components/admin/list/` render the toolbar/table-headers/pagination UI. Each admin Server Component composes these primitives itself — there is no generic `<DataTable>`.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), React 19, Drizzle ORM (Postgres), Vitest, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-04-22-admin-list-filters-design.md`

**Conventions in this repo:**
- Run unit tests: `npm test` (vitest, `tests/**/*.test.ts`).
- `server-only` is stubbed in tests via `tests/stubs/empty.ts` (see `vitest.config.ts`).
- Alias `@` resolves to repo root.
- All admin list pages live under `app/admin/(shell)/<entity>/page.tsx`, already use Server Components + Drizzle.
- `BulkDeleteForm` (client) wraps the `<table>` in many pages; navigation links inside it work normally (Link navigates, form does not submit on link click).
- Existing Orders page already filters by `status` via a plain `Link`-based `FilterPill` — we replace this with the new `FilterChips` primitive.

**Commit policy:** commit after every task unless the task says otherwise. Use conventional-commit prefixes consistent with the repo's log: `feat(admin): …`, `test(admin): …`, `refactor(admin): …`.

**Testing pragmatics:** The spec's "1 integration test for Products" step is covered by manual smoke-tests in Tasks 11–17 plus the thorough unit tests for `lib/admin/list-params.ts` in Tasks 1–3. The repo has no Playwright; writing a Server-Component integration test via testcontainers would need more session/auth scaffolding than the feature warrants at this phase. If this plan grows to include a regression-test suite, add it as a follow-up — out of scope here.

---

## File structure (new)

```
lib/admin/
  list-params.ts                     # parse + build where/orderBy/pagination + href helpers
components/admin/list/
  SearchInput.tsx          (client)  # debounced search, router.replace
  FilterChips.tsx          (server)  # [Tất cả] [A] [B] — list of Links
  FilterSelect.tsx         (client)  # <select> that navigates on change
  SortableTh.tsx           (server)  # <th> with sort toggle Link
  Pagination.tsx           (server)  # prev / pages / next
  PageSizeSelect.tsx       (client)  # dropdown 10/25/50
  ClearFiltersLink.tsx     (server)  # ✕ link — only renders when any list-param set
tests/lib/
  admin-list-params.test.ts          # unit tests for list-params.ts
```

Touched per-page (one edit per file):

```
app/admin/(shell)/products/page.tsx
app/admin/(shell)/orders/page.tsx
app/admin/(shell)/users/page.tsx
app/admin/(shell)/categories/page.tsx
app/admin/(shell)/farmers/page.tsx
app/admin/(shell)/testimonials/page.tsx
app/admin/(shell)/faq/page.tsx
app/admin/(shell)/contact-topics/page.tsx
app/admin/(shell)/delivery-slots/page.tsx
app/admin/(shell)/order-statuses/page.tsx
app/admin/(shell)/payment-methods/page.tsx
app/admin/(shell)/value-props/page.tsx
app/admin/(shell)/email-templates/page.tsx
```

---

## Task 1: `list-params.ts` — types & `parseListParams`

**Files:**
- Create: `lib/admin/list-params.ts`
- Test: `tests/lib/admin-list-params.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/lib/admin-list-params.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseListParams, type ListSchema } from '@/lib/admin/list-params';
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- admin-list-params`
Expected: fails with "Cannot find module '@/lib/admin/list-params'".

- [ ] **Step 3: Write minimal implementation**

`lib/admin/list-params.ts`:

```ts
import type { AnyColumn, SQL } from 'drizzle-orm';

export type FilterDef =
  | { type: 'equals'; column: AnyColumn; values?: readonly string[] }
  | { type: 'boolean'; column: AnyColumn };

export type ListSchema = {
  searchFields?: AnyColumn[];
  sortable: Record<string, AnyColumn>;
  defaultSort: string;
  filters?: Record<string, FilterDef>;
  pageSizes?: readonly number[];
  defaultPageSize?: number;
};

export type ParsedListParams = {
  q: string;
  sort: { key: string; dir: 'asc' | 'desc' } | null;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
};

export type SearchParamsInput = Record<string, string | string[] | undefined>;

const DEFAULT_PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 25;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export function parseListParams(sp: SearchParamsInput, schema: ListSchema): ParsedListParams {
  const pageSizes = schema.pageSizes ?? DEFAULT_PAGE_SIZES;
  const defaultPageSize = schema.defaultPageSize ?? DEFAULT_PAGE_SIZE;

  const q = (first(sp.q) ?? '').trim();

  let sort: ParsedListParams['sort'] = null;
  const rawSort = first(sp.sort);
  if (rawSort) {
    const desc = rawSort.startsWith('-');
    const key = desc ? rawSort.slice(1) : rawSort;
    if (key in schema.sortable) {
      sort = { key, dir: desc ? 'desc' : 'asc' };
    }
  }

  const rawPage = Number.parseInt(first(sp.page) ?? '', 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const rawSize = Number.parseInt(first(sp.pageSize) ?? '', 10);
  const pageSize = (pageSizes as readonly number[]).includes(rawSize) ? rawSize : defaultPageSize;

  const filters: Record<string, string> = {};
  if (schema.filters) {
    for (const [key, def] of Object.entries(schema.filters)) {
      const v = first(sp[key]);
      if (v === undefined) continue;
      if (def.type === 'boolean') {
        if (v === '1' || v === '0') filters[key] = v;
      } else if (def.type === 'equals') {
        if (def.values && !def.values.includes(v)) continue;
        filters[key] = v;
      }
    }
  }

  return { q, sort, page, pageSize, filters };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- admin-list-params`
Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/list-params.ts tests/lib/admin-list-params.test.ts
git commit -m "feat(admin): add parseListParams for list query params"
```

---

## Task 2: `buildWhere`, `buildOrderBy`, `buildPagination`

**Files:**
- Modify: `lib/admin/list-params.ts`
- Modify: `tests/lib/admin-list-params.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `tests/lib/admin-list-params.test.ts`:

```ts
import { buildWhere, buildOrderBy, buildPagination } from '@/lib/admin/list-params';

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
    // defaultSort 'name' → ascending products.name → non-null SQL
    expect(s).toBeTruthy();
  });

  it('uses explicit sort when present', () => {
    const s = buildOrderBy(
      { q: '', sort: { key: 'price', dir: 'desc' }, page: 1, pageSize: 25, filters: {} },
      schema,
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
```

Note: we only assert truthiness/presence of SQL fragments in unit tests — the fragments are covered end-to-end by the Task 11 Products integration smoke.

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test -- admin-list-params`
Expected: fails with missing exports `buildWhere`, `buildOrderBy`, `buildPagination`.

- [ ] **Step 3: Implement**

Append to `lib/admin/list-params.ts`:

```ts
import { and, or, asc, desc, eq, ilike, sql } from 'drizzle-orm';

export function buildPagination(parsed: ParsedListParams): { limit: number; offset: number } {
  return { limit: parsed.pageSize, offset: (parsed.page - 1) * parsed.pageSize };
}

export function buildOrderBy(parsed: ParsedListParams, schema: ListSchema): SQL {
  const applied = parsed.sort ?? parseDefaultSort(schema.defaultSort);
  const col = schema.sortable[applied.key];
  if (!col) throw new Error(`Unknown sort key in defaultSort: ${applied.key}`);
  return applied.dir === 'desc' ? desc(col) : asc(col);
}

function parseDefaultSort(raw: string): { key: string; dir: 'asc' | 'desc' } {
  if (raw.startsWith('-')) return { key: raw.slice(1), dir: 'desc' };
  return { key: raw, dir: 'asc' };
}

export function buildWhere(parsed: ParsedListParams, schema: ListSchema): SQL | undefined {
  const clauses: SQL[] = [];

  if (parsed.q && schema.searchFields && schema.searchFields.length > 0) {
    const like = `%${parsed.q}%`;
    const searchClauses = schema.searchFields.map((col) => ilike(sql`${col}::text`, like));
    const combined = or(...searchClauses);
    if (combined) clauses.push(combined);
  }

  if (schema.filters) {
    for (const [key, value] of Object.entries(parsed.filters)) {
      const def = schema.filters[key];
      if (!def) continue;
      if (def.type === 'boolean') {
        clauses.push(eq(def.column, value === '1'));
      } else {
        clauses.push(eq(def.column, value));
      }
    }
  }

  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return and(...clauses);
}
```

Note: `ilike(sql`${col}::text`, …)` is used so non-text columns (e.g. `products.id` which is `text` here — safe — but also future-proof for `integer` ids) cast to text before the LIKE. On Postgres this is native.

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test -- admin-list-params`
Expected: all tests (8 + ~5 new) pass.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/list-params.ts tests/lib/admin-list-params.test.ts
git commit -m "feat(admin): add buildWhere/buildOrderBy/buildPagination"
```

---

## Task 3: URL href helpers

**Files:**
- Modify: `lib/admin/list-params.ts`
- Modify: `tests/lib/admin-list-params.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `tests/lib/admin-list-params.test.ts`:

```ts
import { sortHref, filterHref, pageHref, pageSizeHref, clearHref } from '@/lib/admin/list-params';

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
```

- [ ] **Step 2: Run tests — expect failure**

Run: `npm test -- admin-list-params`
Expected: missing exports `sortHref`, `filterHref`, `pageHref`, `pageSizeHref`, `clearHref`.

- [ ] **Step 3: Implement**

Append to `lib/admin/list-params.ts`:

```ts
function buildQuery(parsed: ParsedListParams, schema?: ListSchema): URLSearchParams {
  const qs = new URLSearchParams();
  if (parsed.q) qs.set('q', parsed.q);
  if (parsed.sort) {
    qs.set('sort', parsed.sort.dir === 'desc' ? `-${parsed.sort.key}` : parsed.sort.key);
  }
  if (parsed.page > 1) qs.set('page', String(parsed.page));
  const defaultSize = schema?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  if (parsed.pageSize !== defaultSize) qs.set('pageSize', String(parsed.pageSize));
  for (const [k, v] of Object.entries(parsed.filters)) qs.set(k, v);
  return qs;
}

function toHref(basePath: string, qs: URLSearchParams): string {
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function sortHref(
  basePath: string,
  parsed: ParsedListParams,
  col: string,
  schema: ListSchema,
): string {
  let next: ParsedListParams['sort'];
  if (!parsed.sort || parsed.sort.key !== col) {
    next = { key: col, dir: 'asc' };
  } else if (parsed.sort.dir === 'asc') {
    next = { key: col, dir: 'desc' };
  } else {
    next = null;
  }
  return toHref(basePath, buildQuery({ ...parsed, sort: next, page: 1 }, schema));
}

export function filterHref(
  basePath: string,
  parsed: ParsedListParams,
  key: string,
  value: string | null,
  schema?: ListSchema,
): string {
  const filters = { ...parsed.filters };
  if (value === null) delete filters[key]; else filters[key] = value;
  return toHref(basePath, buildQuery({ ...parsed, filters, page: 1 }, schema));
}

export function pageHref(
  basePath: string,
  parsed: ParsedListParams,
  page: number,
  schema?: ListSchema,
): string {
  return toHref(basePath, buildQuery({ ...parsed, page }, schema));
}

export function pageSizeHref(
  basePath: string,
  parsed: ParsedListParams,
  pageSize: number,
  schema?: ListSchema,
): string {
  return toHref(basePath, buildQuery({ ...parsed, pageSize, page: 1 }, schema));
}

export function clearHref(basePath: string): string {
  return basePath;
}

export function hasAnyListParam(parsed: ParsedListParams): boolean {
  return (
    !!parsed.q ||
    parsed.sort !== null ||
    parsed.page > 1 ||
    Object.keys(parsed.filters).length > 0
  );
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test -- admin-list-params`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/list-params.ts tests/lib/admin-list-params.test.ts
git commit -m "feat(admin): add URL href helpers for list params"
```

---

## Task 4: `SearchInput` (client)

**Files:**
- Create: `components/admin/list/SearchInput.tsx`

No unit test — the logic is thin React and the behavior is covered visually in the page wiring.

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SearchInput({
  placeholder = 'Tìm kiếm…',
  debounceMs = 250,
}: {
  placeholder?: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep input in sync when URL changes externally (e.g. Clear button).
  useEffect(() => {
    setValue(initial);
  }, [initial]);

  function push(next: string, immediate: boolean) {
    const qs = new URLSearchParams(params.toString());
    if (next) qs.set('q', next); else qs.delete('q');
    qs.delete('page');
    const href = `${pathname}${qs.toString() ? `?${qs}` : ''}`;
    const go = () => router.replace(href, { scroll: false });
    if (timer.current) clearTimeout(timer.current);
    if (immediate) go(); else timer.current = setTimeout(go, debounceMs);
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); push(value, true); }}
      className="relative">
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { setValue(e.target.value); push(e.target.value, false); }}
        className="w-64 rounded-full border border-green-200 bg-white px-4 py-1.5 text-sm
                   focus:border-green-500 focus:outline-none"
      />
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/list/SearchInput.tsx
git commit -m "feat(admin): add SearchInput primitive"
```

---

## Task 5: `FilterChips` (server)

**Files:**
- Create: `components/admin/list/FilterChips.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from 'next/link';
import type { ParsedListParams } from '@/lib/admin/list-params';
import { filterHref } from '@/lib/admin/list-params';

export type ChipOption = { value: string | null; label: string };

export default function FilterChips({
  basePath,
  parsed,
  filterKey,
  options,
}: {
  basePath: string;
  parsed: ParsedListParams;
  filterKey: string;
  options: ChipOption[];
}) {
  const active = parsed.filters[filterKey] ?? null;
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const isActive = active === opt.value;
        return (
          <Link
            key={opt.label}
            href={filterHref(basePath, parsed, filterKey, opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              isActive
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-green-900 border-green-200 hover:border-green-400'
            }`}>
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
```

Semantics: pass `{ value: null, label: 'Tất cả' }` as the first option to produce an "All" chip that clears the filter. Boolean filters use `options=[{value:null,label:'Tất cả'},{value:'1',label:'Nổi bật'},{value:'0',label:'Thường'}]`.

- [ ] **Step 2: Commit**

```bash
git add components/admin/list/FilterChips.tsx
git commit -m "feat(admin): add FilterChips primitive"
```

---

## Task 6: `FilterSelect` (client)

**Files:**
- Create: `components/admin/list/FilterSelect.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export type SelectOption = { value: string; label: string };

export default function FilterSelect({
  filterKey,
  current,
  options,
  placeholder = 'Tất cả',
}: {
  filterKey: string;
  current: string | null;
  options: SelectOption[];
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <select
      value={current ?? ''}
      onChange={(e) => {
        const qs = new URLSearchParams(params.toString());
        if (e.target.value) qs.set(filterKey, e.target.value); else qs.delete(filterKey);
        qs.delete('page');
        router.replace(`${pathname}${qs.toString() ? `?${qs}` : ''}`, { scroll: false });
      }}
      className="rounded-full border border-green-200 bg-white px-3 py-1.5 text-sm
                 focus:border-green-500 focus:outline-none">
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/list/FilterSelect.tsx
git commit -m "feat(admin): add FilterSelect primitive"
```

---

## Task 7: `SortableTh` (server)

**Files:**
- Create: `components/admin/list/SortableTh.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from 'next/link';
import type { ParsedListParams, ListSchema } from '@/lib/admin/list-params';
import { sortHref } from '@/lib/admin/list-params';

export default function SortableTh({
  basePath,
  parsed,
  schema,
  sortKey,
  className = 'px-4 py-2.5 font-medium',
  children,
}: {
  basePath: string;
  parsed: ParsedListParams;
  schema: ListSchema;
  sortKey: string;
  className?: string;
  children: React.ReactNode;
}) {
  const active = parsed.sort?.key === sortKey ? parsed.sort.dir : null;
  const arrow = active === 'asc' ? '↑' : active === 'desc' ? '↓' : '↕';
  return (
    <th className={className}>
      <Link
        href={sortHref(basePath, parsed, sortKey, schema)}
        className="inline-flex items-center gap-1 hover:text-green-800"
        scroll={false}>
        <span>{children}</span>
        <span className={active ? 'text-green-700' : 'text-green-900/30'}>{arrow}</span>
      </Link>
    </th>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/list/SortableTh.tsx
git commit -m "feat(admin): add SortableTh primitive"
```

---

## Task 8: `Pagination` (server)

**Files:**
- Create: `components/admin/list/Pagination.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from 'next/link';
import type { ParsedListParams, ListSchema } from '@/lib/admin/list-params';
import { pageHref } from '@/lib/admin/list-params';

export default function Pagination({
  basePath,
  parsed,
  schema,
  total,
}: {
  basePath: string;
  parsed: ParsedListParams;
  schema?: ListSchema;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / parsed.pageSize));
  const current = Math.min(parsed.page, totalPages);
  const pages = pageWindow(current, totalPages);
  const from = total === 0 ? 0 : (current - 1) * parsed.pageSize + 1;
  const to = Math.min(total, current * parsed.pageSize);

  return (
    <div className="flex items-center justify-between text-sm text-green-900/70 mt-3 px-1">
      <span>Hiển thị {from}–{to} trong {total}</span>
      <nav className="flex items-center gap-1">
        <PageLink basePath={basePath} parsed={parsed} schema={schema} to={current - 1}
                  disabled={current === 1}>‹</PageLink>
        {pages.map((p, i) =>
          p === null
            ? <span key={`gap-${i}`} className="px-2">…</span>
            : <PageLink key={p} basePath={basePath} parsed={parsed} schema={schema} to={p}
                        active={p === current}>{p}</PageLink>
        )}
        <PageLink basePath={basePath} parsed={parsed} schema={schema} to={current + 1}
                  disabled={current === totalPages}>›</PageLink>
      </nav>
    </div>
  );
}

function PageLink({
  basePath, parsed, schema, to, disabled, active, children,
}: {
  basePath: string;
  parsed: ParsedListParams;
  schema?: ListSchema;
  to: number;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  const cls = `min-w-[28px] h-7 px-2 inline-flex items-center justify-center rounded border text-sm ${
    active ? 'bg-green-700 text-white border-green-700'
           : 'bg-white text-green-900 border-green-200 hover:border-green-400'
  } ${disabled ? 'opacity-40 pointer-events-none' : ''}`;
  if (disabled) return <span className={cls}>{children}</span>;
  return <Link href={pageHref(basePath, parsed, to, schema)} className={cls} scroll={false}>{children}</Link>;
}

function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push(null);
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push(null);
  out.push(total);
  return out;
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/list/Pagination.tsx
git commit -m "feat(admin): add Pagination primitive"
```

---

## Task 9: `PageSizeSelect` (client)

**Files:**
- Create: `components/admin/list/PageSizeSelect.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function PageSizeSelect({
  sizes = [10, 25, 50],
  defaultSize = 25,
}: {
  sizes?: readonly number[];
  defaultSize?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = Number.parseInt(params.get('pageSize') ?? '', 10) || defaultSize;

  return (
    <label className="text-xs text-green-900/70 flex items-center gap-1">
      <select
        value={current}
        onChange={(e) => {
          const next = Number.parseInt(e.target.value, 10);
          const qs = new URLSearchParams(params.toString());
          if (next === defaultSize) qs.delete('pageSize'); else qs.set('pageSize', String(next));
          qs.delete('page');
          router.replace(`${pathname}${qs.toString() ? `?${qs}` : ''}`, { scroll: false });
        }}
        className="rounded border border-green-200 bg-white px-2 py-1 text-xs
                   focus:border-green-500 focus:outline-none">
        {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      / trang
    </label>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/list/PageSizeSelect.tsx
git commit -m "feat(admin): add PageSizeSelect primitive"
```

---

## Task 10: `ClearFiltersLink` (server)

**Files:**
- Create: `components/admin/list/ClearFiltersLink.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from 'next/link';
import type { ParsedListParams } from '@/lib/admin/list-params';
import { clearHref, hasAnyListParam } from '@/lib/admin/list-params';

export default function ClearFiltersLink({
  basePath,
  parsed,
  label = 'Xoá bộ lọc',
}: {
  basePath: string;
  parsed: ParsedListParams;
  label?: string;
}) {
  if (!hasAnyListParam(parsed)) return null;
  return (
    <Link href={clearHref(basePath)}
      className="text-sm text-green-900/60 hover:text-green-900 underline underline-offset-2">
      {label} ✕
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/list/ClearFiltersLink.tsx
git commit -m "feat(admin): add ClearFiltersLink primitive"
```

---

## Task 11: Apply to Products (flagship — full feature set)

**Files:**
- Modify: `app/admin/(shell)/products/page.tsx`

Products will be the first page to wire up: search + category select + 2 boolean chips + sort on 3 columns + pagination.

- [ ] **Step 1: Rewrite the page**

`app/admin/(shell)/products/page.tsx`:

```tsx
import Link from 'next/link';
import { asc, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, categories } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteProduct, bulkDeleteProducts } from '@/app/admin/actions/products';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterSelect from '@/components/admin/list/FilterSelect';
import FilterChips from '@/components/admin/list/FilterChips';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/products';

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cats = await db.select().from(categories).orderBy(asc(categories.name));

  const schema: ListSchema = {
    searchFields: [products.name, products.id, products.description],
    sortable: {
      name: products.name,
      price: products.price,
      createdAt: products.createdAt,
    },
    defaultSort: 'name',
    filters: {
      categoryId: {
        type: 'equals',
        column: products.categoryId,
        values: cats.map((c) => c.id),
      },
      featured: { type: 'boolean', column: products.featured },
      inStock:  { type: 'boolean', column: products.inStock },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(products).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(products).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Sản phẩm</h1>
        <Link href="/admin/products/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo tên / mã / mô tả…" />
        <FilterSelect
          filterKey="categoryId"
          current={parsed.filters.categoryId ?? null}
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Tất cả danh mục"
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="featured"
          options={[
            { value: null, label: 'Mọi sản phẩm' },
            { value: '1', label: '⭐ Nổi bật' },
          ]}
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="inStock"
          options={[
            { value: null, label: 'Mọi tồn kho' },
            { value: '1', label: 'Còn' },
            { value: '0', label: 'Hết' },
          ]}
        />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-6 text-sm text-green-900/70">
          {parsed.q || Object.keys(parsed.filters).length > 0
            ? 'Không có kết quả phù hợp.'
            : 'Chưa có sản phẩm.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteProducts}>
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-green-900/70 bg-green-50/60">
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium">Ảnh</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Danh mục</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="price">Giá</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-green-50">
                    <td className="px-4 py-2">
                      <input type="checkbox" name="ids" value={p.id} />
                    </td>
                    <td className="px-4 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover" />}
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-green-950 hover:underline">{p.name}</Link>
                      <div className="text-xs text-green-900/60">{p.id}</div>
                    </td>
                    <td className="px-4 py-2">{catMap.get(p.categoryId) ?? p.categoryId}</td>
                    <td className="px-4 py-2">{formatPrice(p.price)}</td>
                    <td className="px-4 py-2 space-x-1">
                      {p.featured && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Nổi bật</span>}
                      {!p.inStock && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">Hết</span>}
                    </td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link href={`/admin/products/${p.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton action={deleteProduct.bind(null, p.id)} confirmText={`Xóa sản phẩm "${p.name}"?`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkDeleteForm>
      )}

      <div className="flex items-center justify-between">
        <Pagination basePath={BASE} parsed={parsed} schema={schema} total={total} />
        <PageSizeSelect />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Smoke-test in browser**

Run: `npm run dev` (in another terminal), navigate to `/admin/products`, and verify:
- Typing in the search box narrows the list after ~250 ms without full page reload.
- Changing the category select narrows immediately.
- Clicking a chip (⭐ Nổi bật / Còn / Hết) toggles.
- Clicking "Tên" / "Giá" headers toggles ↕ → ↑ → ↓ → ↕.
- Pagination appears when count > pageSize; clicking page 2 loads next.
- Bulk delete still works for the current page.
- Refreshing the page preserves all params.
- "Xoá bộ lọc ✕" clears everything.

If any behavior is off, fix inline and note what needed changing (e.g. arrow icon, placeholder text, chip order).

- [ ] **Step 3: Lint + typecheck**

Run: `npm run lint` — expected: 0 errors.
Run: `npm test` — expected: all unit tests still green.

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(shell\)/products/page.tsx
git commit -m "feat(admin): search/filter/sort/pagination for products list"
```

---

## Task 12: Apply to Orders (replace existing FilterPill)

**Files:**
- Modify: `app/admin/(shell)/orders/page.tsx`

Orders already has a DB-driven `status` filter — keep it, but move to `FilterChips`. Add search, payment filters, sort, pagination.

- [ ] **Step 1: Rewrite the page**

`app/admin/(shell)/orders/page.tsx`:

```tsx
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { bulkDeleteOrders } from '@/app/admin/actions/orders';
import { getAllOrderStatuses } from '@/lib/data';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterChips from '@/components/admin/list/FilterChips';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/orders';

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const statusRows = await getAllOrderStatuses();
  const statusMap = Object.fromEntries(statusRows.map((s) => [s.key, s]));

  const schema: ListSchema = {
    searchFields: [orders.id, orders.customerName, orders.phone, orders.customerEmail],
    sortable: {
      createdAt: orders.createdAt,
      total: orders.total,
      status: orders.status,
    },
    defaultSort: '-createdAt',
    filters: {
      status: {
        type: 'equals',
        column: orders.status,
        values: statusRows.map((s) => s.key),
      },
      paymentMethod: {
        type: 'equals',
        column: orders.paymentMethod,
        values: ['cod', 'bank'],
      },
      paymentStatus: {
        type: 'equals',
        column: orders.paymentStatus,
        values: ['unpaid', 'paid'],
      },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(orders).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  const statusOptions = [
    { value: null, label: 'Tất cả' },
    ...statusRows.map((s) => ({ value: s.key, label: s.label })),
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold font-display text-green-950">Đơn hàng</h1>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo mã / tên / SĐT / email…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      <FilterChips basePath={BASE} parsed={parsed} filterKey="status" options={statusOptions} />

      <div className="flex flex-wrap gap-2">
        <FilterChips basePath={BASE} parsed={parsed} filterKey="paymentMethod"
          options={[
            { value: null, label: 'Mọi hình thức' },
            { value: 'cod',  label: '💵 COD' },
            { value: 'bank', label: '🏦 CK' },
          ]} />
        <FilterChips basePath={BASE} parsed={parsed} filterKey="paymentStatus"
          options={[
            { value: null, label: 'Mọi thanh toán' },
            { value: 'unpaid', label: 'Chưa trả' },
            { value: 'paid',   label: 'Đã trả' },
          ]} />
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-6 text-sm text-green-900/70">
          {parsed.q || Object.keys(parsed.filters).length > 0
            ? 'Không có kết quả phù hợp.'
            : 'Không có đơn hàng.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteOrders}>
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-green-900/70 bg-green-50/60">
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium">Mã</th>
                  <th className="px-4 py-2.5 font-medium">Khách</th>
                  <th className="px-4 py-2.5 font-medium">Điện thoại</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="total">Tổng</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Thanh toán</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="status">Trạng thái</SortableTh>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="createdAt">Ngày</SortableTh>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-green-50 hover:bg-green-50/40">
                    <td className="px-4 py-2"><input type="checkbox" name="ids" value={r.id} /></td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/orders/${r.id}`} className="font-mono text-green-800 hover:underline">{r.id}</Link>
                    </td>
                    <td className="px-4 py-2">{r.customerName}</td>
                    <td className="px-4 py-2">{r.phone}</td>
                    <td className="px-4 py-2">{formatPrice(r.total)}</td>
                    <td className="px-4 py-2 text-xs">
                      <div>{r.paymentMethod === 'bank' ? '🏦 CK' : '💵 COD'}</div>
                      <div className={r.paymentStatus === 'paid' ? 'text-green-700 font-semibold' : 'text-amber-700'}>
                        {r.paymentStatus === 'paid' ? 'Đã trả' : 'Chưa trả'}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {(() => {
                        const s = statusMap[r.status];
                        return (
                          <span className={`text-xs px-2 py-0.5 rounded ${s?.color ?? 'bg-green-50 text-green-800'}`}>
                            {s?.label ?? r.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2 text-green-900/70">{r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkDeleteForm>
      )}

      <div className="flex items-center justify-between">
        <Pagination basePath={BASE} parsed={parsed} schema={schema} total={total} />
        <PageSizeSelect />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Smoke-test**

Verify in browser:
- The old status pills still work (now rendered by `FilterChips`), including "Tất cả".
- Search across id / name / phone / email works.
- Payment-method and payment-status chips filter.
- Sort toggles on Tổng / Trạng thái / Ngày headers; default sort is newest first.
- Pagination shows when > 25 orders.

- [ ] **Step 3: Lint + unit tests**

Run: `npm run lint && npm test`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(shell\)/orders/page.tsx
git commit -m "feat(admin): search/filter/sort/pagination for orders list"
```

---

## Task 13: Apply to Users

**Files:**
- Modify: `app/admin/(shell)/users/page.tsx`

Note: schema `users.role` enum is `'admin' | 'staff'` (not "customer"), confirmed from `db/schema.ts`.

- [ ] **Step 1: Rewrite**

```tsx
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteUser } from '@/app/admin/actions/users';
import { requireRole } from '@/lib/session';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterChips from '@/components/admin/list/FilterChips';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/users';

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const self = await requireRole('admin');
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [users.email, users.name],
    sortable: { email: users.email, name: users.name, createdAt: users.createdAt },
    defaultSort: 'email',
    filters: {
      role: { type: 'equals', column: users.role, values: ['admin', 'staff'] },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(users).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Tài khoản</h1>
        <Link href="/admin/users/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm tài khoản
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo email / tên…" />
        <FilterChips basePath={BASE} parsed={parsed} filterKey="role"
          options={[
            { value: null, label: 'Tất cả' },
            { value: 'admin', label: 'Admin' },
            { value: 'staff', label: 'Staff' },
          ]} />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-6 text-sm text-green-900/70">
          Không có kết quả phù hợp.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-green-900/70 bg-green-50/60">
              <tr>
                <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="email">Email</SortableTh>
                <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                <th className="px-4 py-2.5 font-medium">Vai trò</th>
                <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="createdAt">Tạo lúc</SortableTh>
                <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-green-50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-green-950 hover:underline">{u.email}</Link>
                    {u.id === self.id && <span className="ml-2 text-xs text-amber-700">(bạn)</span>}
                  </td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-green-900/70">{u.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <Link href={`/admin/users/${u.id}`} className="text-green-700 hover:underline">Sửa</Link>
                    {u.id !== self.id && (
                      <DeleteButton action={deleteUser.bind(null, u.id)} confirmText={`Xóa tài khoản "${u.email}"?`} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Pagination basePath={BASE} parsed={parsed} schema={schema} total={total} />
        <PageSizeSelect />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Smoke-test**

Verify: search, role chip, sort columns, pagination.

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(shell\)/users/page.tsx
git commit -m "feat(admin): search/filter/sort/pagination for users list"
```

---

## Task 14: Apply to Categories (no filters — just search + sort + pagination)

**Files:**
- Modify: `app/admin/(shell)/categories/page.tsx`

- [ ] **Step 1: Rewrite**

```tsx
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteCategory, bulkDeleteCategories } from '@/app/admin/actions/categories';
import SearchInput from '@/components/admin/list/SearchInput';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/categories';

export default async function CategoriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [categories.name],
    sortable: {
      name: categories.name,
      sortOrder: categories.sortOrder,
    },
    defaultSort: 'sortOrder',
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(categories).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(categories).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Danh mục</h1>
        <Link href="/admin/categories/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm danh mục
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm danh mục…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-6 text-sm text-green-900/70">
          {parsed.q ? 'Không có kết quả phù hợp.' : 'Chưa có danh mục.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteCategories}>
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-green-900/70 bg-green-50/60">
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium w-14">Icon</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Slug</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="sortOrder">Thứ tự</SortableTh>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-green-50">
                    <td className="px-4 py-2"><input type="checkbox" name="ids" value={r.id} /></td>
                    <td className="px-4 py-2 text-xl">{r.icon}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/categories/${r.id}`} className="font-medium text-green-950 hover:underline">{r.name}</Link>
                      <div className="text-xs text-green-900/60 line-clamp-1">{r.description}</div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-2">{r.sortOrder}</td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link href={`/admin/categories/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton action={deleteCategory.bind(null, r.id)} confirmText={`Xóa danh mục "${r.name}"?`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkDeleteForm>
      )}

      <div className="flex items-center justify-between">
        <Pagination basePath={BASE} parsed={parsed} schema={schema} total={total} />
        <PageSizeSelect />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/\(shell\)/categories/page.tsx
git commit -m "feat(admin): search/sort/pagination for categories list"
```

---

## Task 15: Apply to Farmers

**Files:**
- Modify: `app/admin/(shell)/farmers/page.tsx`

The rewrite follows the exact same shape as Task 14 (categories). Only the imports, `BASE`, `schema`, placeholder text, and which headers become `SortableTh` change. **Do not invent column names or action-import names — read the current file first and keep whatever is there.**

- [ ] **Step 1: Read the existing file to capture its columns/cells/imports**

Run: `cat "app/admin/(shell)/farmers/page.tsx"`. Note the existing action import names (e.g., `deleteFarmer`, `bulkDeleteFarmers` — use whatever is there exactly), the column set, and any farmer-specific cell rendering.

- [ ] **Step 2: Rewrite the page**

Use the Task 14 template wholesale. Replace:
- `BASE` constant → `'/admin/farmers'`
- imports: `categories` → `farmers`; category actions → the existing farmer actions from step 1
- schema:

  ```ts
  const schema: ListSchema = {
    searchFields: [farmers.name, farmers.farm, farmers.location, farmers.specialty],
    sortable: { name: farmers.name, createdAt: farmers.createdAt },
    defaultSort: 'name',
  };
  ```

- `SearchInput` placeholder: `"Tìm theo tên / nông trại / vùng / chuyên canh…"`
- Keep every column and cell body from the original file. Wrap the "Tên" column's `<th>` in `SortableTh` with `sortKey="name"`. No other `<th>` becomes sortable unless farmers has a `createdAt`-showing column already.
- Empty state copy: `parsed.q ? 'Không có kết quả phù hợp.' : 'Chưa có nông dân.'` (adjust the no-data message to what the current file uses).

- [ ] **Step 3: Smoke-test**

Dev server: search by name / farm / location; default sort alpha; page to 2 if more than 25 rows; click "Tên" header to toggle sort.

- [ ] **Step 4: Lint**

Run: `npm run lint` — clean.

- [ ] **Step 5: Commit**

```bash
git add app/admin/\(shell\)/farmers/page.tsx
git commit -m "feat(admin): search/sort/pagination for farmers list"
```

---

## Task 16: Apply to Testimonials, FAQ, Value Props, Contact Topics, Delivery Slots (sortOrder-default, simple config lists)

These five pages all share the same shape (`sortOrder` as default sort, one or two searchable fields, no filters). Do them in one commit with one smoke-test pass at the end.

**Files:**
- Modify: `app/admin/(shell)/testimonials/page.tsx`
- Modify: `app/admin/(shell)/faq/page.tsx`
- Modify: `app/admin/(shell)/value-props/page.tsx`
- Modify: `app/admin/(shell)/contact-topics/page.tsx`
- Modify: `app/admin/(shell)/delivery-slots/page.tsx`

- [ ] **Step 1: Rewrite each page following the Task 14 template, with per-page specifics below.**

For each, **keep every existing column/cell/DeleteButton call unchanged** — only the toolbar, schema, query, `<th>` replacements to `SortableTh`, empty state, and pagination are new.

### 16a. Testimonials

```ts
const BASE = '/admin/testimonials';
import { testimonials } from '@/db/schema';
import { deleteTestimonial, bulkDeleteTestimonials } from '@/app/admin/actions/testimonials';

const schema: ListSchema = {
  searchFields: [testimonials.name, testimonials.content],
  sortable: { name: testimonials.name, sortOrder: testimonials.sortOrder },
  defaultSort: 'sortOrder',
};
```
Placeholder: `"Tìm theo tên / nội dung…"`. Make "Tên" and "Thứ tự" sortable.

### 16b. FAQ

```ts
const BASE = '/admin/faq';
import { faqItems } from '@/db/schema';
import { deleteFaq, bulkDeleteFaq } from '@/app/admin/actions/faq';

const schema: ListSchema = {
  searchFields: [faqItems.question],
  sortable: { sortOrder: faqItems.sortOrder, question: faqItems.question },
  defaultSort: 'sortOrder',
};
```
Placeholder: `"Tìm câu hỏi…"`. Make "Thứ tự" sortable.

### 16c. Value props

```ts
const BASE = '/admin/value-props';
import { valueProps } from '@/db/schema';
import { deleteValueProp, bulkDeleteValueProps } from '@/app/admin/actions/value-props';

const schema: ListSchema = {
  searchFields: [valueProps.title, valueProps.description],
  sortable: { title: valueProps.title, sortOrder: valueProps.sortOrder },
  defaultSort: 'sortOrder',
};
```
Placeholder: `"Tìm..."`. Sortable on "Thứ tự" / "Tiêu đề".

### 16d. Contact topics

```ts
const BASE = '/admin/contact-topics';
import { contactTopics } from '@/db/schema';
import { deleteContactTopic, bulkDeleteContactTopics } from '@/app/admin/actions/contact-topics';

const schema: ListSchema = {
  searchFields: [contactTopics.label],
  sortable: { label: contactTopics.label, sortOrder: contactTopics.sortOrder },
  defaultSort: 'sortOrder',
};
```
Placeholder: `"Tìm chủ đề…"`. Sortable on "Thứ tự" / "Nhãn".

### 16e. Delivery slots

```ts
const BASE = '/admin/delivery-slots';
import { deliverySlots } from '@/db/schema';
import { deleteDeliverySlot, bulkDeleteDeliverySlots } from '@/app/admin/actions/delivery-slots';

const schema: ListSchema = {
  searchFields: [deliverySlots.label],
  sortable: { label: deliverySlots.label, sortOrder: deliverySlots.sortOrder },
  defaultSort: 'sortOrder',
};
```
Placeholder: `"Tìm khung giờ…"`. Sortable on "Thứ tự" / "Nhãn".

**Important:** if any page's action imports use a different name than listed above (e.g. `deleteSlot` vs `deleteDeliverySlot`), keep the existing name from the file — do not invent ones. The existing code is the source of truth; only replace the imports that actually exist.

- [ ] **Step 2: Smoke-test all five pages**

Visit each `/admin/<list>`, verify: search, sort, pagination work; empty states render.

- [ ] **Step 3: Lint + tests**

Run: `npm run lint && npm test` — expected clean.

- [ ] **Step 4: Commit**

```bash
git add app/admin/\(shell\)/testimonials/page.tsx \
        app/admin/\(shell\)/faq/page.tsx \
        app/admin/\(shell\)/value-props/page.tsx \
        app/admin/\(shell\)/contact-topics/page.tsx \
        app/admin/\(shell\)/delivery-slots/page.tsx
git commit -m "feat(admin): search/sort/pagination for config lists"
```

---

## Task 17: Apply to Order statuses, Payment methods, Email templates

These three have a `key` primary column instead of `id`. Same template as Task 14/16.

**Files:**
- Modify: `app/admin/(shell)/order-statuses/page.tsx`
- Modify: `app/admin/(shell)/payment-methods/page.tsx`
- Modify: `app/admin/(shell)/email-templates/page.tsx`

- [ ] **Step 1: Rewrite each.**

### 17a. Order statuses

```ts
const BASE = '/admin/order-statuses';
import { orderStatuses } from '@/db/schema';
// keep existing delete/bulk-delete imports from the current file

const schema: ListSchema = {
  searchFields: [orderStatuses.label, orderStatuses.key],
  sortable: { label: orderStatuses.label, key: orderStatuses.key, sortOrder: orderStatuses.sortOrder },
  defaultSort: 'sortOrder',
};
```
Placeholder: `"Tìm trạng thái…"`. Row key uses `key` (not `id`); keep checkbox value as `r.key` exactly as in the current file. If the current file doesn't use BulkDeleteForm, don't add it.

### 17b. Payment methods

```ts
const BASE = '/admin/payment-methods';
import { paymentMethods } from '@/db/schema';

const schema: ListSchema = {
  searchFields: [paymentMethods.label, paymentMethods.id],
  sortable: { label: paymentMethods.label, id: paymentMethods.id, sortOrder: paymentMethods.sortOrder },
  defaultSort: 'sortOrder',
};
```
Placeholder: `"Tìm phương thức…"`.

### 17c. Email templates

```ts
const BASE = '/admin/email-templates';
import { emailTemplates } from '@/db/schema';

const schema: ListSchema = {
  searchFields: [emailTemplates.subject, emailTemplates.key, emailTemplates.name],
  sortable: { key: emailTemplates.key, name: emailTemplates.name, updatedAt: emailTemplates.updatedAt },
  defaultSort: 'key',
};
```
Placeholder: `"Tìm template…"`.

- [ ] **Step 2: Smoke-test all three.**

- [ ] **Step 3: Commit**

```bash
git add app/admin/\(shell\)/order-statuses/page.tsx \
        app/admin/\(shell\)/payment-methods/page.tsx \
        app/admin/\(shell\)/email-templates/page.tsx
git commit -m "feat(admin): search/sort/pagination for key-based config lists"
```

---

## Task 18: Final verification + rollup

- [ ] **Step 1: Run lint + full test suite**

Run: `npm run lint` — 0 errors.
Run: `npm test` — all pass.

- [ ] **Step 2: Manual sweep of every admin list URL**

Visit each in dev:
- `/admin/products`
- `/admin/orders`
- `/admin/users`
- `/admin/categories`
- `/admin/farmers`
- `/admin/testimonials`
- `/admin/faq`
- `/admin/value-props`
- `/admin/contact-topics`
- `/admin/delivery-slots`
- `/admin/order-statuses`
- `/admin/payment-methods`
- `/admin/email-templates`

For each: search narrows results; sort headers toggle; pagination works (add rows if needed to test); "Xoá bộ lọc" clears; deep-linking `?q=…&sort=…&page=2` from address bar works on reload.

If any page is broken, fix inline (no new commit needed if small and on the same page as above — otherwise separate `fix(admin):` commit).

- [ ] **Step 3: Final commit (if any fixups)**

Otherwise, nothing to commit. The feature is done.

---

## Out of scope (do not implement in this plan)

- Date range picker on Orders (`createdAt`).
- CSV export.
- Saved views / bookmarks UI.
- Select-all-across-pages bulk delete.
- Column show/hide.
- Server-sent search suggestions / typeahead.
- Multi-select filters.

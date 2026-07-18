import type { AnyColumn, SQL } from 'drizzle-orm';
import { and, or, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { escapeLike } from '@/lib/sql-like';

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
    const isDesc = rawSort.startsWith('-');
    const key = isDesc ? rawSort.slice(1) : rawSort;
    if (key in schema.sortable) {
      sort = { key, dir: isDesc ? 'desc' : 'asc' };
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

export function buildPagination(parsed: ParsedListParams): { limit: number; offset: number } {
  return { limit: parsed.pageSize, offset: (parsed.page - 1) * parsed.pageSize };
}

function parseDefaultSort(raw: string): { key: string; dir: 'asc' | 'desc' } {
  if (raw.startsWith('-')) return { key: raw.slice(1), dir: 'desc' };
  return { key: raw, dir: 'asc' };
}

export function buildOrderBy(parsed: ParsedListParams, schema: ListSchema): SQL {
  const applied = parsed.sort ?? parseDefaultSort(schema.defaultSort);
  const col = schema.sortable[applied.key];
  if (!col) throw new Error(`Unknown sort key: ${applied.key}`);
  return applied.dir === 'desc' ? desc(col) : asc(col);
}

export function buildWhere(parsed: ParsedListParams, schema: ListSchema): SQL | undefined {
  const clauses: SQL[] = [];

  if (parsed.q && schema.searchFields && schema.searchFields.length > 0) {
    // Escape LIKE metacharacters so a term with % or _ doesn't act as a
    // wildcard — matching what lib/posts.ts and lib/media.ts already do.
    const like = `%${escapeLike(parsed.q)}%`;
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

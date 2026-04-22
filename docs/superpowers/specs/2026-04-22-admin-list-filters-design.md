# Admin list: search, filter, sort, pagination — Thiết kế

- **Ngày:** 2026-04-22
- **Trạng thái:** Chờ duyệt
- **Tác giả:** Claude (brainstorm với chủ dự án)

## 1. Mục tiêu

Các trang list trong `/admin/*` hiện tại đa phần là bảng thô: không search, không sort, không pagination, và chỉ Orders có filter pills theo `status`. Khi dữ liệu tăng (hàng trăm đơn, hàng trăm sản phẩm) sẽ không dùng được. Mục tiêu của phase này:

- Thêm **search**, **filter chips/select**, **sort theo cột**, và **pagination page-based** cho mọi list admin.
- Xây bộ primitives dùng chung để các list mới sau này compose nhanh; không dùng abstraction generic `<DataTable>`.
- URL là single source of truth cho state — share link/refresh/back đều giữ nguyên.

Không trong phạm vi: date range picker, CSV export, saved views, select-all-across-pages, column show/hide, search suggestions server-sent.

## 2. Quyết định kiến trúc

| Lĩnh vực | Chọn | Ghi chú |
| --- | --- | --- |
| State | **URL query string** | SSR tự nhiên; share/bookmark được |
| Client state | **Chỉ debounce buffer trong `SearchInput`** | Không Zustand, không React Query |
| Data fetching | **Server Component** đọc `searchParams`, query Drizzle trực tiếp | Giữ pattern hiện có |
| Component shape | **Primitives nhỏ** (Approach 1 đã chốt khi brainstorm) | Mỗi page tự compose toolbar |
| Pagination | **Page-based** (page + pageSize), không cursor | Biết tổng, jump trang cuối được |
| Sort UX | **Click column header** toggle asc/desc/off | Icon ↕/↑/↓ |
| Bulk delete | **Giữ nguyên**, apply trên trang hiện tại | Không select-all-across-pages |

## 3. Files mới

```
lib/admin/list-params.ts              # parse & serialize, build where/orderBy/pagination
components/admin/list/
  SearchInput.tsx         (client)    # input + debounce + router.replace
  FilterChips.tsx         (server)    # [Tất cả] [A] [B] — Link
  FilterSelect.tsx        (client)    # dropdown, submit on change
  SortableTh.tsx          (server)    # header Link với mũi tên
  Pagination.tsx          (server)    # số trang + prev/next
  PageSizeSelect.tsx      (client)    # 10/25/50
  ClearFiltersLink.tsx    (server)    # nút X xoá hết, chỉ render khi có param
```

Không tạo `<ListToolbar>` wrapper — mỗi page tự ghép để giữ linh hoạt (Orders vẫn render pills theo `orderStatuses` trong DB).

## 4. URL schema

```
?q=<string>
&sort=<col> | -<col>          ví dụ: sort=-createdAt
&page=<int ≥ 1>               default 1
&pageSize=<10|25|50>          default 25
&<filterKey>=<value>          ví dụ: status=pending, role=admin, featured=1
```

Quy tắc:
- Unknown/invalid params → ignore silent (không 400).
- `page=1` và `pageSize=25` (default) được bỏ khỏi URL để link sạch.
- Multi-value chưa cần — chọn nhiều category cùng lúc không thuộc phase này.

## 5. `lib/admin/list-params.ts` API

```ts
// filter definitions
type FilterDef =
  | { type: 'equals'; column: AnyColumn; values?: readonly string[] }  // whitelist values
  | { type: 'boolean'; column: AnyColumn };                            // '1' / '0'

type ListSchema = {
  searchFields?: AnyColumn[];                 // ILIKE OR across these
  sortable: Record<string, AnyColumn>;        // key → column, whitelist
  defaultSort: string;                        // e.g. '-createdAt' or 'name'
  filters?: Record<string, FilterDef>;
  pageSizes?: readonly number[];              // default [10, 25, 50]
  defaultPageSize?: number;                   // default 25
};

type ParsedListParams = {
  q: string;                                  // '' if absent
  sort: { key: string; dir: 'asc' | 'desc' } | null;
  page: number;                               // ≥ 1
  pageSize: number;                           // ∈ pageSizes
  filters: Record<string, string>;            // validated values only
};

// parse: from Next's searchParams
parseListParams(searchParams: Record<string, string | string[] | undefined>,
                schema: ListSchema): ParsedListParams;

// build Drizzle fragments
buildWhere(parsed: ParsedListParams, schema: ListSchema): SQL | undefined;
buildOrderBy(parsed: ParsedListParams, schema: ListSchema): SQL;
buildPagination(parsed: ParsedListParams): { limit: number; offset: number };

// URL helpers for links (return full query string, preserving other params)
sortHref(current: ParsedListParams, col: string): string;      // toggles off/asc/desc
filterHref(current: ParsedListParams, key: string,
           value: string | null): string;                      // null = clear
pageHref(current: ParsedListParams, page: number): string;
pageSizeHref(current: ParsedListParams, size: number): string;
clearHref(): string;                                           // '?'
```

Search: `OR(ILIKE(lower(col), '%'+lower(q)+'%') for col in searchFields)`. Dùng `sql` template để tương thích Postgres.

## 6. Sort toggle

Click 1: asc (`?sort=col`). Click 2: desc (`?sort=-col`). Click 3: off (param removed → defaultSort).

`<SortableTh sortKey="name" current={parsed.sort}>Tên</SortableTh>` render `<Link href={sortHref(...)}>`.

Icon logic:
- sortKey không phải current → `↕` (mờ)
- current asc → `↑`
- current desc → `↓`

## 7. Pagination

```
Hiển thị 1–25 trong 137           ‹ 1 2 … 5 6 ›         [25 / trang ▾]
```

- Total count: dùng 1 query `COUNT(*)` với cùng where filter, chạy song song với data query.
- Trang quá lớn (page > totalPages): clamp về totalPages, redirect `replace` (dùng `redirect()` của Next).
- Totaling 0 và có filter → hiện "Không có kết quả. [Xoá bộ lọc]" (link `ClearFiltersLink`).
- Totaling 0 và không có filter → giữ message hiện tại ("Chưa có sản phẩm." / "Không có đơn hàng.").

## 8. Search debounce

`SearchInput` client:
- State local `value`.
- `useEffect` với `setTimeout(250ms)` → `router.replace(href)` (replace, không push — không làm đầy history).
- `scroll: false` để không nhảy lên đầu khi gõ.
- Submit (Enter) → push ngay, không debounce.

## 9. Per-entity schemas

| Entity | searchFields | sortable (default*) | filters |
|---|---|---|---|
| Orders | id, customerName, phone, email | createdAt*, total, status | status (existing pills, DB-driven), paymentMethod (bank/cod), paymentStatus (pending/paid) |
| Products | name, id, description | name*, price, createdAt | categoryId (select, từ `categories`), featured (bool), inStock (bool) |
| Users | email, name | email*, createdAt | role (admin/customer) |
| Categories | name | name*, sortOrder | — |
| Farmers | name, region | name*, createdAt | — |
| Testimonials | name, content | createdAt* | — |
| FAQ | question | sortOrder*, createdAt | — |
| Contact topics | label, key | sortOrder* | — |
| Delivery slots | label | sortOrder* | — |
| Order statuses | label, key | sortOrder* | — |
| Payment methods | label, key | sortOrder* | — |
| Value props | label | sortOrder* | — |
| Email templates | subject, key | key* | — |

Mỗi page sẽ định nghĩa `const schema: ListSchema = {...}` cục bộ, không đưa vào file chung.

## 10. Layout toolbar (reference)

```
┌──────────────────────────────────────────────────────────────────┐
│ [🔍 Tìm kiếm ______]  [Danh mục ▾]  [⭐Nổi bật] [⚠Hết hàng]  ✕ │
└──────────────────────────────────────────────────────────────────┘
│  Tên ↕      Giá ↑      Trạng thái      Thao tác                  │
│  ...                                                              │
├──────────────────────────────────────────────────────────────────┤
│ Hiển thị 1–25 trong 137    ‹ 1 2 … 5 6 ›     [25 / trang ▾]     │
└──────────────────────────────────────────────────────────────────┘
```

- Chip active: nền `green-700`, chữ trắng (giống `FilterPill` hiện tại trong Orders).
- Clear (`✕`) chỉ render nếu có ít nhất 1 param (q / filter / sort không-default).
- PageSize mặc định ẩn param; chọn khác 25 mới hiện.

## 11. Server Component template (ví dụ Products)

```tsx
// app/admin/(shell)/products/page.tsx
import { SearchInput } from '@/components/admin/list/SearchInput';
import { FilterSelect } from '@/components/admin/list/FilterSelect';
import { FilterChips } from '@/components/admin/list/FilterChips';
import { SortableTh } from '@/components/admin/list/SortableTh';
import { Pagination } from '@/components/admin/list/Pagination';
import { PageSizeSelect } from '@/components/admin/list/PageSizeSelect';
import { parseListParams, buildWhere, buildOrderBy, buildPagination } from '@/lib/admin/list-params';

export default async function ProductsAdminPage({ searchParams }) {
  const sp = await searchParams;
  const cats = await db.select().from(categories).orderBy(asc(categories.name));

  const schema = {
    searchFields: [products.name, products.id, products.description],
    sortable: { name: products.name, price: products.price, createdAt: products.createdAt },
    defaultSort: 'name',
    filters: {
      categoryId: { type: 'equals' as const, column: products.categoryId,
                    values: cats.map((c) => c.id) },
      featured:   { type: 'boolean' as const, column: products.featured },
      inStock:    { type: 'boolean' as const, column: products.inStock },
    },
  };
  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(products).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  return (...);
}
```

## 12. Testing

- **Unit `list-params.ts`:**
  - defaults khi không có param.
  - unknown sort key → rơi về defaultSort.
  - unknown filter key → ignore.
  - `sortHref` toggle 3 chiều chính xác.
  - `clamp(page > totalPages)` trả về page cuối hợp lệ (nằm ở caller, test expectation về API).
  - `filterHref('categoryId', null)` remove param.
- **Integration 1 path (Products):** seed data, request `/admin/products?q=rau&categoryId=...&sort=-price&page=2`, assert rows đúng. Dùng Playwright nếu đã có; không thì vitest gọi trực tiếp handler.
- Không snapshot test UI primitives.

## 13. Rollout

1. Thêm primitives + `list-params.ts` + test.
2. Áp cho Products trước (đầy đủ: search + select + 2 bool chip + sort 3 cột + pagination). Xác nhận UX.
3. Áp cho Orders (giữ pills status hiện có, thêm paymentMethod/paymentStatus, search, sort, pagination).
4. Áp cho Users (search, role chip, sort, pagination).
5. Áp batch cho các config list còn lại (search + sort + pagination, không filter).

Mỗi bước là 1 commit độc lập; có thể ship dần mà không vỡ.

## 14. Out of scope (phase sau)

- Date range picker cho Orders (createdAt).
- CSV export.
- Saved views / bookmarks UI.
- Select-all-across-pages cho bulk delete.
- Column show/hide.
- Server-sent search suggestions / typeahead.
- Multi-select filter (chọn nhiều category cùng lúc).

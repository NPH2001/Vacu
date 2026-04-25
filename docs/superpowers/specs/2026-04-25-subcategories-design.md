# Subcategories — Design

**Date:** 2026-04-25
**Status:** Approved
**Author:** Vacu / brainstorming session

## Problem

The category tree is currently flat. Admin needs unlimited-depth nesting (parent → child → grandchild → …) so the storefront can group related categories. When a user lands on a parent category, they should see the subcategory list along with the aggregated products from the parent and all its descendants.

## Scope

### In scope

- Self-referential `parent_id` column on `categories`, nullable, `ON DELETE RESTRICT`.
- Unlimited nesting depth.
- Flat URL pattern preserved: `/danh-muc/<slug>` for every level (slugs are globally unique).
- Public render:
  - Breadcrumb of ancestors above the hero on category pages.
  - Subcategory card grid above the products grid when the active category has direct children.
  - Products grid aggregates the active category and **all** descendants.
  - Top-level pills bar continues to show only root categories; the pill in the active branch is highlighted.
- Admin:
  - Parent picker on the category form (nullable; "no parent" = root).
  - Cycle prevention on create/update (parent cannot be self or any descendant).
  - List page shows the parent name in each row.
- Pure-function tree helpers in `lib/categories.ts`: `buildCategoryTree`, `getDescendantIds`, `getAncestors`.
- Seed data unchanged (existing 6 categories stay as roots; admin adds children via UI).

### Out of scope

- Materialized path / nested-set / closure-table optimizations (YAGNI at this scale).
- Recursive SQL CTEs (tree work happens in JS over the already-fetched category list).
- Nested URL pattern (`/danh-muc/parent/child`) — flat keeps slugs portable when admin moves a category.
- Per-category role-based visibility.
- Bulk move / reorder UI for categories.

## Approach (Approach 1)

Add `parent_id text NULL REFERENCES categories(id) ON DELETE RESTRICT` to `categories`. The public layout already fetches all categories for the pill bar; reuse that list to build the tree in JS once per request. Pure helpers compute descendants and ancestors. The category page does one extra query: `SELECT products WHERE category_id IN (descendantIds)`.

### Alternatives considered

- **Recursive CTE** — More elegant for a single subtree query, but the page already needs the full category list for pills, so the in-memory pass is essentially free.
- **Materialized path / nested set** — Requires maintenance on every parent change; overkill at this scale.

## Schema

```ts
// db/schema.ts
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

The `(): AnyPgColumn` callback is the Drizzle pattern for self-referential FKs. `ON DELETE RESTRICT` mirrors the existing FK from `products.category_id`.

Migration: `drizzle-kit generate` produces an `ALTER TABLE` that adds the nullable column and the FK constraint. Existing rows have `parent_id = NULL`.

## Tree helpers

`lib/categories.ts` (new file) — pure functions, no DB access:

```ts
import type { CategoryRow } from '@/db/schema';

export type CategoryNode = CategoryRow & { children: CategoryNode[] };

export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>(
    rows.map((r) => [r.id, { ...r, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function getDescendantIds(rootId: string, rows: CategoryRow[]): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const r of rows) {
    if (r.parentId) {
      if (!childrenByParent.has(r.parentId)) childrenByParent.set(r.parentId, []);
      childrenByParent.get(r.parentId)!.push(r.id);
    }
  }
  const ids = [rootId];
  const queue = [rootId];
  while (queue.length) {
    const cur = queue.shift()!;
    const kids = childrenByParent.get(cur) ?? [];
    for (const kid of kids) {
      ids.push(kid);
      queue.push(kid);
    }
  }
  return ids;
}

export function getAncestors(id: string, rows: CategoryRow[]): CategoryRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const chain: CategoryRow[] = [];
  let current = byId.get(id);
  while (current?.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}
```

## Data layer

`lib/data.ts` adds:

```ts
import { inArray } from 'drizzle-orm';

export async function getProductsByCategoryDeep(categoryIds: string[]) {
  if (categoryIds.length === 0) return [];
  return db
    .select()
    .from(products)
    .where(inArray(products.categoryId, categoryIds))
    .orderBy(asc(products.name));
}
```

The single-id `getProductsByCategory` stays for the product detail page's "related products" lookup.

## Public render path

### `/danh-muc/[slug]/page.tsx`

```ts
const allCategories = await getAllCategories();
const activeCategory = allCategories.find((c) => c.id === slug);
if (!activeCategory) notFound();

const descendantIds = getDescendantIds(activeCategory.id, allCategories);
const directChildren = allCategories
  .filter((c) => c.parentId === activeCategory.id)
  .sort((a, b) => a.sortOrder - b.sortOrder);
const ancestors = getAncestors(activeCategory.id, allCategories);
const [allProducts, filtered] = await Promise.all([
  getAllProducts(),
  getProductsByCategoryDeep(descendantIds),
]);
```

Pass everything to `CategoryListing`.

### `/products/page.tsx`

Stays as the all-products view. Now passes top-level categories (root only) for the pill bar. `allProducts` continues to drive pill counts but the count formula changes (see below).

### `CategoryListing` component refactor

New props:

```ts
{
  topLevel: CategoryRow[];           // root categories for the pill bar
  directChildren: CategoryRow[];     // subcategory cards (only if any)
  ancestors: CategoryRow[];          // breadcrumb chain (root → ... → parent of active)
  filtered: ProductRow[];            // aggregated products
  allProducts: ProductRow[];         // for pill counts (deep per top-level)
  activeCategory: CategoryRow | null;
  // for descendant lookup at render time:
  allCategories: CategoryRow[];
}
```

New layout (top to bottom):

1. **Breadcrumb** — only when `ancestors.length > 0`. E.g. `Trang chủ / Nông sản / Rau củ`. Each ancestor links to its own `/danh-muc/<id>`.
2. **Hero** — same gradient + heading + description as today. Heading prefixed with category icon when active.
3. **Pill bar** — only top-level categories (filter `c.parentId === null`). Active pill: any pill whose id matches `activeCategory.id` OR is in `ancestors`. Counts use deep descendants of the pill (precomputed once).
4. **Subcategory cards** — when `directChildren.length > 0`, render a 2/3/4-col grid above the products. Each card: icon, name, description, `count` of products in that subtree. Click → `/danh-muc/<child-id>`.
5. **Products grid** — same `<ProductCard>` grid as today, fed by `filtered`.

Empty state when `filtered.length === 0` AND `directChildren.length === 0`: existing message ("Chưa có sản phẩm trong danh mục này. Xem tất cả →").

Empty state when `filtered.length === 0` AND `directChildren.length > 0`: subcategory cards still render, no products grid, no empty message (the cards are the page).

## Admin

### Schema validator

`lib/validators.ts` — `categorySchema` adds:

```ts
parentId: z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((v) => (v && v.length ? v : null))
  .nullable(),
```

### Action — cycle prevention

`app/admin/actions/categories.ts` (`createCategory`, `updateCategory`):

After Zod parse, if `parentId` is set:

1. `parentId === id` → reject "Không thể chọn chính nó làm cha".
2. Build the descendant list of the current category (only relevant on update; on create the row doesn't exist yet, so no descendants). If `parentId` is in that set → reject "Không thể chọn danh mục con làm cha".

The action loads `await db.select().from(categories)` once and uses `getDescendantIds` from `lib/categories.ts`.

### Form — parent picker

`components/admin/CategoryForm.tsx` accepts new prop `availableParents: CategoryRow[]`. The select renders:

```html
<option value="">— Không có (cấp gốc) —</option>
<!-- one <option> per available parent -->
```

The parent options are computed in the page that hosts the form:

- `/admin/categories/new` — all categories are valid parents.
- `/admin/categories/[id]` — exclude the row itself plus all its descendants (computed via `getDescendantIds`).

### List page

`app/admin/(shell)/categories/page.tsx` — add a small "Cha" line under each row's title showing `parent.name` or `—`. Existing search/sort/pagination stay.

## Migration

```sql
ALTER TABLE "categories"
  ADD COLUMN "parent_id" text;
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parent_id_categories_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id")
  ON DELETE restrict ON UPDATE no action;
```

No data backfill required.

## Tests

- `tests/lib/categories.test.ts` (new) — `buildCategoryTree`, `getDescendantIds`, `getAncestors` for empty list, single root, deep chain, multiple roots, orphaned `parent_id`.
- `tests/integration/admin-crud-actions.test.ts` — extend `categories actions` to cover `parentId`:
  - Create with valid parent.
  - Update with valid parent change.
  - Reject `parentId === id`.
  - Reject `parentId` pointing to a descendant.

## Edge cases

- **Orphaned `parent_id`** (admin DB hand-edited): tree builder ignores parents not in the row set and treats the node as a root. List page shows "—" for parent.
- **Deleting a parent with children**: `ON DELETE RESTRICT` raises `23503` from Postgres; the existing action catch-block returns the error to the form.
- **Cycles** prevented at the application layer. We don't add a DB CHECK because Postgres can't enforce graph constraints declaratively without a recursive trigger; the validator + admin path is the only place that mutates parents.
- **Products on parent**: included in the deep aggregate (root id is the first member of `descendantIds`).
- **Empty subtree page**: no products, no children → existing empty-state message; "Tất cả" link still functions.

## Files touched

| File | Status |
|------|--------|
| `db/schema.ts` | edit (`parentId` column) |
| `drizzle/0003_*.sql` | create (auto-generated migration) |
| `lib/categories.ts` | create (tree helpers) |
| `lib/data.ts` | edit (`getProductsByCategoryDeep`) |
| `lib/validators.ts` | edit (`parentId` on `categorySchema`) |
| `app/admin/actions/categories.ts` | edit (cycle validation, pass parentId through) |
| `components/admin/CategoryForm.tsx` | edit (parent select) |
| `app/admin/(shell)/categories/new/page.tsx` | edit (load all parents, pass to form) |
| `app/admin/(shell)/categories/[id]/page.tsx` | edit (filter out self + descendants) |
| `app/admin/(shell)/categories/page.tsx` | edit (show parent name on each row) |
| `components/CategoryListing.tsx` | refactor (breadcrumb, subcategory cards, top-level pills, deep counts) |
| `app/(public)/danh-muc/[slug]/page.tsx` | edit (deep products + new props) |
| `app/(public)/products/page.tsx` | edit (top-level pills only) |
| `tests/lib/categories.test.ts` | create |
| `tests/integration/admin-crud-actions.test.ts` | edit (parent / cycle tests) |

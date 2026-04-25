# Subcategories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unlimited-depth nesting to categories so admin can group categories under parents, and the public category page shows breadcrumb + subcategory cards + aggregated products from the active category and all descendants.

**Architecture:** Add a self-referential `parent_id` column to `categories`. Build the tree in-memory from the already-fetched category list using pure helpers in `lib/categories.ts`. The public layout stays mostly the same — `CategoryListing` gains a breadcrumb above the hero, a subcategory-card row above the products grid, and the pill bar shows top-level categories only with deep counts. Admin gets a parent picker on the category form with cycle prevention.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (Postgres), Zod, Vitest + Testcontainers (Postgres), TailwindCSS.

**Spec:** [docs/superpowers/specs/2026-04-25-subcategories-design.md](../specs/2026-04-25-subcategories-design.md)

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `db/schema.ts` | edit | Add `parentId` self-FK on `categories` |
| `drizzle/0003_*.sql` | create | Generated migration |
| `lib/categories.ts` | create | Pure tree helpers |
| `tests/lib/categories.test.ts` | create | Unit tests for tree helpers |
| `lib/data.ts` | edit | `getProductsByCategoryDeep(ids)` |
| `lib/validators.ts` | edit | `parentId` on `categorySchema` |
| `app/admin/actions/categories.ts` | edit | Pass `parentId`, cycle guard |
| `tests/integration/admin-crud-actions.test.ts` | edit | Cycle / parent tests |
| `components/admin/CategoryForm.tsx` | edit | Parent picker |
| `app/admin/(shell)/categories/new/page.tsx` | edit | Load all parents for picker |
| `app/admin/(shell)/categories/[id]/page.tsx` | edit | Filter out self+descendants |
| `app/admin/(shell)/categories/page.tsx` | edit | Show parent name per row |
| `components/CategoryListing.tsx` | refactor | Breadcrumb, subcat cards, top-level pills, deep counts |
| `app/(public)/danh-muc/[slug]/page.tsx` | edit | Deep aggregation + new props |
| `app/(public)/products/page.tsx` | edit | Pass top-level categories + counts |

---

## Task 1: Schema + migration

**Files:**
- Modify: `db/schema.ts` (categories table, around line 17)
- Create: `drizzle/0003_*.sql`

- [ ] **Step 1: Add `parentId` to the categories table**

In `db/schema.ts`, find the `import` block at the top (around lines 1-3) and ensure it includes `AnyPgColumn`:

```ts
import {
  pgTable, text, integer, serial, boolean, timestamp, jsonb, uuid, check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
```

(Append `type AnyPgColumn` to the existing destructure if not already present.)

Then update the `categories` table definition (currently at lines 17-25):

```ts
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

The new `parentId` is the second field. The `(): AnyPgColumn => categories.id` callback is the Drizzle pattern for self-references.

- [ ] **Step 2: Generate the migration**

```bash
npm run db:generate
```

Expected: a new file `drizzle/0003_<slug>.sql` is created. Inspect it. It should contain ONLY:
- `ALTER TABLE "categories" ADD COLUMN "parent_id" text;`
- `ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;`

If the migration touches any other table or adds extra columns, STOP and report BLOCKED — there's schema drift.

- [ ] **Step 3: Apply the migration**

```bash
npm run db:migrate
```

Expected: clean run.

Verify the column exists:

```bash
docker compose exec postgres psql -U vacu -d vacu -c "\d categories"
```

Expected: shows a `parent_id text` column and a FK constraint to `categories.id` with `ON DELETE RESTRICT`.

- [ ] **Step 4: Commit**

```bash
git add db/schema.ts drizzle/
git commit -m "feat(categories): add nullable parent_id self-FK"
```

---

## Task 2: Tree helpers (TDD)

**Files:**
- Create: `tests/lib/categories.test.ts`
- Create: `lib/categories.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/categories.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  buildCategoryTree, getDescendantIds, getAncestors,
  type CategoryNode,
} from '@/lib/categories';
import type { CategoryRow } from '@/db/schema';

function row(id: string, parentId: string | null = null, sortOrder = 0): CategoryRow {
  return {
    id,
    parentId,
    name: id,
    icon: '#',
    description: '',
    sortOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('buildCategoryTree', () => {
  it('returns empty array for no rows', () => {
    expect(buildCategoryTree([])).toEqual([]);
  });

  it('returns single root with no children', () => {
    const t = buildCategoryTree([row('a')]);
    expect(t).toHaveLength(1);
    expect(t[0].id).toBe('a');
    expect(t[0].children).toEqual([]);
  });

  it('nests children under their parent', () => {
    const t = buildCategoryTree([row('a'), row('b', 'a'), row('c', 'a')]);
    expect(t).toHaveLength(1);
    expect(t[0].children.map((c: CategoryNode) => c.id).sort()).toEqual(['b', 'c']);
  });

  it('handles deep chains', () => {
    const t = buildCategoryTree([row('a'), row('b', 'a'), row('c', 'b'), row('d', 'c')]);
    expect(t[0].id).toBe('a');
    expect(t[0].children[0].id).toBe('b');
    expect(t[0].children[0].children[0].id).toBe('c');
    expect(t[0].children[0].children[0].children[0].id).toBe('d');
  });

  it('treats orphan parent_id as a root', () => {
    const t = buildCategoryTree([row('a', 'missing')]);
    expect(t).toHaveLength(1);
    expect(t[0].id).toBe('a');
  });

  it('returns multiple roots', () => {
    const t = buildCategoryTree([row('a'), row('b'), row('c', 'a')]);
    expect(t.map((n) => n.id).sort()).toEqual(['a', 'b']);
  });
});

describe('getDescendantIds', () => {
  it('returns just the root id when no children exist', () => {
    expect(getDescendantIds('a', [row('a')])).toEqual(['a']);
  });

  it('includes the root and all descendants in BFS order', () => {
    const rows = [row('a'), row('b', 'a'), row('c', 'b'), row('d', 'a')];
    expect(getDescendantIds('a', rows)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('does not include siblings or unrelated branches', () => {
    const rows = [row('a'), row('b', 'a'), row('x'), row('y', 'x')];
    expect(getDescendantIds('a', rows).sort()).toEqual(['a', 'b']);
  });

  it('returns root id even if root not in rows (defensive)', () => {
    expect(getDescendantIds('ghost', [row('a')])).toEqual(['ghost']);
  });
});

describe('getAncestors', () => {
  it('returns empty array for a root', () => {
    expect(getAncestors('a', [row('a')])).toEqual([]);
  });

  it('returns the chain root → parent for a leaf', () => {
    const rows = [row('a'), row('b', 'a'), row('c', 'b')];
    expect(getAncestors('c', rows).map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('stops at orphan parent_id without infinite loop', () => {
    const rows = [row('a', 'missing')];
    expect(getAncestors('a', rows)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests — should fail**

```bash
npm test -- tests/lib/categories.test.ts
```

Expected: FAIL — module `@/lib/categories` not found.

- [ ] **Step 3: Implement the helpers**

Create `lib/categories.ts`:

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
      const arr = childrenByParent.get(r.parentId) ?? [];
      arr.push(r.id);
      childrenByParent.set(r.parentId, arr);
    }
  }
  const ids: string[] = [rootId];
  const queue: string[] = [rootId];
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

- [ ] **Step 4: Run tests — should pass**

```bash
npm test -- tests/lib/categories.test.ts
```

Expected: 12 tests passing in 3 describe blocks.

- [ ] **Step 5: Commit**

```bash
git add lib/categories.ts tests/lib/categories.test.ts
git commit -m "feat(categories): tree helpers (buildCategoryTree, getDescendantIds, getAncestors)"
```

---

## Task 3: Deep products query

**Files:**
- Modify: `lib/data.ts`

- [ ] **Step 1: Add `getProductsByCategoryDeep`**

In `lib/data.ts`, locate the existing `getProductsByCategory` function (around line 28). Add `inArray` to the existing `drizzle-orm` import on line 2:

```ts
import { eq, asc, inArray } from 'drizzle-orm';
```

Add the new function right below `getProductsByCategory`:

```ts
export async function getProductsByCategoryDeep(categoryIds: string[]) {
  if (categoryIds.length === 0) return [];
  return db
    .select()
    .from(products)
    .where(inArray(products.categoryId, categoryIds))
    .orderBy(asc(products.name));
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.json --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/data.ts
git commit -m "feat(categories): getProductsByCategoryDeep for tree aggregation"
```

---

## Task 4: Validator + cycle-guarded action

**Files:**
- Modify: `lib/validators.ts`
- Modify: `app/admin/actions/categories.ts`
- Modify: `tests/integration/admin-crud-actions.test.ts`

### Step 1: Write failing integration tests

- [ ] In `tests/integration/admin-crud-actions.test.ts`, find the existing `categories actions` describe block. Append these new tests **inside** that describe (so they share the existing `bootPg` and auth mock setup). If you can't find it, search for `describe('categories` and add the tests just before its closing `});`.

Append:

```ts
  it('creates a category with a valid parent', async () => {
    const { createCategory } = await import('@/app/admin/actions/categories');
    const { db } = await import('@/db/client');
    const { categories } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const parent = new FormData();
    parent.set('id', 'parent-cat'); parent.set('name', 'Parent');
    parent.set('icon', '🥦'); parent.set('description', 'p'); parent.set('sortOrder', '0');
    await expect(createCategory(null, parent)).rejects.toThrow();

    const child = new FormData();
    child.set('id', 'child-cat'); child.set('name', 'Child');
    child.set('icon', '🥬'); child.set('description', 'c'); child.set('sortOrder', '1');
    child.set('parentId', 'parent-cat');
    await expect(createCategory(null, child)).rejects.toThrow();

    const [row] = await db.select().from(categories).where(eq(categories.id, 'child-cat'));
    expect(row.parentId).toBe('parent-cat');
  });

  it('rejects parentId equal to id (self-cycle)', async () => {
    const { createCategory } = await import('@/app/admin/actions/categories');
    const fd = new FormData();
    fd.set('id', 'self-cat'); fd.set('name', 'Self');
    fd.set('icon', '🥦'); fd.set('description', 'x'); fd.set('sortOrder', '0');
    fd.set('parentId', 'self-cat');
    const res = await createCategory(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects updateCategory parentId pointing to a descendant', async () => {
    const { createCategory, updateCategory } =
      await import('@/app/admin/actions/categories');
    // Build: A → B → C
    for (const [id, parent] of [['cyc-a', null], ['cyc-b', 'cyc-a'], ['cyc-c', 'cyc-b']] as const) {
      const fd = new FormData();
      fd.set('id', id); fd.set('name', id); fd.set('icon', '🥦');
      fd.set('description', 'x'); fd.set('sortOrder', '0');
      if (parent) fd.set('parentId', parent);
      await expect(createCategory(null, fd)).rejects.toThrow();
    }
    // Try to make A's parent be C (which is a descendant of A).
    const u = new FormData();
    u.set('id', 'cyc-a'); u.set('name', 'cyc-a'); u.set('icon', '🥦');
    u.set('description', 'x'); u.set('sortOrder', '0');
    u.set('parentId', 'cyc-c');
    const res = await updateCategory('cyc-a', null, u);
    expect(res?.error).toBeTruthy();
  });
```

- [ ] **Step 2: Run tests — should fail (action doesn't accept parentId yet)**

```bash
npm test -- tests/integration/admin-crud-actions.test.ts -t "categories actions"
```

Expected: the new "creates a category with a valid parent" test fails because `parentId` is dropped by the validator.

### Step 3: Update the validator

- [ ] In `lib/validators.ts`, find `categorySchema` (around lines 12-18). Replace the entire block with:

```ts
const optParentSlug = z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((v) => (v && v.length ? v : null))
  .nullable();

export const categorySchema = z.object({
  id: slug,
  parentId: optParentSlug,
  name: z.string().min(1).max(120),
  icon: z.string().min(1).max(10),
  description: z.string().min(1).max(300),
  sortOrder: z.coerce.number().int().default(0),
});
```

### Step 4: Update the action

- [ ] In `app/admin/actions/categories.ts`, replace the file with:

```ts
'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import { categorySchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { getDescendantIds } from '@/lib/categories';

export type CategoryFormState = { error?: string } | null;

function isFkViolation(e: unknown): boolean {
  const err = e as { message?: string; code?: string; cause?: { message?: string; code?: string } };
  if (err.code === '23503' || err.cause?.code === '23503') return true;
  const msg = `${err.message ?? ''} ${err.cause?.message ?? ''}`;
  return /violates foreign key|restrict/i.test(msg);
}

function parse(fd: FormData) {
  return categorySchema.safeParse({
    id: fd.get('id'),
    parentId: fd.get('parentId'),
    name: fd.get('name'),
    icon: fd.get('icon'),
    description: fd.get('description'),
    sortOrder: fd.get('sortOrder') || 0,
  });
}

async function checkCycle(id: string, parentId: string | null): Promise<string | null> {
  if (!parentId) return null;
  if (parentId === id) return 'Không thể chọn chính nó làm cha';
  const allRows = await db.select().from(categories);
  const descendants = getDescendantIds(id, allRows);
  if (descendants.includes(parentId)) return 'Không thể chọn danh mục con làm cha';
  return null;
}

export async function createCategory(_prev: CategoryFormState, fd: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const cycleErr = await checkCycle(r.data.id, r.data.parentId);
  if (cycleErr) return { error: cycleErr };
  try { await db.insert(categories).values(r.data); }
  catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function updateCategory(originalId: string, _prev: CategoryFormState, fd: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const cycleErr = await checkCycle(originalId, r.data.parentId);
  if (cycleErr) return { error: cycleErr };
  try {
    await db.update(categories).set({ ...r.data, updatedAt: new Date() }).where(eq(categories.id, originalId));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (e) {
    if (isFkViolation(e)) throw new Error('Không thể xóa: danh mục đang được sản phẩm hoặc danh mục con sử dụng.');
    throw e;
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function bulkDeleteCategories(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) { redirect('/admin/categories'); }
  try {
    await db.delete(categories).where(inArray(categories.id, ids));
  } catch (e) {
    if (isFkViolation(e)) throw new Error('Không thể xóa: có danh mục đang được sản phẩm hoặc danh mục con sử dụng.');
    throw e;
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}
```

Note the only changes vs the previous file:
- Added `getDescendantIds` import and `checkCycle` helper.
- `parse()` now reads `parentId` from FormData.
- `createCategory` and `updateCategory` call `checkCycle` after Zod parse.
- `deleteCategory` and `bulkDeleteCategories` error messages mention "danh mục con" because the FK now also restricts removing a parent that has children.

- [ ] **Step 5: Run integration tests — should now pass**

```bash
npm test -- tests/integration/admin-crud-actions.test.ts -t "categories actions"
```

Expected: all categories actions tests pass (including the 3 new ones).

- [ ] **Step 6: Commit**

```bash
git add lib/validators.ts app/admin/actions/categories.ts tests/integration/admin-crud-actions.test.ts
git commit -m "feat(categories): parentId on validator + cycle-guarded action"
```

---

## Task 5: Admin form — parent picker

**Files:**
- Modify: `components/admin/CategoryForm.tsx`
- Modify: `app/admin/(shell)/categories/new/page.tsx`
- Modify: `app/admin/(shell)/categories/[id]/page.tsx`

- [ ] **Step 1: Update the form to accept and render `availableParents`**

Replace the entire content of `components/admin/CategoryForm.tsx` with:

```tsx
'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { CategoryFormState } from '@/app/admin/actions/categories';
import type { CategoryRow } from '@/db/schema';
import EmojiPicker from './EmojiPicker';

export default function CategoryForm({
  action, defaults, editing, availableParents,
}: {
  action: (prev: CategoryFormState, fd: FormData) => Promise<CategoryFormState>;
  defaults?: Partial<CategoryRow>;
  editing: boolean;
  availableParents: Pick<CategoryRow, 'id' | 'name'>[];
}) {
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(action, null);
  const d = defaults ?? {};
  const [icon, setIcon] = useState(d.icon ?? '');
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <L label="Slug (ID)" required>
          <input name="id" defaultValue={d.id ?? ''} required readOnly={editing} pattern="[a-z0-9-]+"
            className="w-full border border-green-200 rounded px-3 py-2 read-only:bg-green-50 read-only:text-green-900/70" />
        </L>
        <L label="Tên" required>
          <input name="name" defaultValue={d.name ?? ''} required
            className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
        <L label="Icon (emoji)" required>
          <EmojiPicker value={icon} onChange={setIcon} name="icon" required />
        </L>
        <L label="Thứ tự">
          <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
            className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
        <L label="Danh mục cha">
          <select name="parentId" defaultValue={d.parentId ?? ''}
            className="w-full border border-green-200 rounded px-3 py-2 bg-white">
            <option value="">— Không có (cấp gốc) —</option>
            {availableParents.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </L>
      </div>
      <L label="Mô tả" required>
        <textarea name="description" defaultValue={d.description ?? ''} required rows={3}
          className="w-full border border-green-200 rounded px-3 py-2" />
      </L>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/categories" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}

function L({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
```

- [ ] **Step 2: Update the create page to load all parents**

Replace `app/admin/(shell)/categories/new/page.tsx` with:

```tsx
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import CategoryForm from '@/components/admin/CategoryForm';
import { createCategory } from '@/app/admin/actions/categories';

export default async function NewCategoryPage() {
  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Danh mục mới</h1>
      <CategoryForm action={createCategory} editing={false} availableParents={rows} />
    </div>
  );
}
```

- [ ] **Step 3: Update the edit page to filter out self + descendants**

Replace `app/admin/(shell)/categories/[id]/page.tsx` with:

```tsx
import { notFound } from 'next/navigation';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import CategoryForm from '@/components/admin/CategoryForm';
import { updateCategory } from '@/app/admin/actions/categories';
import { getDescendantIds } from '@/lib/categories';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const all = await db.select().from(categories).orderBy(asc(categories.name));
  const blocked = new Set(getDescendantIds(row.id, all));
  const availableParents = all
    .filter((c) => !blocked.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));
  const bound = updateCategory.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa: {row.name}</h1>
      <CategoryForm action={bound} defaults={row} editing availableParents={availableParents} />
    </div>
  );
}
```

- [ ] **Step 4: Type-check + run tests**

```bash
npx tsc -p tsconfig.json --noEmit
npm test
```

Expected: clean type check, all tests still pass.

- [ ] **Step 5: Commit**

```bash
git add components/admin/CategoryForm.tsx 'app/admin/(shell)/categories/new/page.tsx' 'app/admin/(shell)/categories/[id]/page.tsx'
git commit -m "feat(categories): admin parent picker + descendant filter on edit"
```

---

## Task 6: Admin list — show parent name

**Files:**
- Modify: `app/admin/(shell)/categories/page.tsx`

- [ ] **Step 1: Update the list page**

Replace the entire content of `app/admin/(shell)/categories/page.tsx` with:

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

  const [rows, totalRows, allRows] = await Promise.all([
    db.select().from(categories).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(categories).where(where),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const nameById = new Map(allRows.map((r) => [r.id, r.name]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Danh mục</h1>
        <Link
          href="/admin/categories/new"
          className="admin-btn-primary">
          + Thêm danh mục
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm danh mục…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {parsed.q ? 'Không có kết quả phù hợp.' : 'Chưa có danh mục.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteCategories}>
          <div className="admin-panel-flush">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium w-14">Icon</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Slug</th>
                  <th className="px-4 py-2.5 font-medium">Cha</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="sortOrder">Thứ tự</SortableTh>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2"><input type="checkbox" name="ids" value={r.id} /></td>
                    <td className="px-4 py-2 text-xl">{r.icon}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/categories/${r.id}`} className="font-medium text-green-950 hover:underline">{r.name}</Link>
                      <div className="text-xs text-green-900/60 line-clamp-1">{r.description}</div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-2 text-sm text-green-900/70">
                      {r.parentId ? (nameById.get(r.parentId) ?? r.parentId) : '—'}
                    </td>
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

Differences from the previous file:
- Third item in `Promise.all`: a small `id, name` lookup for parent display.
- New `<th>` header "Cha" and a corresponding `<td>` showing the parent name (or "—").

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.json --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add 'app/admin/(shell)/categories/page.tsx'
git commit -m "feat(categories): admin list shows parent column"
```

---

## Task 7: Refactor `CategoryListing` — breadcrumb, subcat cards, deep counts

**Files:**
- Modify: `components/CategoryListing.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire content of `components/CategoryListing.tsx` with:

```tsx
import Link from 'next/link';
import type { CategoryRow, ProductRow } from '@/db/schema';
import { getDescendantIds } from '@/lib/categories';
import ProductCard from '@/components/ProductCard';

export default function CategoryListing({
  topLevel, directChildren, ancestors, filtered, allProducts, activeCategory, allCategories,
}: {
  topLevel: CategoryRow[];
  directChildren: CategoryRow[];
  ancestors: CategoryRow[];
  filtered: ProductRow[];
  allProducts: ProductRow[];
  activeCategory: CategoryRow | null;
  allCategories: CategoryRow[];
}) {
  const activeBranchIds = activeCategory
    ? new Set([activeCategory.id, ...ancestors.map((a) => a.id)])
    : new Set<string>();

  return (
    <div>
      {ancestors.length > 0 && (
        <nav className="max-w-7xl mx-auto px-4 pt-6 text-sm text-green-900/60">
          <Link href="/products" className="hover:underline">Tất cả nông sản</Link>
          {ancestors.map((a) => (
            <span key={a.id}>
              {' / '}
              <Link href={`/danh-muc/${a.id}`} className="hover:underline">{a.name}</Link>
            </span>
          ))}
          {activeCategory && (
            <span>{' / '}<span className="text-green-950">{activeCategory.name}</span></span>
          )}
        </nav>
      )}

      <section className="bg-gradient-to-br from-green-800 to-green-950 text-white py-14 mt-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-amber-300 text-sm font-bold tracking-widest uppercase mb-2">Chợ nông trại</div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-3">
            {activeCategory ? `${activeCategory.icon} ${activeCategory.name}` : 'Toàn bộ nông sản'}
          </h1>
          <p className="text-green-100/80 max-w-xl">
            {activeCategory ? activeCategory.description : 'Rau củ, trái cây, trứng thịt, gia vị — thu hoạch trực tiếp từ nông trại.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          <Link href="/products" className={pillClass(!activeCategory)}>
            Tất cả · {allProducts.length}
          </Link>
          {topLevel.map((c) => {
            const ids = getDescendantIds(c.id, allCategories);
            const count = allProducts.filter((p) => ids.includes(p.categoryId)).length;
            return (
              <Link
                key={c.id}
                href={`/danh-muc/${c.id}`}
                className={pillClass(activeBranchIds.has(c.id))}
              >
                {c.icon} {c.name} · {count}
              </Link>
            );
          })}
        </div>

        {directChildren.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {directChildren.map((c) => {
              const ids = getDescendantIds(c.id, allCategories);
              const count = allProducts.filter((p) => ids.includes(p.categoryId)).length;
              return (
                <Link
                  key={c.id}
                  href={`/danh-muc/${c.id}`}
                  className="block bg-white rounded-2xl border border-green-100 p-5 text-center hover:shadow-lg hover:-translate-y-1 transition h-full"
                >
                  <div className="text-4xl mb-2">{c.icon}</div>
                  <div className="font-bold text-green-950">{c.name}</div>
                  <div className="text-xs text-green-800/60 mt-1 line-clamp-2">{c.description}</div>
                  <div className="text-xs text-green-700 font-semibold mt-2">{count} sản phẩm</div>
                </Link>
              );
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          directChildren.length === 0 && (
            <div className="text-center py-16 text-green-900/60">
              Chưa có sản phẩm trong danh mục này.{' '}
              <Link href="/products" className="text-green-700 font-semibold underline">Xem tất cả</Link>
            </div>
          )
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function pillClass(active: boolean) {
  return `shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border transition ${
    active ? 'bg-green-700 text-white border-green-700' : 'bg-white text-green-900 border-green-200 hover:border-green-400'
  }`;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.json --noEmit
```

Compile will fail because the two callers (`/products` and `/danh-muc/[slug]`) still pass the old prop set. Move on — Tasks 8 + 9 fix this. Skip the commit for now.

---

## Task 8: Wire `/products/page.tsx` to new prop shape

**Files:**
- Modify: `app/(public)/products/page.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire content of `app/(public)/products/page.tsx` with:

```tsx
export const dynamic = 'force-dynamic';

import { permanentRedirect } from 'next/navigation';
import { getAllCategories, getAllProducts } from '@/lib/data';
import CategoryListing from '@/components/CategoryListing';

type SearchParams = Promise<{ c?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { c } = await searchParams;
  if (c && /^[a-z0-9-]+$/.test(c)) permanentRedirect(`/danh-muc/${c}`);

  const [allCategories, allProducts] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);
  const topLevel = allCategories.filter((cat) => !cat.parentId);
  return (
    <CategoryListing
      topLevel={topLevel}
      directChildren={[]}
      ancestors={[]}
      filtered={allProducts}
      allProducts={allProducts}
      activeCategory={null}
      allCategories={allCategories}
    />
  );
}
```

(Compilation still won't be clean until Task 9. No commit yet.)

---

## Task 9: Wire `/danh-muc/[slug]/page.tsx` to new prop shape

**Files:**
- Modify: `app/(public)/danh-muc/[slug]/page.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire content of `app/(public)/danh-muc/[slug]/page.tsx` with:

```tsx
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import {
  getAllCategories, getAllProducts, getProductsByCategoryDeep, getCategory,
} from '@/lib/data';
import { getDescendantIds, getAncestors } from '@/lib/categories';
import CategoryListing from '@/components/CategoryListing';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return {};
  return {
    title: `${cat.name} — ${cat.description}`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [activeCategory, allCategories, allProducts] = await Promise.all([
    getCategory(slug),
    getAllCategories(),
    getAllProducts(),
  ]);
  if (!activeCategory) notFound();

  const descendantIds = getDescendantIds(activeCategory.id, allCategories);
  const directChildren = allCategories
    .filter((c) => c.parentId === activeCategory.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const ancestors = getAncestors(activeCategory.id, allCategories);
  const topLevel = allCategories.filter((c) => !c.parentId);
  const filtered = await getProductsByCategoryDeep(descendantIds);

  return (
    <CategoryListing
      topLevel={topLevel}
      directChildren={directChildren}
      ancestors={ancestors}
      filtered={filtered}
      allProducts={allProducts}
      activeCategory={activeCategory}
      allCategories={allCategories}
    />
  );
}
```

- [ ] **Step 2: Type-check + run tests**

```bash
npx tsc -p tsconfig.json --noEmit
npm test
```

Expected: clean type check, all 360+ tests pass (you added new ones in Task 4).

- [ ] **Step 3: Commit Tasks 7+8+9 together**

```bash
git add components/CategoryListing.tsx 'app/(public)/products/page.tsx' 'app/(public)/danh-muc/[slug]/page.tsx'
git commit -m "feat(categories): public render — breadcrumb, subcategory cards, deep aggregation"
```

---

## Task 10: Final verification

- [ ] **Step 1: Type check the whole project**

```bash
npx tsc -p tsconfig.json --noEmit
```

Expected: clean.

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```

Expected: all suites pass. Test count is 360 + 12 new (`tests/lib/categories.test.ts`) + 3 new (categories integration tests) = 375.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: success. `/danh-muc/[slug]` and `/products` both register.

- [ ] **Step 4: Manual smoke walk-through**

Use the existing dev server (port 3001) or start one. Steps:

1. Visit `/admin/categories/new` and create a category `rau-la-xanh` named "Rau lá xanh", icon "🥬", description "Rau lá xanh tươi", parent = "Rau củ" (`rau-cu`).
2. Visit `/admin/categories` — confirm "Rau lá xanh" row shows `Cha: Rau củ`.
3. Visit `/danh-muc/rau-cu` (the parent) — confirm:
   - Breadcrumb: `Tất cả nông sản / Rau củ`.
   - Pill bar: top-level categories only; "Rau củ" pill is highlighted.
   - Subcategory card grid contains "Rau lá xanh" with its product count (0 right now).
   - Products grid below shows existing `rau-cu`-tagged products.
4. Visit `/danh-muc/rau-la-xanh` (the child) — confirm:
   - Breadcrumb: `Tất cả nông sản / Rau củ / Rau lá xanh`.
   - "Rau củ" pill highlighted (because the active category is in its branch).
   - No subcategory cards (this is a leaf).
   - Empty product state because nothing is assigned yet.
5. Edit "Rau lá xanh" and try to set its parent to itself → expect form error.
6. Edit "Rau củ" and try to set its parent to "Rau lá xanh" (a descendant) → expect form error.
7. Delete "Rau củ" while "Rau lá xanh" still references it → expect error "Không thể xóa: danh mục đang được sản phẩm hoặc danh mục con sử dụng."
8. Delete "Rau lá xanh" first, then "Rau củ" — should fail because products reference Rau củ. Don't pursue further; the data was just for the smoke test.

If everything works, no further commit. If a fix is needed, commit as `fix(categories): ...`.

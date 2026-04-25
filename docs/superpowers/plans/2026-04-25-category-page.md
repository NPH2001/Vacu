# Category Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dedicated category pages at `/danh-muc/<slug>` and 308-redirect the legacy `/products?c=<slug>` URLs there, while keeping the same listing layout.

**Architecture:** Extract the `/products` listing UI (hero + category pills + product grid) into a shared `CategoryListing` component. New route `/danh-muc/[slug]` fetches one category and renders the component. `/products` becomes the "all products" view, and any request with a `c=` param is converted to a 308 via `permanentRedirect`. Update every internal link to the new URL and add a one-time idempotent data fix in the boot-time seeder.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (Postgres), TailwindCSS.

**Spec:** [docs/superpowers/specs/2026-04-25-category-page-design.md](../specs/2026-04-25-category-page-design.md)

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `components/CategoryListing.tsx` | create | Shared layout: hero + pills + grid |
| `app/(public)/danh-muc/[slug]/page.tsx` | create | New per-category route + per-category metadata |
| `app/(public)/products/page.tsx` | rewrite | All-products view + 308 redirect on `?c=` |
| `app/(public)/page.tsx` | edit | Update home category card link (line 109) |
| `app/(public)/products/[id]/page.tsx` | edit | Update breadcrumb category link (line 33) |
| `components/Footer.tsx` | edit | Update "Danh mục" column links (line 58) |
| `components/admin/MenuItemForm.tsx` | edit | Update placeholder text (line 39) |
| `db/schema.ts` | edit | Update `siteInfo.subBoxLink` default (line 110) |
| `db/seed.ts` | edit | Update default header seed URLs |
| `scripts/seed.mjs` | edit | Update default header seed URLs + add idempotent UPDATEs for existing rows |

---

## Task 1: Shared `CategoryListing` component

**Files:**
- Create: `components/CategoryListing.tsx`

- [ ] **Step 1: Create the file**

Full content of `components/CategoryListing.tsx`:

```tsx
import Link from 'next/link';
import type { CategoryRow, ProductRow } from '@/db/schema';
import ProductCard from '@/components/ProductCard';

export default function CategoryListing({
  categories, allProducts, filtered, activeCategory,
}: {
  categories: CategoryRow[];
  allProducts: ProductRow[];
  filtered: ProductRow[];
  activeCategory: CategoryRow | null;
}) {
  return (
    <div>
      <section className="bg-gradient-to-br from-green-800 to-green-950 text-white py-14">
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
          {categories.map((c) => {
            const count = allProducts.filter((p) => p.categoryId === c.id).length;
            return (
              <Link
                key={c.id}
                href={`/danh-muc/${c.id}`}
                className={pillClass(activeCategory?.id === c.id)}
              >
                {c.icon} {c.name} · {count}
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-green-900/60">
            Chưa có sản phẩm trong danh mục này.{' '}
            <Link href="/products" className="text-green-700 font-semibold underline">Xem tất cả</Link>
          </div>
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

Expected: no errors. (The component is not yet imported anywhere but should compile in isolation since all its dependencies — `CategoryRow`, `ProductRow`, `ProductCard` — already exist.)

- [ ] **Step 3: Commit**

```bash
git add components/CategoryListing.tsx
git commit -m "feat(category): extract shared CategoryListing component"
```

---

## Task 2: Rewrite `/products` page (extract layout + add redirect)

**Files:**
- Modify: `app/(public)/products/page.tsx`

- [ ] **Step 1: Replace the entire file**

Full new contents of `app/(public)/products/page.tsx`:

```tsx
export const dynamic = 'force-dynamic';

import { permanentRedirect } from 'next/navigation';
import { getAllCategories, getAllProducts } from '@/lib/data';
import CategoryListing from '@/components/CategoryListing';

type SearchParams = Promise<{ c?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { c } = await searchParams;
  if (c) permanentRedirect(`/danh-muc/${c}`);

  const [categories, allProducts] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);
  return (
    <CategoryListing
      categories={categories}
      allProducts={allProducts}
      filtered={allProducts}
      activeCategory={null}
    />
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/products/page.tsx
git commit -m "feat(category): /products uses CategoryListing + 308 redirect on ?c"
```

---

## Task 3: New route `/danh-muc/[slug]`

**Files:**
- Create: `app/(public)/danh-muc/[slug]/page.tsx`

- [ ] **Step 1: Create the directory and the file**

```bash
mkdir -p 'app/(public)/danh-muc/[slug]'
```

Full content of `app/(public)/danh-muc/[slug]/page.tsx`:

```tsx
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import {
  getAllCategories, getAllProducts, getProductsByCategory, getCategory,
} from '@/lib/data';
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
  const [activeCategory, categories, allProducts, filtered] = await Promise.all([
    getCategory(slug),
    getAllCategories(),
    getAllProducts(),
    getProductsByCategory(slug),
  ]);
  if (!activeCategory) notFound();
  return (
    <CategoryListing
      categories={categories}
      allProducts={allProducts}
      filtered={filtered}
      activeCategory={activeCategory}
    />
  );
}
```

- [ ] **Step 2: Type-check + run all tests**

```bash
npx tsc -p tsconfig.json --noEmit
npm test
```

Expected: type check clean, all 360 tests still pass.

- [ ] **Step 3: Smoke-check via curl**

Start the dev server in a second terminal (or rely on an already-running instance) and curl all four URLs:

```bash
# Existing /products — should still serve all products (200, contains "Toàn bộ nông sản")
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/products

# Old query-string URL — should be a 308 redirect
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/products?c=rau-cu

# New category page — should be a 200 with the category name in HTML
curl -s http://localhost:3000/danh-muc/rau-cu | grep -oE "Rau củ" | head -1

# Unknown slug — should be a 404
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/danh-muc/khong-ton-tai
```

Expected output:
- `/products` → `200`
- `/products?c=rau-cu` → `308 http://localhost:3000/danh-muc/rau-cu`
- `/danh-muc/rau-cu` → prints `Rau củ`
- `/danh-muc/khong-ton-tai` → `404`

If any port other than 3000 is in use (e.g. 3001 from an existing `next dev`), substitute it.

- [ ] **Step 4: Commit**

```bash
git add 'app/(public)/danh-muc/'
git commit -m "feat(category): /danh-muc/[slug] route + per-category metadata"
```

---

## Task 4: Update home page category card links

**Files:**
- Modify: `app/(public)/page.tsx` (line 109)

- [ ] **Step 1: Replace the link**

In `app/(public)/page.tsx`, find this block (around line 108–109):

```tsx
              <Link
                href={`/products?c=${c.id}`}
```

Replace with:

```tsx
              <Link
                href={`/danh-muc/${c.id}`}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.json --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add 'app/(public)/page.tsx'
git commit -m "feat(category): home page category cards link to /danh-muc"
```

---

## Task 5: Update product-detail breadcrumb

**Files:**
- Modify: `app/(public)/products/[id]/page.tsx` (line 33)

- [ ] **Step 1: Replace the link**

In `app/(public)/products/[id]/page.tsx`, change:

```tsx
            {" "}/ <Link href={`/products?c=${category.id}`} className="hover:underline">{category.name}</Link>
```

to:

```tsx
            {" "}/ <Link href={`/danh-muc/${category.id}`} className="hover:underline">{category.name}</Link>
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.json --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add 'app/(public)/products/[id]/page.tsx'
git commit -m "feat(category): product detail breadcrumb links to /danh-muc"
```

---

## Task 6: Update Footer "Danh mục" column

**Files:**
- Modify: `components/Footer.tsx` (line 58)

- [ ] **Step 1: Replace the link**

In `components/Footer.tsx`, change:

```tsx
                <Link href={`/products?c=${c.id}`} className="hover:text-white">
```

to:

```tsx
                <Link href={`/danh-muc/${c.id}`} className="hover:text-white">
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.json --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/Footer.tsx
git commit -m "feat(category): footer Danh mục column links to /danh-muc"
```

---

## Task 7: Update admin MenuItemForm placeholder

**Files:**
- Modify: `components/admin/MenuItemForm.tsx` (line 39)

- [ ] **Step 1: Replace the placeholder string**

In `components/admin/MenuItemForm.tsx`, find:

```tsx
          placeholder="VD: /products?c=rau-cu hoặc https://..." />
```

Replace with:

```tsx
          placeholder="VD: /danh-muc/rau-cu hoặc https://..." />
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/MenuItemForm.tsx
git commit -m "feat(category): admin MenuItemForm placeholder uses /danh-muc"
```

---

## Task 8: Update schema default for `siteInfo.subBoxLink`

**Files:**
- Modify: `db/schema.ts` (line 110)

- [ ] **Step 1: Update the default value**

In `db/schema.ts`, find:

```ts
    subBoxLink: text('sub_box_link').notNull().default('/products?c=hop-qua'),
```

Replace with:

```ts
    subBoxLink: text('sub_box_link').notNull().default('/danh-muc/hop-qua'),
```

- [ ] **Step 2: Generate the migration**

```bash
npm run db:generate
```

Expected: a new file `drizzle/0002_<slug>.sql` is created. Inspect it. It should be a single `ALTER TABLE "site_info" ALTER COLUMN "sub_box_link" SET DEFAULT '/danh-muc/hop-qua';` (or equivalent) — no other changes.

If the generated migration touches any other column or table, STOP and re-check the schema file before continuing.

- [ ] **Step 3: Apply the migration**

```bash
npm run db:migrate
```

Expected: migration runs without error.

- [ ] **Step 4: Commit**

```bash
git add db/schema.ts drizzle/
git commit -m "feat(category): siteInfo.subBoxLink default uses /danh-muc"
```

---

## Task 9: Update default seed URLs (TS + JS) and add idempotent data fix

**Files:**
- Modify: `db/seed.ts` (lines 72–73)
- Modify: `scripts/seed.mjs` (lines 93–94, plus append data-fix block)

- [ ] **Step 1: Update `db/seed.ts`**

In `db/seed.ts`, locate the menu_items HEADER array and replace these two lines:

```ts
      { label: 'Rau Sạch Hữu Cơ',   href: '/products?c=rau-cu' },
      { label: 'Gà ăn thảo dược',   href: '/products?c=trung-thit' },
```

with:

```ts
      { label: 'Rau Sạch Hữu Cơ',   href: '/danh-muc/rau-cu' },
      { label: 'Gà ăn thảo dược',   href: '/danh-muc/trung-thit' },
```

- [ ] **Step 2: Update `scripts/seed.mjs`** (default seed lines)

Same edit in `scripts/seed.mjs` — replace the two lines:

```js
      { label: 'Rau Sạch Hữu Cơ',   href: '/products?c=rau-cu' },
      { label: 'Gà ăn thảo dược',   href: '/products?c=trung-thit' },
```

with:

```js
      { label: 'Rau Sạch Hữu Cơ',   href: '/danh-muc/rau-cu' },
      { label: 'Gà ăn thảo dược',   href: '/danh-muc/trung-thit' },
```

- [ ] **Step 3: Append the idempotent data-fix block to `scripts/seed.mjs`**

In `scripts/seed.mjs`, find the end of the `try` block — just before `await client.query('COMMIT');`. Insert this block on the line above:

```js
  // One-time URL migration for existing installs: /products?c=<slug> → /danh-muc/<slug>
  await client.query(
    `UPDATE menu_items
       SET href = REPLACE(href, '/products?c=', '/danh-muc/')
       WHERE href LIKE '/products?c=%'`,
  );
  await client.query(
    `UPDATE site_info
       SET sub_box_link = '/danh-muc/hop-qua'
       WHERE sub_box_link = '/products?c=hop-qua'`,
  );
```

The block is idempotent: subsequent runs won't match the `LIKE` or the equality and update zero rows.

- [ ] **Step 4: Verify against the live local DB**

The local DB already has the seeded `menu_items` rows from the previous feature, plus a default `site_info.sub_box_link` of `/products?c=hop-qua`. Run the seeder:

```bash
DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-) node scripts/seed.mjs
```

Then check the live state. The DB user is `vacu` (not `postgres`):

```bash
docker compose exec postgres psql -U vacu -d vacu -c \
  "SELECT label, href FROM menu_items WHERE href LIKE '/danh-muc/%' ORDER BY sort_order;"
docker compose exec postgres psql -U vacu -d vacu -c \
  "SELECT sub_box_link FROM site_info WHERE id = 1;"
```

Expected:
- `Rau Sạch Hữu Cơ` → `/danh-muc/rau-cu`, `Gà ăn thảo dược` → `/danh-muc/trung-thit` (and any other `/products?c=...` rows now rewritten).
- `sub_box_link` → `/danh-muc/hop-qua`.

Run the seeder a second time to confirm idempotency:

```bash
DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-) node scripts/seed.mjs
docker compose exec postgres psql -U vacu -d vacu -c \
  "SELECT COUNT(*) FROM menu_items WHERE href LIKE '/products?c=%';"
```

Expected: `0`. (Nothing left to migrate.)

- [ ] **Step 5: Commit**

```bash
git add db/seed.ts scripts/seed.mjs
git commit -m "feat(category): seed defaults and one-time fix for old ?c= URLs"
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

Expected: 360/360 still pass (no tests added or removed).

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: build succeeds. The route list should include both `/products` and `/danh-muc/[slug]`.

- [ ] **Step 4: Manual smoke walk-through**

Run `npm run dev` (or use the existing instance). Visit each URL in a browser:

- `http://localhost:3000/` — home page; click any category card → lands on `/danh-muc/<slug>`, shows that category's hero, pills, and only that category's products.
- `http://localhost:3000/danh-muc/rau-cu` — directly hit a category page; pill bar shows it as active.
- `http://localhost:3000/products` — all-products view; pills point to `/danh-muc/<slug>`; "Tất cả" pill is active.
- `http://localhost:3000/products?c=rau-cu` — browser shows it lands on `/danh-muc/rau-cu` (308 redirect).
- `http://localhost:3000/danh-muc/khong-ton-tai` — 404.
- Open any product detail page — breadcrumb category link goes to `/danh-muc/<slug>`.
- Footer "Danh mục" links → `/danh-muc/<slug>`.
- Header menu items "Rau Sạch Hữu Cơ" and "Gà ăn thảo dược" → land on the category pages without a redirect (DB rows have been migrated).
- View source of `/danh-muc/rau-cu` — `<title>` contains "Rau củ" and the description. `/products` `<title>` is the site default.

Stop the dev server.

- [ ] **Step 5: Final cleanup commit (only if any was needed)**

If everything works, no further commit is needed. If a fix is required, commit it as `fix(category): ...`.

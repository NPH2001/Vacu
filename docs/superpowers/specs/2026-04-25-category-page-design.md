# Category Page — Design

**Date:** 2026-04-25
**Status:** Approved
**Author:** Vacu / brainstorming session

## Problem

Category filtering currently uses a query string on the products listing: `/products?c=<slug>`. The user wants dedicated pages per category at clean Vietnamese-slug URLs (`/danh-muc/<slug>`). Goals:

- Better SEO (Vietnamese keyword in URL).
- Friendlier URL for sharing / bookmarking.
- Keep the existing filtered-listing layout (no UI redesign).
- Preserve existing inbound links and bookmarks via `308` redirect.

## Scope

### In scope

- New route `/danh-muc/[slug]` rendering the same listing layout as `/products`.
- 308 redirect from `/products?c=<slug>` → `/danh-muc/<slug>`.
- Update every internal reference to `/products?c=...` to point at the new URL (home, breadcrumb, footer, admin form placeholder, seed defaults, schema default).
- One-time idempotent data-fix in the boot-time seeder to migrate existing rows in `menu_items.href` and `site_info.sub_box_link`.
- Per-category `<title>` and meta description via Next `generateMetadata`.

### Out of scope

- Changing the listing layout (Hero, pills, grid all stay).
- Adding sort / pagination / search to category pages.
- Sitemap generation (project has none today).
- e2e tests for the public-page redirect (project has no public-page test infra; manual curl in verification).

## Approach (Approach 1)

Add a new `/danh-muc/[slug]` route. Refactor the shared layout (Hero, category pills, product grid) into `components/CategoryListing.tsx`. The existing `/products` route detects `?c=<slug>` and calls `permanentRedirect(`/danh-muc/${c}`)` (Next.js 308). Without `?c`, `/products` continues to render the "Toàn bộ nông sản" view.

### Alternatives considered

- **Middleware-based redirect** (`proxy.ts`) — rejected. Would split redirect logic between middleware and route, making debugging harder. The middleware already carries auth concerns; not the right place.
- **Copy-paste layout, no shared component** — rejected. ~70 lines of JSX duplication; future hero/pill changes would have to be made twice.

## Routes

### `app/(public)/danh-muc/[slug]/page.tsx` (new)

```ts
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

### `app/(public)/products/page.tsx` (refactor)

```ts
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

## Shared component

### `components/CategoryListing.tsx` (new)

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

## Reference updates

Every static or seeded `/products?c=<slug>` reference must be updated to `/danh-muc/<slug>`:

| File | Line(s) | Change |
|------|---------|--------|
| `app/(public)/page.tsx` | 109 | Home category card links |
| `app/(public)/products/[id]/page.tsx` | 33 | Product detail breadcrumb |
| `components/Footer.tsx` | 58 | "Danh mục" footer column |
| `components/admin/MenuItemForm.tsx` | 39 | Placeholder text in href input |
| `db/seed.ts` | 72–73 | Default `menu_items` header seed |
| `scripts/seed.mjs` | 93–94 | Same, JS seeder |
| `db/schema.ts` | 110 | `siteInfo.subBoxLink` default |

## Data migration (one-time, idempotent)

Existing installs already have `menu_items` rows seeded with the old URLs and a `site_info.sub_box_link` defaulted to the old URL. The boot-time `scripts/seed.mjs` runs every container start, so it is the right place for the idempotent fix.

Append to `scripts/seed.mjs` after the regular seed blocks (inside the same transaction, before `COMMIT`):

```js
// One-time URL migration: /products?c=<slug> → /danh-muc/<slug>
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

These are idempotent — `LIKE` matches no rows on the second run, and the equality check fails after the first migration.

The TS seeder (`db/seed.ts`) is dev-only and runs against fresh databases, so the data fix is JS-seeder-only. Schema/seed defaults updated in code mean future fresh runs go straight to the new URL.

## SEO

- `<title>` and meta description per category via `generateMetadata`. Without it, Next falls back to the parent layout's metadata which doesn't mention the category.
- 308 (permanent redirect) preserves method on `/products?c=...`. Search engines transfer link equity.
- No `robots.txt` / `sitemap.ts` exists in the project today; out of scope.

## Edge cases

- **Unknown slug** (`/danh-muc/foobar`) → `notFound()` → Next default 404 page.
- **Empty `?c=`** (`/products?c=`) — `c` is the empty string, falsy in the `if (c)` check, so the page renders the all-products view. No redirect loop.
- **Pill on category page**: "Tất cả" link goes to `/products` (canonical all-products URL); other pills go to `/danh-muc/<slug>`. No mixing of old and new URL formats anywhere in the rendered HTML.
- **`activeCategory.icon`** in the hero — adds the emoji prefix on category pages. The plain `/products` view falls back to "Toàn bộ nông sản" without an icon.

## Files touched

| File | Status |
|------|--------|
| `app/(public)/danh-muc/[slug]/page.tsx` | create |
| `app/(public)/products/page.tsx` | rewrite (extract layout + add redirect) |
| `components/CategoryListing.tsx` | create |
| `app/(public)/page.tsx` | edit (1 link) |
| `app/(public)/products/[id]/page.tsx` | edit (1 breadcrumb link) |
| `components/Footer.tsx` | edit (1 link) |
| `components/admin/MenuItemForm.tsx` | edit (1 placeholder) |
| `db/schema.ts` | edit (1 default value) |
| `db/seed.ts` | edit (2 seed lines) |
| `scripts/seed.mjs` | edit (2 seed lines + 2 data-fix UPDATEs) |

No new tests. Manual verification via `curl` is sufficient given the absence of public-page test infrastructure.

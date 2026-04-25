import Link from 'next/link';
import type { CategoryRow, ProductRow } from '@/db/schema';
import { getDescendantIds } from '@/lib/categories';
import ProductCard from '@/components/ProductCard';
import CategoryDrawer from '@/components/CategoryDrawer';

const MAX_INLINE_PILLS = 6;

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

  // Contextual pill list:
  // - root view (no active category)            → top-level
  // - active category WITH children             → its children
  // - active leaf (no children) WITH a parent   → its siblings
  // - active leaf at root (parentless leaf)     → top-level
  const sortBySortOrder = (a: CategoryRow, b: CategoryRow) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  const siblings: CategoryRow[] =
    activeCategory && activeCategory.parentId
      ? allCategories.filter((c) => c.parentId === activeCategory.parentId).sort(sortBySortOrder)
      : [];
  const contextPills: CategoryRow[] = !activeCategory
    ? topLevel
    : directChildren.length > 0
      ? directChildren
      : siblings.length > 0
        ? siblings
        : topLevel;
  // Only render a "Tất cả" pill at the root view; on a category page the breadcrumb
  // already provides the up-link.
  const showAllPill = !activeCategory;

  const showDrawer = contextPills.length > MAX_INLINE_PILLS;
  const inlinePills = showDrawer ? contextPills.slice(0, MAX_INLINE_PILLS - 1) : contextPills;

  const productCounts: Record<string, number> = showDrawer
    ? Object.fromEntries(
        allCategories.map((c) => {
          const ids = new Set(getDescendantIds(c.id, allCategories));
          return [c.id, allProducts.filter((p) => ids.has(p.categoryId)).length];
        }),
      )
    : {};

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
        {activeCategory && (
          <nav aria-label="Đường dẫn" className="text-sm text-green-900/60 mb-6">
            <Link href="/products" className="hover:underline">Tất cả nông sản</Link>
            {ancestors.map((a) => (
              <span key={a.id}>
                {' / '}
                <Link href={`/danh-muc/${a.id}`} className="hover:underline">{a.name}</Link>
              </span>
            ))}
            <span>{' / '}<span className="text-green-950">{activeCategory.name}</span></span>
          </nav>
        )}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {showAllPill && (
            <Link href="/products" className={pillClass(!activeCategory)}>
              Tất cả · {allProducts.length}
            </Link>
          )}
          {inlinePills.map((c) => {
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
          {showDrawer && (
            <CategoryDrawer
              allCategories={allCategories}
              productCounts={productCounts}
              activeId={activeCategory?.id ?? null}
            />
          )}
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

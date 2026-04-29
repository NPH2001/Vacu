import Link from 'next/link';
import type { CategoryRow, ProductRow } from '@/db/schema';
import { getDescendantIds } from '@/lib/categories';
import ProductCard from '@/components/ProductCard';
import CategoryDrawer from '@/components/CategoryDrawer';
import CategoryIcon from '@/components/CategoryIcon';

const MAX_INLINE_PILLS = 6;

export default function CategoryListing({
  topLevel, ancestors, filtered, allProducts, activeCategory, allCategories,
}: {
  topLevel: CategoryRow[];
  ancestors: CategoryRow[];
  filtered: ProductRow[];
  allProducts: ProductRow[];
  activeCategory: CategoryRow | null;
  allCategories: CategoryRow[];
}) {
  const activeBranchIds = activeCategory
    ? new Set([activeCategory.id, ...ancestors.map((a) => a.id)])
    : new Set<string>();

  // Pill bar always shows top-level (parent) categories so users can pivot
  // between branches from any depth. The active branch's root highlights via
  // activeBranchIds; the drawer covers the full tree.
  const showAllPill = !activeCategory;

  const showDrawer = topLevel.length > MAX_INLINE_PILLS;
  const inlinePills = showDrawer ? topLevel.slice(0, MAX_INLINE_PILLS - 1) : topLevel;

  const productCounts: Record<string, number> = showDrawer
    ? Object.fromEntries(
        allCategories.map((c) => {
          const ids = new Set(getDescendantIds(c.id, allCategories));
          return [c.id, allProducts.filter((p) => ids.has(p.categoryId)).length];
        }),
      )
    : {};

  const cover = activeCategory?.coverImage;

  return (
    <div>
      <section
        className={`relative overflow-hidden text-white ${cover ? 'min-h-[520px] md:min-h-[640px] flex items-end' : 'bg-gradient-to-br from-green-800 to-green-950 py-14'}`}
        style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {cover && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-green-950/85 via-green-950/35 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-green-950/70 via-green-950/20 to-transparent" aria-hidden />
          </>
        )}
        <div className={`relative max-w-7xl mx-auto px-4 w-full ${cover ? 'pb-12 md:pb-16 pt-20 md:pt-24' : ''}`}>
          {activeCategory ? (
            <div className="flex items-end gap-5">
              {!cover && (
                <div className="hidden sm:flex shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 items-center justify-center text-5xl md:text-6xl shadow-xl overflow-hidden">
                  <CategoryIcon value={activeCategory.icon} alt={activeCategory.name} className="w-full h-full" />
                </div>
              )}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 bg-amber-300 text-green-950 text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow-md mb-3">
                  Chợ nông trại
                  <span className="text-green-900/40">•</span>
                  <span>{filtered.length} sản phẩm</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-display mb-3 drop-shadow-2xl leading-[1.05]">
                  {activeCategory.name}
                </h1>
                <p className="text-green-50/95 max-w-2xl text-base md:text-lg drop-shadow leading-relaxed">
                  {activeCategory.description}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-block bg-amber-300 text-green-950 text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow-md mb-3">
                Chợ nông trại
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-display mb-3 drop-shadow-lg leading-[1.05]">
                Toàn bộ nông sản
              </h1>
              <p className="text-green-50/90 max-w-xl text-base md:text-lg drop-shadow">
                Rau củ, trái cây, trứng thịt, gia vị — thu hoạch trực tiếp từ nông trại.
              </p>
            </div>
          )}
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
                className={`${pillClass(activeBranchIds.has(c.id))} inline-flex items-center gap-1.5`}
              >
                <CategoryIcon value={c.icon} alt="" className="w-5 h-5 rounded" />
                <span>{c.name} · {count}</span>
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

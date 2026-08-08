import Link from 'next/link';
import type { CategoryRow, FarmerRow, ProductRow } from '@/db/schema';
import { getDescendantIds } from '@/lib/categories';
import ProductCard from '@/components/ProductCard';
import CategoryDrawer from '@/components/CategoryDrawer';
import CategoryIcon from '@/components/CategoryIcon';

const MAX_INLINE_PILLS = 6;

export default function CategoryListing({
  topLevel, ancestors, filtered, allProducts, activeCategory, allCategories, farmersById,
  rootTitle = 'Toàn bộ nông sản',
  rootSubtitle = 'Rau củ, trái cây, trứng thịt, gia vị — thu hoạch trực tiếp từ nông trại.',
  badge = 'Chợ nông trại',
  filters,
  emptyText = 'Chưa có sản phẩm trong danh mục này.',
}: {
  topLevel: CategoryRow[];
  ancestors: CategoryRow[];
  filtered: ProductRow[];
  allProducts: ProductRow[];
  activeCategory: CategoryRow | null;
  allCategories: CategoryRow[];
  farmersById: Map<string, FarmerRow>;
  // Only shown on the root /products view; category pages use the category's
  // own name/description.
  rootTitle?: string;
  rootSubtitle?: string;
  badge?: string;
  // Search/sort/in-stock controls, rendered above the grid (root view only).
  filters?: React.ReactNode;
  emptyText?: string;
}) {
  const activeBranchIds = activeCategory
    ? new Set([activeCategory.id, ...ancestors.map((a) => a.id)])
    : new Set<string>();

  // Pill bar = direct children of the current page. On root, that's top-level.
  // If the active category has no children, hide the bar entirely — drill-down
  // navigation, no sideways jumps to unrelated branches.
  const directChildren = activeCategory
    ? allCategories
        .filter((c) => c.parentId === activeCategory.id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'))
    : [];
  const contextPills: CategoryRow[] = activeCategory ? directChildren : topLevel;
  const showPillBar = contextPills.length > 0;
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

  const cover = activeCategory?.coverImage;
  // Strip CSS-breakout chars before interpolating into the inline `url(...)` —
  // React escapes the `"` of the style attribute but not `)`/`;` inside the
  // value, so a crafted coverImage could otherwise inject extra CSS declarations
  // (full-screen overlay / defacement) scoped to this element.
  const coverUrl = cover ? cover.replace(/["'()\\<>]/g, '') : '';

  return (
    <div>
      <section
        className={`relative overflow-hidden text-white ${cover ? 'min-h-[240px] lg:min-h-[640px] flex items-end' : 'bg-gradient-to-br from-green-800 to-green-950 py-14'}`}
        style={cover ? { backgroundImage: `url("${coverUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {cover && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-green-950/85 via-green-950/35 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-green-950/70 via-green-950/20 to-transparent" aria-hidden />
          </>
        )}
        <div className={`relative max-w-7xl mx-auto px-4 w-full ${cover ? 'pb-3 lg:pb-16 pt-6 lg:pt-24' : ''}`}>
          {activeCategory ? (
            <div className="flex items-end gap-5">
              {/* Over a cover photo the frame needs a dark, opaque backing —
                  the white/15 glass used on the gradient hero disappears into
                  a bright image. */}
              <div
                className={`hidden sm:flex shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl backdrop-blur-md border items-center justify-center text-5xl md:text-6xl shadow-xl overflow-hidden ${
                  cover
                    ? 'bg-green-950/55 border-white/40 ring-1 ring-green-950/30'
                    : 'bg-white/15 border-white/25'
                }`}
              >
                <CategoryIcon value={activeCategory.icon} alt={activeCategory.name} className="w-full h-full" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 bg-amber-300 text-green-950 text-[10px] lg:text-[11px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full shadow-md mb-2.5 lg:mb-3">
                  {badge}
                  <span className="text-green-900/40">•</span>
                  <span>{filtered.length} sản phẩm</span>
                </div>
                <h1 className="text-3xl lg:text-6xl font-bold font-display mb-2 lg:mb-3 drop-shadow-2xl leading-[1.05]">
                  {activeCategory.name}
                </h1>
                <p className="text-green-50/95 max-w-2xl text-sm lg:text-lg drop-shadow leading-relaxed">
                  {activeCategory.description}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-block bg-amber-300 text-green-950 text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow-md mb-3">
                {badge}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-display mb-3 drop-shadow-lg leading-[1.05] wrap-anywhere">
                {rootTitle}
              </h1>
              <p className="text-green-50/90 max-w-xl text-base md:text-lg drop-shadow wrap-anywhere">
                {rootSubtitle}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
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
        {showPillBar && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 md:mb-8 md:pb-4">
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
        )}

        <section
          aria-label="Thông tin kết quả và bộ lọc"
          className="mb-6 rounded-[1.5rem] border border-green-100 bg-white/90 p-4 shadow-[0_8px_30px_-24px_rgba(20,83,45,0.45)] md:mb-8 md:p-5"
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-800/70">
                Danh mục đang xem
              </p>
              <h2 className="mt-1 text-xl font-bold text-green-950 md:text-2xl">
                {activeCategory?.name ?? rootTitle}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-green-900/70">
                Giá bán hiển thị theo đúng quy cách, kèm thông tin còn hàng và nơi cung cấp để bạn so sánh nhanh.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-fit">
              <div className="rounded-2xl bg-[linear-gradient(180deg,#f7faf3_0%,#eef7e8_100%)] px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-green-800/70">Kết quả</div>
                <div className="mt-1 text-xl font-bold text-green-950 tabular-nums">{filtered.length}</div>
              </div>
              <div className="rounded-2xl bg-[linear-gradient(180deg,#fff9ed_0%,#fff2d8_100%)] px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-green-950/70">Danh mục</div>
                <div className="mt-1 text-xl font-bold text-green-950 tabular-nums">{contextPills.length || 1}</div>
              </div>
            </div>
          </div>
          {filters}
        </section>

        {filtered.length === 0 ? (
          <section className="rounded-[1.75rem] border border-dashed border-green-200 bg-[#f7faf3] px-6 py-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green-800/60">Không có kết quả phù hợp</p>
            <h2 className="mt-2 text-2xl font-bold text-green-950">Điều chỉnh bộ lọc để xem thêm sản phẩm</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-green-900/70">
              {emptyText}
            </p>
            <Link href="/products" className="mt-6 inline-flex rounded-full bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">
              Xem toàn bộ sản phẩm
            </Link>
          </section>
        ) : (
          <section aria-label="Danh sách sản phẩm">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 md:gap-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} farmer={p.farmerId ? farmersById.get(p.farmerId) : null} />
            ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function pillClass(active: boolean) {
  return `shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold transition md:px-5 ${
    active ? 'border-green-700 bg-green-700 text-white' : 'bg-white text-green-900 border-green-200 hover:border-green-400'
  }`;
}

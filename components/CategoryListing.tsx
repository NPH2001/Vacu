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

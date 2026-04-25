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

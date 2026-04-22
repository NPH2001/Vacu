import Link from "next/link";
import { products, categories, getCategory } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

type SearchParams = Promise<{ c?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeCat = params.c ?? "";
  const filtered = activeCat ? products.filter((p) => p.category === activeCat) : products;
  const activeCategory = activeCat ? getCategory(activeCat) : null;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-green-950 text-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-amber-300 text-sm font-bold tracking-widest uppercase mb-2">Chợ nông trại</div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-3">
            {activeCategory ? activeCategory.name : "Toàn bộ nông sản"}
          </h1>
          <p className="text-green-100/80 max-w-xl">
            {activeCategory ? activeCategory.description : "Rau củ, trái cây, trứng thịt, gia vị — thu hoạch trực tiếp từ nông trại."}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          <Link
            href="/products"
            className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border transition ${
              !activeCat ? "bg-green-700 text-white border-green-700" : "bg-white text-green-900 border-green-200 hover:border-green-400"
            }`}
          >
            Tất cả · {products.length}
          </Link>
          {categories.map((c) => {
            const count = products.filter((p) => p.category === c.id).length;
            const isActive = activeCat === c.id;
            return (
              <Link
                key={c.id}
                href={`/products?c=${c.id}`}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border transition ${
                  isActive ? "bg-green-700 text-white border-green-700" : "bg-white text-green-900 border-green-200 hover:border-green-400"
                }`}
              >
                {c.icon} {c.name} · {count}
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-green-900/60">
            Chưa có sản phẩm trong danh mục này. <Link href="/products" className="text-green-700 font-semibold underline">Xem tất cả</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

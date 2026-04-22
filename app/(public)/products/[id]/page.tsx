import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getFarmer, formatPrice, getAllProducts, getCategory } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import ProductBuyBox from "@/components/ProductBuyBox";

type Params = Promise<{ id: string }>;

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();

  const [farmer, category, allProducts] = await Promise.all([
    getFarmer(p.farmerId),
    getCategory(p.categoryId),
    getAllProducts(),
  ]);
  const related = allProducts.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 4);
  const discount =
    p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <nav className="text-sm text-green-900/60 mb-6">
        <Link href="/" className="hover:underline">Trang chủ</Link> /{" "}
        <Link href="/products" className="hover:underline">Nông sản</Link>
        {category && (
          <>
            {" "}/ <Link href={`/products?c=${category.id}`} className="hover:underline">{category.name}</Link>
          </>
        )}
        {" "}/ <span className="text-green-950">{p.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-green-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
          {discount > 0 && (
            <span className="absolute top-4 right-4 bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">-{discount}%</span>
          )}
        </div>
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {p.tags.map((t) => (
              <span key={t} className="bg-green-50 text-green-800 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                ✓ {t}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-green-950 mb-3">{p.name}</h1>
          <p className="text-green-900/80 leading-relaxed mb-6">{p.description}</p>

          <div className="bg-white rounded-2xl p-5 border border-green-100 mb-5">
            <div className="flex items-end gap-3 mb-1">
              <span className="text-3xl font-bold text-green-800">{formatPrice(p.price)}</span>
              {p.oldPrice && (
                <span className="text-lg line-through text-stone-400 pb-1">{formatPrice(p.oldPrice)}</span>
              )}
            </div>
            <div className="text-sm text-green-900/60">Đơn vị: {p.unit}</div>
          </div>

          <ProductBuyBox p={p} />

          {farmer && (
            <Link
              href={`/farmers/${farmer.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-green-100 bg-white hover:shadow-md transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={farmer.avatar} alt={farmer.name} className="w-14 h-14 rounded-full object-cover" />
              <div className="flex-1">
                <div className="text-xs text-green-700/70">Trồng bởi</div>
                <div className="font-bold text-green-950">{farmer.name}</div>
                <div className="text-sm text-green-900/70">{farmer.farm} · 📍 {farmer.location}</div>
              </div>
              <span className="text-green-700 font-bold">→</span>
            </Link>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-green-950 font-display mb-6">Có thể bạn thích</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

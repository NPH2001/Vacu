export const revalidate = 300; // ISR: on-demand + refreshed by admin revalidatePath, 5-min ceiling

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getFarmer, formatPrice, getAllProducts, getCategory, getProductGallery, getSiteInfo } from "@/lib/data";
import { seoMeta } from "@/lib/seo";
import { productLd, breadcrumbLd } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import ProductCard from "@/components/ProductCard";
import ProductBuyBox from "@/components/ProductBuyBox";
import ProductGallery from "@/components/ProductGallery";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const [p, info] = await Promise.all([getProduct(id), getSiteInfo()]);
  if (!p) return { title: "Không tìm thấy sản phẩm" };
  return seoMeta({
    title: `${p.name} — ${info.name}`,
    description: p.description,
    canonical: `/products/${p.id}`,
    image: p.image,
  });
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();

  const [farmer, category, allProducts, gallery, info] = await Promise.all([
    getFarmer(p.farmerId),
    getCategory(p.categoryId),
    getAllProducts(),
    getProductGallery(p.id),
    getSiteInfo(),
  ]);
  const related = allProducts.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 4);
  const discount =
    p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <JsonLd data={productLd(info, p, farmer, category)} />
      <JsonLd data={breadcrumbLd(info, [
        { name: "Trang chủ", path: "/" },
        { name: "Nông sản", path: "/products" },
        ...(category ? [{ name: category.name, path: `/danh-muc/${category.id}` }] : []),
        { name: p.name, path: `/products/${p.id}` },
      ])} />
      <nav className="text-sm text-green-900/60 mb-6 wrap-anywhere">
        <Link href="/" className="hover:underline">Trang chủ</Link> /{" "}
        <Link href="/products" className="hover:underline">Nông sản</Link>
        {category && (
          <>
            {" "}/ <Link href={`/danh-muc/${category.id}`} className="hover:underline">{category.name}</Link>
          </>
        )}
        {" "}/ <span className="text-green-950">{p.name}</span>
      </nav>

      {/* min-w-0 on both columns: a grid item defaults to min-width:auto, so a
          long unbreakable word inside would widen the column past the grid. */}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="min-w-0">
          <ProductGallery primary={p.image} extra={gallery} alt={p.name} discount={discount} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 mb-3">
            {p.tags.map((t) => (
              <span key={t} className="bg-green-50 text-green-800 text-xs font-semibold px-3 py-1 rounded-full border border-green-200 max-w-full wrap-anywhere">
                ✓ {t}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-green-950 mb-3 wrap-anywhere">{p.name}</h1>
          <p className="text-green-900/80 leading-relaxed mb-6 wrap-anywhere">{p.description}</p>

          <div className="bg-white rounded-2xl p-5 border border-green-100 mb-5">
            {/* flex-wrap: a large price plus a strikethrough original is wider
                than a phone can fit on one line. */}
            <div className="flex items-end gap-3 mb-1 flex-wrap">
              <span className="text-3xl font-bold text-green-800 wrap-anywhere">{formatPrice(p.price)}</span>
              {p.oldPrice && (
                <span className="text-lg line-through text-stone-400 pb-1">{formatPrice(p.oldPrice)}</span>
              )}
            </div>
            <div className="text-sm text-green-900/60 wrap-anywhere">Đơn vị: {p.unit}</div>
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
                <div className="text-xs text-green-700/70">{info.grownByLabel}</div>
                <div className="font-bold text-green-950">{farmer.name}</div>
                <div className="text-sm text-green-900/70">{farmer.farm} · 📍 {farmer.location}</div>
              </div>
              <span className="text-green-700 font-bold">→</span>
            </Link>
          )}
        </div>
      </div>

      {p.body?.trim() && (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-green-950 font-display mb-5 wrap-anywhere">{info.productDetailHeading}</h2>
          {/* Sanitized on write in actions/products.ts via sanitizeRichText. */}
          <div className="product-prose" dangerouslySetInnerHTML={{ __html: p.body }} />
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-green-950 font-display mb-6 wrap-anywhere">{info.relatedProductsHeading}</h2>
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

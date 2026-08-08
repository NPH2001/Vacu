import Link from "next/link";
import type { Product } from "@/lib/data";
import type { FarmerRow } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import SmartImage from "./SmartImage";

export default function ProductCard({ p, farmer = null }: { p: Product; farmer?: FarmerRow | null }) {
  const discount =
    p.oldPrice && p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100)
      : 0;
  const farmerCertifications = farmer?.certifications?.slice(0, 2) ?? [];
  const trustTags = farmerCertifications.length > 0 ? farmerCertifications : p.tags.slice(0, 2);
  const stockLabel = p.inStock ? "Còn hàng" : "Hết hàng";
  const sourceLabel = farmer ? `${farmer.farm} · ${farmer.location}` : "Nguồn gốc đang cập nhật";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-green-100 bg-white shadow-[0_1px_3px_rgba(20,60,30,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgba(20,83,45,0.22)]">
      <Link
        href={`/products/${p.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-green-50"
        aria-label={`Xem chi tiết sản phẩm ${p.name}`}
      >
        <SmartImage
          src={p.image}
          alt={p.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-1.5">
          {p.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-green-800 shadow-sm">
              {t}
            </span>
          ))}
        </div>
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-green-950">
            -{discount}%
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
              p.inStock ? "bg-white/95 text-green-900" : "bg-stone-950/80 text-white"
            }`}
          >
            {stockLabel}
          </span>
          {farmer && (
            <span className="truncate rounded-full bg-green-950/70 px-2.5 py-1 text-[11px] font-medium text-white">
              {farmer.location}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 space-y-2">
          <Link href={`/products/${p.id}`} className="block focus-visible:outline-none">
            <h3 className="min-h-[3.5rem] text-lg font-bold leading-tight text-green-950 transition group-hover:text-green-700 line-clamp-2">
              {p.name}
            </h3>
          </Link>
          <p className="line-clamp-2 text-sm leading-relaxed text-green-900/72">
            {sourceLabel}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {trustTags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-800"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-auto rounded-2xl border border-green-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5faef_100%)] p-3">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="text-xl font-bold text-green-950 tabular-nums">
              {formatPrice(p.price)}
            </span>
            {p.oldPrice && p.oldPrice > p.price && (
              <span className="pb-0.5 text-sm text-stone-400 line-through tabular-nums">
                {formatPrice(p.oldPrice)}
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-stone-600">
            {p.unit}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-green-100 pt-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-green-800/70">
                Nguồn cung
              </div>
              <div className="truncate text-sm text-green-950">
                {farmer ? farmer.name : "Vacu tuyển chọn"}
              </div>
            </div>
            <Link
              href={`/products/${p.id}`}
              className="shrink-0 rounded-full bg-green-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 whitespace-nowrap"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

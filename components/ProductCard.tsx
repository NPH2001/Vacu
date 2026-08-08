import Link from "next/link";
import type { Product } from "@/lib/data";
import type { FarmerRow } from "@/db/schema";
import SmartImage from "./SmartImage";

export default function ProductCard({ p, farmer = null }: { p: Product; farmer?: FarmerRow | null }) {
  const discount =
    p.oldPrice && p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100)
      : 0;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-green-100 shadow-[0_1px_3px_rgba(20,60,30,0.05)] hover:shadow-[0_16px_32px_-12px_rgba(20,83,45,0.22)] hover:-translate-y-1 transition duration-300 flex flex-col">
      <Link href={`/products/${p.id}`} className="relative aspect-[4/3] overflow-hidden bg-green-50 block">
        <SmartImage
          src={p.image}
          alt={p.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {p.tags.slice(0, 2).map((t) => (
            <span key={t} className="bg-white/95 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {t}
            </span>
          ))}
        </div>
        {discount > 0 && (
          <span className="absolute top-3 right-3 bg-amber-500 text-green-950 text-xs font-bold px-2.5 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {!p.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/95 text-stone-900 px-3 py-1.5 rounded-full text-xs font-bold">Hết hàng</span>
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/products/${p.id}`}>
          <h3 className="font-bold text-green-950 text-lg leading-tight group-hover:text-green-700 transition line-clamp-2 min-h-[3.5rem]">
            {p.name}
          </h3>
        </Link>
        {farmer && (
          <p className="text-xs text-green-700/70 mt-1 mb-2 truncate">
            👨‍🌾 {farmer.name} — {farmer.location}
          </p>
        )}
        <div className="flex-1" />
        <div className="flex items-end justify-between pt-2 border-t border-green-100/70 gap-2">
          <div>
            <div className="text-sm font-bold text-green-700">Liên hệ để biết giá</div>
            <div className="text-[11px] text-stone-500">/ {p.unit}</div>
          </div>
          <Link
            href={`/products/${p.id}`}
            className="shrink-0 bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2.5 rounded-full transition whitespace-nowrap"
          >
            Xem giá →
          </Link>
        </div>
      </div>
    </div>
  );
}

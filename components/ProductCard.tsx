import Link from "next/link";
import type { Product } from "@/lib/data";
import { formatPrice, getFarmer } from "@/lib/data";
import AddToCartButton from "./AddToCartButton";
import SmartImage from "./SmartImage";

export default async function ProductCard({ p }: { p: Product }) {
  const farmer = await getFarmer(p.farmerId);
  const discount =
    p.oldPrice && p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100)
      : 0;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-green-100 hover:shadow-xl transition flex flex-col">
      <Link href={`/products/${p.id}`} className="relative aspect-[4/3] overflow-hidden bg-green-50 block">
        <SmartImage
          src={p.image}
          alt={p.name}
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
            <div className="text-lg font-bold text-green-800">{formatPrice(p.price)}</div>
            {/* Only strike through when it's a real discount — an oldPrice <= price
                would otherwise imply a markdown that isn't one. */}
            {discount > 0 && (
              <div className="text-xs line-through text-stone-400">{formatPrice(p.oldPrice!)}</div>
            )}
            <div className="text-[11px] text-stone-500">/ {p.unit}</div>
          </div>
          <AddToCartButton item={p} compact disabled={!p.inStock} />
        </div>
      </div>
    </div>
  );
}

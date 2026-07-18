"use client";

import { useCart } from "./CartProvider";
import type { ProductRow } from "@/db/schema";

export default function AddToCartButton({
  item,
  compact = false,
  disabled = false,
}: {
  item: ProductRow;
  compact?: boolean;
  disabled?: boolean;
}) {
  const { add, has } = useCart();
  const inCart = has(item.id);

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) add(item);
        }}
        disabled={disabled}
        aria-label={disabled ? "Hết hàng" : inCart ? "Đã có trong giỏ — thêm nữa" : "Thêm vào giỏ"}
        className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center hover:bg-green-800 disabled:bg-stone-200 disabled:text-stone-400 transition"
      >
        {disabled ? "✕" : inCart ? "✓" : "+"}
      </button>
    );
  }

  return (
    <button
      onClick={() => !disabled && add(item)}
      disabled={disabled}
      className={`flex-1 font-bold px-6 py-3 rounded-full transition disabled:bg-stone-300 disabled:text-stone-500 ${
        inCart
          ? "bg-green-100 text-green-800 border border-green-300"
          : "bg-green-700 hover:bg-green-800 text-white"
      }`}
    >
      {disabled ? "Hết hàng" : inCart ? "✓ Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
    </button>
  );
}

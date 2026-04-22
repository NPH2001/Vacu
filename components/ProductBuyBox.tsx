"use client";

import { useState } from "react";
import type { ProductRow } from "@/db/schema";
import { useCart } from "./CartProvider";

export default function ProductBuyBox({ p }: { p: ProductRow }) {
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);

  function handleAdd() {
    for (let i = 0; i < qty; i++) add(p);
    setOpen(true);
  }

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center bg-white border border-green-200 rounded-full">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="w-10 h-10 text-green-800 font-bold hover:bg-green-50 rounded-l-full"
          aria-label="Giảm"
        >
          −
        </button>
        <span className="w-10 text-center font-bold text-green-950">{qty}</span>
        <button
          onClick={() => setQty(qty + 1)}
          className="w-10 h-10 text-green-800 font-bold hover:bg-green-50 rounded-r-full"
          aria-label="Tăng"
        >
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        disabled={!p.inStock}
        className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-stone-400 text-white font-bold px-6 py-3 rounded-full transition"
      >
        {p.inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
      </button>
    </div>
  );
}

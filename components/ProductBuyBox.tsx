"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductRow } from "@/db/schema";
import { useCart } from "./CartProvider";
import { MAX_LINE_QTY } from "@/lib/cart-limits";
import { formatPrice } from "@/lib/format";

function Stepper({
  qty, setQty, inStock, focusable = true,
}: { qty: number; setQty: (n: number) => void; inStock: boolean; focusable?: boolean }) {
  const tab = focusable ? 0 : -1;
  return (
    <div className="flex items-center bg-white border border-green-200 rounded-full shrink-0">
      <button
        type="button"
        tabIndex={tab}
        onClick={() => setQty(Math.max(1, qty - 1))}
        disabled={!inStock || qty <= 1}
        className="w-10 h-10 text-green-800 font-bold hover:bg-green-50 rounded-l-full disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Giảm"
      >
        −
      </button>
      <span className="w-10 text-center font-bold text-green-950 tabular-nums">{qty}</span>
      <button
        type="button"
        tabIndex={tab}
        onClick={() => setQty(Math.min(MAX_LINE_QTY, qty + 1))}
        disabled={!inStock || qty >= MAX_LINE_QTY}
        className="w-10 h-10 text-green-800 font-bold hover:bg-green-50 rounded-r-full disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Tăng"
      >
        +
      </button>
    </div>
  );
}

export default function ProductBuyBox({ p }: { p: ProductRow }) {
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const inlineRef = useRef<HTMLDivElement>(null);
  // On mobile the inline buy box scrolls out of view as the shopper reads the
  // details / related products; show a sticky bottom bar so "add to cart" stays
  // one tap away.
  const [inlineVisible, setInlineVisible] = useState(true);
  // …but hide it near the very bottom of the page so it never covers (or eats
  // taps on) the footer's last row.
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    const el = inlineRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInlineVisible(e.isIntersecting), { rootMargin: "-80px 0px 0px 0px" });
    obs.observe(el);
    const onScroll = () => {
      const doc = document.documentElement;
      setNearBottom(window.innerHeight + window.scrollY >= doc.scrollHeight - 160);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const showBar = !inlineVisible && !nearBottom;

  function handleAdd() {
    add(p, qty); // one call adds all N units and emits a single add_to_cart event
    setOpen(true);
  }

  return (
    <>
      <div ref={inlineRef} className="flex items-center gap-3 mb-6">
        <Stepper qty={qty} setQty={setQty} inStock={p.inStock} />
        <button
          onClick={handleAdd}
          disabled={!p.inStock}
          className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-stone-400 text-white font-bold px-6 py-3 rounded-full transition"
        >
          {p.inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
        </button>
      </div>

      {/* Mobile sticky buy bar — slides up once the inline box leaves the viewport,
          hides again near the footer. pointer-events on the wrapper are off so
          taps in its empty margins fall through to content behind it. */}
      <div
        aria-hidden={!showBar}
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-green-100 bg-white/95 backdrop-blur pl-4 pr-[4.75rem] py-3 shadow-[0_-6px_20px_-8px_rgba(20,60,30,0.18)] transition-transform duration-300 ${
          showBar ? "translate-y-0 pointer-events-auto" : "translate-y-full pointer-events-none"
        }`}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-lg font-bold text-green-800 leading-none">{formatPrice(p.price)}</div>
            <div className="text-[11px] text-green-900/50 truncate mt-0.5">/ {p.unit}</div>
          </div>
          <Stepper qty={qty} setQty={setQty} inStock={p.inStock} focusable={showBar} />
          <button
            onClick={handleAdd}
            disabled={!p.inStock}
            tabIndex={showBar ? 0 : -1}
            className="bg-green-700 hover:bg-green-800 disabled:bg-stone-400 text-white font-bold px-4 py-2.5 rounded-full transition text-sm whitespace-nowrap"
          >
            {p.inStock ? "Thêm" : "Hết hàng"}
          </button>
        </div>
      </div>
    </>
  );
}

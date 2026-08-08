"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductRow } from "@/db/schema";
import { useCart } from "./CartProvider";
import { MAX_LINE_QTY } from "@/lib/cart-limits";
import { formatPrice } from "@/lib/format";

function Stepper({
  qty, setQty, inStock, focusable = true, itemName,
}: { qty: number; setQty: (n: number) => void; inStock: boolean; focusable?: boolean; itemName: string }) {
  const tab = focusable ? 0 : -1;
  return (
    <div className="flex items-center bg-white border border-green-200 rounded-full shrink-0" aria-label={`Chọn số lượng ${itemName}`}>
      <button
        type="button"
        tabIndex={tab}
        onClick={() => setQty(Math.max(1, qty - 1))}
        disabled={!inStock || qty <= 1}
        className="w-10 h-10 text-green-800 font-bold hover:bg-green-50 rounded-l-full disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label={`Giảm số lượng ${itemName}`}
      >
        −
      </button>
      <span className="w-10 text-center font-bold text-green-950 tabular-nums" aria-live="polite" aria-atomic="true">{qty}</span>
      <button
        type="button"
        tabIndex={tab}
        onClick={() => setQty(Math.min(MAX_LINE_QTY, qty + 1))}
        disabled={!inStock || qty >= MAX_LINE_QTY}
        className="w-10 h-10 text-green-800 font-bold hover:bg-green-50 rounded-r-full disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label={`Tăng số lượng ${itemName}`}
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
      <section ref={inlineRef} className="mb-6 rounded-[1.75rem] border border-green-100 bg-white p-5 shadow-sm" aria-label="Mua sản phẩm">
        <div className="flex flex-wrap items-center gap-3">
          <Stepper qty={qty} setQty={setQty} inStock={p.inStock} itemName={p.name} />
          <button
            onClick={handleAdd}
            disabled={!p.inStock}
            className="min-h-11 flex-1 bg-green-700 hover:bg-green-800 disabled:bg-stone-400 text-white font-bold px-6 py-3 rounded-full transition"
            aria-label={p.inStock ? `Thêm ${qty} ${p.unit} ${p.name} vào giỏ hàng` : `${p.name} hiện hết hàng`}
          >
            {p.inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className={`font-semibold ${p.inStock ? 'text-green-800' : 'text-stone-500'}`}>
            {p.inStock ? 'Còn hàng, có thể đặt ngay' : 'Tạm hết hàng'}
          </span>
          <span className="text-green-900/60">Quy cách: {p.unit}</span>
          <span className="text-green-900/60">Tối đa {MAX_LINE_QTY} đơn vị mỗi lần thêm</span>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-green-50/70 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-green-800/70">Giao nhận</dt>
            <dd className="mt-1 text-sm text-green-950">Chọn khung giờ ở bước thanh toán; cửa hàng xác nhận trước khi giao.</dd>
          </div>
          <div className="rounded-2xl bg-green-50/70 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-green-800/70">Thanh toán</dt>
            <dd className="mt-1 text-sm text-green-950">Hỗ trợ COD; các phương thức khả dụng được hiển thị khi thanh toán.</dd>
          </div>
          <div className="rounded-2xl bg-green-50/70 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-green-800/70">Nguồn gốc</dt>
            <dd className="mt-1 text-sm text-green-950">Sản phẩm do Vacu tuyển chọn từ nông hộ và hợp tác xã đã hiển thị trên trang.</dd>
          </div>
        </dl>
      </section>

      <div className="sr-only" aria-live="polite">
        {showBar ? 'Thanh mua nhanh đang hiển thị ở cuối màn hình.' : 'Thanh mua nhanh đang ẩn.'}
      </div>

      {/* Mobile sticky buy bar — slides up once the inline box leaves the viewport,
          hides again near the footer. pointer-events on the wrapper are off so
          taps in its empty margins fall through to content behind it. */}
      <div
        aria-hidden={!showBar}
        role="region"
        aria-label="Thanh mua nhanh"
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-green-100 bg-white/95 backdrop-blur pl-4 pr-[4.75rem] py-3 shadow-[0_-6px_20px_-8px_rgba(20,60,30,0.18)] transition-transform duration-300 ${
          showBar ? "translate-y-0 pointer-events-auto" : "translate-y-full pointer-events-none"
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-lg font-bold text-green-800 leading-none">{formatPrice(p.price)}</div>
            <div className="text-[11px] text-green-900/50 truncate mt-0.5">/ {p.unit}</div>
            <div className="text-[11px] text-green-900/60 mt-1">{p.inStock ? 'Có thể đặt ngay' : 'Tạm hết hàng'}</div>
          </div>
          <Stepper qty={qty} setQty={setQty} inStock={p.inStock} focusable={showBar} itemName={p.name} />
          <button
            onClick={handleAdd}
            disabled={!p.inStock}
            tabIndex={showBar ? 0 : -1}
            className="bg-green-700 hover:bg-green-800 disabled:bg-stone-400 text-white font-bold px-4 py-2.5 rounded-full transition text-sm whitespace-nowrap"
            aria-label={p.inStock ? `Thêm ${qty} ${p.unit} ${p.name} vào giỏ hàng` : `${p.name} hiện hết hàng`}
          >
            {p.inStock ? "Thêm" : "Hết hàng"}
          </button>
        </div>
      </div>
    </>
  );
}

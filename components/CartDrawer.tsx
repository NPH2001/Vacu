"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";

export default function CartDrawer({
  emptyTitle, emptyText, shippingLabel,
}: {
  emptyTitle: string;
  emptyText: string;
  shippingLabel: string;
}) {
  const { items, total, open, setOpen, setQty, remove } = useCart();

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-green-950/50 z-[60] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-green-100">
          <div>
            <h2 className="text-xl font-bold text-green-950 font-display">Giỏ của bạn</h2>
            <p className="text-xs text-green-900/60">{items.length} món · {items.reduce((s, i) => s + i.qty, 0)} sản phẩm</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Đóng"
            className="w-10 h-10 rounded-full hover:bg-green-50 text-green-900 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="text-center text-green-900/60 py-16">
              <div className="text-6xl mb-3">🧺</div>
              <p className="font-semibold wrap-anywhere">{emptyTitle}</p>
              <p className="text-sm mt-1 wrap-anywhere">{emptyText}</p>
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="inline-block mt-5 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-full text-sm"
              >
                Đi chợ nông trại →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-green-100 bg-green-50/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.image}
                    alt={it.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-green-950 line-clamp-1">{it.name}</div>
                    <div className="text-xs text-green-900/60">/ {it.unit}</div>
                    <div className="text-green-800 font-bold mt-0.5">
                      {formatPrice(it.price)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQty(it.id, it.qty - 1)}
                        className="w-7 h-7 rounded-full bg-white border border-green-200 hover:border-green-500 text-green-800"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold text-green-950">{it.qty}</span>
                      <button
                        onClick={() => setQty(it.id, it.qty + 1)}
                        className="w-7 h-7 rounded-full bg-white border border-green-200 hover:border-green-500 text-green-800"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(it.id)}
                      aria-label="Xóa"
                      className="text-[11px] text-stone-400 hover:text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-green-100 p-5 space-y-3 bg-green-50/50">
            <div className="flex justify-between text-sm text-green-900/70">
              <span>Tạm tính</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-900/70">
              <span>Phí giao nội thành</span>
              <span className="text-green-700 font-semibold wrap-anywhere">{shippingLabel}</span>
            </div>
            <div className="flex justify-between text-lg pt-3 border-t border-green-200">
              <span className="text-green-950 font-semibold">Tổng cộng</span>
              <span className="font-bold text-green-800 text-xl">{formatPrice(total)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="block text-center bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-full transition"
            >
              Thanh toán →
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

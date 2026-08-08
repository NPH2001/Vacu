"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";
import { useModalA11y } from "./useModalA11y";
import { MAX_LINE_QTY } from "@/lib/cart-limits";
import SmartImage from "./SmartImage";

function getShippingState(shippingLabel: string) {
  const normalized = shippingLabel.trim().toLowerCase();
  const isFree = normalized.includes("miễn phí") || normalized === "free";
  return {
    isFree,
    summary: isFree ? "Đơn này đang được miễn phí giao hàng." : "Chính sách giao hàng được hiển thị trong phần tóm tắt.",
  };
}

export default function CartDrawer({
  emptyTitle, emptyText, shippingLabel,
}: {
  emptyTitle: string;
  emptyText: string;
  shippingLabel: string;
}) {
  const { items, total, open, setOpen, setQty, remove } = useCart();
  const panelRef = useModalA11y<HTMLElement>(open, () => setOpen(false));
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const shipping = getShippingState(shippingLabel);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-green-950/50 z-[60] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng"
        inert={!open || undefined}
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-green-100">
          <div>
            <h2 className="text-xl font-bold text-green-950 font-display">Giỏ của bạn</h2>
            <p className="text-xs text-green-900/60">{items.length} món · {itemCount} sản phẩm</p>
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
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Kiểm tra nhanh trước khi thanh toán</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-900/80">
                      {shipping.summary} Sản phẩm không đạt chất lượng sẽ được hỗ trợ theo chính sách đổi trả.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    {shipping.isFree ? "Free ship" : "Minh bạch phí"}
                  </span>
                </div>
              </div>

              <ul className="space-y-3">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="rounded-2xl border border-green-100 bg-green-50/40 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <SmartImage
                        src={it.image}
                        sizes="80px"
                        alt={it.name}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-green-950 line-clamp-2">{it.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-green-900/65">
                          <span>Quy cách: {it.unit}</span>
                          <span aria-hidden>•</span>
                          <span>{formatPrice(it.price)} / đơn vị</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-green-800">
                          Thành tiền: {formatPrice(it.price * it.qty)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-green-100 pt-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${it.name}`}
                          onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}
                          disabled={it.qty <= 1}
                          className="h-10 w-10 rounded-full bg-white border border-green-200 hover:border-green-500 text-green-800 disabled:opacity-40 disabled:hover:border-green-200"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold text-green-950 tabular-nums">{it.qty}</span>
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${it.name}`}
                          onClick={() => setQty(it.id, it.qty + 1)}
                          disabled={it.qty >= MAX_LINE_QTY}
                          className="h-10 w-10 rounded-full bg-white border border-green-200 hover:border-green-500 text-green-800 disabled:opacity-40 disabled:hover:border-green-200"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className="px-2 py-1 text-xs font-medium text-stone-500 hover:text-red-600"
                      >
                        Xóa khỏi giỏ
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-green-100 bg-white p-5">
            <div className="rounded-3xl border border-green-200 bg-green-50/70 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Tạm tính đơn hàng</p>
                  <p className="mt-1 text-2xl font-bold text-green-950 tabular-nums">{formatPrice(total)}</p>
                  <p className="mt-1 text-xs text-green-900/65">
                    {itemCount} sản phẩm, chưa bao gồm phí giao nếu khu vực của bạn áp dụng.
                  </p>
                </div>
                {shipping.isFree && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                    Miễn phí giao
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3 border-t border-green-200 pt-4">
                <div className="flex justify-between text-sm text-green-900/70">
                  <span>Tạm tính hàng hóa</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm text-green-900/70">
                  <span>Giao hàng</span>
                  <span className="text-right font-semibold text-green-700 wrap-anywhere">{shippingLabel}</span>
                </div>
                <div className="flex justify-between border-t border-green-200 pt-3 text-lg">
                  <span className="font-semibold text-green-950">Tạm tính hàng hóa</span>
                  <span className="text-xl font-bold text-green-800">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="mt-4 block text-center bg-green-700 py-3.5 font-bold text-white transition hover:bg-green-800 rounded-full"
            >
              Thanh toán →
            </Link>
            <p className="mt-3 text-center text-xs text-green-900/65">
              Bạn sẽ chọn khung giờ giao và kiểm tra lại thông tin ở bước tiếp theo.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

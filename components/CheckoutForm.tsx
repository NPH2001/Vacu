"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";
import SmartImage from "./SmartImage";
import { placeOrder } from "@/app/(public)/checkout/actions";
import type { DeliverySlotRow } from "@/db/schema";

type PaymentMethod = "cod" | "bank";
type PaymentCopy = { label: string; hint: string };

// crypto.randomUUID exists only in a secure context; on a plain-http LAN/staging
// deploy it throws, which would white-screen the whole checkout. Fall back to a
// good-enough random key there — it only has to be unique per submission.
function newIdempotencyKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export default function CheckoutForm({
  slots, bankEnabled, payment, slotNote, shippingLabel, emptyCartTitle, emptyCartText,
}: {
  slots: DeliverySlotRow[];
  bankEnabled: boolean;
  payment: { cod: PaymentCopy; bank: PaymentCopy };
  slotNote: string;
  shippingLabel: string;
  emptyCartTitle: string;
  emptyCartText: string;
}) {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const slotId = useId();
  const noteId = useId();
  // Stable across retries of the same submission so a double-fire/network retry
  // resolves to one order; reset after a successful checkout. Lazy initializer
  // so the key is minted exactly once, not on every render.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [form, setForm] = useState<{
    name: string; phone: string; email: string; address: string; note: string; slot: string; payment: PaymentMethod;
  }>({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    slot: slots[0]?.label ?? "",
    payment: "cod",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('customerName', form.name);
    fd.set('phone', form.phone);
    fd.set('address', form.address);
    fd.set('deliverySlot', form.slot);
    fd.set('paymentMethod', form.payment);
    if (form.email) fd.set('customerEmail', form.email);
    if (form.note) fd.set('note', form.note);
    // Only id + qty are trusted; the server rebuilds price/name/stock from the DB.
    fd.set('cart', JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty }))));
    fd.set('idempotencyKey', idempotencyKey);
    startTransition(async () => {
      const res = await placeOrder(fd);
      if (!res.ok) { setError(res.error); return; }
      setIdempotencyKey(newIdempotencyKey()); // next order gets a fresh key
      clear();
      router.push(`/orders?new=${res.orderId}`);
    });
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-7xl mb-4">🧺</div>
        <h1 className="text-3xl font-bold text-green-950 mb-3 font-display wrap-anywhere">{emptyCartTitle}</h1>
        <p className="text-green-900/70 mb-8 wrap-anywhere">{emptyCartText}</p>
        <Link
          href="/products"
          className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-3.5 rounded-full"
        >
          Đi chợ nông trại →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link href="/products" className="text-green-700 text-sm font-semibold hover:underline">← Tiếp tục mua sắm</Link>
      <h1 className="text-3xl md:text-4xl font-bold text-green-950 mt-3 mb-8 font-display">Thanh toán</h1>

      <div className="grid md:grid-cols-5 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-3 bg-white rounded-3xl border border-green-100 p-7 space-y-5">
          <h2 className="text-lg font-bold text-green-950 font-display">Thông tin giao hàng</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Họ và tên" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nguyễn Văn A" autoComplete="name" required />
            <Field label="Số điện thoại" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0912 xxx xxx" type="tel" autoComplete="tel" required />
          </div>
          <Field label="Email (để nhận xác nhận đơn)" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="ban@example.com" type="email" autoComplete="email" />
          <Field label="Địa chỉ giao hàng" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Số nhà, đường, phường, quận, thành phố" autoComplete="street-address" required />

          <div>
            <label htmlFor={slotId} className="block text-sm font-semibold text-green-950 mb-1.5">Khung giờ giao</label>
            <select
              id={slotId}
              value={form.slot}
              onChange={(e) => setForm({ ...form, slot: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/40"
              disabled={slots.length === 0}
            >
              {slots.length === 0
                ? <option>Chưa có khung giờ nào</option>
                : slots.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
            </select>
            <p className="text-xs text-green-900/60 mt-1 wrap-anywhere">{slotNote}</p>
          </div>

          <div>
            <label htmlFor={noteId} className="block text-sm font-semibold text-green-950 mb-1.5">Ghi chú cho nông dân</label>
            <textarea
              id={noteId}
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Ví dụ: không gõ cửa, để cổng bảo vệ..."
              className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/40 resize-none"
            />
          </div>

          {bankEnabled ? (
            <div>
              <div className="block text-sm font-semibold text-green-950 mb-2">Phương thức thanh toán</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {(
                  [
                    { id: "cod" as const,  label: payment.cod.label,  hint: payment.cod.hint },
                    { id: "bank" as const, label: payment.bank.label, hint: payment.bank.hint },
                  ]
                ).map((p) => (
                  <label
                    key={p.id}
                    className={`flex flex-col gap-0.5 p-3 rounded-xl border cursor-pointer text-sm font-medium transition ${
                      form.payment === p.id ? "border-green-700 bg-green-50" : "border-green-200 hover:border-green-400"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        value={p.id}
                        checked={form.payment === p.id}
                        onChange={() => setForm({ ...form, payment: p.id })}
                        className="accent-green-700"
                      />
                      {p.label}
                    </span>
                    <span className="text-xs text-green-900/60 pl-6">{p.hint}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-50/60 border border-green-100 rounded-xl p-4 text-sm text-green-900/80 wrap-anywhere">
              <strong>{payment.cod.label}</strong> — {payment.cod.hint}
            </div>
          )}

          {error && <p role="alert" aria-live="assertive" className="text-sm text-red-600">{error}</p>}
          {slots.length === 0 && (
            <p className="text-sm text-amber-700">Cửa hàng chưa mở khung giờ giao — vui lòng quay lại sau.</p>
          )}
          <button
            type="submit"
            disabled={pending || slots.length === 0}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-full transition text-lg disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden />
                Đang đặt hàng…
              </>
            ) : (
              <>Đặt hàng · {formatPrice(total)}</>
            )}
          </button>
        </form>

        <div className="md:col-span-2 bg-green-50/60 rounded-3xl border border-green-100 p-6 h-fit sticky top-24">
          <h2 className="font-bold text-green-950 font-display mb-4">Tóm tắt đơn</h2>
          <ul className="space-y-3 mb-5">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 text-sm">
                <SmartImage src={it.image} alt={it.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-green-950 line-clamp-1">{it.name}</div>
                  <div className="text-xs text-green-900/60">{it.qty} × {it.unit}</div>
                </div>
                <div className="font-semibold text-green-800">{formatPrice(it.qty * it.price)}</div>
              </li>
            ))}
          </ul>
          <div className="border-t border-green-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-900/70">Tạm tính</span>
              <span className="text-green-950">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-900/70">Giao hàng</span>
              <span className="text-green-700 font-semibold wrap-anywhere">{shippingLabel}</span>
            </div>
            <div className="flex justify-between text-lg pt-3 border-t border-green-200 font-bold">
              <span className="text-green-950">Tổng</span>
              <span className="text-green-800">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", required = false, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  type?: string; required?: boolean; autoComplete?: string;
}) {
  // Programmatic label↔input association so a screen reader announces the field
  // name (placeholders are not accessible names and vanish on input).
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-green-950 mb-1.5">
        {label}{required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/40"
      />
    </div>
  );
}

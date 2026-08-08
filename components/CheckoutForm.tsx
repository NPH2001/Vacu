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
type FieldName = "name" | "phone" | "email" | "address" | "note" | "slot" | "payment";
type FieldErrors = Partial<Record<FieldName, string>>;

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

function getItemCount(items: ReturnType<typeof useCart>["items"]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

function validateField(name: FieldName, value: string, slots: DeliverySlotRow[]): string | null {
  switch (name) {
    case "name":
      return value.trim() ? null : "Vui lòng nhập họ tên người nhận.";
    case "phone": {
      const digits = value.replace(/\D/g, "");
      if (!value.trim()) return "Vui lòng nhập số điện thoại.";
      if (digits.length < 9 || digits.length > 11) return "Số điện thoại cần 9–11 chữ số.";
      return null;
    }
    case "email":
      if (!value.trim()) return null;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Email không hợp lệ.";
    case "address":
      return value.trim().length >= 5 ? null : "Vui lòng nhập đầy đủ số nhà, đường và khu vực giao.";
    case "note":
      return value.length <= 500 ? null : "Ghi chú tối đa 500 ký tự.";
    case "slot":
      if (slots.length === 0) return "Cửa hàng chưa mở khung giờ giao.";
      return value ? null : "Vui lòng chọn khung giờ giao.";
    case "payment":
      return value === "cod" || value === "bank" ? null : "Vui lòng chọn phương thức thanh toán.";
    default:
      return null;
  }
}

function validateForm(
  form: {
    name: string; phone: string; email: string; address: string; note: string; slot: string; payment: PaymentMethod;
  },
  slots: DeliverySlotRow[],
): FieldErrors {
  const nextErrors: FieldErrors = {};
  for (const name of ["name", "phone", "email", "address", "note", "slot", "payment"] as const) {
    const message = validateField(name, form[name], slots);
    if (message) nextErrors[name] = message;
  }
  return nextErrors;
}

function getShippingState(shippingLabel: string) {
  const normalized = shippingLabel.trim().toLowerCase();
  const isFree = normalized.includes("miễn phí") || normalized === "free";
  return {
    isFree,
    detail: isFree ? "Miễn phí giao hàng cho đơn này." : "Phí giao được áp dụng theo khu vực và được cửa hàng xác nhận cùng đơn.",
  };
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const slotId = useId();
  const noteId = useId();
  const formId = useId();
  const errorSummaryId = useId();
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
  const itemCount = getItemCount(items);
  const shipping = getShippingState(shippingLabel);

  function updateField<K extends FieldName>(name: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      const message = validateField(name, String(value), slots);
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  function handleFieldBlur(name: FieldName) {
    const message = validateField(name, form[name], slots);
    setErrors((current) => {
      if (!message && !current[name]) return current;
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nextErrors = validateForm(form, slots);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
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
      <h1 className="text-3xl md:text-4xl font-bold text-green-950 mt-3 font-display">Thanh toán</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-green-900/75">
        Điền thông tin giao hàng một lần. Giá sản phẩm, chính sách giao hàng và phương thức thanh toán luôn hiển thị rõ trước khi đặt đơn.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Nguồn đơn rõ ràng</p>
          <p className="mt-2 text-sm font-semibold text-emerald-950">{itemCount} sản phẩm đã sẵn sàng giao</p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/75">Bạn vẫn có thể quay lại giỏ để chỉnh số lượng trước khi đặt hàng.</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Thông tin giao hàng</p>
          <p className="mt-2 text-sm font-semibold text-green-950">{shippingLabel}</p>
          <p className="mt-1 text-xs leading-5 text-green-900/75">{shipping.detail}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Hỗ trợ sau đặt hàng</p>
          <p className="mt-2 text-sm font-semibold text-amber-950">Giữ nguyên dữ liệu nếu có lỗi thanh toán</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/75">Nếu đơn chưa gửi thành công, biểu mẫu và giỏ hàng của bạn vẫn được giữ nguyên.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-5">
        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          aria-describedby={Object.keys(errors).length > 0 || error ? errorSummaryId : undefined}
          className="space-y-5 rounded-3xl border border-green-100 bg-white p-7 md:col-span-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-green-950 font-display">Thông tin giao hàng</h2>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Bước 1 / 1
            </span>
          </div>

          {(Object.keys(errors).length > 0 || error) && (
            <div
              id={errorSummaryId}
              role="alert"
              aria-live="assertive"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error && <p>{error}</p>}
              {Object.keys(errors).length > 0 && (
                <p>{error ? "Kiểm tra lại các trường đang báo lỗi bên dưới." : "Vui lòng hoàn thiện các trường đang báo lỗi."}</p>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Họ và tên"
              value={form.name}
              onChange={(v) => updateField("name", v)}
              onBlur={() => handleFieldBlur("name")}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              error={errors.name}
              required
            />
            <Field
              label="Số điện thoại"
              value={form.phone}
              onChange={(v) => updateField("phone", v)}
              onBlur={() => handleFieldBlur("phone")}
              placeholder="0912 xxx xxx"
              type="tel"
              autoComplete="tel"
              pattern="[0-9+()\s.\-]{9,}"
              title="Nhập 9–11 chữ số (có thể kèm dấu cách/dấu gạch)."
              error={errors.phone}
              required
            />
          </div>
          <Field
            label="Email (để nhận xác nhận đơn)"
            value={form.email}
            onChange={(v) => updateField("email", v)}
            onBlur={() => handleFieldBlur("email")}
            placeholder="ban@example.com"
            type="email"
            autoComplete="email"
            error={errors.email}
          />
          <Field
            label="Địa chỉ giao hàng"
            value={form.address}
            onChange={(v) => updateField("address", v)}
            onBlur={() => handleFieldBlur("address")}
            placeholder="Số nhà, đường, phường, quận, thành phố"
            autoComplete="street-address"
            error={errors.address}
            required
          />

          <div>
            <label htmlFor={slotId} className="block text-sm font-semibold text-green-950 mb-1.5">Khung giờ giao</label>
            <select
              id={slotId}
              value={form.slot}
              onChange={(e) => updateField("slot", e.target.value)}
              onBlur={() => handleFieldBlur("slot")}
              aria-invalid={errors.slot ? "true" : "false"}
              aria-describedby={errors.slot ? `${slotId}-error` : `${slotId}-hint`}
              className={`w-full rounded-xl border bg-white px-4 py-3 focus:border-green-600 focus:ring-2 focus:ring-green-600/40 ${
                errors.slot ? "border-red-300 ring-1 ring-red-200" : "border-green-200"
              }`}
              disabled={slots.length === 0}
            >
              {slots.length === 0
                ? <option>Chưa có khung giờ nào</option>
                : slots.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
            </select>
            <p id={`${slotId}-hint`} className="mt-1 text-xs text-green-900/60 wrap-anywhere">{slotNote}</p>
            {errors.slot && <p id={`${slotId}-error`} className="mt-1 text-xs font-medium text-red-600">{errors.slot}</p>}
          </div>

          <div>
            <label htmlFor={noteId} className="block text-sm font-semibold text-green-950 mb-1.5">Ghi chú cho nông dân</label>
            <textarea
              id={noteId}
              rows={3}
              maxLength={500}
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              onBlur={() => handleFieldBlur("note")}
              aria-invalid={errors.note ? "true" : "false"}
              aria-describedby={errors.note ? `${noteId}-error` : `${noteId}-hint`}
              placeholder="Ví dụ: không gõ cửa, để cổng bảo vệ..."
              className={`w-full resize-none rounded-xl border bg-white px-4 py-3 focus:border-green-600 focus:ring-2 focus:ring-green-600/40 ${
                errors.note ? "border-red-300 ring-1 ring-red-200" : "border-green-200"
              }`}
            />
            <div className="mt-1 flex items-center justify-between gap-3 text-xs">
              <p id={`${noteId}-hint`} className="text-green-900/60">Bạn có thể ghi chú vị trí nhận hàng hoặc thời gian thuận tiện.</p>
              <span className="shrink-0 text-green-900/60">{form.note.length}/500</span>
            </div>
            {errors.note && <p id={`${noteId}-error`} className="mt-1 text-xs font-medium text-red-600">{errors.note}</p>}
          </div>

          {bankEnabled ? (
            <fieldset>
              <legend className="block text-sm font-semibold text-green-950 mb-2">Phương thức thanh toán</legend>
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
                        onChange={() => updateField("payment", p.id)}
                        onBlur={() => handleFieldBlur("payment")}
                        className="accent-green-700"
                      />
                      {p.label}
                    </span>
                    <span className="text-xs text-green-900/60 pl-6">{p.hint}</span>
                  </label>
                ))}
              </div>
              {errors.payment && <p className="mt-2 text-xs font-medium text-red-600">{errors.payment}</p>}
            </fieldset>
          ) : (
            <div className="bg-green-50/60 border border-green-100 rounded-xl p-4 text-sm text-green-900/80 wrap-anywhere">
              <strong>{payment.cod.label}</strong> — {payment.cod.hint}
            </div>
          )}

          {slots.length === 0 && (
            <p className="text-sm text-amber-700">Cửa hàng chưa mở khung giờ giao — vui lòng quay lại sau.</p>
          )}
          <button
            type="submit"
            disabled={pending || slots.length === 0}
            className="hidden w-full items-center justify-center gap-2 rounded-full bg-green-700 py-3.5 text-lg font-bold text-white transition hover:bg-green-800 disabled:opacity-60 md:inline-flex"
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
          <p className="hidden text-xs text-green-900/60 md:block">
            Bằng cách đặt hàng, bạn xác nhận đã kiểm tra lại địa chỉ, khung giờ giao và tổng tiền hiển thị bên phải.
          </p>
        </form>

        <div className="md:col-span-2">
          <div className="h-fit rounded-3xl border border-green-100 bg-green-50/60 p-6 md:sticky md:top-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-green-950 font-display">Tóm tắt đơn</h2>
              <p className="mt-1 text-xs text-green-900/65">{itemCount} sản phẩm trong giỏ</p>
            </div>
            {shipping.isFree && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Miễn phí giao
              </span>
            )}
          </div>
          <ul className="space-y-3 mb-5">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 text-sm">
                <SmartImage src={it.image} alt={it.name} sizes="64px" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-green-950 line-clamp-1">{it.name}</div>
                  <div className="text-xs text-green-900/60">{it.qty} × {it.unit}</div>
                </div>
                <div className="font-semibold text-green-800">{formatPrice(it.qty * it.price)}</div>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-sm shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Giao và thanh toán</p>
            <p className="mt-2 font-semibold text-green-950">{shippingLabel}</p>
            <p className="mt-1 text-xs leading-5 text-green-900/70">{shipping.detail}</p>
            <p className="mt-3 text-xs leading-5 text-green-900/70">
              {form.payment === "bank" ? payment.bank.hint : payment.cod.hint}
            </p>
          </div>
          <div className="mt-4 border-t border-green-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-900/70">Tạm tính</span>
              <span className="text-green-950">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-green-900/70">Giao hàng</span>
              <span className="text-right text-green-700 font-semibold wrap-anywhere">{shippingLabel}</span>
            </div>
            <div className="flex justify-between text-lg pt-3 border-t border-green-200 font-bold">
              <span className="text-green-950">Tổng</span>
              <span className="text-green-800">{formatPrice(total)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-green-900/65">
            Nếu phí giao thay đổi theo địa chỉ thực tế, cửa hàng sẽ liên hệ xác nhận cùng bạn khi xử lý đơn.
          </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-green-200 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(20,83,45,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Tổng thanh toán</p>
            <p className="text-lg font-bold text-green-950 tabular-nums">{formatPrice(total)}</p>
            <p className="text-[11px] text-green-900/60 line-clamp-1">{shippingLabel}</p>
          </div>
          <button
            type="submit"
            form={formId}
            disabled={pending || slots.length === 0}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {pending ? "Đang đặt hàng…" : "Đặt hàng"}
          </button>
        </div>
      </div>
      <div className="h-24 md:hidden" aria-hidden />
    </div>
  );
}

function Field({
  label, value, onChange, onBlur, placeholder, type = "text", required = false, autoComplete, pattern, title, error,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder: string;
  type?: string; required?: boolean; autoComplete?: string; pattern?: string; title?: string; error?: string;
}) {
  // Programmatic label↔input association so a screen reader announces the field
  // name (placeholders are not accessible names and vanish on input).
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
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
        pattern={pattern}
        title={title}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : hintId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-4 py-3 focus:border-green-600 focus:ring-2 focus:ring-green-600/40 ${
          error ? "border-red-300 ring-1 ring-red-200" : "border-green-200"
        }`}
      />
      <p id={hintId} className="mt-1 text-xs text-green-900/60">
        {required ? "Trường bắt buộc để hoàn tất giao hàng." : "Trường tùy chọn."}
      </p>
      {error && <p id={errorId} className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

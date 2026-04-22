"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { useOrders } from "./OrdersProvider";
import { formatPrice } from "@/lib/data";

const SLOTS = [
  "Sáng mai (7:00 - 11:00)",
  "Chiều mai (14:00 - 18:00)",
  "Sáng ngày kia (7:00 - 11:00)",
  "Chiều ngày kia (14:00 - 18:00)",
];

export default function CheckoutForm() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const { addOrder } = useOrders();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
    slot: SLOTS[0],
    payment: "cod",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = addOrder({
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image,
        unit: i.unit,
      })),
      total,
      address: form.address,
      deliverySlot: form.slot,
    });
    clear();
    router.push(`/orders?new=${id}`);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-7xl mb-4">🧺</div>
        <h1 className="text-3xl font-bold text-green-950 mb-3 font-display">Giỏ trống</h1>
        <p className="text-green-900/70 mb-8">Hãy chọn vài loại rau tươi trước khi thanh toán.</p>
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
            <Field label="Họ và tên" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nguyễn Văn A" required />
            <Field label="Số điện thoại" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0912 xxx xxx" type="tel" required />
          </div>
          <Field label="Địa chỉ giao hàng" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Số nhà, đường, phường, quận, thành phố" required />

          <div>
            <label className="block text-sm font-semibold text-green-950 mb-1.5">Khung giờ giao</label>
            <select
              value={form.slot}
              onChange={(e) => setForm({ ...form, slot: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-600"
            >
              {SLOTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <p className="text-xs text-green-900/60 mt-1">Rau được thu hoạch buổi sáng cùng ngày giao.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-green-950 mb-1.5">Ghi chú cho nông dân</label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Ví dụ: không gõ cửa, để cổng bảo vệ..."
              className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-600 resize-none"
            />
          </div>

          <div>
            <div className="block text-sm font-semibold text-green-950 mb-2">Phương thức thanh toán</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { id: "cod", label: "💵 Tiền mặt khi nhận" },
                { id: "momo", label: "📱 Ví MoMo" },
                { id: "bank", label: "🏦 Chuyển khoản" },
                { id: "card", label: "💳 Thẻ ngân hàng" },
              ].map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm font-medium transition ${
                    form.payment === p.id ? "border-green-700 bg-green-50" : "border-green-200 hover:border-green-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={p.id}
                    checked={form.payment === p.id}
                    onChange={(e) => setForm({ ...form, payment: e.target.value })}
                    className="accent-green-700"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-full transition text-lg"
          >
            Đặt hàng · {formatPrice(total)}
          </button>
        </form>

        <div className="md:col-span-2 bg-green-50/60 rounded-3xl border border-green-100 p-6 h-fit sticky top-24">
          <h2 className="font-bold text-green-950 font-display mb-4">Tóm tắt đơn</h2>
          <ul className="space-y-3 mb-5">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.name} className="w-12 h-12 rounded-lg object-cover" />
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
              <span className="text-green-700 font-semibold">Miễn phí</span>
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
  label, value, onChange, placeholder, type = "text", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-green-950 mb-1.5">
        {label}{required && <span className="text-red-600"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-green-200 bg-white focus:outline-none focus:border-green-600"
      />
    </div>
  );
}

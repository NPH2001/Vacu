'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import type { OrderStatusFormState } from '@/app/admin/actions/order-statuses';
import type { OrderStatusRow } from '@/db/schema';

export default function OrderStatusForm({
  action, defaults,
}: {
  action: (prev: OrderStatusFormState, fd: FormData) => Promise<OrderStatusFormState>;
  defaults: OrderStatusRow;
}) {
  const [state, formAction, pending] = useActionState<OrderStatusFormState, FormData>(action, null);
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <div className="text-sm text-green-900/70">
        Key: <span className="font-mono bg-green-50 px-2 py-0.5 rounded">{defaults.key}</span>
        <span className="ml-2 text-green-900/50">(không sửa được)</span>
      </div>
      <L label="Nhãn hiển thị" required>
        <input name="label" defaultValue={defaults.label} required
          className="w-full admin-input" />
      </L>
      <L label="Màu (tailwind class)" required>
        <input name="color" defaultValue={defaults.color} required
          className="w-full admin-input font-mono text-sm"
          placeholder="VD: bg-amber-100 text-amber-800" />
        <p className="text-xs text-green-900/60 mt-1">
          Viết như: <code>bg-amber-100 text-amber-800</code>.
          Xem <a href="https://tailwindcss.com/docs/background-color" target="_blank" rel="noopener noreferrer" className="underline">Tailwind colors</a>.
        </p>
      </L>
      <L label="Thứ tự">
        <input name="sortOrder" type="number" defaultValue={defaults.sortOrder}
          className="w-32 admin-input" />
      </L>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/order-statuses" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : 'Cập nhật'}
        </button>
      </div>
    </form>
  );
}

function L({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

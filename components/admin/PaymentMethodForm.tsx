'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import SlugInput from './SlugInput';
import type { PaymentMethodFormState } from '@/app/admin/actions/payment-methods';
import type { PaymentMethodRow } from '@/db/schema';

export default function PaymentMethodForm({
  action, defaults, editing,
}: {
  action: (prev: PaymentMethodFormState, fd: FormData) => Promise<PaymentMethodFormState>;
  defaults?: Partial<PaymentMethodRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<PaymentMethodFormState, FormData>(action, null);
  const d = defaults ?? {};
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      {!editing && (
        <L label="Mã (slug)" required>
          <SlugInput
            defaultValue={d.id ?? ''}
            editing={false}
            sourceName="label"
            placeholder="cod / momo / bank / card"
            mono
          />
          <p className="text-xs text-green-900/60 mt-1">Chữ thường, số, dấu gạch ngang. Không đổi được sau khi tạo.</p>
        </L>
      )}
      <L label="Nhãn hiển thị" required>
        <input name="label" defaultValue={d.label ?? ''} required
          className="w-full border border-green-200 rounded px-3 py-2"
          placeholder="VD: 💵 Tiền mặt khi nhận" />
      </L>
      <L label="Kích hoạt">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={d.active ?? true} />
          <span className="text-sm">Hiển thị ở trang thanh toán</span>
        </label>
      </L>
      <L label="Thứ tự">
        <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
          className="w-32 border border-green-200 rounded px-3 py-2" />
      </L>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/payment-methods" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo mới'}
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

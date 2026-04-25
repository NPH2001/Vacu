'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import type { MenuItemFormState } from '@/app/admin/actions/menu';
import type { MenuItemRow } from '@/db/schema';

export default function MenuItemForm({
  action, defaults, editing,
}: {
  action: (prev: MenuItemFormState, fd: FormData) => Promise<MenuItemFormState>;
  defaults?: Partial<MenuItemRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<MenuItemFormState, FormData>(action, null);
  const d = defaults ?? {};
  const loc = d.location ?? 'header';
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <L label="Vị trí" required>
        <div className="flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="location" value="header" defaultChecked={loc === 'header'} required />
            <span>Header (menu trên cùng)</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="location" value="footer" defaultChecked={loc === 'footer'} />
            <span>Footer (Liên kết nhanh)</span>
          </label>
        </div>
      </L>
      <L label="Nhãn hiển thị" required>
        <input name="label" defaultValue={d.label ?? ''} required maxLength={120}
          className="w-full border border-green-200 rounded px-3 py-2"
          placeholder="VD: Trang chủ" />
      </L>
      <L label="Đường dẫn (URL)" required>
        <input name="href" defaultValue={d.href ?? ''} required maxLength={500}
          className="w-full border border-green-200 rounded px-3 py-2"
          placeholder="VD: /products?c=rau-cu hoặc https://..." />
      </L>
      <L label="Mở tab mới">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="openInNewTab" defaultChecked={d.openInNewTab ?? false} />
          <span className="text-sm">Mở liên kết trong tab/cửa sổ mới</span>
        </label>
      </L>
      <L label="Thứ tự">
        <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
          className="w-32 border border-green-200 rounded px-3 py-2" />
      </L>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/menu" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
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

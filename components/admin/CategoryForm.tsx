'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { CategoryFormState } from '@/app/admin/actions/categories';
import type { CategoryRow } from '@/db/schema';
import EmojiPicker from './EmojiPicker';

export default function CategoryForm({
  action, defaults, editing,
}: {
  action: (prev: CategoryFormState, fd: FormData) => Promise<CategoryFormState>;
  defaults?: Partial<CategoryRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(action, null);
  const d = defaults ?? {};
  const [icon, setIcon] = useState(d.icon ?? '');
  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <L label="Slug (ID)" required>
          <input name="id" defaultValue={d.id ?? ''} required readOnly={editing} pattern="[a-z0-9-]+"
            className="w-full border border-green-200 rounded px-3 py-2 read-only:bg-green-50 read-only:text-green-900/70" />
        </L>
        <L label="Tên" required>
          <input name="name" defaultValue={d.name ?? ''} required
            className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
        <L label="Icon (emoji)" required>
          <EmojiPicker value={icon} onChange={setIcon} name="icon" required />
        </L>
        <L label="Thứ tự">
          <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
            className="w-full border border-green-200 rounded px-3 py-2" />
        </L>
      </div>
      <L label="Mô tả" required>
        <textarea name="description" defaultValue={d.description ?? ''} required rows={3}
          className="w-full border border-green-200 rounded px-3 py-2" />
      </L>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/admin/categories" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
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

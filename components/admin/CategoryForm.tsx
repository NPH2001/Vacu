'use client';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import type { CategoryFormState } from '@/app/admin/actions/categories';
import type { CategoryRow } from '@/db/schema';
import CategoryIconField from './CategoryIconField';
import ImageUpload from './ImageUpload';
import SlugInput from './SlugInput';

export default function CategoryForm({
  action, defaults, editing, availableParents,
}: {
  action: (prev: CategoryFormState, fd: FormData) => Promise<CategoryFormState>;
  defaults?: Partial<CategoryRow>;
  editing: boolean;
  availableParents: Pick<CategoryRow, 'id' | 'name'>[];
}) {
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(action, null);
  const d = defaults ?? {};

  // Warn before leaving with unsaved changes (image + required description).
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty || pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, pending]);

  return (
    <form action={formAction} onChange={() => setDirty(true)} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <L label="Slug (ID)" required>
          <SlugInput defaultValue={d.id ?? ''} editing={editing} />
        </L>
        <L label="Tên" required>
          <input name="name" defaultValue={d.name ?? ''} required
            className="w-full admin-input" />
        </L>
        <L label="Icon" required>
          <CategoryIconField defaultValue={d.icon ?? ''} />
        </L>
        <L label="Thứ tự">
          <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
            className="w-full admin-input" />
        </L>
        <L label="Danh mục cha">
          <select name="parentId" defaultValue={d.parentId ?? ''}
            className="w-full admin-input bg-white">
            <option value="">— Không có (cấp gốc) —</option>
            {availableParents.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </L>
      </div>
      <L label="Mô tả" required>
        <textarea name="description" defaultValue={d.description ?? ''} required rows={3}
          className="w-full admin-input" />
      </L>
      <ImageUpload
        name="coverImage"
        defaultValue={d.coverImage ?? ''}
        label="Ảnh bìa danh mục (banner)"
      />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
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

'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import SlugInput from '@/components/admin/SlugInput';
import type { PostCategoryFormState } from '@/app/admin/actions/post-categories';
import type { PostCategoryRow } from '@/db/schema';

export default function PostCategoryForm({
  action, defaults, editing,
}: {
  action: (prev: PostCategoryFormState, fd: FormData) => Promise<PostCategoryFormState>;
  defaults?: Partial<PostCategoryRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<PostCategoryFormState, FormData>(action, null);
  const d = defaults ?? {};

  return (
    <form action={formAction} className="admin-panel p-5 space-y-4 max-w-2xl">
      <label className="block">
        <span className="text-[13px] font-medium text-stone-900">Tên chuyên mục <span className="text-red-500">*</span></span>
        <input name="name" defaultValue={d.name ?? ''} required autoFocus={!editing}
          placeholder="Ví dụ: Mẹo nhà bếp"
          className="mt-1 w-full border border-stone-300 rounded px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-[13px] font-medium text-stone-900">Đường dẫn <span className="text-red-500">*</span></span>
        <span className="block text-[11.5px] text-stone-500 mt-0.5">
          Địa chỉ lọc theo chuyên mục: /tin-tuc?chuyen-muc={d.id || 'duong-dan'}
          {editing && ' — không đổi được sau khi tạo.'}
        </span>
        <SlugInput defaultValue={d.id ?? ''} sourceName="name" editing={editing} mono
          className="mt-1 w-full border border-stone-300 rounded px-3 py-2 read-only:bg-stone-50 read-only:text-stone-500" />
      </label>

      <label className="block">
        <span className="text-[13px] font-medium text-stone-900">Mô tả</span>
        <span className="block text-[11.5px] text-stone-500 mt-0.5">Hiện ở đầu trang khi lọc theo chuyên mục này.</span>
        <textarea name="description" defaultValue={d.description ?? ''} rows={2} maxLength={300}
          className="mt-1 w-full border border-stone-300 rounded px-3 py-2 text-sm" />
      </label>

      <label className="block max-w-[160px]">
        <span className="text-[13px] font-medium text-stone-900">Thứ tự</span>
        <span className="block text-[11.5px] text-stone-500 mt-0.5">Số nhỏ hiện trước.</span>
        <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
          className="mt-1 w-full border border-stone-300 rounded px-3 py-2" />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-3 pt-2 border-t border-stone-200">
        <Link href="/admin/post-categories" className="admin-btn-ghost">Hủy</Link>
        <button type="submit" disabled={pending} className="admin-btn-primary disabled:opacity-60">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}

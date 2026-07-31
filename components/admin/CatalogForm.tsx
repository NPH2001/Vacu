'use client';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import GalleryField from '@/components/admin/GalleryField';
import type { CatalogFormState } from '@/app/admin/actions/catalogs';
import type { CatalogRow } from '@/db/schema';

export default function CatalogForm({
  action, defaults, pages = [], editing,
}: {
  action: (prev: CatalogFormState, fd: FormData) => Promise<CatalogFormState>;
  defaults?: Partial<CatalogRow>;
  /** Ảnh các trang, theo thứ tự hiển thị. */
  pages?: string[];
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<CatalogFormState, FormData>(action, null);
  const [dirty, setDirty] = useState(false);
  const d = defaults ?? {};

  // Một catalog vài chục trang là cả buổi ngồi tải ảnh — mất vì một cú bấm lạc
  // là chuyện khiến người ta không tin CMS nữa.
  useEffect(() => {
    if (!dirty || pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, pending]);

  return (
    <form action={formAction} onChange={() => setDirty(true)}
      className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <L label="Tên catalog" required hint="Ví dụ: Catalog nông sản 2026">
        <input name="name" defaultValue={d.name ?? ''} required maxLength={200} autoFocus={!editing}
          className="w-full admin-input" />
      </L>

      <L label="Mô tả ngắn" hint="Một hai câu hiện trên thẻ catalog. Bỏ trống thì ẩn.">
        <textarea name="description" defaultValue={d.description ?? ''} rows={3} maxLength={600}
          className="w-full admin-input" />
      </L>

      <L label="Các trang catalog" required
        hint="Tải ảnh từng trang lên theo đúng thứ tự. Ảnh đầu tiên được dùng làm bìa. Kéo để sắp lại thứ tự.">
        <GalleryField
          name="pages"
          defaultValue={pages}
          max={60}
          pickerTitle="Chọn ảnh trang catalog"
          emptyTitle="Thêm trang catalog"
          emptyHint="Ảnh từng trang — JPG, PNG hoặc WebP, tối đa 4MB mỗi ảnh"
          onChange={() => setDirty(true)}
        />
      </L>

      <L label="Hiện trên web" hint="Bỏ tick để tạm giấu catalog này mà không xoá — bản cũ vẫn còn để đối chiếu.">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="visible" defaultChecked={d.visible ?? true} className="accent-green-700" />
          <span className="text-sm">Khách xem được catalog này</span>
        </label>
      </L>

      <L label="Thứ tự" hint="Số nhỏ hiện trước.">
        <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0}
          className="w-32 admin-input" />
      </L>

      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-3">
        <Link href="/admin/catalogs" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}

function L({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
      {hint && <span className="block text-[11.5px] text-stone-500 mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

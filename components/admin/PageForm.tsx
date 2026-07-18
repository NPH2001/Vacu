'use client';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import SlugInput from '@/components/admin/SlugInput';
import PageBuilder, { type PickOption } from '@/components/admin/PageBuilder';
import type { PageFormState } from '@/app/admin/actions/pages';
import type { PageRow } from '@/db/schema';
import { HOME_PAGE_ID, type BlockEntry } from '@/lib/blocks';

export default function PageForm({
  action, defaults, blocks = [], editing, categoryOptions = [], productOptions = [],
}: {
  action: (prev: PageFormState, fd: FormData) => Promise<PageFormState>;
  defaults?: Partial<PageRow>;
  blocks?: BlockEntry[];
  editing: boolean;
  categoryOptions?: PickOption[];
  productOptions?: PickOption[];
}) {
  const [state, formAction, pending] = useActionState<PageFormState, FormData>(action, null);
  const [dirty, setDirty] = useState(false);
  const d = defaults ?? {};
  const isHome = editing && d.id === HOME_PAGE_ID;

  useEffect(() => {
    if (!dirty || pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, pending]);

  return (
    <form action={formAction} onChange={() => setDirty(true)}
      className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
      <div className="space-y-4 min-w-0">
        <div className="admin-panel p-5 space-y-4">
          <label className="block">
            <span className="text-[13px] font-medium text-stone-900">Tên trang <span className="text-red-500">*</span></span>
            <input name="title" defaultValue={d.title ?? ''} required autoFocus={!editing}
              placeholder="Ví dụ: Tuyển dụng"
              className="mt-1 w-full admin-input text-[15px]" />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-stone-900">Đường dẫn <span className="text-red-500">*</span></span>
            <span className="block text-[11.5px] text-stone-500 mt-0.5">
              {isHome ? (
                <>Đây là <b>Trang chủ</b> — hiển thị ngay tại <code className="font-mono">/</code>, không đổi đường dẫn được.</>
              ) : (
                <>
                  Địa chỉ trang: /{d.id || 'duong-dan'}
                  {editing ? ' — không đổi được sau khi tạo.' : ' — tự điền theo tên, bạn có thể sửa.'}
                </>
              )}
            </span>
            <SlugInput defaultValue={d.id ?? ''} sourceName="title" editing={editing} mono
              className="mt-1 w-full admin-input read-only:bg-stone-50 read-only:text-stone-500" />
          </label>
        </div>

        <div>
          <h2 className="text-[13px] font-semibold text-stone-700 uppercase tracking-wider mb-2">
            Các khối nội dung
          </h2>
          <p className="text-[11.5px] text-stone-500 mb-3">
            Trang hiện ra theo đúng thứ tự các khối bên dưới. Dùng ↑ ↓ để đổi thứ tự, “Ẩn” để tạm giấu một khối
            mà không xóa nó.
          </p>
          <PageBuilder defaultValue={blocks} categoryOptions={categoryOptions} productOptions={productOptions}
            onDirty={() => setDirty(true)} />
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-4">
        <div className="admin-panel p-4 space-y-3">
          <h3 className="font-display text-[15px] text-stone-900">Xuất bản</h3>
          {isHome ? (
            // The homepage must stay published — a draft would make `/` fall back
            // to the code default and silently hide the admin's arranged layout.
            <>
              <input type="hidden" name="status" value="published" />
              <p className="text-[12.5px] text-stone-500">Trang chủ luôn ở trạng thái <b>đã đăng</b>.</p>
            </>
          ) : (
            <label className="block">
              <select name="status" defaultValue={d.status ?? 'draft'}
                className="w-full admin-input text-sm bg-white">
                <option value="draft">Nháp — chỉ mình bạn thấy</option>
                <option value="published">Đã đăng — khách xem được</option>
              </select>
            </label>
          )}
          <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
            <button type="submit" disabled={pending}
              className="admin-btn-primary disabled:opacity-60 flex-1 justify-center">
              {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo trang'}
            </button>
            {editing && d.id && (
              <a href={`/${d.id}?preview=1`} target="_blank" rel="noopener noreferrer"
                className="admin-btn-ghost text-[12.5px] shrink-0" title="Mở trang trong tab mới">
                Xem thử ↗
              </a>
            )}
          </div>
        </div>

        {state?.error && (
          <div className="admin-panel p-3 border-red-200 bg-red-50">
            <p role="alert" className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        <div className="admin-panel p-4 space-y-3">
          <h3 className="font-display text-[15px] text-stone-900">SEO</h3>
          <label className="block">
            <span className="text-[13px] font-medium text-stone-900">Tiêu đề trên Google</span>
            <span className="block text-[11.5px] text-stone-500 mt-0.5">Bỏ trống thì dùng tên trang.</span>
            <input name="metaTitle" defaultValue={d.metaTitle ?? ''} maxLength={200}
              className="mt-1 w-full admin-input text-sm" />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-stone-900">Mô tả trên Google</span>
            <textarea name="metaDescription" defaultValue={d.metaDescription ?? ''} rows={3} maxLength={300}
              className="mt-1 w-full admin-input text-sm" />
          </label>
        </div>

        <div className="admin-panel p-4">
          <h3 className="font-display text-[15px] text-stone-900 mb-1.5">Đưa trang vào menu</h3>
          <p className="text-[11.5px] text-stone-500">
            Trang mới không tự hiện trên thanh menu. Vào{' '}
            <Link href="/admin/menu" className="text-green-700 hover:underline">Menu</Link>{' '}
            và thêm mục trỏ tới <code className="font-mono">/{d.id || 'duong-dan'}</code>.
          </p>
        </div>

        <div className="flex justify-end">
          <Link href="/admin/pages" className="admin-btn-ghost text-[12.5px]">← Quay lại danh sách</Link>
        </div>
      </div>
    </form>
  );
}

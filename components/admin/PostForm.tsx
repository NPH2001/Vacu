'use client';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import SlugInput from '@/components/admin/SlugInput';
import RichEditor from '@/components/admin/RichEditor';
import PublishBox from '@/components/admin/PublishBox';
import type { PublishMode } from '@/lib/publish-mode';
import type { PostFormState } from '@/app/admin/actions/posts';
import type { PostRow, PostCategoryRow } from '@/db/schema';

type Defaults = Partial<PostRow> & { id?: string };

export default function PostForm({
  action, defaults, categories, editing, initialMode,
}: {
  action: (prev: PostFormState, fd: FormData) => Promise<PostFormState>;
  defaults?: Defaults;
  categories: PostCategoryRow[];
  editing: boolean;
  /** Computed server-side so render never has to read the clock. */
  initialMode: PublishMode;
}) {
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(action, null);
  const [tab, setTab] = useState<'content' | 'seo'>('content');
  const [dirty, setDirty] = useState(false);
  const d = defaults ?? {};

  // Losing a half-written article to a stray click is the kind of thing that
  // makes people distrust the CMS, so warn before the tab closes. Skipped while
  // a submit is in flight, since that navigation is intentional.
  useEffect(() => {
    if (!dirty || pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, pending]);

  return (
    <form action={formAction} onChange={() => setDirty(true)}
      className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
      <div className="space-y-4 min-w-0">
        <div className="admin-panel p-5 space-y-4">
          <Field label="Tiêu đề bài viết" required>
            <input name="title" defaultValue={d.title ?? ''} required autoFocus={!editing}
              placeholder="Ví dụ: Bí quyết chọn rau tươi ngon cho bữa cơm gia đình"
              className="w-full admin-input text-[15px]" />
          </Field>

          <Field label="Đường dẫn" required
            hint={`Địa chỉ bài viết trên web: /tin-tuc/${d.id || 'duong-dan-bai-viet'}${editing ? ' — không đổi được sau khi tạo.' : ' — tự điền theo tiêu đề, bạn có thể sửa.'}`}>
            <SlugInput defaultValue={d.id ?? ''} sourceName="title" editing={editing} mono />
          </Field>
        </div>

        <div className="admin-panel-flush">
          <div className="flex gap-1 px-3 pt-3 border-b border-stone-200">
            <Tab active={tab === 'content'} onClick={() => setTab('content')}>Nội dung</Tab>
            <Tab active={tab === 'seo'} onClick={() => setTab('seo')}>SEO &amp; Tóm tắt</Tab>
          </div>

          {/* Both panels stay mounted: unmounting the editor would throw away
              unsaved typing when the admin flicks to the SEO tab. */}
          <div className="p-5" hidden={tab !== 'content'}>
            <RichEditor
              name="contentHtml"
              defaultValue={d.contentHtml ?? ''}
              placeholder="Viết nội dung bài viết ở đây… Bạn có thể dán từ Word."
              minHeight={420}
              // The editor writes its hidden input programmatically (no bubbling
              // change event), so a body-only edit would otherwise never mark the
              // form dirty and the unsaved-work guard would miss it.
              onChange={() => setDirty(true)}
            />
          </div>

          <div className="p-5 space-y-4" hidden={tab !== 'seo'}>
            <Field label="Tóm tắt ngắn"
              hint="Hiện ở thẻ bài viết ngoài trang tin tức. Bỏ trống thì hệ thống tự lấy đoạn đầu bài.">
              <textarea name="excerpt" defaultValue={d.excerpt ?? ''} rows={3} maxLength={500}
                placeholder="Một hai câu tóm tắt bài viết…"
                className="w-full admin-input text-sm" />
            </Field>
            <Field label="Tiêu đề trên Google"
              hint="Bỏ trống thì dùng tiêu đề bài viết. Nên dưới 60 ký tự.">
              <input name="metaTitle" defaultValue={d.metaTitle ?? ''} maxLength={200}
                className="w-full admin-input text-sm" />
            </Field>
            <Field label="Mô tả trên Google"
              hint="Đoạn chữ xám hiện dưới tiêu đề khi tìm trên Google. Bỏ trống thì dùng tóm tắt.">
              <textarea name="metaDescription" defaultValue={d.metaDescription ?? ''} rows={2} maxLength={300}
                className="w-full admin-input text-sm" />
            </Field>
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-4">
        <PublishBox
          initialMode={initialMode}
          publishedAt={d.publishedAt ? new Date(d.publishedAt) : null}
          editing={editing}
          pending={pending}
          previewHref={d.id ? `/tin-tuc/${d.id}?preview=1` : undefined}
        />

        {state?.error && (
          <div className="admin-panel p-3 border-red-200 bg-red-50">
            <p role="alert" className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        <div className="admin-panel p-4 space-y-3">
          <h3 className="font-display text-[15px] text-stone-900">Ảnh bìa</h3>
          <ImageUpload name="coverImage" defaultValue={d.coverImage ?? ''} label="" />
          <p className="text-[11.5px] text-stone-500">
            Hiện ở đầu bài và trên thẻ bài viết. Ảnh ngang đẹp hơn ảnh dọc.
          </p>
        </div>

        <div className="admin-panel p-4 space-y-3">
          <h3 className="font-display text-[15px] text-stone-900">Phân loại</h3>
          <Field label="Chuyên mục">
            <select name="categoryId" defaultValue={d.categoryId ?? ''}
              className="w-full admin-input text-sm bg-white">
              <option value="">— Chưa phân loại —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {categories.length === 0 && (
            <p className="text-[11.5px] text-stone-500">
              Chưa có chuyên mục nào.{' '}
              <Link href="/admin/post-categories/new" className="text-green-700 hover:underline">Tạo chuyên mục</Link>
            </p>
          )}
          <Field label="Thẻ" hint="Ngăn cách bằng dấu phẩy.">
            <input name="tags" defaultValue={(d.tags ?? []).join(', ')} placeholder="rau sạch, mẹo bếp"
              className="w-full admin-input text-sm" />
          </Field>
          <label className="flex items-center gap-2 text-[13.5px] text-stone-900">
            <input type="checkbox" name="featured" defaultChecked={d.featured ?? false} className="accent-green-700" />
            Ghim lên đầu trang tin tức
          </label>
        </div>

        <div className="flex justify-end">
          <Link href="/admin/posts" className="admin-btn-ghost text-[12.5px]">← Quay lại danh sách</Link>
        </div>
      </div>
    </form>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3.5 py-2 text-[13px] font-medium rounded-t-lg border-b-2 -mb-px transition ${
        active ? 'border-green-700 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
      }`}>
      {children}
    </button>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="text-[13px] font-medium text-stone-900">
          {label}{required && <span className="text-red-500"> *</span>}
        </span>
      )}
      {hint && <span className="block text-[11.5px] text-stone-500 mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

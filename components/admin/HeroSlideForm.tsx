'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import type { HeroSlideFormState } from '@/app/admin/actions/hero-slides';
import type { HeroSlideRow } from '@/db/schema';

export default function HeroSlideForm({
  action, defaults, editing,
}: {
  action: (prev: HeroSlideFormState, fd: FormData) => Promise<HeroSlideFormState>;
  defaults?: Partial<HeroSlideRow>;
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<HeroSlideFormState, FormData>(action, null);
  const d = defaults ?? {};

  return (
    <form action={formAction} className="admin-panel p-6 space-y-5 max-w-3xl">
      <ImageUpload name="image" defaultValue={d.image ?? ''} label="Ảnh nền *" />

      <L label="Chữ nhỏ phía trên (badge)" hint="Ví dụ: Thu hoạch sáng nay — giao chiều nay. Bỏ trống thì ẩn.">
        <input name="badge" defaultValue={d.badge ?? ''} className={inputCls} />
      </L>

      <L label="Tiêu đề lớn" required>
        <input name="title" defaultValue={d.title ?? ''} required autoFocus={!editing}
          className={inputCls} placeholder="Sản vật OCOP từ hợp tác xã Việt Nam" />
      </L>

      <L label="Mô tả ngắn" hint="Câu phụ dưới tiêu đề. Bỏ trống thì ẩn.">
        <textarea name="subtitle" defaultValue={d.subtitle ?? ''} rows={2} className={inputCls} />
      </L>

      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-stone-200">
        <L label="Nút chính — chữ" hint="Bỏ trống thì ẩn nút.">
          <input name="ctaPrimaryLabel" defaultValue={d.ctaPrimaryLabel ?? ''} className={inputCls} placeholder="Đi chợ nông trại →" />
        </L>
        <L label="Nút chính — liên kết">
          <input name="ctaPrimaryHref" defaultValue={d.ctaPrimaryHref ?? ''} className={inputCls} placeholder="/products" />
        </L>
        <L label="Nút phụ — chữ" hint="Bỏ trống thì ẩn nút.">
          <input name="ctaSecondaryLabel" defaultValue={d.ctaSecondaryLabel ?? ''} className={inputCls} placeholder="Gặp bà con nông dân" />
        </L>
        <L label="Nút phụ — liên kết">
          <input name="ctaSecondaryHref" defaultValue={d.ctaSecondaryHref ?? ''} className={inputCls} placeholder="/farmers" />
        </L>
      </div>

      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-stone-200">
        <L label="Thứ tự" hint="Số nhỏ hiện trước.">
          <input name="sortOrder" type="number" defaultValue={d.sortOrder ?? 0} className={inputCls} />
        </L>
        <label className="flex items-center gap-2 text-sm text-stone-900 self-end pb-2">
          <input type="checkbox" name="active" defaultChecked={d.active ?? true} className="accent-green-700" />
          Hiển thị trên trang chủ
        </label>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-3 pt-2 border-t border-stone-200">
        <Link href="/admin/hero-slides" className="admin-btn-ghost">Hủy</Link>
        <button type="submit" disabled={pending} className="admin-btn-primary disabled:opacity-60">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo slide'}
        </button>
      </div>
    </form>
  );
}

const inputCls = 'mt-1 w-full border border-stone-300 rounded px-3 py-2 text-sm';

function L({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-stone-900">{label}{required && <span className="text-red-500"> *</span>}</span>
      {hint && <span className="block text-[11.5px] text-stone-500 mt-0.5">{hint}</span>}
      {children}
    </label>
  );
}

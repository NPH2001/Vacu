'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import type { ProductFormState } from '@/app/admin/actions/products';
import type { ProductRow, CategoryRow, FarmerRow } from '@/db/schema';

type Defaults = Partial<ProductRow> & { id?: string };

export default function ProductForm({
  action,
  defaults,
  categories,
  farmers,
  editing,
}: {
  action: (prev: ProductFormState, fd: FormData) => Promise<ProductFormState>;
  defaults?: Defaults;
  categories: CategoryRow[];
  farmers: FarmerRow[];
  editing: boolean;
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, null);
  const d = defaults ?? {};

  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Slug (ID)" required>
          <input name="id" defaultValue={d.id ?? ''} readOnly={editing} required
            pattern="[a-z0-9-]+"
            className="w-full border border-green-200 rounded px-3 py-2 read-only:bg-green-50 read-only:text-green-900/70" />
        </Field>
        <Field label="Tên sản phẩm" required>
          <input name="name" defaultValue={d.name ?? ''} required
            className="w-full border border-green-200 rounded px-3 py-2" />
        </Field>
        <Field label="Danh mục" required>
          <select name="categoryId" defaultValue={d.categoryId ?? ''} required
            className="w-full border border-green-200 rounded px-3 py-2 bg-white">
            <option value="" disabled>— Chọn danh mục —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Nông dân">
          <select name="farmerId" defaultValue={d.farmerId ?? ''}
            className="w-full border border-green-200 rounded px-3 py-2 bg-white">
            <option value="">— Không gán —</option>
            {farmers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </Field>
        <Field label="Đơn vị" required>
          <input name="unit" defaultValue={d.unit ?? ''} required placeholder="bó 250g"
            className="w-full border border-green-200 rounded px-3 py-2" />
        </Field>
        <Field label="Giá (VND)" required>
          <input name="price" type="number" min="0" step="1000" defaultValue={d.price ?? ''} required
            className="w-full border border-green-200 rounded px-3 py-2" />
        </Field>
        <Field label="Giá gốc (VND)">
          <input name="oldPrice" type="number" min="0" step="1000" defaultValue={d.oldPrice ?? ''}
            className="w-full border border-green-200 rounded px-3 py-2" />
        </Field>
        <Field label="Tags (phẩy ngăn cách)">
          <input name="tags" defaultValue={(d.tags ?? []).join(', ')} placeholder="Hữu cơ, PGS"
            className="w-full border border-green-200 rounded px-3 py-2" />
        </Field>
      </div>

      <ImageUpload name="image" defaultValue={d.image ?? ''} label="Ảnh sản phẩm *" />

      <Field label="Mô tả ngắn" required hint="Hiển thị ở thẻ sản phẩm và đầu trang chi tiết. Tối đa 2000 ký tự.">
        <textarea name="description" defaultValue={d.description ?? ''} required rows={3}
          className="w-full border border-green-200 rounded px-3 py-2" />
      </Field>

      <Field label="Mô tả chi tiết" hint="Hiển thị section 'Chi tiết sản phẩm' dưới khu vực mua. Hỗ trợ Markdown: **đậm**, *nghiêng*, # tiêu đề, - danh sách, [link](url), bảng GFM.">
        <textarea name="body" defaultValue={d.body ?? ''} rows={12}
          placeholder="## Đặc điểm&#10;- Trồng tại Đà Lạt&#10;- Thu hoạch sáng cùng ngày&#10;&#10;## Cách bảo quản&#10;Bọc khăn ẩm, để ngăn mát 3-5 ngày."
          className="w-full border border-green-200 rounded px-3 py-2 font-mono text-[13px] leading-relaxed" />
      </Field>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-green-950">
          <input type="checkbox" name="featured" defaultChecked={d.featured ?? false} /> Nổi bật
        </label>
        <label className="flex items-center gap-2 text-sm text-green-950">
          <input type="checkbox" name="inStock" defaultChecked={d.inStock ?? true} /> Còn hàng
        </label>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Link href="/admin/products" className="px-4 py-2 text-sm text-green-800 hover:underline">Hủy</Link>
        <button type="submit" disabled={pending}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-full">
          {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-950">{label}{required && <span className="text-red-500"> *</span>}</span>
      {hint && <span className="block text-xs text-green-900/60 mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

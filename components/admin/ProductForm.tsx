'use client';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import SlugInput from '@/components/admin/SlugInput';
import RichEditor from '@/components/admin/RichEditor';
import GalleryField from '@/components/admin/GalleryField';
import { formatPrice } from '@/lib/format';
import type { ProductFormState } from '@/app/admin/actions/products';
import type { ProductRow, CategoryRow, FarmerRow } from '@/db/schema';

type Defaults = Partial<ProductRow> & { id?: string };

export default function ProductForm({
  action, defaults, categories, farmers, editing, gallery = [],
}: {
  action: (prev: ProductFormState, fd: FormData) => Promise<ProductFormState>;
  defaults?: Defaults;
  categories: CategoryRow[];
  farmers: FarmerRow[];
  editing: boolean;
  gallery?: string[];
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, null);
  const [tab, setTab] = useState<'info' | 'detail'>('info');
  const [dirty, setDirty] = useState(false);
  const d = defaults ?? {};

  // Losing a half-filled product to a stray click is the kind of thing that
  // makes people distrust the CMS. Skipped while submitting — that navigation
  // is intentional.
  useEffect(() => {
    if (!dirty || pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, pending]);

  // Every required field lives on the "info" tab. If the admin submits while the
  // "detail" tab is showing, the browser can't focus a required control inside a
  // `hidden` panel, so submit aborts with no visible feedback. Catch the invalid
  // event (capture — it doesn't bubble), reveal the info tab, and focus the
  // offender so the native validation bubble has something to point at.
  const revealInvalid = (e: React.FormEvent) => {
    const el = e.target as HTMLElement;
    setTab('info');
    requestAnimationFrame(() => { if (el.isConnected) (el as HTMLInputElement).focus?.(); });
  };

  return (
    <form action={formAction} onChange={() => setDirty(true)} onInvalidCapture={revealInvalid}
      className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
      <div className="space-y-4 min-w-0">
        <div className="admin-panel-flush">
          <div className="flex gap-1 px-3 pt-3 border-b border-stone-200">
            <Tab active={tab === 'info'} onClick={() => setTab('info')}>Thông tin &amp; giá</Tab>
            <Tab active={tab === 'detail'} onClick={() => setTab('detail')}>Mô tả chi tiết</Tab>
          </div>

          {/* Both panels stay mounted: unmounting the editor would throw away
              unsaved typing when the admin flicks between tabs. */}
          <div className="p-5 space-y-4" hidden={tab !== 'info'}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Tên sản phẩm" required>
                <input name="name" defaultValue={d.name ?? ''} required autoFocus={!editing}
                  placeholder="Ví dụ: Cà chua bi Đà Lạt"
                  className="w-full border border-stone-300 rounded px-3 py-2" />
              </Field>
              <Field label="Đường dẫn" required
                hint={editing ? 'Không đổi được sau khi tạo.' : 'Tự điền theo tên, bạn có thể sửa.'}>
                <SlugInput defaultValue={d.id ?? ''} editing={editing} mono
                  className="w-full border border-stone-300 rounded px-3 py-2 read-only:bg-stone-50 read-only:text-stone-500" />
              </Field>
              <Field label="Danh mục" required>
                <select name="categoryId" defaultValue={d.categoryId ?? ''} required
                  className="w-full border border-stone-300 rounded px-3 py-2 bg-white">
                  <option value="" disabled>— Chọn danh mục —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Nông dân" hint="Gắn sản phẩm với người trồng để khách xem được câu chuyện.">
                <select name="farmerId" defaultValue={d.farmerId ?? ''}
                  className="w-full border border-stone-300 rounded px-3 py-2 bg-white">
                  <option value="">— Không gán —</option>
                  {farmers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </Field>
              <Field label="Đơn vị bán" required hint="Khách sẽ thấy: 25.000đ / bó 250g">
                <input name="unit" defaultValue={d.unit ?? ''} required placeholder="bó 250g"
                  className="w-full border border-stone-300 rounded px-3 py-2" />
              </Field>
              <Field label="Thẻ" hint="Ngăn cách bằng dấu phẩy.">
                <input name="tags" defaultValue={(d.tags ?? []).join(', ')} placeholder="Hữu cơ, PGS"
                  className="w-full border border-stone-300 rounded px-3 py-2" />
              </Field>
              <PriceField label="Giá bán" name="price" required defaultValue={d.price ?? null}
                hint="Giá khách phải trả." />
              <PriceField label="Giá gốc" name="oldPrice" defaultValue={d.oldPrice ?? null}
                hint="Điền nếu đang giảm giá — sẽ hiện gạch ngang cạnh giá bán." />
            </div>

            <Field label="Mô tả ngắn" required
              hint="Một hai câu hiện ở thẻ sản phẩm và đầu trang chi tiết.">
              <textarea name="description" defaultValue={d.description ?? ''} required rows={3} maxLength={2000}
                placeholder="Cà chua bi trồng nhà kính Đà Lạt, hái sáng, ngọt và chắc thịt."
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </Field>
          </div>

          <div className="p-5" hidden={tab !== 'detail'}>
            <RichEditor
              name="body"
              defaultValue={d.body ?? ''}
              label="Mô tả chi tiết"
              hint="Hiện ở mục 'Chi tiết sản phẩm' bên dưới khu vực mua hàng. Gõ như Word, có thể dán từ Word."
              placeholder="Ví dụ: đặc điểm, cách bảo quản, gợi ý chế biến…"
              minHeight={360}
              // The editor writes its hidden input programmatically (no bubbling
              // change event), so the form's onChange never sees body edits —
              // mark dirty here or the unsaved-work guard misses a body-only edit.
              onChange={() => setDirty(true)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-4">
        <div className="admin-panel p-4 space-y-3">
          <h3 className="font-display text-[15px] text-stone-900">Lưu sản phẩm</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[13.5px] text-stone-900">
              <input type="checkbox" name="inStock" defaultChecked={d.inStock ?? true} className="accent-green-700" />
              Còn hàng <span className="text-stone-400 text-[11.5px]">(bỏ tick để tạm ẩn nút mua)</span>
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-stone-900">
              <input type="checkbox" name="featured" defaultChecked={d.featured ?? false} className="accent-green-700" />
              Nổi bật <span className="text-stone-400 text-[11.5px]">(hiện ở trang chủ)</span>
            </label>
          </div>
          <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
            <button type="submit" disabled={pending}
              className="admin-btn-primary disabled:opacity-60 flex-1 justify-center">
              {pending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo sản phẩm'}
            </button>
            {editing && d.id && (
              <a href={`/products/${d.id}`} target="_blank" rel="noopener noreferrer"
                className="admin-btn-ghost text-[12.5px] shrink-0" title="Mở trang sản phẩm trong tab mới">
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

        <div className="admin-panel p-4 space-y-2">
          <h3 className="font-display text-[15px] text-stone-900">Ảnh đại diện</h3>
          <p className="text-[11.5px] text-stone-500">Ảnh chính hiện ở mọi nơi: trang chủ, danh sách, giỏ hàng.</p>
          <ImageUpload name="image" defaultValue={d.image ?? ''} label="" />
        </div>

        <div className="admin-panel p-4 space-y-2">
          <h3 className="font-display text-[15px] text-stone-900">Ảnh phụ</h3>
          <GalleryField defaultValue={gallery} />
        </div>

        <div className="flex justify-end">
          <Link href="/admin/products" className="admin-btn-ghost text-[12.5px]">← Quay lại danh sách</Link>
        </div>
      </div>
    </form>
  );
}

/** Shows the typed number back as formatted currency, to catch a stray zero. */
function PriceField({
  label, name, defaultValue, required, hint,
}: { label: string; name: string; defaultValue: number | null; required?: boolean; hint?: string }) {
  const [value, setValue] = useState<string>(defaultValue != null ? String(defaultValue) : '');
  const n = Number(value);
  const preview = value !== '' && Number.isFinite(n) && n > 0 ? formatPrice(n) : null;

  return (
    <Field label={label} required={required} hint={hint}>
      <div className="relative">
        <input name={name} type="number" min="0" step="1000" required={required}
          value={value} onChange={(e) => setValue(e.target.value)}
          className="w-full border border-stone-300 rounded px-3 py-2 pr-24 tabular-nums" />
        {preview && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-green-700 font-medium pointer-events-none">
            {preview}
          </span>
        )}
      </div>
    </Field>
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
      <span className="text-[13px] font-medium text-stone-900">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {hint && <span className="block text-[11.5px] text-stone-500 mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

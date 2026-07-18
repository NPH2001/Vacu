'use client';
import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import type { MenuItemFormState } from '@/app/admin/actions/menu';
import type { CategoryRow, MenuItemRow } from '@/db/schema';
import { buildCategoryTree, type CategoryNode } from '@/lib/categories';

const STATIC_PAGES = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Tất cả nông sản' },
  { href: '/farmers', label: 'Nông dân' },
  { href: '/orders', label: 'Tra cứu đơn hàng' },
  { href: '/about', label: 'Câu chuyện' },
  { href: '/contact', label: 'Liên hệ' },
];

type LinkType = 'category' | 'page' | 'custom';

function inferType(href: string): LinkType {
  if (href.startsWith('/danh-muc/')) return 'category';
  if (STATIC_PAGES.some((p) => p.href === href)) return 'page';
  return 'custom';
}

function flattenForSelect(tree: CategoryNode[]): { id: string; name: string; level: number }[] {
  const out: { id: string; name: string; level: number }[] = [];
  const walk = (nodes: CategoryNode[], level: number) => {
    const sorted = [...nodes].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'));
    for (const n of sorted) {
      out.push({ id: n.id, name: n.name, level });
      walk(n.children, level + 1);
    }
  };
  walk(tree, 0);
  return out;
}

export default function MenuItemForm({
  action, defaults, editing, categories,
}: {
  action: (prev: MenuItemFormState, fd: FormData) => Promise<MenuItemFormState>;
  defaults?: Partial<MenuItemRow>;
  editing: boolean;
  categories: Pick<CategoryRow, 'id' | 'name' | 'parentId' | 'sortOrder'>[];
}) {
  const [state, formAction, pending] = useActionState<MenuItemFormState, FormData>(action, null);
  const d = defaults ?? {};
  const loc = d.location ?? 'header';
  const initialHref = d.href ?? '';

  const [linkType, setLinkType] = useState<LinkType>(inferType(initialHref));
  const [categorySlug, setCategorySlug] = useState(
    initialHref.startsWith('/danh-muc/') ? initialHref.slice('/danh-muc/'.length) : '',
  );
  const [pageHref, setPageHref] = useState(
    STATIC_PAGES.find((p) => p.href === initialHref)?.href ?? STATIC_PAGES[0].href,
  );
  const [customHref, setCustomHref] = useState(
    inferType(initialHref) === 'custom' ? initialHref : '',
  );

  const flatCategories = useMemo(() => {
    const fullRows: CategoryRow[] = categories.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      name: c.name,
      sortOrder: c.sortOrder,
      icon: '',
      description: '',
      coverImage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    return flattenForSelect(buildCategoryTree(fullRows));
  }, [categories]);

  const computedHref =
    linkType === 'category' ? (categorySlug ? `/danh-muc/${categorySlug}` : '') :
    linkType === 'page' ? pageHref :
    customHref;

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

      <L label="Loại liên kết" required>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="linkType" value="category"
              checked={linkType === 'category'} onChange={() => setLinkType('category')} />
            <span>Danh mục</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="linkType" value="page"
              checked={linkType === 'page'} onChange={() => setLinkType('page')} />
            <span>Trang có sẵn</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="linkType" value="custom"
              checked={linkType === 'custom'} onChange={() => setLinkType('custom')} />
            <span>Tùy chỉnh / Liên kết ngoài</span>
          </label>
        </div>
      </L>

      {linkType === 'category' && (
        <L label="Chọn danh mục" required>
          <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} required
            className="w-full border border-green-200 rounded px-3 py-2 bg-white">
            <option value="">— Chọn —</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {'  '.repeat(c.level)}{c.level > 0 ? '└ ' : ''}{c.name}
              </option>
            ))}
          </select>
        </L>
      )}

      {linkType === 'page' && (
        <L label="Chọn trang" required>
          <select value={pageHref} onChange={(e) => setPageHref(e.target.value)} required
            className="w-full border border-green-200 rounded px-3 py-2 bg-white">
            {STATIC_PAGES.map((p) => (
              <option key={p.href} value={p.href}>{p.label}</option>
            ))}
          </select>
        </L>
      )}

      {linkType === 'custom' && (
        <L label="Đường dẫn tùy chỉnh" required>
          <input value={customHref} onChange={(e) => setCustomHref(e.target.value)}
            required maxLength={500}
            className="w-full border border-green-200 rounded px-3 py-2"
            placeholder="VD: /khuyen-mai hoặc https://zalo.me/..." />
        </L>
      )}

      {linkType !== 'custom' && computedHref && (
        <p className="text-xs text-green-900/60">
          URL sẽ lưu: <code className="font-mono">{computedHref}</code>
        </p>
      )}

      <input type="hidden" name="href" value={computedHref} />

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

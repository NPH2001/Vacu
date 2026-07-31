'use client';
import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import type { MenuItemFormState } from '@/app/admin/actions/menu';
import type { CategoryRow, MenuItemRow } from '@/db/schema';
import { buildCategoryTree, type CategoryNode } from '@/lib/categories';
import { MAX_MENU_DEPTH, buildMenuTree, canBeParent, flattenMenuTree } from '@/lib/menu';

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
  action, defaults, editing, categories, menuItems = [],
}: {
  action: (prev: MenuItemFormState, fd: FormData) => Promise<MenuItemFormState>;
  defaults?: Partial<MenuItemRow>;
  editing: boolean;
  categories: Pick<CategoryRow, 'id' | 'name' | 'parentId' | 'sortOrder'>[];
  /** Toàn bộ mục menu hiện có — để dựng danh sách chọn mục cha. */
  menuItems?: MenuItemRow[];
}) {
  const [state, formAction, pending] = useActionState<MenuItemFormState, FormData>(action, null);
  const d = defaults ?? {};
  const initialHref = d.href ?? '';

  // Vị trí phải là state: danh sách mục cha chỉ được chứa mục cùng vị trí, nên
  // đổi radio là phải lọc lại ngay.
  const [loc, setLoc] = useState<'header' | 'footer'>(d.location ?? 'header');
  const [parentId, setParentId] = useState<string>(d.parentId != null ? String(d.parentId) : '');

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

  // Chỉ liệt kê những mục thực sự làm cha được: cùng vị trí, không phải chính
  // nó hay con cháu nó, và nhận thêm nhánh này vào vẫn không quá số cấp cho
  // phép. Lọc ngay ở đây để admin không chọn được thứ rồi bị server từ chối.
  const parentOptions = useMemo(() => {
    const self = d.id ?? null;
    // Xét theo vị trí ĐANG chọn, để chuyển cả nhánh sang Footer không bị vị trí
    // cũ của chính nó chặn.
    const view = self != null
      ? menuItems.map((r) => (r.id === self ? { ...r, location: loc } : r))
      : menuItems;
    const sameLocation = view.filter((r) => r.location === loc);
    return flattenMenuTree(buildMenuTree(sameLocation))
      .filter(({ node }) => canBeParent(self, node.id, view))
      .map(({ node, depth }) => ({ id: node.id, label: node.label, depth }));
  }, [menuItems, loc, d.id]);

  // Mục cha đã chọn có thể biến mất khỏi danh sách khi đổi vị trí — bỏ chọn
  // thay vì gửi lên một id không còn hợp lệ.
  const parentStillValid = parentId === '' || parentOptions.some((o) => String(o.id) === parentId);
  const effectiveParent = parentStillValid ? parentId : '';

  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-green-100 p-6">
      <L label="Vị trí" required>
        <div className="flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="location" value="header" required
              checked={loc === 'header'} onChange={() => setLoc('header')} />
            <span>Header (menu trên cùng)</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="location" value="footer"
              checked={loc === 'footer'} onChange={() => setLoc('footer')} />
            <span>Footer (Liên kết nhanh)</span>
          </label>
        </div>
      </L>

      <L label="Mục cha">
        <select name="parentId" value={effectiveParent} onChange={(e) => setParentId(e.target.value)}
          className="w-full admin-input bg-white">
          <option value="">— Không có (mục cấp 1) —</option>
          {parentOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {'  '.repeat(o.depth)}{o.depth > 0 ? '└ ' : ''}{o.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-green-900/60 mt-1">
          Chọn mục cha để biến mục này thành submenu. Tối đa {MAX_MENU_DEPTH} cấp — mục đã ở cấp{' '}
          {MAX_MENU_DEPTH} không hiện trong danh sách.
          {editing && ' Đổi vị trí Header/Footer sẽ chuyển theo cả các mục con bên dưới.'}
        </p>
      </L>

      <L label="Nhãn hiển thị" required>
        <input name="label" defaultValue={d.label ?? ''} required maxLength={120}
          className="w-full admin-input"
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
            className="w-full admin-input bg-white">
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
            className="w-full admin-input bg-white">
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
            className="w-full admin-input"
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
          className="w-32 admin-input" />
        <p className="text-xs text-green-900/60 mt-1">
          Số nhỏ hiện trước, và chỉ so với các mục cùng cha.
        </p>
      </L>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
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

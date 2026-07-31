import Link from 'next/link';
import { db } from '@/db/client';
import { menuItems } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import FlashBanner from '@/components/admin/FlashBanner';
import { deleteMenuItem, bulkDeleteMenuItems } from '@/app/admin/actions/menu';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterChips from '@/components/admin/list/FilterChips';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import { parseListParams, type ListSchema } from '@/lib/admin/list-params';
import { MAX_MENU_DEPTH, buildMenuTree, flattenMenuTree } from '@/lib/menu';

const BASE = '/admin/menu';

export default async function MenuAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    sortable: { sortOrder: menuItems.sortOrder },
    defaultSort: 'sortOrder',
    filters: {
      location: { type: 'equals', column: menuItems.location, values: ['header', 'footer'] as const },
    },
  };
  const parsed = parseListParams(sp, schema);

  // Cây phải dựng từ TOÀN BỘ danh sách rồi mới cắt trang: lọc hay phân trang ở
  // SQL sẽ cắt mất mục cha và biến mục con thành mồ côi trong lúc hiển thị.
  // Menu vốn nhỏ (vài chục mục), nên đọc hết là chấp nhận được.
  const all = await db.select().from(menuItems);

  const scoped = parsed.filters.location
    ? all.filter((r) => r.location === parsed.filters.location)
    : all;

  const flat = flattenMenuTree(buildMenuTree(scoped));
  const q = parsed.q.toLowerCase();
  // Khi tìm kiếm thì hiện danh sách phẳng các mục khớp — giữ nguyên cây sẽ phải
  // kéo theo cả những mục cha không khớp, gây hiểu nhầm là chúng cũng khớp.
  const matched = q === ''
    ? flat
    : flat.filter(({ node }) =>
        node.label.toLowerCase().includes(q) || node.href.toLowerCase().includes(q));

  const total = matched.length;
  const start = (parsed.page - 1) * parsed.pageSize;
  const rows = matched.slice(start, start + parsed.pageSize);
  const hasFilter = parsed.q !== '' || Object.keys(parsed.filters).length > 0;

  const childCount = new Map<number, number>();
  for (const r of all) {
    if (r.parentId != null) childCount.set(r.parentId, (childCount.get(r.parentId) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-title text-[28px]">Menu</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">
            Mục con xếp thụt vào dưới mục cha — tối đa {MAX_MENU_DEPTH} cấp.
          </p>
        </div>
        <Link href="/admin/menu/new" className="admin-btn-primary">+ Thêm</Link>
      </div>

      <FlashBanner code={sp.ok ?? sp.loi} basePath={BASE} />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo nhãn hoặc URL…" />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="location"
          options={[
            { value: null, label: 'Tất cả' },
            { value: 'header', label: 'Header' },
            { value: 'footer', label: 'Footer' },
          ]}
        />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {hasFilter ? 'Không có kết quả phù hợp.' : 'Chưa có mục nào.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteMenuItems}>
          <div className="admin-panel-flush">
            <ul className="divide-y divide-stone-100">
              {rows.map(({ node: r, depth }) => {
                const kids = childCount.get(r.id) ?? 0;
                return (
                  <li key={r.id} className="p-5 flex gap-4 items-center">
                    <input type="checkbox" name="ids" aria-label="Chọn để xóa" value={r.id} />
                    {/* Thụt lề theo cấp; khi đang tìm kiếm thì bỏ, vì kết quả là
                        danh sách phẳng nên thụt lề sẽ vô nghĩa. */}
                    <div className="flex-1 min-w-0" style={q === '' ? { paddingLeft: depth * 22 } : undefined}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {q === '' && depth > 0 && (
                          <span className="text-stone-300 shrink-0" aria-hidden>└</span>
                        )}
                        <Link href={`/admin/menu/${r.id}`} className="font-semibold text-green-950 hover:underline truncate">
                          {r.label}
                        </Link>
                        {r.openInNewTab && <span title="Mở tab mới" className="text-xs text-green-700">↗</span>}
                        {kids > 0 && (
                          <span className="admin-badge shrink-0" title="Số mục con trực tiếp">
                            {kids} mục con
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-green-900/70 mt-0.5 truncate">{r.href}</div>
                      <div className="text-xs text-green-900/50 mt-0.5">
                        {r.location === 'header' ? 'Header' : 'Footer'} · Cấp {depth + 1} · Thứ tự: {r.sortOrder}
                      </div>
                    </div>
                    <div className="space-x-3 text-sm shrink-0">
                      <Link href={`/admin/menu/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton
                        action={deleteMenuItem.bind(null, r.id)}
                        confirmText={kids > 0
                          ? `“${r.label}” còn ${kids} mục con — xóa mục con trước đã. Vẫn thử xóa?`
                          : 'Xóa mục này?'}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </BulkDeleteForm>
      )}

      <div className="flex items-center justify-between">
        <Pagination basePath={BASE} parsed={parsed} schema={schema} total={total} />
        <PageSizeSelect />
      </div>
    </div>
  );
}

import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { menuItems } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteMenuItem, bulkDeleteMenuItems } from '@/app/admin/actions/menu';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterChips from '@/components/admin/list/FilterChips';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/menu';

export default async function MenuAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [menuItems.label, menuItems.href],
    sortable: {
      label: menuItems.label,
      sortOrder: menuItems.sortOrder,
    },
    defaultSort: 'sortOrder',
    filters: {
      location: { type: 'equals', column: menuItems.location, values: ['header', 'footer'] as const },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(menuItems).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(menuItems).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const hasFilter = parsed.q !== '' || Object.keys(parsed.filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Menu</h1>
        <Link href="/admin/menu/new" className="admin-btn-primary">+ Thêm</Link>
      </div>

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
              {rows.map((r) => (
                <li key={r.id} className="p-5 flex gap-4 items-center">
                  <input type="checkbox" name="ids" value={r.id} />
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/menu/${r.id}`} className="font-semibold text-green-950 hover:underline">
                      {r.label} {r.openInNewTab && <span title="Mở tab mới" className="text-xs text-green-700">↗</span>}
                    </Link>
                    <div className="text-xs text-green-900/70 mt-0.5 truncate">{r.href}</div>
                    <div className="text-xs text-green-900/50 mt-0.5">
                      {r.location === 'header' ? 'Header' : 'Footer'} · Thứ tự: {r.sortOrder}
                    </div>
                  </div>
                  <div className="space-x-3 text-sm shrink-0">
                    <Link href={`/admin/menu/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                    <DeleteButton action={deleteMenuItem.bind(null, r.id)} confirmText="Xóa mục này?" />
                  </div>
                </li>
              ))}
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

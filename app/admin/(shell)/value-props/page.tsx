import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { valueProps } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteValueProp, bulkDeleteValueProps } from '@/app/admin/actions/value-props';
import SearchInput from '@/components/admin/list/SearchInput';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/value-props';

export default async function ValuePropsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [valueProps.title, valueProps.description],
    sortable: {
      title: valueProps.title,
      sortOrder: valueProps.sortOrder,
    },
    defaultSort: 'sortOrder',
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(valueProps).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(valueProps).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Điểm giá trị (trang chủ)</h1>
        <Link
          href="/admin/value-props/new"
          className="admin-btn-primary">
          + Thêm
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm điểm giá trị…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {parsed.q ? 'Không có kết quả phù hợp.' : 'Chưa có mục nào.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteValueProps}>
          <div className="admin-panel-flush">
            <ul className="divide-y divide-stone-100">
              {rows.map((r) => (
                <li key={r.id} className="p-5 flex gap-4 items-start">
                  <input type="checkbox" name="ids" aria-label="Chọn để xóa" value={r.id} className="mt-1" />
                  <div className="text-3xl">{r.icon}</div>
                  <div className="flex-1">
                    <Link href={`/admin/value-props/${r.id}`} className="font-semibold text-green-950 hover:underline">{r.title}</Link>
                    <div className="text-sm text-green-900/70 mt-1 line-clamp-2">{r.description}</div>
                    <div className="text-xs text-green-900/50 mt-1">Thứ tự: {r.sortOrder}</div>
                  </div>
                  <div className="space-x-3 text-sm shrink-0">
                    <Link href={`/admin/value-props/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                    <DeleteButton action={deleteValueProp.bind(null, r.id)} confirmText="Xóa mục này?" />
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

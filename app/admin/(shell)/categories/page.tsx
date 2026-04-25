import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteCategory, bulkDeleteCategories } from '@/app/admin/actions/categories';
import SearchInput from '@/components/admin/list/SearchInput';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/categories';

export default async function CategoriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [categories.name],
    sortable: {
      name: categories.name,
      sortOrder: categories.sortOrder,
    },
    defaultSort: 'sortOrder',
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows, allRows] = await Promise.all([
    db.select().from(categories).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(categories).where(where),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const nameById = new Map(allRows.map((r) => [r.id, r.name]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Danh mục</h1>
        <Link
          href="/admin/categories/new"
          className="admin-btn-primary">
          + Thêm danh mục
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm danh mục…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {parsed.q ? 'Không có kết quả phù hợp.' : 'Chưa có danh mục.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteCategories}>
          <div className="admin-panel-flush">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium w-14">Icon</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Slug</th>
                  <th className="px-4 py-2.5 font-medium">Cha</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="sortOrder">Thứ tự</SortableTh>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2"><input type="checkbox" name="ids" value={r.id} /></td>
                    <td className="px-4 py-2 text-xl">{r.icon}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/categories/${r.id}`} className="font-medium text-green-950 hover:underline">{r.name}</Link>
                      <div className="text-xs text-green-900/60 line-clamp-1">{r.description}</div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-2 text-sm text-green-900/70">
                      {r.parentId ? (nameById.get(r.parentId) ?? r.parentId) : '—'}
                    </td>
                    <td className="px-4 py-2">{r.sortOrder}</td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link href={`/admin/categories/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton action={deleteCategory.bind(null, r.id)} confirmText={`Xóa danh mục "${r.name}"?`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

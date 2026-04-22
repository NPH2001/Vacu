import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteUser } from '@/app/admin/actions/users';
import { requireRole } from '@/lib/session';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterChips from '@/components/admin/list/FilterChips';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/users';

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const self = await requireRole('admin');
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [users.email, users.name],
    sortable: { email: users.email, name: users.name, createdAt: users.createdAt },
    defaultSort: 'email',
    filters: {
      role: { type: 'equals', column: users.role, values: ['admin', 'staff'] },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(users).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const hasFilter = parsed.q !== '' || Object.keys(parsed.filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Tài khoản</h1>
        <Link
          href="/admin/users/new"
          className="admin-btn-primary">
          + Thêm tài khoản
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo email / tên…" />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="role"
          options={[
            { value: null, label: 'Tất cả' },
            { value: 'admin', label: 'Admin' },
            { value: 'staff', label: 'Staff' },
          ]}
        />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {hasFilter ? 'Không có kết quả phù hợp.' : 'Chưa có tài khoản.'}
        </div>
      ) : (
        <div className="admin-panel-flush">
          <table className="admin-table">
            <thead>
              <tr>
                <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="email">Email</SortableTh>
                <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                <th className="px-4 py-2.5 font-medium">Vai trò</th>
                <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="createdAt">Tạo lúc</SortableTh>
                <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-stone-900 hover:underline">{u.email}</Link>
                    {u.id === self.id && <span className="ml-2 text-[11px] text-amber-700 font-semibold">(bạn)</span>}
                  </td>
                  <td className="text-stone-600">{u.name}</td>
                  <td>
                    <span
                      className="admin-badge"
                      style={
                        u.role === 'admin'
                          ? { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }
                          : { background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }
                      }>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-stone-500 tabular-nums text-[12.5px]">{u.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link href={`/admin/users/${u.id}`} className="text-[12.5px] text-stone-600 hover:text-stone-900 transition-colors">Sửa</Link>
                      {u.id !== self.id && (
                        <DeleteButton action={deleteUser.bind(null, u.id)} confirmText={`Xóa tài khoản "${u.email}"?`} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Pagination basePath={BASE} parsed={parsed} schema={schema} total={total} />
        <PageSizeSelect />
      </div>
    </div>
  );
}

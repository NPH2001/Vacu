import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { bulkDeleteOrders } from '@/app/admin/actions/orders';
import { getAllOrderStatuses } from '@/lib/data';
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

const BASE = '/admin/orders';

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const statusRows = await getAllOrderStatuses();
  const statusMap = Object.fromEntries(statusRows.map((s) => [s.key, s]));

  const schema: ListSchema = {
    searchFields: [orders.id, orders.customerName, orders.phone, orders.customerEmail],
    sortable: {
      createdAt: orders.createdAt,
      total: orders.total,
      status: orders.status,
    },
    defaultSort: '-createdAt',
    filters: {
      status: {
        type: 'equals',
        column: orders.status,
        values: statusRows.map((s) => s.key),
      },
      paymentMethod: {
        type: 'equals',
        column: orders.paymentMethod,
        values: ['cod', 'bank'],
      },
      paymentStatus: {
        type: 'equals',
        column: orders.paymentStatus,
        values: ['unpaid', 'paid'],
      },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(orders).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const hasFilter = parsed.q !== '' || Object.keys(parsed.filters).length > 0;

  const statusOptions = [
    { value: null, label: 'Tất cả' },
    ...statusRows.map((s) => ({ value: s.key, label: s.label })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Đơn hàng</h1>
        <ClearFiltersLink basePath={BASE} parsed={parsed} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo mã / tên / SĐT / email…" />
      </div>

      <FilterChips basePath={BASE} parsed={parsed} filterKey="status" options={statusOptions} />

      <div className="flex flex-wrap gap-2">
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="paymentMethod"
          options={[
            { value: null, label: 'Mọi hình thức' },
            { value: 'cod', label: '💵 COD' },
            { value: 'bank', label: '🏦 CK' },
          ]}
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="paymentStatus"
          options={[
            { value: null, label: 'Mọi thanh toán' },
            { value: 'unpaid', label: 'Chưa trả' },
            { value: 'paid', label: 'Đã trả' },
          ]}
        />
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {hasFilter ? 'Không có kết quả phù hợp.' : 'Không có đơn hàng.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteOrders}>
          <div className="admin-panel-flush">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium">Mã</th>
                  <th className="px-4 py-2.5 font-medium">Khách</th>
                  <th className="px-4 py-2.5 font-medium">Điện thoại</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="total">Tổng</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Thanh toán</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="status">Trạng thái</SortableTh>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="createdAt">Ngày</SortableTh>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const s = statusMap[r.status];
                  return (
                    <tr key={r.id}>
                      <td><input type="checkbox" name="ids" aria-label="Chọn để xóa" value={r.id} /></td>
                      <td>
                        <Link href={`/admin/orders/${r.id}`} className="font-mono text-[12.5px] text-stone-900 hover:underline">{r.id}</Link>
                      </td>
                      <td className="text-stone-900">{r.customerName}</td>
                      <td className="text-stone-600 tabular-nums">{r.phone}</td>
                      <td className="tabular-nums font-medium text-stone-900">{formatPrice(r.total)}</td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] text-stone-600">
                            {r.paymentMethod === 'bank' ? '🏦 Chuyển khoản' : '💵 COD'}
                          </span>
                          <span
                            className="admin-badge w-fit"
                            style={
                              r.paymentStatus === 'paid'
                                ? { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }
                                : { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }
                            }>
                            {r.paymentStatus === 'paid' ? 'Đã trả' : 'Chưa trả'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${s?.color ?? 'bg-stone-100 text-stone-700'}`}>
                          {s?.label ?? r.status}
                        </span>
                      </td>
                      <td className="text-stone-500 tabular-nums text-[12.5px]">
                        {r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
                      </td>
                    </tr>
                  );
                })}
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

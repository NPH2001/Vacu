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
        <h1 className="text-2xl font-bold font-display text-green-950">Đơn hàng</h1>
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
        <div className="bg-white rounded-2xl border border-green-100 p-6 text-sm text-green-900/70">
          {hasFilter ? 'Không có kết quả phù hợp.' : 'Không có đơn hàng.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteOrders}>
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-green-900/70 bg-green-50/60">
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
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-green-50 hover:bg-green-50/40">
                    <td className="px-4 py-2"><input type="checkbox" name="ids" value={r.id} /></td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/orders/${r.id}`} className="font-mono text-green-800 hover:underline">{r.id}</Link>
                    </td>
                    <td className="px-4 py-2">{r.customerName}</td>
                    <td className="px-4 py-2">{r.phone}</td>
                    <td className="px-4 py-2">{formatPrice(r.total)}</td>
                    <td className="px-4 py-2 text-xs">
                      <div>{r.paymentMethod === 'bank' ? '🏦 CK' : '💵 COD'}</div>
                      <div className={r.paymentStatus === 'paid' ? 'text-green-700 font-semibold' : 'text-amber-700'}>
                        {r.paymentStatus === 'paid' ? 'Đã trả' : 'Chưa trả'}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {(() => {
                        const s = statusMap[r.status];
                        return (
                          <span className={`text-xs px-2 py-0.5 rounded ${s?.color ?? 'bg-green-50 text-green-800'}`}>
                            {s?.label ?? r.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2 text-green-900/70">{r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
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

import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { deliverySlots } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteDeliverySlot, bulkDeleteDeliverySlots } from '@/app/admin/actions/delivery-slots';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterChips from '@/components/admin/list/FilterChips';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/delivery-slots';

export default async function DeliverySlotsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [deliverySlots.label],
    sortable: {
      label: deliverySlots.label,
      sortOrder: deliverySlots.sortOrder,
    },
    defaultSort: 'sortOrder',
    filters: {
      active: { type: 'boolean', column: deliverySlots.active },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(deliverySlots).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(deliverySlots).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const hasFilter = parsed.q !== '' || Object.keys(parsed.filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Khung giờ giao</h1>
        <Link
          href="/admin/delivery-slots/new"
          className="admin-btn-primary">
          + Thêm
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm khung giờ…" />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="active"
          options={[
            { value: null, label: 'Tất cả' },
            { value: '1', label: 'Đang bật' },
            { value: '0', label: 'Ẩn' },
          ]}
        />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {hasFilter ? 'Không có kết quả phù hợp.' : 'Chưa có khung giờ nào.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteDeliverySlots}>
          <div className="admin-panel-flush">
            <ul className="divide-y divide-stone-100">
              {rows.map((r) => (
                <li key={r.id} className="p-5 flex gap-4 items-center">
                  <input type="checkbox" name="ids" value={r.id} />
                  <div className="flex-1">
                    <Link href={`/admin/delivery-slots/${r.id}`} className="font-semibold text-green-950 hover:underline">{r.label}</Link>
                    <div className="text-xs text-green-900/50 mt-0.5">Thứ tự: {r.sortOrder} · {r.active ? 'Đang bật' : 'Ẩn'}</div>
                  </div>
                  <div className="space-x-3 text-sm shrink-0">
                    <Link href={`/admin/delivery-slots/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                    <DeleteButton action={deleteDeliverySlot.bind(null, r.id)} confirmText="Xóa khung giờ này?" />
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

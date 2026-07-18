import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { farmers } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteFarmer, bulkDeleteFarmers } from '@/app/admin/actions/farmers';
import SearchInput from '@/components/admin/list/SearchInput';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import FlashBanner from '@/components/admin/FlashBanner';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/farmers';

export default async function FarmersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [farmers.name, farmers.farm, farmers.location, farmers.specialty],
    sortable: {
      name: farmers.name,
      years: farmers.years,
      createdAt: farmers.createdAt,
    },
    defaultSort: 'name',
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(farmers).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(farmers).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Nông dân</h1>
        <Link
          href="/admin/farmers/new"
          className="admin-btn-primary">
          + Thêm nông dân
        </Link>
      </div>

      <FlashBanner code={sp.ok ?? sp.loi} basePath={BASE} />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo tên / nông trại / vùng / chuyên canh…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {parsed.q ? 'Không có kết quả phù hợp.' : 'Chưa có nông dân.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteFarmers}>
          <div className="admin-panel-flush">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium w-14">Ảnh</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Nông trại</th>
                  <th className="px-4 py-2.5 font-medium">Địa điểm</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="years">Năm</SortableTh>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2"><input type="checkbox" name="ids" aria-label="Chọn để xóa" value={r.id} /></td>
                    <td className="px-4 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.avatar && <img src={r.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/farmers/${r.id}`} className="font-medium text-green-950 hover:underline">{r.name}</Link>
                      <div className="text-xs text-green-900/60">{r.id}</div>
                    </td>
                    <td className="px-4 py-2">{r.farm}</td>
                    <td className="px-4 py-2">{r.location}</td>
                    <td className="px-4 py-2">{r.years}</td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link href={`/admin/farmers/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton action={deleteFarmer.bind(null, r.id)} confirmText={`Xóa nông dân "${r.name}"?`} />
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

import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { certificates } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteCertificate, bulkDeleteCertificates } from '@/app/admin/actions/certificates';
import SearchInput from '@/components/admin/list/SearchInput';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/certificates';

export default async function CertificatesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [certificates.name, certificates.issuer, certificates.description],
    sortable: {
      name: certificates.name,
      sortOrder: certificates.sortOrder,
    },
    defaultSort: 'sortOrder',
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(certificates).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(certificates).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-title text-[28px]">Chứng nhận</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">
            Giấy chứng nhận, chứng chỉ — hiện ở khối “Dải chứng nhận” trên trang chủ và trang Chứng nhận.
          </p>
        </div>
        <Link href="/admin/certificates/new" className="admin-btn-primary">+ Thêm</Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo tên hoặc nơi cấp…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-8 text-center">
          <div className="text-4xl mb-2">🏅</div>
          <p className="text-sm text-stone-600 mb-3">
            {parsed.q
              ? 'Không có kết quả phù hợp.'
              : 'Chưa có chứng nhận nào. Thêm chứng nhận đầu tiên rồi đặt khối “Dải chứng nhận” vào trang.'}
          </p>
          {!parsed.q && (
            <Link href="/admin/certificates/new" className="admin-btn-primary inline-flex">Thêm chứng nhận</Link>
          )}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteCertificates}>
          <div className="admin-panel-flush">
            <ul className="divide-y divide-stone-100">
              {rows.map((r) => (
                <li key={r.id} className="p-5 flex gap-4 items-start">
                  <input type="checkbox" name="ids" aria-label="Chọn để xóa" value={r.id} className="mt-1" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt="" className="w-14 h-14 rounded-lg object-cover border border-stone-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/certificates/${r.id}`} className="font-semibold text-green-950 hover:underline">
                      {r.name}
                    </Link>
                    {r.issuer && <div className="text-sm text-green-900/70 mt-0.5 truncate">{r.issuer}</div>}
                    {r.description && (
                      <div className="text-sm text-green-900/60 mt-1 line-clamp-2">{r.description}</div>
                    )}
                    <div className="text-xs text-green-900/50 mt-1">Thứ tự: {r.sortOrder}</div>
                  </div>
                  <div className="space-x-3 text-sm shrink-0">
                    <Link href={`/admin/certificates/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                    <DeleteButton action={deleteCertificate.bind(null, r.id)} confirmText={`Xóa “${r.name}”?`} />
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

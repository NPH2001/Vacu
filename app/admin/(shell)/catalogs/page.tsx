import Link from 'next/link';
import { sql, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { catalogs, catalogImages } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteCatalog, bulkDeleteCatalogs } from '@/app/admin/actions/catalogs';
import SearchInput from '@/components/admin/list/SearchInput';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/catalogs';

export default async function CatalogsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const schema: ListSchema = {
    searchFields: [catalogs.name, catalogs.description],
    sortable: {
      name: catalogs.name,
      sortOrder: catalogs.sortOrder,
    },
    defaultSort: 'sortOrder',
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(catalogs).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(catalogs).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;

  // Bìa và số trang cho đúng những catalog đang hiện trên trang này — một truy
  // vấn cho cả trang, không phải một truy vấn mỗi dòng.
  const ids = rows.map((r) => r.id);
  const pages = ids.length
    ? await db.select({ catalogId: catalogImages.catalogId, url: catalogImages.url, sortOrder: catalogImages.sortOrder })
      .from(catalogImages).where(inArray(catalogImages.catalogId, ids))
      .orderBy(catalogImages.catalogId, catalogImages.sortOrder)
    : [];
  const coverOf = new Map<number, string>();
  const countOf = new Map<number, number>();
  for (const p of pages) {
    if (!coverOf.has(p.catalogId)) coverOf.set(p.catalogId, p.url);
    countOf.set(p.catalogId, (countOf.get(p.catalogId) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-title text-[28px]">Catalog</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">
            Catalog sản phẩm dạng ảnh từng trang — hiện ở khối “Catalog” và trang Catalog.
          </p>
        </div>
        <Link href="/admin/catalogs/new" className="admin-btn-primary">+ Thêm</Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo tên catalog…" />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-8 text-center">
          <div className="text-4xl mb-2">📘</div>
          <p className="text-sm text-stone-600 mb-3">
            {parsed.q
              ? 'Không có kết quả phù hợp.'
              : 'Chưa có catalog nào. Tạo catalog rồi tải ảnh từng trang lên.'}
          </p>
          {!parsed.q && (
            <Link href="/admin/catalogs/new" className="admin-btn-primary inline-flex">Thêm catalog</Link>
          )}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteCatalogs}>
          <div className="admin-panel-flush">
            <ul className="divide-y divide-stone-100">
              {rows.map((r) => {
                const cover = coverOf.get(r.id);
                const count = countOf.get(r.id) ?? 0;
                return (
                  <li key={r.id} className="p-5 flex gap-4 items-start">
                    <input type="checkbox" name="ids" aria-label="Chọn để xóa" value={r.id} className="mt-1" />
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className={`w-14 h-[74px] rounded-lg object-cover border border-stone-200 shrink-0 ${r.visible ? '' : 'opacity-45 grayscale'}`} />
                    ) : (
                      <div className="w-14 h-[74px] rounded-lg border border-stone-200 bg-stone-50 shrink-0 flex items-center justify-center text-stone-400 text-xl">📘</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/admin/catalogs/${r.id}`} className="font-semibold text-green-950 hover:underline">
                          {r.name}
                        </Link>
                        {/* Ẩn mà không có dấu hiệu gì thì admin sẽ ngồi dò xem
                            sao catalog không hiện ra web. */}
                        {!r.visible && (
                          <span className="admin-badge" style={{ background: '#f5f5f4', color: '#57534e', borderColor: '#e7e5e4' }}>
                            Đang ẩn
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <div className="text-sm text-green-900/60 mt-1 line-clamp-2">{r.description}</div>
                      )}
                      <div className="text-xs text-green-900/50 mt-1">
                        {count > 0 ? `${count} trang` : (
                          <span className="text-amber-700">Chưa có trang nào — chưa hiện ra web</span>
                        )} · Thứ tự: {r.sortOrder}
                      </div>
                    </div>
                    <div className="space-x-3 text-sm shrink-0">
                      <Link href={`/admin/catalogs/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton action={deleteCatalog.bind(null, r.id)}
                        confirmText={`Xóa catalog “${r.name}”? Ảnh vẫn còn trong Thư viện ảnh.`} />
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

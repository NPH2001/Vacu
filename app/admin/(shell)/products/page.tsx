import Link from 'next/link';
import { asc, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, categories } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteProduct, bulkDeleteProducts } from '@/app/admin/actions/products';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterSelect from '@/components/admin/list/FilterSelect';
import FilterChips from '@/components/admin/list/FilterChips';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import FlashBanner from '@/components/admin/FlashBanner';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/products';

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cats = await db.select().from(categories).orderBy(asc(categories.name));

  const schema: ListSchema = {
    searchFields: [products.name, products.id, products.description],
    sortable: {
      name: products.name,
      price: products.price,
      createdAt: products.createdAt,
    },
    defaultSort: 'name',
    filters: {
      categoryId: {
        type: 'equals',
        column: products.categoryId,
        values: cats.map((c) => c.id),
      },
      featured: { type: 'boolean', column: products.featured },
      inStock: { type: 'boolean', column: products.inStock },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(products).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(products).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const hasFilter = parsed.q !== '' || Object.keys(parsed.filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="admin-title text-[28px]">Sản phẩm</h1>
        <Link
          href="/admin/products/new"
          className="admin-btn-primary">
          + Thêm sản phẩm
        </Link>
      </div>

      <FlashBanner code={sp.ok ?? sp.loi} basePath={BASE} />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo tên / mã / mô tả…" />
        <FilterSelect
          filterKey="categoryId"
          current={parsed.filters.categoryId ?? null}
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Tất cả danh mục"
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="featured"
          options={[
            { value: null, label: 'Mọi sản phẩm' },
            { value: '1', label: '⭐ Nổi bật' },
          ]}
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="inStock"
          options={[
            { value: null, label: 'Mọi tồn kho' },
            { value: '1', label: 'Còn' },
            { value: '0', label: 'Hết' },
          ]}
        />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="admin-panel p-6 text-sm text-stone-500">
          {hasFilter ? 'Không có kết quả phù hợp.' : 'Chưa có sản phẩm.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteProducts}>
          <div className="admin-panel-flush">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium">Ảnh</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Danh mục</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="price">Giá</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input type="checkbox" name="ids" aria-label="Chọn để xóa" value={p.id} />
                    </td>
                    <td>
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="w-10 h-10 rounded-md object-cover ring-1 ring-stone-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-stone-100 ring-1 ring-stone-200" />
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-stone-900 hover:underline">{p.name}</Link>
                      <div className="text-[11.5px] text-stone-400 font-mono mt-0.5">{p.id}</div>
                    </td>
                    <td className="text-stone-600">{catMap.get(p.categoryId) ?? p.categoryId}</td>
                    <td className="tabular-nums font-medium text-stone-900">{formatPrice(p.price)}</td>
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.featured && (
                          <span className="admin-badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                            ★ Nổi bật
                          </span>
                        )}
                        {!p.inStock && (
                          <span className="admin-badge" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}>
                            Hết hàng
                          </span>
                        )}
                        {p.inStock && !p.featured && (
                          <span className="text-[11.5px] text-stone-400">Đang bán</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-3">
                        <Link href={`/admin/products/${p.id}`} className="text-[12.5px] text-stone-600 hover:text-stone-900 transition-colors">Sửa</Link>
                        <DeleteButton action={deleteProduct.bind(null, p.id)} confirmText={`Xóa sản phẩm "${p.name}"?`} />
                      </div>
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
